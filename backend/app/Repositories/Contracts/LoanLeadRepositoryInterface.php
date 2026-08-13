<?php

namespace App\Repositories\Contracts;

use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

interface LoanLeadRepositoryInterface
{
    /** Query constrained to the leads the actor may see. */
    public function visibleQuery(User $actor): Builder;

    /**
     * @param array<string, mixed> $filters
     */
    public function paginateVisible(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function findVisible(User $actor, int $id): ?LoanLead;

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): LoanLead;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(LoanLead $lead, array $attributes): LoanLead;

    public function delete(LoanLead $lead): bool;

    /**
     * Status counts for the actor's visible leads.
     *
     * @return array<string, int>
     */
    public function statusCounts(User $actor): array;
}
