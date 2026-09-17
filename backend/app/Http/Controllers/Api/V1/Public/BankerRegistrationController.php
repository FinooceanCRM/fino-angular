<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Banker\RegisterBankerRequest;
use App\Http\Requests\Banker\ResendBankerOtpRequest;
use App\Http\Requests\Banker\VerifyBankerOtpRequest;
use App\Enums\BankerStatus;
use App\Services\BankerRegistrationService;
use Illuminate\Http\JsonResponse;

/**
 * Public "Join as Banker" signup + phone-OTP verification. Unauthenticated
 * by design, same shape as {@see VendorRegistrationController}.
 */
class BankerRegistrationController extends BaseApiController
{
    public function __construct(private readonly BankerRegistrationService $registrations) {}

    public function store(RegisterBankerRequest $request): JsonResponse
    {
        $banker = $this->registrations->register($request->validated());

        $verificationRequired = $banker->statusEnum() === BankerStatus::PendingVerification;

        return $this->respondCreated(
            array_merge(['verification_required' => $verificationRequired], $this->devOtpPayload($banker->otp_code) ?? []),
            $verificationRequired
                ? 'Registration received. Enter the code we sent to your phone to verify your account.'
                : 'Registration received. You can now log in.',
        );
    }

    public function verifyOtp(VerifyBankerOtpRequest $request): JsonResponse
    {
        $this->registrations->verifyOtp($request->validated()['email'], $request->validated()['otp']);

        return $this->respondSuccess(null, 'Your account is verified. You can now log in.');
    }

    public function resendOtp(ResendBankerOtpRequest $request): JsonResponse
    {
        $banker = $this->registrations->resendOtp($request->validated()['email']);

        return $this->respondSuccess(
            $this->devOtpPayload($banker->otp_code),
            'A new code has been sent.',
        );
    }

    /**
     * Convenience only: with no SMS gateway configured, local development
     * has no other way to see the OTP than the log file. Surfacing it in
     * the response too — local/debug only, never in production.
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
