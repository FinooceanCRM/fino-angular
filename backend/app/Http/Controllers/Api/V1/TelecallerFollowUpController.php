<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\TelecallerFollowUp\RescheduleTelecallerFollowUpRequest;
use App\Http\Requests\TelecallerFollowUp\StoreTelecallerFollowUpRequest;
use App\Http\Resources\TelecallerFollowUpResource;
use App\Models\Telecaller;
use App\Models\TelecallerFollowUp;
use App\Services\LeadService;
use App\Services\TelecallerFollowUpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelecallerFollowUpController extends BaseApiController
{
    public function __construct(
        private readonly TelecallerFollowUpService $followUps,
        private readonly LeadService $leads,
    ) {}

    /** GET /api/v1/leads/{lead}/telecaller-follow-ups */
    public function index(Request $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('viewAny', [TelecallerFollowUp::class, $model]);

        return $this->respondSuccess(
            TelecallerFollowUpResource::collection($this->followUps->forLead($model))->resolve($request),
        );
    }

    /** POST /api/v1/leads/{lead}/telecaller-follow-ups */
    public function store(StoreTelecallerFollowUpRequest $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('create', [TelecallerFollowUp::class, $model]);

        $followUp = $this->followUps->create($request->user(), $model, $request->validated());

        return $this->respondCreated(
            (new TelecallerFollowUpResource($followUp->load('telecaller:id,name,email,role')))->resolve($request),
            'Follow-up logged.',
        );
    }

    /** POST /api/v1/telecaller-follow-ups/{follow_up}/complete */
    public function complete(Request $request, int $follow_up): JsonResponse
    {
        $followUp = TelecallerFollowUp::query()->findOrFail($follow_up);
        $this->authorize('complete', $followUp);

        $updated = $this->followUps->complete($followUp);

        return $this->respondSuccess(
            (new TelecallerFollowUpResource($updated->load('telecaller:id,name,email,role')))->resolve($request),
            'Follow-up marked complete.',
        );
    }

    /** POST /api/v1/telecaller-follow-ups/{follow_up}/reschedule */
    public function reschedule(RescheduleTelecallerFollowUpRequest $request, int $follow_up): JsonResponse
    {
        $followUp = TelecallerFollowUp::query()->findOrFail($follow_up);
        $this->authorize('reschedule', $followUp);

        $updated = $this->followUps->reschedule($followUp, $request->validated()['next_follow_up_at']);

        return $this->respondSuccess(
            (new TelecallerFollowUpResource($updated->load('telecaller:id,name,email,role')))->resolve($request),
            'Follow-up rescheduled.',
        );
    }

    /** GET /api/v1/telecallers/follow-ups?filter=all|today|pending|completed|overdue */
    public function pending(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', Telecaller::class);

        $filter = (string) $request->query('filter', 'pending');

        return $this->respondSuccess(
            TelecallerFollowUpResource::collection(
                $this->followUps->forActor($request->user(), $filter),
            )->resolve($request),
        );
    }
}
