<?php

namespace App\Repositories;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\LeadStatus;
use App\Models\Affiliate;
use App\Models\AffiliateCommission;
use App\Models\LoanLead;
use App\Repositories\Contracts\AffiliateRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentAffiliateRepository implements AffiliateRepositoryInterface
{
    public function findByUserId(int $userId): ?Affiliate
    {
        return Affiliate::query()->where('user_id', $userId)->first();
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Affiliate $affiliate, array $attributes): Affiliate
    {
        $affiliate->fill($attributes)->save();

        return $affiliate->refresh();
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function referralsFor(Affiliate $affiliate, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = LoanLead::query()->where('affiliate_id', $affiliate->user_id);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * @return array{total: int, converted: int}
     */
    public function referralCounts(Affiliate $affiliate): array
    {
        $base = LoanLead::query()->where('affiliate_id', $affiliate->user_id);

        return [
            'total' => (clone $base)->count(),
            'converted' => (clone $base)->where('status', LeadStatus::Disbursed->value)->count(),
        ];
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function commissionsFor(Affiliate $affiliate, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = AffiliateCommission::query()
            ->where('affiliate_id', $affiliate->user_id)
            ->with('loanLead:id,reference,applicant_name');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderByDesc('accrued_at')->paginate($perPage);
    }

    /**
     * @return array{accrued: float, paid: float, pending_payout: float}
     */
    public function commissionTotals(Affiliate $affiliate): array
    {
        $base = AffiliateCommission::query()->where('affiliate_id', $affiliate->user_id);

        return [
            'accrued' => (float) (clone $base)
                ->whereIn('status', [AffiliateCommissionStatus::Accrued->value, AffiliateCommissionStatus::Paid->value])
                ->sum('commission_amount'),
            'paid' => (float) (clone $base)->where('status', AffiliateCommissionStatus::Paid->value)->sum('commission_amount'),
            'pending_payout' => (float) (clone $base)->where('status', AffiliateCommissionStatus::Accrued->value)->sum('commission_amount'),
        ];
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginateAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        // Full `user` load (not a trimmed column list): AffiliateResource
        // nests a UserResource, which reads role/department/manager_id/etc
        // — a trimmed select here would leave those null and crash
        // UserResource's `$this->role->value` access.
        $query = Affiliate::query()->with('user');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->whereHas('user', function ($q) use ($search): void {
                $q->where('name', 'like', $search)->orWhere('email', 'like', $search);
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

        // Referral/commission totals for the admin list — same aggregates
        // dashboardFor() computes for the affiliate's own dashboard,
        // reused here per row rather than duplicating the query shape.
        $paginator->getCollection()->each(function (Affiliate $affiliate): void {
            $referralCounts = $this->referralCounts($affiliate);
            $commissionTotals = $this->commissionTotals($affiliate);

            $affiliate->setAttribute('referral_count', $referralCounts['total']);
            $affiliate->setAttribute('converted_count', $referralCounts['converted']);
            $affiliate->setAttribute('commission_accrued', $commissionTotals['accrued']);
            $affiliate->setAttribute('commission_paid', $commissionTotals['paid']);
        });

        return $paginator;
    }
}
