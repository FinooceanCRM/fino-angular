<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Banker\UpdateBankerProfileRequest;
use App\Http\Resources\BankerProfileResource;
use App\Models\Banker;
use App\Services\BankerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Banker module endpoints. Every action is scoped to the authenticated
 * banker; no hierarchy lookup happens here.
 */
class BankerController extends BaseApiController
{
    public function __construct(private readonly BankerService $bankers)
    {
    }

    /** GET /api/v1/bankers/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', Banker::class);

        return $this->respondSuccess($this->bankers->dashboardFor($request->user()));
    }

    /** GET /api/v1/bankers/profile */
    public function profile(Request $request): JsonResponse
    {
        $this->authorize('viewOwnProfile', Banker::class);

        $profile = $this->bankers->profileFor($request->user());

        return $this->respondSuccess((new BankerProfileResource($profile))->resolve($request));
    }

    /** PUT /api/v1/bankers/profile */
    public function updateProfile(UpdateBankerProfileRequest $request): JsonResponse
    {
        $profile = $this->bankers->updateProfile($request->user(), $request->validated());

        return $this->respondSuccess(
            (new BankerProfileResource($profile))->resolve($request),
            'Profile updated.',
        );
    }
}
