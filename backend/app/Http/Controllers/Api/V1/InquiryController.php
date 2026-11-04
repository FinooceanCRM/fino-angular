<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Department;
use App\Enums\InquirySource;
use App\Enums\InquiryStatus;
use App\Enums\LoanType;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Inquiry\AddInquiryActivityRequest;
use App\Http\Requests\Inquiry\AssignInquiryRequest;
use App\Http\Requests\Inquiry\SetRoutingRuleRequest;
use App\Http\Requests\Inquiry\UpdateInquiryStatusRequest;
use App\Http\Resources\InquiryResource;
use App\Models\InquiryRoutingRule;
use App\Services\InquiryQueueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer Inquiries queue — Telecaller + Super Admin only (route middleware
 * `role:telecaller,super_admin`, re-checked in InquiryQueueService).
 */
class InquiryController extends BaseApiController
{
    public function __construct(private readonly InquiryQueueService $queue)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->queue->paginate($request->user(), $request->only([
            'loan_type', 'inquiry_status', 'source', 'offer_id', 'date_from', 'date_to',
            'assignment', 'mine', 'follow_up_due', 'search', 'sort', 'dir',
        ]), min(100, max(1, (int) $request->query('per_page', 15))));

        return $this->respondSuccess(
            InquiryResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        );
    }

    public function meta(Request $request): JsonResponse
    {
        $this->queue->assertStaff($request->user());

        return $this->respondSuccess([
            'statuses' => InquiryStatus::catalogue(),
            'sources' => collect(InquirySource::catalogue())->whereIn('value', InquirySource::inquiryValues())->values(),
            'loan_types' => LoanType::catalogue(),
            'departments' => Department::catalogue(),
            'offers' => \App\Models\LeadOffer::query()->withTrashed()->orderBy('name')->get(['id', 'name'])->map(fn ($o): array => ['id' => $o->id, 'name' => $o->name])->all(),
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->queue->stats($request->user()));
    }

    public function show(Request $request, int $inquiry): JsonResponse
    {
        $lead = $this->queue->find($request->user(), $inquiry);

        return $this->respondSuccess(InquiryResource::detail($lead, $this->queue->context($lead), $request));
    }

    public function claim(Request $request, int $inquiry): JsonResponse
    {
        $lead = $this->queue->claim($request->user(), $inquiry);

        return $this->respondSuccess((new InquiryResource($lead))->resolve($request), 'Inquiry claimed.');
    }

    public function updateStatus(UpdateInquiryStatusRequest $request, int $inquiry): JsonResponse
    {
        $lead = $this->queue->updateStatus(
            $request->user(),
            $inquiry,
            $request->string('inquiry_status')->toString(),
            $request->input('remarks'),
            $request->input('next_follow_up_at'),
        );

        return $this->respondSuccess((new InquiryResource($lead))->resolve($request), 'Status updated.');
    }

    public function addActivity(AddInquiryActivityRequest $request, int $inquiry): JsonResponse
    {
        $activity = $this->queue->addActivity(
            $request->user(),
            $inquiry,
            $request->string('type')->toString(),
            $request->string('body')->toString(),
            $request->input('next_follow_up_at'),
        );

        return $this->respondCreated(['id' => $activity->id], 'Activity logged.');
    }

    public function managers(Request $request, int $inquiry): JsonResponse
    {
        $lead = $this->queue->find($request->user(), $inquiry);

        return $this->respondSuccess($this->queue->assignableManagers($request->user(), $lead)->all());
    }

    public function assign(AssignInquiryRequest $request, int $inquiry): JsonResponse
    {
        $lead = $this->queue->assignToManager(
            $request->user(),
            $inquiry,
            (int) $request->input('manager_id'),
            $request->input('reason'),
        );

        return $this->respondSuccess((new InquiryResource($lead))->resolve($request), 'Inquiry assigned to manager.');
    }

    public function routingRules(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->presentRules($this->queue->routingRules($request->user())));
    }

    public function setRoutingRule(SetRoutingRuleRequest $request, string $department): JsonResponse
    {
        $rules = $this->queue->setRoutingRule($request->user(), $department, $request->input('manager_ids', []));

        return $this->respondSuccess($this->presentRules($rules), 'Routing updated.');
    }

    /**
     * @param iterable<InquiryRoutingRule> $rules
     * @return array<int, array<string, mixed>>
     */
    private function presentRules(iterable $rules): array
    {
        $out = [];
        foreach ($rules as $r) {
            $out[] = [
                'id' => $r->id,
                'department' => $r->department,
                'department_label' => Department::tryFrom($r->department)?->label(),
                'manager' => $r->manager?->only(['id', 'name', 'email']),
                'is_active' => $r->is_active,
            ];
        }

        return $out;
    }
}
