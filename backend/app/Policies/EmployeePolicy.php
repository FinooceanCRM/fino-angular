<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Employee;
use App\Models\User;

/**
 * Employee profiles are strictly self-owned. An employee can never create
 * or edit another user. Only the employee's own Relationship Manager,
 * Manager or a Super Admin may read the record.
 */
class EmployeePolicy
{
    public function viewDashboard(User $actor): bool
    {
        return $actor->hasRole(UserRole::Employee);
    }

    public function viewOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Employee);
    }

    public function updateOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Employee) && (bool) $actor->is_active;
    }

    public function viewTeam(User $actor): bool
    {
        return $actor->hasRole(UserRole::Employee);
    }

    public function view(User $actor, Employee $employee): bool
    {
        if ($actor->id === $employee->user_id) {
            return true;
        }

        if ($actor->hasRole(UserRole::SuperAdmin)) {
            return true;
        }

        $owner = $employee->user;

        if ($owner === null) {
            return false;
        }

        return ($actor->hasRole(UserRole::RelationshipManager) && $owner->relationship_manager_id === $actor->id)
            || ($actor->hasRole(UserRole::Manager) && $owner->manager_id === $actor->id);
    }

    public function update(User $actor, Employee $employee): bool
    {
        return $actor->id === $employee->user_id && $actor->hasRole(UserRole::Employee);
    }

    /** Employees never create users or employee records for others. */
    public function create(User $actor): bool
    {
        return $actor->hasRole(UserRole::SuperAdmin);
    }

    public function delete(User $actor): bool
    {
        return $actor->hasRole(UserRole::SuperAdmin);
    }
}
