<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Vendor\RegisterVendorRequest;
use App\Http\Requests\Vendor\ResendVendorOtpRequest;
use App\Http\Requests\Vendor\VerifyVendorOtpRequest;
use App\Enums\VendorStatus;
use App\Services\VendorRegistrationService;
use Illuminate\Http\JsonResponse;

/**
 * Public "Join as Vendor" signup + phone-OTP verification. Unauthenticated
 * by design, same shape as {@see ConnectorRegistrationController}.
 */
class VendorRegistrationController extends BaseApiController
{
    public function __construct(private readonly VendorRegistrationService $registrations) {}

    public function store(RegisterVendorRequest $request): JsonResponse
    {
        $vendor = $this->registrations->register($request->validated());

        $verificationRequired = $vendor->statusEnum() === VendorStatus::PendingVerification;

        return $this->respondCreated(
            array_merge(['verification_required' => $verificationRequired], $this->devOtpPayload($vendor->otp_code) ?? []),
            $verificationRequired
                ? 'Registration received. Enter the code we sent to your phone to verify your account.'
                : 'Registration received. You can now log in.',
        );
    }

    public function verifyOtp(VerifyVendorOtpRequest $request): JsonResponse
    {
        $this->registrations->verifyOtp($request->validated()['email'], $request->validated()['otp']);

        return $this->respondSuccess(null, 'Your account is verified. You can now log in.');
    }

    public function resendOtp(ResendVendorOtpRequest $request): JsonResponse
    {
        $vendor = $this->registrations->resendOtp($request->validated()['email']);

        return $this->respondSuccess(
            $this->devOtpPayload($vendor->otp_code),
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
