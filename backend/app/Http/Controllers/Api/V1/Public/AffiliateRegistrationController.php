<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Affiliate\RegisterAffiliateRequest;
use App\Services\AffiliateRegistrationService;
use Illuminate\Http\JsonResponse;

class AffiliateRegistrationController extends BaseApiController
{
    public function __construct(private readonly AffiliateRegistrationService $registrations)
    {
    }

    public function store(RegisterAffiliateRequest $request): JsonResponse
    {
        $this->registrations->register($request->validated());

        return $this->respondCreated(
            null,
            'Registration received. Please check your email to verify your account before logging in.',
        );
    }

    /**
     * The `signed` route middleware already rejects a tampered or expired
     * URL before this runs; the service still checks the hash against the
     * user's email as a second, independent guard.
     */
    public function verify(string $id, string $hash): JsonResponse
    {
        $this->registrations->verify((int) $id, $hash);

        return $this->respondSuccess(null, 'Your email has been verified. You can now log in.');
    }
}
