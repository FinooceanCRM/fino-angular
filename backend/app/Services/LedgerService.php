<?php

namespace App\Services;

use App\Models\LedgerEntry;
use App\Repositories\Contracts\LedgerRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;

/**
 * The accounting ledger (Phase 2) — the real backend behind the frontend's
 * former mock `SEED_LEDGER`. {@see self::record()} is called directly from
 * other Services alongside their own mutations (disbursement, commission
 * accrual, payout paid), the same way AuditLogService::record() is —
 * there is no public mutating HTTP endpoint for this feature either.
 */
class LedgerService extends BaseService
{
    public function __construct(private readonly LedgerRepositoryInterface $ledger)
    {
    }

    public function record(
        string $type,
        string $description,
        ?float $debit,
        ?float $credit,
        ?Model $related = null,
    ): LedgerEntry {
        return $this->ledger->create([
            'date' => now()->toDateString(),
            'type' => $type,
            'description' => $description,
            'debit' => $debit,
            'credit' => $credit,
            'related_type' => $related !== null ? get_class($related) : null,
            'related_id' => $related?->getKey(),
        ]);
    }

    /**
     * Mirrors the mock's `SuperAdminAccountingComponent` logic: the running
     * "commission payable" balance is cumulative across the *entire* ledger
     * (disbursement rows carry it forward unchanged; `_accrued` rows add
     * `credit`; `_paid` rows subtract `debit`), so it has to be computed
     * chronologically over every row before search/type/date filters ever
     * narrow what's displayed — a filtered view still needs to show the
     * true running balance at that point in the ledger, not one recomputed
     * from just the visible subset. Once balances are attached, rows are
     * reversed to newest-first for display and then paginated.
     *
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $balance = 0.0;

        $withBalance = $this->ledger->allChronological()->map(function (LedgerEntry $entry) use (&$balance): LedgerEntry {
            if ($entry->typeEnum()?->affectsBalance() ?? true) {
                $balance += (float) ($entry->credit ?? 0) - (float) ($entry->debit ?? 0);
            }

            $entry->setAttribute('balance', round($balance, 2));

            return $entry;
        });

        $filtered = $withBalance->filter(function (LedgerEntry $entry) use ($filters): bool {
            if (! empty($filters['search'])) {
                $search = mb_strtolower((string) $filters['search']);
                if (! str_contains(mb_strtolower((string) $entry->description), $search)) {
                    return false;
                }
            }

            if (! empty($filters['type']) && $entry->type !== $filters['type']) {
                return false;
            }

            $date = $entry->date?->format('Y-m-d');

            if (! empty($filters['from']) && ($date === null || $date < $filters['from'])) {
                return false;
            }

            if (! empty($filters['to']) && ($date === null || $date > $filters['to'])) {
                return false;
            }

            return true;
        })->values();

        $newestFirst = $filtered->reverse()->values();

        $page = Paginator::resolveCurrentPage();
        $items = $newestFirst->slice(($page - 1) * $perPage, $perPage)->values();

        return new LengthAwarePaginator($items, $newestFirst->count(), $perPage, $page, [
            'path' => Paginator::resolveCurrentPath(),
        ]);
    }

    /**
     * The "commission payable" running balance as of right now — the same
     * chronological walk as {@see self::paginate()}, but only the final
     * total is kept. Backs the Accounts Dashboard KPI card.
     */
    public function currentBalance(): float
    {
        $balance = 0.0;

        foreach ($this->ledger->allChronological() as $entry) {
            if ($entry->typeEnum()?->affectsBalance() ?? true) {
                $balance += (float) ($entry->credit ?? 0) - (float) ($entry->debit ?? 0);
            }
        }

        return round($balance, 2);
    }
}
