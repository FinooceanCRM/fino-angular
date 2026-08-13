<?php

namespace App\Repositories\Contracts;

use App\Models\BankCriteria;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface BankCriteriaRepositoryInterface
{
    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * @return Collection<int, BankCriteria>
     */
    public function activeForLoanType(string $loanType): Collection;

    public function find(int $id): ?BankCriteria;

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): BankCriteria;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(BankCriteria $criteria, array $attributes): BankCriteria;

    public function delete(BankCriteria $criteria): bool;
}
