<?php

namespace App\Repositories\Contracts;

use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

interface TaskRepositoryInterface
{
    /** Query constrained to the tasks the actor may see. */
    public function visibleQuery(User $actor): Builder;

    /**
     * @param array<string, mixed> $filters
     */
    public function paginateVisible(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function findVisible(User $actor, int $id): ?Task;

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): Task;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Task $task, array $attributes): Task;

    public function delete(Task $task): bool;
}
