<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Accounts\UpdateAccountsProfileRequest;
use App\Http\Resources\AccountsProfileResource;
use App\Models\Accountant;
use App\Services\AccountsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Accounts module endpoints. Every action is scoped to the authenticated
 * accounts user; dashboard() is the only one that reads across every payee
 * (still read-only — decisions are made via the existing Super Admin
 * commissions/payouts/ledger endpoints, just opened up to this role at the
 * policy layer — see routes/api.php).
 */
class AccountsController extends BaseApiController
{
    public function __construct(private readonly AccountsService $accounts)
    {
    }

    /** GET /api/v1/accounts/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', Accountant::class);

        return $this->respondSuccess($this->accounts->dashboardFor($request->user()));
    }

    /** GET /api/v1/accounts/profile */
    public function profile(Request $request): JsonResponse
    {
        $this->authorize('viewOwnProfile', Accountant::class);

        $profile = $this->accounts->profileFor($request->user());

        return $this->respondSuccess((new AccountsProfileResource($profile))->resolve($request));
    }

    /** PUT /api/v1/accounts/profile */
    public function updateProfile(UpdateAccountsProfileRequest $request): JsonResponse
    {
        $profile = $this->accounts->updateProfile($request->user(), $request->validated());

        return $this->respondSuccess(
            (new AccountsProfileResource($profile))->resolve($request),
            'Profile updated.',
        );
    }
}
