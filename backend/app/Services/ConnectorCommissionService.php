<?php

namespace App\Services;

use App\Enums\ConnectorCommissionStatus;
use App\Models\Connector;
use App\Models\ConnectorCommission;
use App\Models\LoanLead;
use App\Models\User;

/**
 * Commission accrual, triggered from LeadService::changeStatus() the moment
 * a lead transitions to `disbursed` — same trigger point and idempotency
 * pattern as {@see AffiliateCommissionService}, extended with a cascading
 * referral-override walk: the earning connector's own commission is a
 * level-0 row; their direct inviter earns a level-1 override (a percentage
 * of the level-0 amount); that inviter's own inviter earns a level-2
 * override (the same percentage of the level-1 amount); and so on up the
 * chain until a connector with no inviter (root) is reached. The rate is
 * geometric decay of a single global percentage, so the walk always
 * terminates in practical amounts long before the defensive iteration cap
 * below is ever relevant.
 */
class ConnectorCommissionService extends BaseService
{
    /**
     * Purely defensive — guards against a corrupted/circular
     * referred_by_connector_id chain, not a real business rule. A real
     * chain decays geometrically (20% level 1, 4% level 2, 0.8% level 3...)
     * and is never remotely this deep in practice.
     */
    private const MAX_CASCADE_LEVELS = 50;

    public function __construct(private readonly LedgerService $ledger)
    {
    }

    /**
     * No-op if the lead has no connector, or a level-0 row for this
     * (connector, lead) pair already exists — idempotent, so a lead
     * re-entering `disbursed` via a bug can never double-accrue.
     *
     * @return array<int, ConnectorCommission> every row created (level 0 first, then each ancestor's override)
     */
    public function accrueForLead(LoanLead $lead, ?User $actor = null): array
    {
        if ($lead->connector_id === null) {
            return [];
        }

        $alreadyAccrued = ConnectorCommission::query()
            ->where('connector_id', $lead->connector_id)
            ->where('loan_lead_id', $lead->id)
            ->where('level', 0)
            ->exists();

        if ($alreadyAccrued) {
            return [];
        }

        $connector = Connector::query()->where('user_id', $lead->connector_id)->first();

        if (! $connector) {
            return [];
        }

        $baseRate = $connector->commission_rate !== null
            ? (float) $connector->commission_rate
            : (float) config('connectors.default_commission_rate');
        $baseAmount = round((float) $lead->loan_amount * $baseRate / 100, 2);

        $level0 = ConnectorCommission::query()->create([
            'connector_id' => $lead->connector_id,
            'loan_lead_id' => $lead->id,
            'source_connector_id' => null,
            'level' => 0,
            'commission_rate' => $baseRate,
            'commission_amount' => $baseAmount,
            'status' => ConnectorCommissionStatus::Accrued->value,
            'accrued_at' => now(),
        ]);

        $this->ledger->record(
            'connector_commission_accrued',
            sprintf('Commission accrued — %s', $lead->connector?->name ?? 'Connector'),
            null,
            $baseAmount,
            $level0,
        );

        $rows = [$level0];

        $rows = array_merge(
            $rows,
            $this->cascadeOverrides($lead, sourceConnectorUserId: $lead->connector_id, previousAmount: $baseAmount),
        );

        return $rows;
    }

    /**
     * @return array<int, ConnectorCommission>
     */
    private function cascadeOverrides(LoanLead $lead, int $sourceConnectorUserId, float $previousAmount): array
    {
        $overrideRate = (float) config('connectors.referral_override_rate');

        $rows = [];
        $currentUserId = $sourceConnectorUserId;
        $level = 1;

        while ($level <= self::MAX_CASCADE_LEVELS) {
            $parentUserId = Connector::query()->where('user_id', $currentUserId)->value('referred_by_connector_id');

            if ($parentUserId === null) {
                break;
            }

            $overrideAmount = round($previousAmount * $overrideRate / 100, 2);

            $overrideRow = ConnectorCommission::query()->create([
                'connector_id' => $parentUserId,
                'loan_lead_id' => $lead->id,
                'source_connector_id' => $currentUserId,
                'level' => $level,
                'commission_rate' => $overrideRate,
                'commission_amount' => $overrideAmount,
                'status' => ConnectorCommissionStatus::Accrued->value,
                'accrued_at' => now(),
            ]);

            $this->ledger->record(
                'connector_commission_accrued',
                sprintf('Referral override accrued — %s', User::query()->find($parentUserId)?->name ?? 'Connector'),
                null,
                $overrideAmount,
                $overrideRow,
            );

            $rows[] = $overrideRow;

            $currentUserId = $parentUserId;
            $previousAmount = $overrideAmount;
            $level++;
        }

        return $rows;
    }
}
