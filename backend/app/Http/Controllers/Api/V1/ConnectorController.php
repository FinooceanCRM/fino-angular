<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Connector\UpdateConnectorProfileRequest;
use App\Http\Resources\ConnectorProfileResource;
use App\Models\Connector;
use App\Services\ConnectorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Connector module endpoints. Every action is scoped to the authenticated
 * connector; no hierarchy lookup happens here.
 */
class ConnectorController extends BaseApiController
{
    public function __construct(private readonly ConnectorService $connectors)
    {
    }

    /** GET /api/v1/connectors/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', Connector::class);

        return $this->respondSuccess($this->connectors->dashboardFor($request->user()));
    }

    /** GET /api/v1/connectors/profile */
    public function profile(Request $request): JsonResponse
    {
        $this->authorize('viewOwnProfile', Connector::class);

        $profile = $this->connectors->profileFor($request->user());

        return $this->respondSuccess((new ConnectorProfileResource($profile))->resolve($request));
    }

    /** PUT /api/v1/connectors/profile */
    public function updateProfile(UpdateConnectorProfileRequest $request): JsonResponse
    {
        $profile = $this->connectors->updateProfile($request->user(), $request->validated());

        return $this->respondSuccess(
            (new ConnectorProfileResource($profile))->resolve($request),
            'Profile updated.',
        );
    }
}
