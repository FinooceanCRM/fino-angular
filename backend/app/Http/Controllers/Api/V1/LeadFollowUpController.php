<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\FollowUp\StoreFollowUpRequest;
use App\Http\Resources\LeadFollowUpResource;
use App\Models\LeadFollowUp;
use App\Services\LeadFollowUpService;
use App\Services\LeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadFollowUpController extends BaseApiController
{
    public function __construct(
        private readonly LeadFollowUpService $followUps,
        private readonly LeadService $leads,
    ) {}

    /** GET /api/v1/leads/{lead}/follow-ups */
    public function index(Request $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('viewAny', [LeadFollowUp::class, $model]);

        return $this->respondSuccess(LeadFollowUpResource::collection($this->followUps->forLead($model))->resolve($request));
    }

    /** POST /api/v1/leads/{lead}/follow-ups */
    public function store(StoreFollowUpRequest $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('create', [LeadFollowUp::class, $model]);

        $followUp = $this->followUps->create($request->user(), $model, $request->validated());

        return $this->respondCreated(
            (new LeadFollowUpResource($followUp->load('banker:id,name,email,role')))->resolve($request),
            'Follow-up logged.',
        );
    }

    /** POST /api/v1/follow-ups/{follow_up}/complete */
    public function complete(Request $request, int $follow_up): JsonResponse
    {
        $followUp = LeadFollowUp::query()->findOrFail($follow_up);
        $this->authorize('complete', $followUp);

        $updated = $this->followUps->complete($followUp);

        return $this->respondSuccess(
            (new LeadFollowUpResource($updated->load('banker:id,name,email,role')))->resolve($request),
            'Follow-up marked complete.',
        );
    }
}
