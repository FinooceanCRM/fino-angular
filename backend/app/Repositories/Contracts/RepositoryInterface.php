<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Contract implemented by every repository.
 */
interface RepositoryInterface
{
    /**
     * @param array<string, mixed> $filters
     */
    public function all(array $filters = []): Collection;

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator;

    public function find(int|string $id): ?Model;

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): Model;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(int|string $id, array $attributes): Model;

    public function delete(int|string $id): bool;
}
