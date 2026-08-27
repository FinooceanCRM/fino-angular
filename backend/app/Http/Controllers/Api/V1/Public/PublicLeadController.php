<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Public\SubmitPublicLeadRequest;
use App\Services\PublicLeadIntakeService;
use Illuminate\Http\JsonResponse;

class PublicLeadController extends BaseApiController
{
    public function __construct(private readonly PublicLeadIntakeService $intake)
    {
    }

    /**
     * Always responds 201 with the same generic message, whether or not a
     * lead was actually persisted — see PublicLeadIntakeService::submit()
     * for why (honeypot handling must not be observable to a bot).
     */
    public function store(SubmitPublicLeadRequest $request): JsonResponse
    {
        $this->intake->submit($request->validated(), $request->ip());

        return $this->respondCreated(null, 'Thank you. Your submission has been received.');
    }
}
