<?php

namespace App\Repositories\Contracts;

use App\Models\Connector;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ConnectorRepositoryInterface
{
    public function findByUser(User $user): ?Connector;

    /** Returns the connector profile for the user, creating an empty one if missing. */
    public function firstOrCreateForUser(User $user): Connector;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Connector $connector, array $attributes): Connector;

    /**
     * Connectors directly referred by this one (network), newest first.
     *
     * @param array<string, mixed> $filters
     */
    public function referralsFor(Connector $connector, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * @return array{total: int, converted: int}
     */
    public function referredLeadCounts(Connector $connector): array;

    /**
     * @return array{accrued: float, paid: float, pending_payout: float}
     */
    public function commissionTotals(Connector $connector): array;

    /**
     * @param array<string, mixed> $filters
     */
    public function commissionsFor(Connector $connector, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Every connector, for Super Admin management.
     *
     * @param array<string, mixed> $filters
     */
    public function paginateAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;
}
