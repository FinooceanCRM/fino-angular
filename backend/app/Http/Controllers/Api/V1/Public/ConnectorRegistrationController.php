<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Connector\RegisterConnectorRequest;
use App\Http\Requests\Connector\ResendConnectorOtpRequest;
use App\Http\Requests\Connector\VerifyConnectorOtpRequest;
use App\Services\ConnectorRegistrationService;
use Illuminate\Http\JsonResponse;

class ConnectorRegistrationController extends BaseApiController
{
    public function __construct(private readonly ConnectorRegistrationService $registrations)
    {
    }

    public function store(RegisterConnectorRequest $request): JsonResponse
    {
        $connector = $this->registrations->register($request->validated());

        return $this->respondCreated(
            $this->devOtpPayload($connector->otp_code),
            'Registration received. Enter the code we sent to your phone to verify your account.',
        );
    }

    public function verifyOtp(VerifyConnectorOtpRequest $request): JsonResponse
    {
        $this->registrations->verifyOtp($request->validated()['email'], $request->validated()['otp']);

        return $this->respondSuccess(null, 'Your account is verified. You can now log in.');
    }

    public function resendOtp(ResendConnectorOtpRequest $request): JsonResponse
    {
        $connector = $this->registrations->resendOtp($request->validated()['email']);

        return $this->respondSuccess(
            $this->devOtpPayload($connector->otp_code),
            'A new code has been sent.',
        );
    }

    /**
     * Convenience only: with no SMS gateway configured, local development
     * has no other way to see the OTP than the log file. Surfacing it in
     * the response too — local/debug only, never in production — saves
     * digging through storage/logs/laravel.log on every signup while
     * testing.
     *
     * @return array<string, string>|null
     */
    private function devOtpPayload(?string $otp): ?array
    {
        if (! $otp || ! config('app.debug')) {
            return null;
        }

        return ['dev_otp' => $otp];
    }
}
