<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\RelationshipManager\UpdateRelationshipManagerProfileRequest;
use App\Http\Resources\RelationshipManagerProfileResource;
use App\Models\RelationshipManager;
use App\Services\RelationshipManagerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Relationship Manager module endpoints (Phase 7). Every action is scoped to
 * the authenticated Relationship Manager and their assigned team.
 */
class RelationshipManagerController extends BaseApiController
{
    public function __construct(private readonly RelationshipManagerService $relationshipManagers)
    {
    }

    /** GET /api/v1/relationship-managers/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', RelationshipManager::class);

        return $this->respondSuccess($this->relationshipManagers->dashboardFor($request->user()));
    }

    /** GET /api/v1/relationship-managers/profile */
    public function profile(Request $request): JsonResponse
    {
        $this->authorize('viewOwnProfile', RelationshipManager::class);

        $profile = $this->relationshipManagers->profileFor($request->user());

        return $this->respondSuccess((new RelationshipManagerProfileResource($profile))->resolve($request));
    }

    /** PUT /api/v1/relationship-managers/profile */
    public function updateProfile(UpdateRelationshipManagerProfileRequest $request): JsonResponse
    {
        $profile = $this->relationshipManagers->updateProfile($request->user(), $request->validated());

        return $this->respondSuccess(
            (new RelationshipManagerProfileResource($profile))->resolve($request),
            'Profile updated.',
        );
    }

    /** GET /api/v1/relationship-managers/employees */
    public function employees(Request $request): JsonResponse
    {
        $this->authorize('viewEmployees', RelationshipManager::class);

        return $this->respondSuccess($this->relationshipManagers->employeesFor($request->user()));
    }

    /** GET /api/v1/relationship-managers/connectors */
    public function connectors(Request $request): JsonResponse
    {
        $this->authorize('viewConnectors', RelationshipManager::class);

        return $this->respondSuccess($this->relationshipManagers->connectorsFor($request->user()));
    }
}
