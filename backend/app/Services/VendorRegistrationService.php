<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\VendorStatus;
use App\Exceptions\DomainException;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Self-service vendor signup: no admin approval gate, but the account stays
 * inactive (`users.is_active = false`, `vendors.status =
 * pending_verification`) until the vendor confirms a 6-digit OTP sent to
 * the phone number they signed up with.
 *
 * Deliberately a trimmed copy of {@see ConnectorRegistrationService}: a
 * vendor has no referral network and no payout profile, so `register()`
 * only creates the `users` identity row and the 1:1 `vendors` profile.
 */
class VendorRegistrationService extends BaseService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function register(array $data): Vendor
    {
        $vendor = $this->transaction(function () use ($data): Vendor {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => UserRole::Vendor,
                'phone' => $data['phone'],
                'is_active' => false,
            ]);

            $vendor = Vendor::query()->create([
                'user_id' => $user->id,
                'status' => VendorStatus::PendingVerification,
                'business_name' => $data['business_name'] ?? null,
                'contact_person' => $data['contact_person'] ?? null,
                'alternate_phone' => $data['alternate_phone'] ?? null,
                'address_line1' => $data['address_line1'] ?? null,
                'address_line2' => $data['address_line2'] ?? null,
                'city' => $data['city'] ?? null,
                'state' => $data['state'] ?? null,
                'pincode' => $data['pincode'] ?? null,
                'pan_number' => $data['pan_number'] ?? null,
                'gst_number' => $data['gst_number'] ?? null,
                'joined_at' => now(),
                ...$this->generateOtp(),
            ]);

            $vendor->setRelation('user', $user);

            return $vendor;
        });

        $this->sendOtp($vendor->user, $vendor->otp_code);

        return $vendor;
    }

    /**
     * Confirms the OTP, activates the vendor and their user account.
     * Idempotent: verifying an already-active vendor simply returns it
     * unchanged (a stale OTP resubmitted after a page refresh is not an
     * error).
     */
    public function verifyOtp(string $email, string $otp): Vendor
    {
        $user = User::query()->where('email', mb_strtolower(trim($email)))->first();

        if (! $user || ! $user->hasRole(UserRole::Vendor)) {
            throw new DomainException('This verification code is invalid.', 404);
        }

        $vendor = Vendor::query()->where('user_id', $user->id)->first();

        if (! $vendor) {
            throw new DomainException('This verification code is invalid.', 404);
        }

        if ($vendor->statusEnum() !== VendorStatus::PendingVerification) {
            return $vendor;
        }

        if ($vendor->otp_code === null || $vendor->otp_expires_at === null || $vendor->otp_expires_at->isPast()) {
            throw new DomainException('This code has expired. Request a new one.', 422);
        }

        if (! hash_equals($vendor->otp_code, $otp)) {
            throw new DomainException('That code is incorrect.', 422);
        }

        return $this->transaction(function () use ($user, $vendor): Vendor {
            $vendor->forceFill([
                'phone_verified_at' => now(),
                'otp_code' => null,
                'otp_expires_at' => null,
                'status' => VendorStatus::Active,
            ])->save();

            $user->forceFill(['is_active' => true])->save();

            return $vendor->refresh();
        });
    }

    /**
     * Issues a fresh OTP for a vendor still pending verification.
     * Idempotent no-op (returns the already-active vendor) once verified,
     * same as verifyOtp().
     */
    public function resendOtp(string $email): Vendor
    {
        $user = User::query()->where('email', mb_strtolower(trim($email)))->first();

        if (! $user || ! $user->hasRole(UserRole::Vendor)) {
            throw new DomainException('We could not find that account.', 404);
        }

        $vendor = Vendor::query()->where('user_id', $user->id)->first();

        if (! $vendor) {
            throw new DomainException('We could not find that account.', 404);
        }

        if ($vendor->statusEnum() !== VendorStatus::PendingVerification) {
            return $vendor;
        }

        $vendor = $this->transaction(function () use ($vendor): Vendor {
            $vendor->forceFill($this->generateOtp())->save();

            return $vendor->refresh();
        });

        $this->sendOtp($user, $vendor->otp_code);

        return $vendor;
    }

    /**
     * @return array{otp_code: string, otp_expires_at: Carbon}
     */
    private function generateOtp(): array
    {
        return [
            'otp_code' => (string) random_int(100000, 999999),
            'otp_expires_at' => now()->addMinutes((int) config('vendors.otp_expiry_minutes')),
        ];
    }

    /**
     * No SMS gateway is configured for this app — the OTP is written to the
     * log, the same "simulate delivery" convention ConnectorRegistrationService
     * uses.
     */
    private function sendOtp(User $user, string $otp): void
    {
        Log::info(sprintf(
            '[SMS to %s] Your FINOOCEAN vendor verification code is %s. It expires in %d minutes.',
            $user->phone ?? $user->email,
            $otp,
            (int) config('vendors.otp_expiry_minutes'),
        ));
    }
}
