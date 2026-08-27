<?php

namespace App\Repositories\Contracts;

use App\Models\Affiliate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AffiliateRepositoryInterface
{
    public function findByUserId(int $userId): ?Affiliate;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Affiliate $affiliate, array $attributes): Affiliate;

    /**
     * Leads attributed to this affiliate (loan_leads.affiliate_id = the
     * affiliate's user id), newest first.
     *
     * @param array<string, mixed> $filters
     */
    public function referralsFor(Affiliate $affiliate, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * @return array{total: int, converted: int}
     */
    public function referralCounts(Affiliate $affiliate): array;

    /**
     * @param array<string, mixed> $filters
     */
    public function commissionsFor(Affiliate $affiliate, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * @return array{accrued: float, paid: float, pending_payout: float}
     */
    public function commissionTotals(Affiliate $affiliate): array;

    /**
     * Every affiliate, for Super Admin management — unlike every other
     * method here, not scoped to one affiliate.
     *
     * @param array<string, mixed> $filters
     */
    public function paginateAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;
}
