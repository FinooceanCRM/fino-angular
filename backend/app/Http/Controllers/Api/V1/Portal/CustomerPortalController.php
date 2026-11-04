<?php

namespace App\Http\Controllers\Api\V1\Portal;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Portal\ApplyRequest;
use App\Http\Requests\Portal\OtpRequest;
use App\Http\Requests\Portal\UploadCustomerDocumentRequest;
use App\Http\Resources\NotificationResource;
use App\Models\User;
use App\Services\CustomerPortalService;
use App\Services\DocumentService;
use App\Services\NotificationService;
use App\Services\PhoneOtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Customer-only endpoints (route middleware `role:customer`). Every read is
 * scoped to the caller's own customer record inside CustomerPortalService.
 */
class CustomerPortalController extends BaseApiController
{
    public function __construct(
        private readonly CustomerPortalService $portal,
        private readonly DocumentService $documents,
        private readonly NotificationService $notifications,
        private readonly PhoneOtpService $otp,
    ) {
    }

    private function me(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();

        return $user;
    }

    public function dashboard(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->portal->dashboard($this->me($request)));
    }

    public function applications(Request $request): JsonResponse
    {
        $paginator = $this->portal->applications($this->me($request), $request->query('status'), min(50, max(1, (int) $request->query('per_page', 10))));

        return $this->respondSuccess(
            collect($paginator->items())->map(fn ($l): array => $this->portal->present($l))->all(),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        );
    }

    public function application(Request $request, int $lead): JsonResponse
    {
        $model = $this->portal->findOwned($this->me($request), $lead);

        return $this->respondSuccess($this->portal->present($model, true));
    }

    public function apply(ApplyRequest $request): JsonResponse
    {
        $result = $this->portal->apply($this->me($request), $request->validated());

        return $this->respondCreated(
            $this->portal->present($result['lead']),
            'Your application has been submitted.',
        );
    }

    public function sendOtp(OtpRequest $request): JsonResponse
    {
        return $this->respondSuccess(
            $this->otp->send($this->me($request), $request->string('phone')->toString()),
            'We have sent a 6-digit code to your mobile number.',
        );
    }

    public function verifyOtp(OtpRequest $request): JsonResponse
    {
        $token = $this->otp->verify($this->me($request), $request->string('phone')->toString(), $request->string('code')->toString());

        return $this->respondSuccess(['otp_token' => $token], 'Mobile number verified.');
    }

    public function documents(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->portal->allDocuments($this->me($request)));
    }

    public function uploadDocument(UploadCustomerDocumentRequest $request, int $lead): JsonResponse
    {
        $document = $this->portal->uploadDocument(
            $this->me($request),
            $lead,
            $request->string('document_type')->toString(),
            $request->file('file'),
        );

        return $this->respondCreated(['id' => $document->id, 'status' => $document->status], 'Document uploaded.');
    }

    public function downloadDocument(Request $request, int $document): StreamedResponse
    {
        return $this->documents->stream($this->portal->findOwnedDocument($this->me($request), $document));
    }

    public function notifications(Request $request): JsonResponse
    {
        $user = $this->me($request);
        $paginator = $this->notifications->paginateFor($user, (bool) $request->query('unread'), 20);

        return $this->respondSuccess(
            NotificationResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'unread' => $this->notifications->unreadCount($user),
            ],
        );
    }

    public function markNotificationRead(Request $request, int $notification): JsonResponse
    {
        $this->notifications->markRead($this->me($request), $notification);

        return $this->respondSuccess(null, 'Marked as read.');
    }

    public function markAllNotificationsRead(Request $request): JsonResponse
    {
        $this->notifications->markAllRead($this->me($request));

        return $this->respondSuccess(null, 'All notifications marked as read.');
    }
}
