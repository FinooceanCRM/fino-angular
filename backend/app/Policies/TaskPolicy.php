<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Task;
use App\Models\User;

/**
 * Task authorisation (Phase 4). Visibility (who sees which rows) is
 * enforced by {@see \App\Repositories\EloquentTaskRepository}; `view` trusts
 * that scoping unconditionally, same pattern as {@see CustomerPolicy::view()}.
 * `update` is narrower: the task's own creator/assignee, or a hierarchy role.
 */
class TaskPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->is_active;
    }

    public function view(User $actor, Task $task): bool
    {
        return $actor->is_active;
    }

    /** Every authenticated role may create tasks — Tasks is shared by all 8 roles. */
    public function create(User $actor): bool
    {
        return $actor->is_active;
    }

    public function update(User $actor, Task $task): bool
    {
        return $task->created_by === $actor->id
            || $task->assigned_to === $actor->id
            || $this->isHierarchyRole($actor);
    }

    public function delete(User $actor, Task $task): bool
    {
        return $this->isHierarchyRole($actor);
    }

    private function isHierarchyRole(User $actor): bool
    {
        return in_array($actor->roleEnum(), [
            UserRole::SuperAdmin,
            UserRole::Manager,
            UserRole::RelationshipManager,
        ], true);
    }
}
