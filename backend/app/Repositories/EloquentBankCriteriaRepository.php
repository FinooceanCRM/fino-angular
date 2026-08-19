<?php

namespace App\Repositories;

use App\Models\BankCriteria;
use App\Repositories\Contracts\BankCriteriaRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class EloquentBankCriteriaRepository implements BankCriteriaRepositoryInterface
{
    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = BankCriteria::query();

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where(function (Builder $q) use ($search): void {
                $q->where('bank_name', 'like', $search)->orWhere('product_name', 'like', $search);
            });
        }

        if (! empty($filters['loan_type'])) {
            $query->where('loan_type', $filters['loan_type']);
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null && $filters['is_active'] !== '') {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['banker_id'])) {
            $query->where('banker_id', (int) $filters['banker_id']);
        }

        return $query->orderBy('bank_name')->paginate($perPage);
    }

    /**
     * @return Collection<int, BankCriteria>
     */
    public function activeForLoanType(string $loanType): Collection
    {
        return BankCriteria::query()
            ->where('is_active', true)
            ->where('loan_type', $loanType)
            ->orderBy('interest_rate')
            ->get();
    }

    public function find(int $id): ?BankCriteria
    {
        return BankCriteria::query()->find($id);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): BankCriteria
    {
        return BankCriteria::query()->create($attributes);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(BankCriteria $criteria, array $attributes): BankCriteria
    {
        $criteria->fill($attributes)->save();

        return $criteria->refresh();
    }

    public function delete(BankCriteria $criteria): bool
    {
        return (bool) $criteria->delete();
    }
}
