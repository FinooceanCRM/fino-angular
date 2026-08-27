<?php

namespace App\Services;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\AffiliatePayoutStatus;
use App\Exceptions\DomainException;
use App\Models\Affiliate;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

/**
 * Payout request (affiliate-initiated) -> approve -> mark paid, or ->
 * reject, workflow — the money-movement counterpart to
 * {@see AffiliateCommissionService}'s accrual. Mirrors the
 * request/approve/reject shape LeadAccessRequestService established for
 * bankers, adapted for a two-step decide (approve -> processing, then
 * markPaid -> paid) since the mock payout status list exposes `processing`
 * as a real intermediate state.
 *
 * Commission rows are linked to a payout (payout_id) at REQUEST time, not
 * approval time — that's what makes requestPayout() and approve() agree on
 * exactly which rows this particular payout covers, even if more
 * commissions accrue for the same affiliate before the payout is decided.
 * Their `status` only flips (accrued -> paid) on approval, per the accrual
 * design: request does not touch commission status at all.
 */
class AffiliatePayoutService extends BaseService
{
    public function __construct(private readonly LedgerService $ledger)
    {
    }

    public function requestPayout(User $affiliateUser): AffiliatePayout
    {
        return $this->transaction(function () use ($affiliateUser): AffiliatePayout {
            $commissions = AffiliateCommission::query()
                ->where('affiliate_id', $affiliateUser->id)
                ->where('status', AffiliateCommissionStatus::Accrued->value)
                ->whereNull('payout_id')
                ->lockForUpdate()
                ->get();

            $total = (float) $commissions->sum('commission_amount');

            if ($total <= 0.0) {
                throw new DomainException('You have no accrued commissions available to request a payout for.', 422);
            }

            $affiliate = Affiliate::query()->where('user_id', $affiliateUser->id)->first();

            if (! $affiliate || blank($affiliate->payout_method)) {
                throw new DomainException('Set a payout method on your profile before requesting a payout.', 422);
            }

            $payout = AffiliatePayout::query()->create([
                'affiliate_id' => $affiliateUser->id,
                'reference' => $this->generateReference(),
                'amount' => $total,
                'method' => $affiliate->payout_method,
                'status' => AffiliatePayoutStatus::Pending->value,
                'requested_at' => now(),
            ]);

            AffiliateCommission::query()
                ->whereIn('id', $commissions->pluck('id'))
                ->update(['payout_id' => $payout->id]);

            return $payout;
        });
    }

    /**
     * Moves the payout to `processing` and flips every commission row
     * linked to it (via payout_id, set at request time) to `paid`.
     */
    public function approve(AffiliatePayout $payout, User $admin): AffiliatePayout
    {
        $this->guardStatus($payout, AffiliatePayoutStatus::Pending);

        return $this->transaction(function () use ($payout, $admin): AffiliatePayout {
            $payout->forceFill([
                'status' => AffiliatePayoutStatus::Processing->value,
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ])->save();

            AffiliateCommission::query()
                ->where('payout_id', $payout->id)
                ->update([
                    'status' => AffiliateCommissionStatus::Paid->value,
                    'paid_at' => now(),
                ]);

            return $payout->refresh();
        });
    }

    /** Final step after approve(): the money has actually been sent. */
    public function markPaid(AffiliatePayout $payout): AffiliatePayout
    {
        $this->guardStatus($payout, AffiliatePayoutStatus::Processing);

        $payout->forceFill(['status' => AffiliatePayoutStatus::Paid->value])->save();

        $this->ledger->record(
            'affiliate_commission_paid',
            sprintf('Payout %s — %s', $payout->reference, $payout->affiliate?->name ?? 'Affiliate'),
            (float) $payout->amount,
            null,
            $payout,
        );

        return $payout->refresh();
    }

    /**
     * Rejects a payout still pending, or fails one already approved but not
     * yet paid. Either way, every commission row linked to it reverts to
     * `accrued` (unlinked from this payout) so it rolls into a future
     * payout request rather than being lost.
     */
    public function reject(AffiliatePayout $payout, User $admin, string $reason): AffiliatePayout
    {
        if (in_array($payout->statusEnum(), [AffiliatePayoutStatus::Paid, AffiliatePayoutStatus::Failed], true)) {
            throw new DomainException('This payout has already been finalised.', 422);
        }

        return $this->transaction(function () use ($payout, $admin, $reason): AffiliatePayout {
            $payout->forceFill([
                'status' => AffiliatePayoutStatus::Failed->value,
                'failure_reason' => $reason,
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ])->save();

            AffiliateCommission::query()
                ->where('payout_id', $payout->id)
                ->update([
                    'status' => AffiliateCommissionStatus::Accrued->value,
                    'paid_at' => null,
                    'payout_id' => null,
                ]);

            return $payout->refresh();
        });
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function listForAffiliate(User $affiliateUser, array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return AffiliatePayout::query()
            ->where('affiliate_id', $affiliateUser->id)
            ->orderByDesc('requested_at')
            ->paginate($perPage);
    }

    /**
     * Defaults to pending/processing (the admin's action queue); pass
     * filters['status'] to see paid/failed history too.
     *
     * @param array<string, mixed> $filters
     */
    public function listForAdmin(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $statuses = $filters['status'] ?? [AffiliatePayoutStatus::Pending->value, AffiliatePayoutStatus::Processing->value];

        if (is_string($statuses)) {
            $statuses = explode(',', $statuses);
        }

        return AffiliatePayout::query()
            ->with('affiliate:id,name,email')
            ->whereIn('status', $statuses)
            ->orderBy('requested_at')
            ->paginate($perPage);
    }

    private function guardStatus(AffiliatePayout $payout, AffiliatePayoutStatus $expected): void
    {
        if ($payout->statusEnum() !== $expected) {
            throw new DomainException(sprintf('This payout is not %s.', mb_strtolower($expected->label())), 422);
        }
    }

    private function generateReference(): string
    {
        do {
            $reference = 'PO-'.strtoupper(Str::random(10));
        } while (AffiliatePayout::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
