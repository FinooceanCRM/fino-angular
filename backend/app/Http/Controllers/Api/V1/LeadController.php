<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\LeadStatus;
use App\Enums\LoanType;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Lead\AssignLeadRequest;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Http\Requests\Lead\UpdateLeadStatusRequest;
use App\Http\Resources\LoanLeadResource;
use App\Models\LoanLead;
use App\Models\User;
use App\Services\LeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Lead management API (Phase 9). Every read is hierarchy-scoped.
 */
class LeadController extends BaseApiController
{
    public function __construct(private readonly LeadService $leads)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', LoanLead::class);
        $actor = $request->user();

        $paginator = $this->leads->paginate($actor, [
            'search' => $request->query('search'),
            'status' => $request->query('status'),
            'loan_type' => $request->query('loan_type'),
            'city' => $request->query('city'),
            'state' => $request->query('state'),
            'assigned_employee_id' => $request->query('assigned_employee_id'),
            'connector_id' => $request->query('connector_id'),
            'min_amount' => $request->query('min_amount'),
            'max_amount' => $request->query('max_amount'),
            'sort' => $request->query('sort'),
            'direction' => $request->query('direction'),
        ], (int) $request->query('per_page', 15));

        return $this->respondSuccess(
            LoanLeadResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        );
    }

    public function show(Request $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('view', $model);

        $model->load(['statusHistory.changedBy:id,name', 'matches.bankCriteria', 'documents.uploader:id,name']);

        return $this->respondSuccess([
            'lead' => (new LoanLeadResource($model))->resolve($request),
            'status_history' => $model->statusHistory->map(static fn ($h): array => [
                'id' => $h->id,
                'from_status' => $h->from_status,
                'to_status' => $h->to_status,
                'remarks' => $h->remarks,
                'changed_by' => $h->changedBy?->name,
                'created_at' => optional($h->created_at)->toIso8601String(),
            ])->all(),
            'matches' => $model->matches->map(static fn ($m): array => [
                'id' => $m->id,
                'match_score' => $m->match_score,
                'status' => $m->status,
                'reasons' => $m->reasons ?? [],
                'bank_name' => $m->bankCriteria?->bank_name,
                'product_name' => $m->bankCriteria?->product_name,
                'interest_rate' => $m->bankCriteria?->interest_rate !== null ? (float) $m->bankCriteria->interest_rate : null,
            ])->all(),
        ]);
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $this->authorize('create', LoanLead::class);

        $lead = $this->leads->create($request->user(), $request->validated());

        return $this->respondCreated(
            (new LoanLeadResource($lead))->resolve($request),
            'Lead created.',
        );
    }

    public function update(UpdateLeadRequest $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('update', $model);

        $updated = $this->leads->update($request->user(), $model, $request->validated());

        return $this->respondSuccess(
            (new LoanLeadResource($updated))->resolve($request),
            'Lead updated.',
        );
    }

    public function destroy(Request $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('delete', $model);

        $this->leads->delete($model);

        return $this->respondSuccess(null, 'Lead deleted.');
    }

    public function assign(AssignLeadRequest $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('assign', $model);

        $assignee = User::query()->findOrFail((int) $request->validated()['assignee_id']);
        $updated = $this->leads->assign($request->user(), $model, $assignee, $request->validated()['remarks'] ?? null);

        return $this->respondSuccess(
            (new LoanLeadResource($updated))->resolve($request),
            'Lead assigned.',
        );
    }

    public function updateStatus(UpdateLeadStatusRequest $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('changeStatus', $model);

        $updated = $this->leads->changeStatus(
            $request->user(),
            $model,
            $request->validated()['status'],
            $request->validated()['remarks'] ?? null,
        );

        return $this->respondSuccess(
            (new LoanLeadResource($updated))->resolve($request),
            'Lead status updated.',
        );
    }

    public function match(Request $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('match', $model);

        return $this->respondSuccess($this->leads->runMatching($model), 'Matching completed.');
    }

    public function assignableUsers(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->leads->assignableUsers($request->user()));
    }

    /** Static catalogues used by the frontend forms. */
    public function metadata(): JsonResponse
    {
        return $this->respondSuccess([
            'statuses' => LeadStatus::catalogue(),
            'loan_types' => array_map(
                static fn (LoanType $t): array => ['value' => $t->value, 'label' => $t->label()],
                LoanType::cases(),
            ),
            'employment_types' => [
                ['value' => 'salaried', 'label' => 'Salaried'],
                ['value' => 'self_employed', 'label' => 'Self Employed'],
                ['value' => 'business', 'label' => 'Business'],
            ],
        ]);
    }
}
