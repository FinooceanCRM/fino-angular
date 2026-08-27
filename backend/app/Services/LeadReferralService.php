<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\User;

/**
 * Personal lead-capture referral links for Manager, Relationship Manager,
 * Employee, Connector and Banker — reuses the public `/refer/:code` intake
 * page (see `PublicLeadIntakeService`), attributing whatever comes through
 * to the owning user so it lands in their "My Submitted Leads" list.
 *
 * Distinct from `ConnectorRegistrationService`'s recruiting-link codes and
 * `AffiliateRegistrationService`'s own lead-capture codes — those live on
 * the `connectors`/`affiliates` profile tables and serve different existing
 * flows; this is a single `users.lead_referral_code` column shared by five
 * roles that otherwise have no referral concept at all.
 */
class LeadReferralService extends BaseService
{
    private const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    private const CODE_LENGTH = 8;

    private const ELIGIBLE_ROLES = [
        UserRole::Manager,
        UserRole::RelationshipManager,
        UserRole::Employee,
        UserRole::Connector,
        UserRole::Banker,
    ];

    /**
     * @return array{code: string, link: string}
     */
    public function getOrCreate(User $user): array
    {
        if (! in_array($user->roleEnum(), self::ELIGIBLE_ROLES, true)) {
            throw new DomainException('This role does not have a lead-referral link.', 422);
        }

        if (blank($user->lead_referral_code)) {
            $user->forceFill(['lead_referral_code' => $this->generateUniqueCode()])->save();
        }

        return [
            'code' => $user->lead_referral_code,
            'link' => rtrim((string) config('app.frontend_url'), '/').'/refer/'.$user->lead_referral_code,
        ];
    }

    public function resolve(?string $code): ?User
    {
        if (blank($code)) {
            return null;
        }

        return User::query()->where('lead_referral_code', $code)->first();
    }

    private function generateUniqueCode(): string
    {
        $lastIndex = strlen(self::CODE_ALPHABET) - 1;

        do {
            $code = '';
            for ($i = 0; $i < self::CODE_LENGTH; $i++) {
                $code .= self::CODE_ALPHABET[random_int(0, $lastIndex)];
            }
        } while (User::query()->where('lead_referral_code', $code)->exists());

        return $code;
    }
}
