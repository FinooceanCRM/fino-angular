<?php

namespace App\Services;

use App\Enums\Department;
use App\Enums\LeadStatus;
use App\Enums\LoanType;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Affiliate;
use App\Models\LeadStatusHistory;
use App\Models\LoanLead;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;
use App\Services\Contracts\CaptchaVerifierInterface;
use Illuminate\Support\Str;

/**
 * Unauthenticated lead intake from the public referral form. Deliberately
 * independent of LeadService/LoanLeadPolicy — there is no actor here, and
 * the trust model (captcha + honeypot instead of authentication) is
 * different enough that sharing the authenticated path would mean threading
 * "actor may be null" through code that currently assumes it never is.
 */
class PublicLeadIntakeService extends BaseService
{
    public function __construct(
        private readonly LoanLeadRepositoryInterface $leads,
        private readonly NotificationService $notifications,
        private readonly CaptchaVerifierInterface $captcha,
        private readonly LeadReferralService $leadReferral,
    ) {
    }

    /**
     * Returns the created lead, or null when the honeypot field caught a
     * bot — the caller still responds 201 either way, so a bot never learns
     * its submission was dropped.
     *
     * @param array<string, mixed> $data
     */
    public function submit(array $data, ?string $ip = null): ?LoanLead
    {
        if (! empty($data['website'])) {
            return null;
        }

        if (! $this->captcha->verify((string) $data['captcha_token'], $ip)) {
            throw new DomainException('We could not verify your submission. Please try again.', 422);
        }

        return $this->transaction(function () use ($data): LoanLead {
            $referralCode = $data['referral_code'] ?? null;
            $affiliateId = $this->resolveAffiliateId($referralCode);
            $referredBy = $affiliateId === null ? $this->leadReferral->resolve($referralCode) : null;

            $attributes = [
                'reference' => 'LD-'.strtoupper(Str::random(10)),
                'applicant_name' => $data['applicant_name'],
                'applicant_email' => $data['applicant_email'] ?? null,
                'applicant_phone' => $data['applicant_phone'],
                'loan_type' => $data['loan_type'],
                'department' => Department::fromLoanType(LoanType::from($data['loan_type']))->value,
                'loan_amount' => $data['loan_amount'],
                'city' => $data['city'],
                'status' => LeadStatus::New->value,
                'created_by' => $referredBy !== null && $referredBy->roleEnum() !== UserRole::Connector ? $referredBy->id : null,
                'connector_id' => $referredBy?->roleEnum() === UserRole::Connector ? $referredBy->id : null,
                'affiliate_id' => $affiliateId,
            ];

            $lead = $this->leads->create($attributes);

            LeadStatusHistory::query()->create([
                'loan_lead_id' => $lead->id,
                'from_status' => null,
                'to_status' => LeadStatus::New->value,
                'changed_by' => null,
                'remarks' => 'Public referral submission.',
            ]);

            $this->notifications->notifyMany(
                [$lead->assigned_relationship_manager_id, $lead->assigned_manager_id, $referredBy?->id],
                'lead.created',
                'New lead submitted',
                sprintf('A public referral submitted lead %s.', $lead->reference),
                ['lead_id' => $lead->id],
            );

            return $lead;
        });
    }

    /**
     * A code that doesn't resolve to an active affiliate is not an error —
     * the submission proceeds unattributed rather than failing outright.
     */
    private function resolveAffiliateId(?string $referralCode): ?int
    {
        if (blank($referralCode)) {
            return null;
        }

        /** @var int|null $userId */
        $userId = Affiliate::query()->where('referral_code', $referralCode)->value('user_id');

        return $userId;
    }
}
