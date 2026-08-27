<?php

namespace App\Repositories;

use App\Enums\UserRole;
use App\Models\Task;
use App\Models\User;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Services\UserHierarchyService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Task visibility (Phase 4): an actor sees tasks they created or are
 * assigned to, plus — for Manager/Relationship Manager/Super Admin — tasks
 * created by or assigned to anyone in their reporting team
 * ({@see UserHierarchyService::scopeVisible()}, the same hierarchy helper
 * `User` listings already use). Super Admin sees every task.
 */
class EloquentTaskRepository implements TaskRepositoryInterface
{
    public function __construct(private readonly UserHierarchyService $hierarchy) {}

    public function visibleQuery(User $actor): Builder
    {
        $query = Task::query()->with([
            'assignee:id,name,email,role',
            'creator:id,name,email,role',
            'lead:id,reference,applicant_name',
        ]);

        if ($actor->roleEnum() === UserRole::SuperAdmin) {
            return $query;
        }

        $teamIds = $this->hierarchy->scopeVisible(User::query(), $actor)->pluck('id')->all();

        $ownedOrTeamIds = array_values(array_unique(array_merge([$actor->id], $teamIds)));

        return $query->where(function (Builder $q) use ($ownedOrTeamIds): void {
            $q->whereIn('created_by', $ownedOrTeamIds)
                ->orWhereIn('assigned_to', $ownedOrTeamIds);
        });
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginateVisible(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->visibleQuery($actor);

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        // 'assigned_to' here is an actor-relative param (me|team), not a raw
        // user id — 'team' scopes to everyone the actor manages (their own
        // tasks excluded), used by the RM Activities consolidation to show
        // "my team's" tasks. Reads on top of the already-visible-only query.
        if (! empty($filters['assigned_to'])) {
            if ($filters['assigned_to'] === 'me') {
                $query->where('assigned_to', $actor->id);
            } elseif ($filters['assigned_to'] === 'team') {
                $teamIds = $this->hierarchy->scopeVisible(User::query(), $actor)->pluck('id')->all();

                $query->whereIn('assigned_to', $teamIds ?: [0]);
            }
        }

        $query->orderByDesc('due_at');

        // The 'due' filter matches against the derived display_status, which
        // has no column of its own — filter in PHP over the visible set
        // rather than trying to express the date-math in SQL.
        if (! empty($filters['due'])) {
            $ids = (clone $query)->get()
                ->filter(fn (Task $task): bool => $task->displayStatus() === $filters['due'])
                ->pluck('id');

            $query = Task::query()->with(['assignee:id,name,email,role', 'creator:id,name,email,role', 'lead:id,reference,applicant_name'])
                ->whereIn('id', $ids)
                ->orderByDesc('due_at');
        }

        return $query->paginate($perPage);
    }

    public function findVisible(User $actor, int $id): ?Task
    {
        return $this->visibleQuery($actor)->whereKey($id)->first();
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): Task
    {
        return Task::query()->create($attributes);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Task $task, array $attributes): Task
    {
        $task->fill($attributes)->save();

        return $task->refresh();
    }

    public function delete(Task $task): bool
    {
        return (bool) $task->delete();
    }
}
