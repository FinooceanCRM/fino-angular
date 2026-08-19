<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AccessRequestStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\AccessRequest\ApproveAccessRequestRequest;
use App\Http\Requests\AccessRequest\CreateAccessRequestRequest;
use App\Http\Requests\AccessRequest\RejectAccessRequestRequest;
use App\Http\Resources\LeadAccessRequestResource;
use App\Models\LeadAccessRequest;
use App\Services\LeadAccessRequestService;
use App\Services\LeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeadAccessRequestController extends BaseApiController
{
    public function __construct(
        private readonly LeadAccessRequestService $accessRequests,
        private readonly LeadService $leads,
    ) {
    }

    /** POST /api/v1/leads/{lead}/access-requests */
    public function store(CreateAccessRequestRequest $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('create', [LeadAccessRequest::class, $model]);

        $accessRequest = $this->accessRequests->request(
            $request->user(),
            $model,
            $request->validated()['remarks'] ?? null,
        );

        return $this->respondCreated(
            (new LeadAccessRequestResource($accessRequest->load('banker:id,name,email,role')))->resolve($request),
            'Access request submitted.',
        );
    }

    /** GET /api/v1/leads/{lead}/access-requests */
    public function forLead(Request $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('view', $model);

        $requests = $this->accessRequests->forLead($model);

        return $this->respondSuccess(LeadAccessRequestResource::collection($requests)->resolve($request));
    }

    /** GET /api/v1/access-requests?status=pending|approved|rejected */
    public function pending(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(AccessRequestStatus::values())],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = $this->accessRequests->listFor(
            $request->user(),
            $validated['status'] ?? AccessRequestStatus::Pending->value,
            (int) ($validated['per_page'] ?? 15),
        );

        return $this->respondSuccess(
            LeadAccessRequestResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        );
    }

    /** POST /api/v1/access-requests/{access_request}/approve */
    public function approve(ApproveAccessRequestRequest $request, int $access_request): JsonResponse
    {
        $accessRequest = LeadAccessRequest::query()->findOrFail($access_request);
        $this->authorize('decide', $accessRequest);

        $updated = $this->accessRequests->approve(
            $request->user(),
            $accessRequest,
            $request->validated()['remarks'] ?? null,
        );

        return $this->respondSuccess(
            (new LeadAccessRequestResource($updated->load(['banker:id,name,email,role', 'decidedBy:id,name'])))->resolve($request),
            'Access request approved.',
        );
    }

    /** POST /api/v1/access-requests/{access_request}/reject */
    public function reject(RejectAccessRequestRequest $request, int $access_request): JsonResponse
    {
        $accessRequest = LeadAccessRequest::query()->findOrFail($access_request);
        $this->authorize('decide', $accessRequest);

        $updated = $this->accessRequests->reject(
            $request->user(),
            $accessRequest,
            $request->validated()['remarks'],
        );

        return $this->respondSuccess(
            (new LeadAccessRequestResource($updated->load(['banker:id,name,email,role', 'decidedBy:id,name'])))->resolve($request),
            'Access request rejected.',
        );
    }
}
