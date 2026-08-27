<?php

namespace App\Services;

use App\Enums\AffiliateCommissionStatus;
use App\Models\Affiliate;
use App\Models\AffiliateCommission;
use App\Models\LoanLead;
use App\Models\User;

/**
 * Commission accrual, triggered from LeadService::changeStatus() the moment
 * a lead transitions to `disbursed`. Deliberately reads plain models rather
 * than going through AffiliateRepositoryInterface — that repository is
 * scoped to an authenticated affiliate reading their own data, which
 * doesn't fit this system-triggered, actor-less write.
 */
class AffiliateCommissionService extends BaseService
{
    public function __construct(private readonly LedgerService $ledger)
    {
    }

    /**
     * No-op (returns null) when the lead has no affiliate, or a commission
     * row for this (affiliate, lead) pair already exists — idempotent, so a
     * lead re-entering `disbursed` via a bug can never double-accrue. The
     * unique constraint on affiliate_commissions backs this up at the DB
     * level, but checking first avoids surfacing that as an exception.
     */
    public function accrueForLead(LoanLead $lead, ?User $actor = null): ?AffiliateCommission
    {
        if ($lead->affiliate_id === null) {
            return null;
        }

        $alreadyAccrued = AffiliateCommission::query()
            ->where('affiliate_id', $lead->affiliate_id)
            ->where('loan_lead_id', $lead->id)
            ->exists();

        if ($alreadyAccrued) {
            return null;
        }

        $affiliate = Affiliate::query()->where('user_id', $lead->affiliate_id)->first();

        if (! $affiliate) {
            return null;
        }

        $rate = $affiliate->commission_rate !== null
            ? (float) $affiliate->commission_rate
            : (float) config('affiliates.default_commission_rate');

        $amount = round((float) $lead->loan_amount * $rate / 100, 2);

        $commission = AffiliateCommission::query()->create([
            'affiliate_id' => $lead->affiliate_id,
            'loan_lead_id' => $lead->id,
            'commission_rate' => $rate,
            'commission_amount' => $amount,
            'status' => AffiliateCommissionStatus::Accrued->value,
            'accrued_at' => now(),
        ]);

        $this->ledger->record(
            'affiliate_commission_accrued',
            sprintf('Commission accrued — %s', $lead->affiliate?->name ?? 'Affiliate'),
            null,
            $amount,
            $commission,
        );

        return $commission;
    }
}
