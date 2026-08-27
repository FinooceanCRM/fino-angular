<?php

namespace App\Repositories\Contracts;

use App\Models\Approval;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ApprovalRepositoryInterface
{
    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * @return Collection<int, Approval>
     */
    public function byType(string $type): Collection;

    public function pendingCount(string $type): int;

    public function find(int $id): ?Approval;

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): Approval;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Approval $approval, array $attributes): Approval;
}
