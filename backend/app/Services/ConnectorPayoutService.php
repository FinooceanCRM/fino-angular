<?php

namespace App\Services;

use App\Enums\ConnectorCommissionStatus;
use App\Enums\ConnectorPayoutStatus;
use App\Exceptions\DomainException;
use App\Models\Connector;
use App\Models\ConnectorCommission;
use App\Models\ConnectorPayout;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

/**
 * Payout request (connector-initiated) -> approve -> mark paid, or ->
 * reject, workflow — identical shape to {@see AffiliatePayoutService}.
 * `requestPayout()` sums accrued commission rows across every level (a
 * connector's own base earnings and any referral-override earnings both
 * roll into the same payout) since ConnectorCommission doesn't distinguish
 * levels for payout purposes, only for display.
 */
class ConnectorPayoutService extends BaseService
{
    public function __construct(private readonly LedgerService $ledger)
    {
    }

    public function requestPayout(User $connectorUser): ConnectorPayout
    {
        return $this->transaction(function () use ($connectorUser): ConnectorPayout {
            $commissions = ConnectorCommission::query()
                ->where('connector_id', $connectorUser->id)
                ->where('status', ConnectorCommissionStatus::Accrued->value)
                ->whereNull('payout_id')
                ->lockForUpdate()
                ->get();

            $total = (float) $commissions->sum('commission_amount');

            if ($total <= 0.0) {
                throw new DomainException('You have no accrued commissions available to request a payout for.', 422);
            }

            $connector = Connector::query()->where('user_id', $connectorUser->id)->first();

            if (! $connector || blank($connector->payout_method)) {
                throw new DomainException('Set a payout method on your profile before requesting a payout.', 422);
            }

            $payout = ConnectorPayout::query()->create([
                'connector_id' => $connectorUser->id,
                'reference' => $this->generateReference(),
                'amount' => $total,
                'method' => $connector->payout_method,
                'status' => ConnectorPayoutStatus::Pending->value,
                'requested_at' => now(),
            ]);

            ConnectorCommission::query()
                ->whereIn('id', $commissions->pluck('id'))
                ->update(['payout_id' => $payout->id]);

            return $payout;
        });
    }

    /**
     * Moves the payout to `processing` and flips every commission row
     * linked to it (via payout_id, set at request time) to `paid`.
     */
    public function approve(ConnectorPayout $payout, User $admin): ConnectorPayout
    {
        $this->guardStatus($payout, ConnectorPayoutStatus::Pending);

        return $this->transaction(function () use ($payout, $admin): ConnectorPayout {
            $payout->forceFill([
                'status' => ConnectorPayoutStatus::Processing->value,
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ])->save();

            ConnectorCommission::query()
                ->where('payout_id', $payout->id)
                ->update([
                    'status' => ConnectorCommissionStatus::Paid->value,
                    'paid_at' => now(),
                ]);

            return $payout->refresh();
        });
    }

    /** Final step after approve(): the money has actually been sent. */
    public function markPaid(ConnectorPayout $payout): ConnectorPayout
    {
        $this->guardStatus($payout, ConnectorPayoutStatus::Processing);

        $payout->forceFill(['status' => ConnectorPayoutStatus::Paid->value])->save();

        $this->ledger->record(
            'connector_commission_paid',
            sprintf('Payout %s — %s', $payout->reference, $payout->connector?->name ?? 'Connector'),
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
    public function reject(ConnectorPayout $payout, User $admin, string $reason): ConnectorPayout
    {
        if (in_array($payout->statusEnum(), [ConnectorPayoutStatus::Paid, ConnectorPayoutStatus::Failed], true)) {
            throw new DomainException('This payout has already been finalised.', 422);
        }

        return $this->transaction(function () use ($payout, $admin, $reason): ConnectorPayout {
            $payout->forceFill([
                'status' => ConnectorPayoutStatus::Failed->value,
                'failure_reason' => $reason,
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ])->save();

            ConnectorCommission::query()
                ->where('payout_id', $payout->id)
                ->update([
                    'status' => ConnectorCommissionStatus::Accrued->value,
                    'paid_at' => null,
                    'payout_id' => null,
                ]);

            return $payout->refresh();
        });
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function listForConnector(User $connectorUser, array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return ConnectorPayout::query()
            ->where('connector_id', $connectorUser->id)
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
        $statuses = $filters['status'] ?? [ConnectorPayoutStatus::Pending->value, ConnectorPayoutStatus::Processing->value];

        if (is_string($statuses)) {
            $statuses = explode(',', $statuses);
        }

        return ConnectorPayout::query()
            ->with('connector:id,name,email')
            ->whereIn('status', $statuses)
            ->orderBy('requested_at')
            ->paginate($perPage);
    }

    private function guardStatus(ConnectorPayout $payout, ConnectorPayoutStatus $expected): void
    {
        if ($payout->statusEnum() !== $expected) {
            throw new DomainException(sprintf('This payout is not %s.', mb_strtolower($expected->label())), 422);
        }
    }

    private function generateReference(): string
    {
        do {
            $reference = 'PO-'.strtoupper(Str::random(10));
        } while (ConnectorPayout::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
