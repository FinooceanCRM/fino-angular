<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Single source of truth for "who can see / manage whom".
 *
 * Super Admin        -> every user
 * Manager            -> Relationship Managers and Employees under them
 * RelationshipManager-> Employees assigned to them
 * Employee           -> nobody
 * Connector          -> nobody (outside the reporting hierarchy)
 * Accounts           -> nobody (outside the reporting hierarchy)
 */
class UserHierarchyService
{
    /**
     * Roles a given actor is allowed to create/assign.
     *
     * @return array<int, UserRole>
     */
    public function assignableRoles(User $actor): array
    {
        return match ($actor->roleEnum()) {
            UserRole::SuperAdmin => [
                UserRole::Manager,
                UserRole::RelationshipManager,
                UserRole::Employee,
                UserRole::Connector,
                UserRole::Banker,
                UserRole::Telecaller,
                UserRole::Accounts,
            ],
            UserRole::Manager => [UserRole::RelationshipManager, UserRole::Employee],
            UserRole::RelationshipManager => [UserRole::Employee],
            default => [],
        };
    }

    /**
     * Constrain a user query to the subtree the actor may access.
     */
    public function scopeVisible(Builder $query, User $actor): Builder
    {
        return match ($actor->roleEnum()) {
            UserRole::SuperAdmin => $query,
            UserRole::Manager => $query->where(function (Builder $q) use ($actor): void {
                $q->where('manager_id', $actor->id)
                    ->orWhereIn('relationship_manager_id', $this->relationshipManagerIds($actor));
            }),
            UserRole::RelationshipManager => $query->where('relationship_manager_id', $actor->id),
            default => $query->whereRaw('1 = 0'),
        };
    }

    /**
     * @return array<int, int>
     */
    public function relationshipManagerIds(User $manager): array
    {
        return User::query()
            ->where('manager_id', $manager->id)
            ->where('role', UserRole::RelationshipManager->value)
            ->pluck('id')
            ->all();
    }

    /**
     * True when the actor may view the target. A permitted actor may always
     * view their own account, while management remains restricted below them.
     */
    public function canAccess(User $actor, User $target): bool
    {
        if ($actor->id === $target->id) {
            return true;
        }

        return $this->canManage($actor, $target);
    }

    /** True when the actor may modify the target. */
    public function canManage(User $actor, User $target): bool
    {
        if ($actor->id === $target->id) {
            return false;
        }

        return match ($actor->roleEnum()) {
            UserRole::SuperAdmin => true,
            UserRole::Manager => $this->managerOwns($actor, $target),
            UserRole::RelationshipManager => $target->roleEnum() === UserRole::Employee
                && (int) $target->relationship_manager_id === $actor->id,
            default => false,
        };
    }

    public function managerOwnsRelationshipManager(User $manager, int $relationshipManagerId): bool
    {
        return User::query()
            ->whereKey($relationshipManagerId)
            ->where('role', UserRole::RelationshipManager->value)
            ->where('manager_id', $manager->id)
            ->exists();
    }

    public function relationshipIsValid(?int $managerId, ?int $relationshipManagerId): bool
    {
        if ($managerId === null || $relationshipManagerId === null) {
            return false;
        }

        return User::query()
            ->whereKey($relationshipManagerId)
            ->where('role', UserRole::RelationshipManager->value)
            ->where('manager_id', $managerId)
            ->exists();
    }

    private function managerOwns(User $manager, User $target): bool
    {
        if (! in_array($target->roleEnum(), [UserRole::RelationshipManager, UserRole::Employee], true)) {
            return false;
        }

        if ((int) $target->manager_id === $manager->id) {
            return true;
        }

        return $target->relationship_manager_id !== null
            && in_array((int) $target->relationship_manager_id, $this->relationshipManagerIds($manager), true);
    }
}
