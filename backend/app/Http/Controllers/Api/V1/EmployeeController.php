<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Employee\UpdateEmployeeProfileRequest;
use App\Http\Resources\EmployeeProfileResource;
use App\Models\Employee;
use App\Services\EmployeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Employee module endpoints (Phase 6). Every action is scoped to the
 * authenticated employee; no other user's data can be reached from here.
 */
class EmployeeController extends BaseApiController
{
    public function __construct(private readonly EmployeeService $employees)
    {
    }

    /** GET /api/v1/employees/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', Employee::class);

        return $this->respondSuccess($this->employees->dashboardFor($request->user()));
    }

    /** GET /api/v1/employees/profile */
    public function profile(Request $request): JsonResponse
    {
        $this->authorize('viewOwnProfile', Employee::class);

        $profile = $this->employees->profileFor($request->user());

        return $this->respondSuccess((new EmployeeProfileResource($profile))->resolve($request));
    }

    /** PUT /api/v1/employees/profile */
    public function updateProfile(UpdateEmployeeProfileRequest $request): JsonResponse
    {
        $profile = $this->employees->updateProfile($request->user(), $request->validated());

        return $this->respondSuccess(
            (new EmployeeProfileResource($profile))->resolve($request),
            'Profile updated.',
        );
    }

    /** GET /api/v1/employees/team */
    public function team(Request $request): JsonResponse
    {
        $this->authorize('viewTeam', Employee::class);

        return $this->respondSuccess($this->employees->teamFor($request->user()));
    }
}
