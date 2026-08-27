<?php

namespace App\Repositories\Contracts;

use App\Models\AuditLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AuditLogRepositoryInterface
{
    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): AuditLog;

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * @return array<int, string>
     */
    public function distinctEntityTypes(): array;

    public function findOrFail(int $id): AuditLog;
}
