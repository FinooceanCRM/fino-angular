<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Department;
use App\Enums\LeadStatus;
use App\Enums\LoanType;
use App\Enums\UserRole;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Lead\AssignLeadRequest;
use App\Http\Requests\Lead\CompletePdRequest;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\SubmitPdRequest;
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
    public function __construct(private readonly LeadService $leads) {}

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
            'assigned_relationship_manager_id' => $request->query('assigned_relationship_manager_id'),
            'assigned_banker_id' => $request->query('assigned_banker_id'),
            'connector_id' => $request->query('connector_id'),
            'created_by' => $request->query('created_by'),
            'banker_bucket' => $request->query('banker_bucket'),
            'min_amount' => $request->query('min_amount'),
            'max_amount' => $request->query('max_amount'),
            'created_from' => $request->query('created_from'),
            'created_to' => $request->query('created_to'),
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

        $model->load([
            'statusHistory.changedBy:id,name',
            'matches' => fn ($q) => $q->orderByDesc('match_score'),
            'matches.bankCriteria',
            'documents.uploader:id,name',
            'assignments' => fn ($q) => $q->orderBy('assigned_at'),
            'assignments.assignee:id,name,email,role',
            'assignments.assigner:id,name,email,role',
        ]);

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
            'assignment_history' => $model->assignments->map(static fn ($a): array => [
                'id' => $a->id,
                'assignee' => $a->assignee ? [
                    'id' => $a->assignee->id,
                    'name' => $a->assignee->name,
                    'email' => $a->assignee->email,
                    'role' => $a->assignee->role instanceof UserRole ? $a->assignee->role->value : (string) $a->assignee->role,
                ] : null,
                'assigned_by' => $a->assigner ? [
                    'id' => $a->assigner->id,
                    'name' => $a->assigner->name,
                    'email' => $a->assigner->email,
                    'role' => $a->assigner->role instanceof UserRole ? $a->assigner->role->value : (string) $a->assigner->role,
                ] : null,
                'remarks' => $a->remarks,
                'created_at' => optional($a->assigned_at)->toIso8601String(),
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
        try {
            $this->authorize('create', LoanLead::class);

            \Log::info('Lead creation started.', [
                'user_id' => $request->user()?->id,
                'payload' => $request->validated(),
            ]);

            $lead = $this->leads->create(
                $request->user(),
                $request->validated()
            );

            \Log::info('Lead created successfully.', [
                'lead_id' => $lead->id,
            ]);

            return $this->respondCreated(
                (new LoanLeadResource($lead))->resolve($request),
                'Lead created.',
            );

        } catch (\Throwable $e) {

            \Log::error('Lead creation failed.', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'payload' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Lead creation failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
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

    /** POST /api/v1/leads/{lead}/pd-complete — Telecaller PD workflow (Phase 6). */
    public function completePd(CompletePdRequest $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('completePd', $model);

        $updated = $this->leads->completePd($request->user(), $model, $request->validated()['remarks'] ?? null);

        return $this->respondSuccess(
            (new LoanLeadResource($updated))->resolve($request),
            'PD completed.',
        );
    }

    /** GET /api/v1/leads/{lead}/pd — existing Full PD data, for pre-filling/resuming the form. */
    public function showPd(Request $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('view', $model);

        // pd_details holds the same class of sensitive PII as documents
        // (bank accounts, addresses, family details) — gate it the same
        // way viewDocuments does, so a Banker who is merely matched (not
        // granted full access) can't read it via this endpoint.
        $this->authorize('viewDocuments', $model);

        return $this->respondSuccess([
            'pd_details' => $model->pd_details,
            'pd_completed_at' => optional($model->pd_completed_at)->toIso8601String(),
            'can_submit_pd' => $request->user()->can('submitPd', $model),
        ]);
    }

    /** POST /api/v1/leads/{lead}/pd — Full PD workflow (successor to pd-complete). */
    public function submitPd(SubmitPdRequest $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('submitPd', $model);

        $updated = $this->leads->submitPd($request->user(), $model, $request->validated());

        return $this->respondSuccess(
            (new LoanLeadResource($updated))->resolve($request),
            'Full PD completed.',
        );
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
            'departments' => Department::catalogue(),
            'employment_types' => [
                ['value' => 'salaried', 'label' => 'Salaried'],
                ['value' => 'self_employed', 'label' => 'Self Employed'],
                ['value' => 'business', 'label' => 'Business'],
                ['value' => 'professional', 'label' => 'Professional'],
            ],
        ]);
    }
}
