<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Vendor\SaveVendorCertificationDraftRequest;
use App\Http\Requests\Vendor\SubmitVendorCertificationRequest;
use App\Http\Requests\Vendor\UploadVendorCertificationImageRequest;
use App\Http\Resources\VendorCertificationImageResource;
use App\Http\Resources\VendorCertificationResource;
use App\Models\VendorCertification;
use App\Services\VendorCertificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Vendor Certification wizard endpoints. Every action is scoped to the
 * authenticated vendor — `vendor_id` is derived from `$request->user()`,
 * never read from the request body.
 */
class VendorCertificationController extends BaseApiController
{
    public function __construct(private readonly VendorCertificationService $certifications) {}

    /** GET /api/v1/vendors/certifications — the vendor's own certifications. */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('manage', VendorCertification::class);

        return $this->respondSuccess(
            VendorCertificationResource::collection(
                $this->certifications->listFor($request->user()),
            )->resolve($request),
        );
    }

    /** GET /api/v1/vendors/certifications/metadata — option catalogues + rules for the wizard. */
    public function metadata(Request $request): JsonResponse
    {
        $this->authorize('manage', VendorCertification::class);

        return $this->respondSuccess([
            'catalogues' => config('vendors.catalogues'),
            'image_profiles' => config('vendors.image_profiles'),
            'map' => config('vendors.map'),
        ]);
    }

    /** GET /api/v1/vendors/certifications/draft — the single open draft (created on first read). */
    public function draft(Request $request): JsonResponse
    {
        $this->authorize('manage', VendorCertification::class);

        $draft = $this->certifications->draftFor($request->user());

        return $this->respondSuccess((new VendorCertificationResource($draft))->resolve($request));
    }

    /** PUT /api/v1/vendors/certifications/draft — upsert survey fields onto the draft. */
    public function saveDraft(SaveVendorCertificationDraftRequest $request): JsonResponse
    {
        $this->authorize('manage', VendorCertification::class);

        $draft = $this->certifications->saveDraft($request->user(), $request->validated());

        return $this->respondSuccess(
            (new VendorCertificationResource($draft))->resolve($request),
            'Draft saved.',
        );
    }

    /** POST /api/v1/vendors/certifications/images — stage one image on the draft. */
    public function uploadImage(UploadVendorCertificationImageRequest $request): JsonResponse
    {
        $this->authorize('manage', VendorCertification::class);

        $image = $this->certifications->storeImage(
            $request->user(),
            $request->validated()['type'],
            $request->file('image'),
        );

        return $this->respondCreated(
            (new VendorCertificationImageResource($image))->resolve($request),
            'Image uploaded successfully.',
        );
    }

    /** DELETE /api/v1/vendors/certifications/images/{image} — remove a staged image. */
    public function deleteImage(Request $request, int $image): JsonResponse
    {
        $this->authorize('manage', VendorCertification::class);

        $this->certifications->deleteImage($request->user(), $image);

        return $this->respondSuccess(null, 'Image removed.');
    }

    /** POST /api/v1/vendors/certifications — submit the draft → completed certification. */
    public function submit(SubmitVendorCertificationRequest $request): JsonResponse
    {
        $this->authorize('manage', VendorCertification::class);

        $certification = $this->certifications->submit(
            $request->user(),
            $request->validated(),
            [
                'ip_address' => $request->ip(),
                'device' => $this->detectDevice($request->userAgent()),
                'browser' => $this->detectBrowser($request->userAgent()),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 400),
            ],
        );

        return $this->respondCreated(
            (new VendorCertificationResource($certification))->resolve($request),
            'Vendor Certification submitted successfully.',
        );
    }

    /** GET /api/v1/vendors/certifications/{certification} — one owned certification. */
    public function show(Request $request, int $certification): JsonResponse
    {
        $model = $this->certifications->findForOwner($request->user(), $certification);
        $this->authorize('view', $model);

        return $this->respondSuccess((new VendorCertificationResource($model))->resolve($request));
    }

    /** GET /api/v1/vendors/certifications/{certification}/certificate — data for the certificate view/PDF. */
    public function certificate(Request $request, int $certification): JsonResponse
    {
        $model = $this->certifications->findForOwner($request->user(), $certification);
        $this->authorize('view', $model);

        if ($model->certificate_number === null) {
            return $this->respondError('This certification has not been submitted yet.', 409);
        }

        return $this->respondSuccess([
            'certification' => (new VendorCertificationResource($model))->resolve($request),
            'certificate' => $this->certifications->certificateData($model),
        ]);
    }

    /** GET /api/v1/vendors/certifications/{certification}/images/{image} — owner-checked file stream. */
    public function showImage(Request $request, int $certification, int $image): StreamedResponse
    {
        $model = $this->certifications->findForOwner($request->user(), $certification);
        $this->authorize('view', $model);

        return $this->certifications->streamImage($request->user(), $certification, $image);
    }

    /* ------------------------------------------------------------ ua helpers */

    private function detectDevice(?string $ua): string
    {
        $ua = strtolower((string) $ua);

        return match (true) {
            str_contains($ua, 'ipad'), str_contains($ua, 'tablet') => 'Tablet',
            str_contains($ua, 'mobi'), str_contains($ua, 'android') => 'Mobile',
            $ua === '' => 'Unknown',
            default => 'Desktop',
        };
    }

    private function detectBrowser(?string $ua): string
    {
        $ua = (string) $ua;
        foreach ([
            'Edge' => '/Edg/i',
            'Opera' => '/OPR|Opera/i',
            'Chrome' => '/Chrome|CriOS/i',
            'Firefox' => '/Firefox|FxiOS/i',
            'Safari' => '/Safari/i',
        ] as $name => $pattern) {
            if (preg_match($pattern, $ua) === 1) {
                return $name;
            }
        }

        return 'Unknown';
    }
}
