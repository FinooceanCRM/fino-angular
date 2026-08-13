<?php

namespace App\Repositories;

use App\Repositories\Contracts\RepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Generic Eloquent repository. Feature repositories extend this class and
 * declare their model plus any domain-specific query methods.
 */
abstract class BaseRepository implements RepositoryInterface
{
    public function __construct(protected Model $model)
    {
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function all(array $filters = []): Collection
    {
        return $this->query($filters)->get();
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->query($filters)->paginate($perPage);
    }

    public function find(int|string $id): ?Model
    {
        return $this->model->newQuery()->find($id);
    }

    public function findOrFail(int|string $id): Model
    {
        return $this->find($id) ?? throw new ModelNotFoundException();
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): Model
    {
        return $this->model->newQuery()->create($attributes);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(int|string $id, array $attributes): Model
    {
        $record = $this->findOrFail($id);
        $record->fill($attributes)->save();

        return $record;
    }

    public function delete(int|string $id): bool
    {
        return (bool) $this->findOrFail($id)->delete();
    }

    /**
     * Hook for applying filters. Override in concrete repositories.
     *
     * @param array<string, mixed> $filters
     */
    protected function query(array $filters = []): Builder
    {
        return $this->model->newQuery();
    }
}
