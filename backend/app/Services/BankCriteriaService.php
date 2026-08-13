<?php

namespace App\Services;

use App\Models\BankCriteria;
use App\Repositories\Contracts\BankCriteriaRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/** Bank criteria management (Phase 9). */
class BankCriteriaService extends BaseService
{
    public function __construct(private readonly BankCriteriaRepositoryInterface $criteria)
    {
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->criteria->paginate($filters, $perPage);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): BankCriteria
    {
        return $this->criteria->create($attributes);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(BankCriteria $bank, array $attributes): BankCriteria
    {
        return $this->criteria->update($bank, $attributes);
    }

    public function delete(BankCriteria $bank): bool
    {
        return $this->criteria->delete($bank);
    }
}
