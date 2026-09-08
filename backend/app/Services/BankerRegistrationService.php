<?php

namespace App\Services;

use App\Enums\BankerStatus;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Banker;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Self-service banker signup ("Join as Banker"): no admin approval gate,
 * but the account stays inactive (`users.is_active = false`,
 * `bankers.status = pending_verification`) until the banker confirms a
 * 6-digit OTP sent to the phone number they signed up with.
 *
 * Deliberately a trimmed copy of {@see VendorRegistrationService}: it only
 * creates the `users` identity row and the 1:1 `bankers` profile carrying
 * everything the registration form captured. Once verified, the banker
 * logs in and lands on the existing Banker workspace — nothing role-side
 * changes.
 */
class BankerRegistrationService extends BaseService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function register(array $data): Banker
    {
        $banker = $this->transaction(function () use ($data): Banker {
            $fullName = trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? ''));

            $user = User::query()->create([
                'name' => $fullName,
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => UserRole::Banker,
                'phone' => $data['phone'],
                'is_active' => false,
            ]);

            $banker = Banker::query()->create([
                'user_id' => $user->id,
                'first_name' => $data['first_name'] ?? null,
                'last_name' => $data['last_name'] ?? null,
                'city' => $data['city'] ?? null,
                'state' => $data['state'] ?? null,
                'pincode' => $data['pincode'] ?? null,
                'country' => $data['country'] ?? null,
                'pan_number' => $data['pan_number'] ?? null,
                'bank_name' => $data['bank_name'] ?? null,
                'branch_address' => $data['branch_address'] ?? null,
                'branch_location' => $data['branch_location'] ?? null,
                'bank_city' => $data['bank_city'] ?? null,
                'bank_state' => $data['bank_state'] ?? null,
                'products' => $data['products'] ?? [],
                'manager_name' => $data['manager_name'] ?? null,
                'manager_email' => $data['manager_email'] ?? null,
                'manager_phone' => $data['manager_phone'] ?? null,
                'status' => BankerStatus::PendingVerification->value,
                'joined_at' => now(),
                ...$this->generateOtp(),
            ]);

            $banker->setRelation('user', $user);

            return $banker;
        });

        $this->sendOtp($banker->user, $banker->otp_code);

        return $banker;
    }

    /**
     * Confirms the OTP, activates the banker and their user account.
     * Idempotent: verifying an already-active banker simply returns it
     * unchanged (a stale OTP resubmitted after a page refresh is not an
     * error).
     */
    public function verifyOtp(string $email, string $otp): Banker
    {
        $banker = $this->pendingBankerFor($email, 'This verification code is invalid.');

        if ($banker->statusEnum() !== BankerStatus::PendingVerification) {
            return $banker;
        }

        if ($banker->otp_code === null || $banker->otp_expires_at === null || $banker->otp_expires_at->isPast()) {
            throw new DomainException('This code has expired. Request a new one.', 422);
        }

        if (! hash_equals($banker->otp_code, $otp)) {
            throw new DomainException('That code is incorrect.', 422);
        }

        return $this->transaction(function () use ($banker): Banker {
            $banker->forceFill([
                'phone_verified_at' => now(),
                'otp_code' => null,
                'otp_expires_at' => null,
                'status' => BankerStatus::Active->value,
            ])->save();

            $banker->user->forceFill(['is_active' => true])->save();

            return $banker->refresh();
        });
    }

    /**
     * Issues a fresh OTP for a banker still pending verification.
     * Idempotent no-op (returns the already-active banker) once verified,
     * same as verifyOtp().
     */
    public function resendOtp(string $email): Banker
    {
        $banker = $this->pendingBankerFor($email, 'We could not find that account.');

        if ($banker->statusEnum() !== BankerStatus::PendingVerification) {
            return $banker;
        }

        $banker = $this->transaction(function () use ($banker): Banker {
            $banker->forceFill($this->generateOtp())->save();

            return $banker->refresh();
        });

        $this->sendOtp($banker->user, $banker->otp_code);

        return $banker;
    }

    private function pendingBankerFor(string $email, string $notFoundMessage): Banker
    {
        $user = User::query()->where('email', mb_strtolower(trim($email)))->first();

        if (! $user || ! $user->hasRole(UserRole::Banker)) {
            throw new DomainException($notFoundMessage, 404);
        }

        $banker = Banker::query()->where('user_id', $user->id)->first();

        if (! $banker) {
            throw new DomainException($notFoundMessage, 404);
        }

        $banker->setRelation('user', $user);

        return $banker;
    }

    /**
     * @return array{otp_code: string, otp_expires_at: Carbon}
     */
    private function generateOtp(): array
    {
        return [
            'otp_code' => (string) random_int(100000, 999999),
            'otp_expires_at' => now()->addMinutes((int) config('bankers.otp_expiry_minutes')),
        ];
    }

    /**
     * No SMS gateway is configured for this app — the OTP is written to the
     * log, the same "simulate delivery" convention the Vendor and Connector
     * registration services use.
     */
    private function sendOtp(User $user, string $otp): void
    {
        Log::info(sprintf(
            '[SMS to %s] Your FINOOCEAN banker verification code is %s. It expires in %d minutes.',
            $user->phone ?? $user->email,
            $otp,
            (int) config('bankers.otp_expiry_minutes'),
        ));
    }
}
