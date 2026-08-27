<?php

namespace App\Services;

use App\Enums\AffiliateStatus;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Affiliate;
use App\Models\User;
use App\Notifications\AffiliateVerifyEmail;
use Illuminate\Support\Facades\URL;

/**
 * Self-service affiliate signup: no admin approval gate, but the account
 * stays inactive (`users.is_active = false`, `affiliates.status =
 * pending_verification`) until the affiliate confirms their email via the
 * signed verification link.
 */
class AffiliateRegistrationService extends BaseService
{
    /** Characters excludes visually ambiguous ones: 0/O, 1/I/L. */
    private const REFERRAL_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    private const REFERRAL_CODE_LENGTH = 8;

    private const VERIFICATION_LINK_MINUTES = 60;

    /**
     * @param array<string, mixed> $data
     */
    public function register(array $data): Affiliate
    {
        $affiliate = $this->transaction(function () use ($data): Affiliate {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => UserRole::Affiliate,
                'phone' => $data['alternate_phone'] ?? null,
                'is_active' => false,
            ]);

            $affiliate = Affiliate::query()->create([
                'user_id' => $user->id,
                'referral_code' => $this->generateUniqueReferralCode(),
                'status' => AffiliateStatus::PendingVerification,
                'alternate_phone' => $data['alternate_phone'] ?? null,
                'payout_method' => $data['payout_method'] ?? null,
                'payout_account_name' => $data['payout_account_name'] ?? null,
                'payout_account_number' => $data['payout_account_number'] ?? null,
                'payout_ifsc_or_upi' => $data['payout_ifsc_or_upi'] ?? null,
                'joined_at' => now(),
            ]);

            $affiliate->setRelation('user', $user);

            return $affiliate;
        });

        $affiliate->user->notify(new AffiliateVerifyEmail($this->verificationUrlFor($affiliate->user)));

        return $affiliate;
    }

    /**
     * Confirms the signed verification link, activates the affiliate and
     * their user account. Idempotent: verifying an already-active affiliate
     * simply returns it unchanged.
     */
    public function verify(int $userId, string $hash): Affiliate
    {
        $user = User::query()->find($userId);

        if (! $user || ! $user->hasRole(UserRole::Affiliate)) {
            throw new DomainException('This verification link is invalid.', 404);
        }

        if (! hash_equals(sha1($user->email), $hash)) {
            throw new DomainException('This verification link is invalid.', 403);
        }

        $affiliate = Affiliate::query()->where('user_id', $user->id)->first();

        if (! $affiliate) {
            throw new DomainException('This verification link is invalid.', 404);
        }

        if ($affiliate->statusEnum() !== AffiliateStatus::PendingVerification) {
            return $affiliate;
        }

        return $this->transaction(function () use ($user, $affiliate): Affiliate {
            $affiliate->forceFill([
                'email_verified_at' => now(),
                'status' => AffiliateStatus::Active,
            ])->save();

            $user->forceFill(['is_active' => true])->save();

            return $affiliate->refresh();
        });
    }

    private function verificationUrlFor(User $user): string
    {
        return URL::temporarySignedRoute(
            'api.v1.public.affiliates.verify',
            now()->addMinutes(self::VERIFICATION_LINK_MINUTES),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );
    }

    private function generateUniqueReferralCode(): string
    {
        $lastIndex = strlen(self::REFERRAL_CODE_ALPHABET) - 1;

        do {
            $code = '';
            for ($i = 0; $i < self::REFERRAL_CODE_LENGTH; $i++) {
                $code .= self::REFERRAL_CODE_ALPHABET[random_int(0, $lastIndex)];
            }
        } while (Affiliate::query()->where('referral_code', $code)->exists());

        return $code;
    }
}
