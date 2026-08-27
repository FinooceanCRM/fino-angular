<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Affiliate\UpdateAffiliateProfileRequest;
use App\Http\Resources\AffiliateCommissionResource;
use App\Http\Resources\AffiliatePayoutResource;
use App\Http\Resources\AffiliateResource;
use App\Models\Affiliate;
use App\Models\AffiliatePayout;
use App\Services\AffiliatePayoutService;
use App\Services\AffiliateService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Affiliate module endpoints. Every action is scoped to the authenticated
 * affiliate; no hierarchy lookup happens here.
 */
class AffiliateController extends BaseApiController
{
    public function __construct(
        private readonly AffiliateService $affiliates,
        private readonly AffiliatePayoutService $payouts,
    ) {
    }

    /** GET /api/v1/affiliates/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', Affiliate::class);

        return $this->respondSuccess($this->affiliates->dashboardFor($request->user()));
    }

    /** GET /api/v1/affiliates/profile */
    public function profile(Request $request): JsonResponse
    {
        $this->authorize('viewOwnProfile', Affiliate::class);

        $profile = $this->affiliates->profileFor($request->user());

        return $this->respondSuccess((new AffiliateResource($profile))->resolve($request));
    }

    /** PUT /api/v1/affiliates/profile */
    public function updateProfile(UpdateAffiliateProfileRequest $request): JsonResponse
    {
        $profile = $this->affiliates->updateProfile($request->user(), $request->validated());

        return $this->respondSuccess(
            (new AffiliateResource($profile))->resolve($request),
            'Profile updated.',
        );
    }

    /** GET /api/v1/affiliates/referrals */
    public function referrals(Request $request): JsonResponse
    {
        $this->authorize('viewReferrals', Affiliate::class);

        $paginator = $this->affiliates->referralsFor($request->user(), $request->query());

        return $this->respondSuccess(
            collect($paginator->items())->map(fn ($lead): array => [
                'id' => $lead->id,
                'reference' => $lead->reference,
                'applicant_name' => $lead->applicant_name,
                'loan_type' => $lead->loan_type,
                'status' => $lead->statusEnum()->value,
                'status_label' => $lead->statusEnum()->label(),
                'status_colour' => $lead->statusEnum()->colour(),
                'created_at' => $lead->created_at?->toIso8601String(),
            ])->all(),
            null,
            $this->paginationMeta($paginator),
        );
    }

    /** GET /api/v1/affiliates/commissions */
    public function commissions(Request $request): JsonResponse
    {
        $this->authorize('viewCommissions', Affiliate::class);

        $paginator = $this->affiliates->commissionsFor($request->user(), $request->query());

        return $this->respondSuccess(
            AffiliateCommissionResource::collection($paginator->items())->resolve($request),
            null,
            $this->paginationMeta($paginator),
        );
    }

    /** POST /api/v1/affiliates/payouts */
    public function requestPayout(Request $request): JsonResponse
    {
        $this->authorize('requestOwn', AffiliatePayout::class);

        $payout = $this->payouts->requestPayout($request->user());

        return $this->respondCreated(
            (new AffiliatePayoutResource($payout))->resolve($request),
            'Payout requested.',
        );
    }

    /** GET /api/v1/affiliates/payouts */
    public function payoutHistory(Request $request): JsonResponse
    {
        $this->authorize('viewOwn', AffiliatePayout::class);

        $paginator = $this->payouts->listForAffiliate($request->user(), $request->query());

        return $this->respondSuccess(
            AffiliatePayoutResource::collection($paginator->items())->resolve($request),
            null,
            $this->paginationMeta($paginator),
        );
    }

    /**
     * @return array<string, int>
     */
    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ];
    }
}
