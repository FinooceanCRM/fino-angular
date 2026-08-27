<?php

namespace App\Repositories\Contracts;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

interface CustomerRepositoryInterface
{
    /** Query constrained to the customers the actor may see. */
    public function visibleQuery(User $actor): Builder;

    /**
     * @param array<string, mixed> $filters
     */
    public function paginateVisible(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function findVisible(User $actor, int $id): ?Customer;

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): Customer;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Customer $customer, array $attributes): Customer;

    public function delete(Customer $customer): bool;
}
