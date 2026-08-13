<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Manager\StoreRelationshipManagerRequest;
use App\Http\Requests\Manager\UpdateManagerProfileRequest;
use App\Http\Requests\Manager\UpdateRelationshipManagerRequest;
use App\Http\Resources\ManagerProfileResource;
use App\Http\Resources\UserResource;
use App\Models\Manager;
use App\Services\ManagerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manager module endpoints (Phase 8). Every action is scoped to the
 * authenticated Manager and the Relationship Managers / Employees below them.
 */
class ManagerController extends BaseApiController
{
    public function __construct(private readonly ManagerService $managers)
    {
    }

    /** GET /api/v1/managers/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', Manager::class);

        return $this->respondSuccess($this->managers->dashboardFor($request->user()));
    }

    /** GET /api/v1/managers/profile */
    public function profile(Request $request): JsonResponse
    {
        $this->authorize('viewOwnProfile', Manager::class);

        $profile = $this->managers->profileFor($request->user());

        return $this->respondSuccess((new ManagerProfileResource($profile))->resolve($request));
    }

    /** PUT /api/v1/managers/profile */
    public function updateProfile(UpdateManagerProfileRequest $request): JsonResponse
    {
        $profile = $this->managers->updateProfile($request->user(), $request->validated());

        return $this->respondSuccess(
            (new ManagerProfileResource($profile))->resolve($request),
            'Profile updated.',
        );
    }

    /** GET /api/v1/managers/relationship-managers */
    public function relationshipManagers(Request $request): JsonResponse
    {
        $this->authorize('viewRelationshipManagers', Manager::class);

        return $this->respondSuccess($this->managers->relationshipManagersFor($request->user()));
    }

    /** POST /api/v1/managers/relationship-managers */
    public function storeRelationshipManager(StoreRelationshipManagerRequest $request): JsonResponse
    {
        $rm = $this->managers->createRelationshipManager($request->user(), $request->validated());

        return $this->respondCreated(
            (new UserResource($rm))->resolve($request),
            'Relationship Manager created.',
        );
    }

    /** PUT /api/v1/managers/relationship-managers/{relationship_manager} */
    public function updateRelationshipManager(
        UpdateRelationshipManagerRequest $request,
        int $relationshipManager,
    ): JsonResponse {
        $rm = $this->managers->updateRelationshipManager(
            $request->user(),
            $relationshipManager,
            $request->validated(),
        );

        return $this->respondSuccess(
            (new UserResource($rm))->resolve($request),
            'Relationship Manager updated.',
        );
    }

    /** GET /api/v1/managers/employees */
    public function employees(Request $request): JsonResponse
    {
        $this->authorize('viewEmployees', Manager::class);

        return $this->respondSuccess($this->managers->employeesFor($request->user()));
    }
}
