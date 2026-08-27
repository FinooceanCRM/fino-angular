<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Approval\DecideApprovalRequest;
use App\Http\Requests\Approval\RejectApprovalRequest;
use App\Http\Requests\Approval\StoreApprovalCommentRequest;
use App\Http\Requests\Approval\StoreApprovalRequest;
use App\Http\Resources\ApprovalCommentResource;
use App\Http\Resources\ApprovalResource;
use App\Models\Approval;
use App\Services\ApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Approval Center API (Phase 5). Covers the Banker/Lead/Document approval
 * types — the Access type is served by {@see LeadAccessRequestController}.
 */
class ApprovalController extends BaseApiController
{
    public function __construct(private readonly ApprovalService $approvals) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Approval::class);

        $paginator = $this->approvals->paginate([
            'type' => $request->query('type'),
            'status' => $request->query('status'),
        ], (int) $request->query('per_page', 15));

        return $this->respondSuccess(
            ApprovalResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        );
    }

    public function show(Request $request, int $approval): JsonResponse
    {
        $model = $this->approvals->find($approval);
        $this->authorize('view', $model);
        $model->load('comments.author:id,name,email,role');

        return $this->respondSuccess((new ApprovalResource($model))->resolve($request));
    }

    public function store(StoreApprovalRequest $request): JsonResponse
    {
        $this->authorize('create', Approval::class);

        $approval = $this->approvals->create($request->user(), $request->validated());
        $approval->load([
            'requester:id,name,email,phone,role',
            'lead:id,reference,applicant_name,loan_type,loan_amount,city,assigned_banker_id',
            'lead.assignedBanker:id,name,email,phone,role',
        ]);

        return $this->respondCreated((new ApprovalResource($approval))->resolve($request), 'Approval request created.');
    }

    public function approve(DecideApprovalRequest $request, int $approval): JsonResponse
    {
        $model = $this->approvals->find($approval);
        $this->authorize('decide', $model);

        $updated = $this->approvals->approve($request->user(), $model, $request->validated()['remarks'] ?? null);
        $updated->load([
            'requester:id,name,email,phone,role',
            'decider:id,name,email,phone,role',
            'lead:id,reference,applicant_name,loan_type,loan_amount,city,assigned_banker_id',
            'lead.assignedBanker:id,name,email,phone,role',
        ]);

        return $this->respondSuccess((new ApprovalResource($updated))->resolve($request), 'Approval request approved.');
    }

    public function reject(RejectApprovalRequest $request, int $approval): JsonResponse
    {
        $model = $this->approvals->find($approval);
        $this->authorize('decide', $model);

        $updated = $this->approvals->reject($request->user(), $model, $request->validated('remarks'));
        $updated->load([
            'requester:id,name,email,phone,role',
            'decider:id,name,email,phone,role',
            'lead:id,reference,applicant_name,loan_type,loan_amount,city,assigned_banker_id',
            'lead.assignedBanker:id,name,email,phone,role',
        ]);

        return $this->respondSuccess((new ApprovalResource($updated))->resolve($request), 'Approval request rejected.');
    }

    public function comments(Request $request, int $approval): JsonResponse
    {
        $model = $this->approvals->find($approval);
        $this->authorize('view', $model);
        $model->load('comments.author:id,name,email,role');

        return $this->respondSuccess(ApprovalCommentResource::collection($model->comments)->resolve($request));
    }

    public function storeComment(StoreApprovalCommentRequest $request, int $approval): JsonResponse
    {
        $model = $this->approvals->find($approval);
        $this->authorize('comment', $model);

        $comment = $this->approvals->addComment($request->user(), $model, $request->validated('body'));

        return $this->respondCreated((new ApprovalCommentResource($comment))->resolve($request), 'Comment added.');
    }
}
