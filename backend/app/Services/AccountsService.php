<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Accountant;
use App\Models\AffiliatePayout;
use App\Models\ConnectorPayout;
use App\Models\LedgerEntry;
use App\Models\User;
use App\Repositories\Contracts\AccountantRepositoryInterface;
use Illuminate\Support\Carbon;

/**
 * Business rules for the Accounts module: the accounts staff profile
 * (mirrors BankerService) plus the read-only cross-payee dashboard
 * (disbursements, commission-payable balance, payout queue) — everything
 * an accounts user needs, all sourced from the same LedgerEntry /
 * ConnectorPayout / AffiliatePayout / LoanLead rows the Super Admin
 * Commissions module already writes to. Accounts never mutates any of
 * that data itself; decisions (approve/mark-paid/reject) still go through
 * SuperAdminConnectorController / SuperAdminAffiliateController, just
 * opened up to this role at the policy layer.
 */
class AccountsService extends BaseService
{
    public function __construct(
        private readonly AccountantRepositoryInterface $accountants,
        private readonly LedgerService $ledger,
    ) {
    }

    /** Profile for the given accounts user, auto-provisioned on first read. */
    public function profileFor(User $user): Accountant
    {
        $this->assertAccounts($user);

        $accountant = $this->accountants->firstOrCreateForUser($user);
        $accountant->setRelation('user', $user);

        return $accountant;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function updateProfile(User $user, array $attributes): Accountant
    {
        $this->assertAccounts($user);

        $profileAttributes = array_intersect_key($attributes, array_flip([
            'designation',
            'branch',
            'employee_code',
            'alternate_phone',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'pincode',
        ]));

        $identityAttributes = array_intersect_key($attributes, array_flip(['name', 'phone']));

        return $this->transaction(function () use ($user, $profileAttributes, $identityAttributes): Accountant {
            if ($identityAttributes !== []) {
                $user->fill($identityAttributes)->save();
            }

            $accountant = $this->accountants->firstOrCreateForUser($user);
            $accountant = $this->accountants->update($accountant, $profileAttributes);
            $accountant->setRelation('user', $user->refresh());

            return $accountant;
        });
    }

    /**
     * Platform-wide accounts dashboard: KPI totals, a 6-month disbursement
     * trend, accrued-vs-paid commission by month, the payout queue split by
     * status (connector + affiliate combined), and the most recent ledger
     * activity. Every figure is read straight off the real ledger/payout
     * tables — nothing here is computed independently of what the
     * Commissions module already records.
     *
     * @return array<string, mixed>
     */
    public function dashboardFor(User $user): array
    {
        $this->assertAccounts($user);

        $today = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();
        $yearStart = $today->copy()->startOfYear();

        $disbursedThisMonth = (float) LedgerEntry::query()
            ->where('type', 'disbursement')
            ->whereBetween('date', [$monthStart->toDateString(), $today->toDateString()])
            ->sum('debit');

        $disbursedYtd = (float) LedgerEntry::query()
            ->where('type', 'disbursement')
            ->whereBetween('date', [$yearStart->toDateString(), $today->toDateString()])
            ->sum('debit');

        $paidThisMonth = (float) LedgerEntry::query()
            ->whereIn('type', ['connector_commission_paid', 'affiliate_commission_paid'])
            ->whereBetween('date', [$monthStart->toDateString(), $today->toDateString()])
            ->sum('debit');

        $payoutCounts = $this->payoutStatusBreakdown();

        return [
            'welcome' => [
                'headline' => 'Welcome back, '.$user->name.'.',
                'message' => 'Disbursements, commission liability and the payout queue, across every connector and affiliate.',
            ],
            'kpis' => [
                'disbursed_this_month' => round($disbursedThisMonth, 2),
                'disbursed_ytd' => round($disbursedYtd, 2),
                'commission_payable' => $this->ledger->currentBalance(),
                'paid_this_month' => round($paidThisMonth, 2),
                'pending_payouts_count' => $payoutCounts['pending']['count'],
                'pending_payouts_amount' => $payoutCounts['pending']['amount'],
            ],
            'disbursement_trend' => $this->monthlySeries('disbursement', 'debit'),
            'commission_trend' => [
                'accrued' => $this->monthlySeries(['connector_commission_accrued', 'affiliate_commission_accrued'], 'credit'),
                'paid' => $this->monthlySeries(['connector_commission_paid', 'affiliate_commission_paid'], 'debit'),
            ],
            'payout_status_breakdown' => $payoutCounts,
            'recent_activity' => LedgerEntry::query()
                ->orderByDesc('date')
                ->orderByDesc('id')
                ->limit(10)
                ->get()
                ->map(static fn (LedgerEntry $entry): array => [
                    'id' => $entry->id,
                    'date' => $entry->date?->toDateString(),
                    'type' => $entry->type,
                    'type_label' => $entry->typeEnum()?->label() ?? $entry->type,
                    'description' => $entry->description,
                    'debit' => $entry->debit !== null ? (float) $entry->debit : null,
                    'credit' => $entry->credit !== null ? (float) $entry->credit : null,
                ])
                ->all(),
        ];
    }

    /**
     * Pending/processing/paid/failed counts + amounts across BOTH connector
     * and affiliate payouts combined — the two payee types share one status
     * vocabulary (ConnectorPayoutStatus/AffiliatePayoutStatus are identical
     * value sets), so they fold into a single breakdown here.
     *
     * @return array<string, array{count: int, amount: float}>
     */
    private function payoutStatusBreakdown(): array
    {
        $statuses = ['pending', 'processing', 'paid', 'failed'];
        $breakdown = [];

        foreach ($statuses as $status) {
            $connector = ConnectorPayout::query()->where('status', $status)
                ->selectRaw('COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total')
                ->first();
            $affiliate = AffiliatePayout::query()->where('status', $status)
                ->selectRaw('COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total')
                ->first();

            $breakdown[$status] = [
                'count' => (int) $connector->cnt + (int) $affiliate->cnt,
                'amount' => round((float) $connector->total + (float) $affiliate->total, 2),
            ];
        }

        return $breakdown;
    }

    /**
     * Sums `$column` (debit/credit) for ledger rows of `$types`, bucketed by
     * month, for the trailing 6 months (oldest first).
     *
     * @param string|array<int, string> $types
     * @return array<int, array{month: string, value: float}>
     */
    private function monthlySeries(string|array $types, string $column): array
    {
        $types = (array) $types;
        $start = Carbon::today()->startOfMonth()->subMonths(5);

        // Grouped in PHP rather than via a DB-specific date-format function
        // (the app runs MySQL in production but sqlite in tests) — the
        // ledger stays small enough that this is a non-issue either way.
        $totals = [];
        LedgerEntry::query()
            ->whereIn('type', $types)
            ->where('date', '>=', $start->toDateString())
            ->get(['date', $column])
            ->each(function (LedgerEntry $entry) use (&$totals, $column): void {
                $key = $entry->date?->format('Y-m');
                if ($key === null) {
                    return;
                }
                $totals[$key] = ($totals[$key] ?? 0) + (float) ($entry->{$column} ?? 0);
            });

        $series = [];
        for ($i = 0; $i < 6; $i++) {
            $month = $start->copy()->addMonths($i);
            $key = $month->format('Y-m');

            $series[] = [
                'month' => $month->format('M Y'),
                'value' => round((float) ($totals[$key] ?? 0), 2),
            ];
        }

        return $series;
    }

    private function assertAccounts(User $user): void
    {
        if ($user->roleEnum() !== UserRole::Accounts) {
            throw new DomainException('This action is only available to accounts users.', 403);
        }
    }
}
