<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Telecaller\UpdateTelecallerProfileRequest;
use App\Http\Resources\TelecallerProfileResource;
use App\Models\Telecaller;
use App\Services\TelecallerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Telecaller module endpoints. Every action is scoped to the authenticated
 * telecaller; no hierarchy lookup happens here.
 */
class TelecallerController extends BaseApiController
{
    public function __construct(private readonly TelecallerService $telecallers)
    {
    }

    /** GET /api/v1/telecallers/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', Telecaller::class);

        return $this->respondSuccess($this->telecallers->dashboardFor($request->user()));
    }

    /** GET /api/v1/telecallers/profile */
    public function profile(Request $request): JsonResponse
    {
        $this->authorize('viewOwnProfile', Telecaller::class);

        $profile = $this->telecallers->profileFor($request->user());

        return $this->respondSuccess((new TelecallerProfileResource($profile))->resolve($request));
    }

    /** PUT /api/v1/telecallers/profile */
    public function updateProfile(UpdateTelecallerProfileRequest $request): JsonResponse
    {
        $profile = $this->telecallers->updateProfile($request->user(), $request->validated());

        return $this->respondSuccess(
            (new TelecallerProfileResource($profile))->resolve($request),
            'Profile updated.',
        );
    }
}
