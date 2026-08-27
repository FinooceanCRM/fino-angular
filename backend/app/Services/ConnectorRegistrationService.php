<?php

namespace App\Services;

use App\Enums\ConnectorStatus;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Connector;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Self-service connector signup: no admin approval gate, but the account
 * stays inactive (`users.is_active = false`, `connectors.status =
 * pending_verification`) until the connector confirms a 6-digit OTP sent to
 * the phone number they signed up with.
 *
 * Optionally accepts another connector's `referral_code` (as `invite_code`)
 * to join the referral network under them; an unknown/missing code simply
 * registers a standalone (root) connector rather than failing the whole
 * submission. Applies identically whichever way the connector arrived —
 * standalone signup or via an inviter's link — since both go through this
 * same `register()` method.
 */
class ConnectorRegistrationService extends BaseService
{
    /** Characters excludes visually ambiguous ones: 0/O, 1/I/L. */
    private const REFERRAL_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    private const REFERRAL_CODE_LENGTH = 8;

    /**
     * @param array<string, mixed> $data
     */
    public function register(array $data): Connector
    {
        $connector = $this->transaction(function () use ($data): Connector {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => UserRole::Connector,
                'phone' => $data['phone'],
                'is_active' => false,
            ]);

            $connector = Connector::query()->create([
                'user_id' => $user->id,
                'referral_code' => $this->generateUniqueReferralCode(),
                'referred_by_connector_id' => $this->resolveInviterUserId($data['invite_code'] ?? null),
                'status' => ConnectorStatus::PendingVerification,
                'company_name' => $data['company_name'] ?? null,
                'contact_person' => $data['contact_person'] ?? null,
                'alternate_phone' => $data['alternate_phone'] ?? null,
                'address_line1' => $data['address_line1'] ?? null,
                'address_line2' => $data['address_line2'] ?? null,
                'city' => $data['city'] ?? null,
                'state' => $data['state'] ?? null,
                'pincode' => $data['pincode'] ?? null,
                'pan_number' => $data['pan_number'] ?? null,
                'gst_number' => $data['gst_number'] ?? null,
                'payout_method' => $data['payout_method'] ?? null,
                'payout_account_name' => $data['payout_account_name'] ?? null,
                'payout_account_number' => $data['payout_account_number'] ?? null,
                'payout_ifsc_or_upi' => $data['payout_ifsc_or_upi'] ?? null,
                'joined_at' => now(),
                ...$this->generateOtp(),
            ]);

            $connector->setRelation('user', $user);

            return $connector;
        });

        $this->sendOtp($connector->user, $connector->otp_code);

        return $connector;
    }

    /**
     * Confirms the OTP, activates the connector and their user account.
     * Idempotent: verifying an already-active connector simply returns it
     * unchanged (a stale OTP resubmitted after a page refresh is not an
     * error).
     */
    public function verifyOtp(string $email, string $otp): Connector
    {
        $user = User::query()->where('email', mb_strtolower(trim($email)))->first();

        if (! $user || ! $user->hasRole(UserRole::Connector)) {
            throw new DomainException('This verification code is invalid.', 404);
        }

        $connector = Connector::query()->where('user_id', $user->id)->first();

        if (! $connector) {
            throw new DomainException('This verification code is invalid.', 404);
        }

        if ($connector->statusEnum() !== ConnectorStatus::PendingVerification) {
            return $connector;
        }

        if ($connector->otp_code === null || $connector->otp_expires_at === null || $connector->otp_expires_at->isPast()) {
            throw new DomainException('This code has expired. Request a new one.', 422);
        }

        if (! hash_equals($connector->otp_code, $otp)) {
            throw new DomainException('That code is incorrect.', 422);
        }

        return $this->transaction(function () use ($user, $connector): Connector {
            $connector->forceFill([
                'phone_verified_at' => now(),
                'otp_code' => null,
                'otp_expires_at' => null,
                'status' => ConnectorStatus::Active,
            ])->save();

            $user->forceFill(['is_active' => true])->save();

            return $connector->refresh();
        });
    }

    /**
     * Issues a fresh OTP for a connector still pending verification.
     * Idempotent no-op (returns the already-active connector) once verified,
     * same as verifyOtp() — resending after the account is already active
     * is not an error, just pointless.
     */
    public function resendOtp(string $email): Connector
    {
        $user = User::query()->where('email', mb_strtolower(trim($email)))->first();

        if (! $user || ! $user->hasRole(UserRole::Connector)) {
            throw new DomainException('We could not find that account.', 404);
        }

        $connector = Connector::query()->where('user_id', $user->id)->first();

        if (! $connector) {
            throw new DomainException('We could not find that account.', 404);
        }

        if ($connector->statusEnum() !== ConnectorStatus::PendingVerification) {
            return $connector;
        }

        $connector = $this->transaction(function () use ($connector): Connector {
            $connector->forceFill($this->generateOtp())->save();

            return $connector->refresh();
        });

        $this->sendOtp($user, $connector->otp_code);

        return $connector;
    }

    /**
     * @return array{otp_code: string, otp_expires_at: \Illuminate\Support\Carbon}
     */
    private function generateOtp(): array
    {
        return [
            'otp_code' => (string) random_int(100000, 999999),
            'otp_expires_at' => now()->addMinutes((int) config('connectors.otp_expiry_minutes')),
        ];
    }

    /**
     * No SMS gateway is configured for this app — the OTP is written to the
     * log, the same "simulate delivery" convention already used for mail in
     * local development (no MAIL_MAILER set means Laravel's mail also just
     * logs).
     */
    private function sendOtp(User $user, string $otp): void
    {
        Log::info(sprintf(
            '[SMS to %s] Your FINOOCEAN connector verification code is %s. It expires in %d minutes.',
            $user->phone ?? $user->email,
            $otp,
            (int) config('connectors.otp_expiry_minutes'),
        ));
    }

    /**
     * A code that doesn't resolve to an active connector is not an error —
     * registration proceeds as a standalone (root) connector rather than
     * failing outright.
     */
    private function resolveInviterUserId(?string $inviteCode): ?int
    {
        if (blank($inviteCode)) {
            return null;
        }

        /** @var int|null $userId */
        $userId = Connector::query()->where('referral_code', $inviteCode)->value('user_id');

        return $userId;
    }

    private function generateUniqueReferralCode(): string
    {
        $lastIndex = strlen(self::REFERRAL_CODE_ALPHABET) - 1;

        do {
            $code = '';
            for ($i = 0; $i < self::REFERRAL_CODE_LENGTH; $i++) {
                $code .= self::REFERRAL_CODE_ALPHABET[random_int(0, $lastIndex)];
            }
        } while (Connector::query()->where('referral_code', $code)->exists());

        return $code;
    }
}
