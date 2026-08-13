<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Manager;
use App\Models\User;

/**
 * Manager module authorisation (Phase 8).
 *
 * The module is subtree-scoped: a Manager reaches only their own profile, the
 * Relationship Managers whose `manager_id` points at them, and the employees
 * under those RMs. Super Admin functionality and another Manager's subtree are
 * never granted here.
 */
class ManagerPolicy
{
    public function viewDashboard(User $actor): bool
    {
        return $actor->hasRole(UserRole::Manager);
    }

    public function viewOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Manager);
    }

    public function updateOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Manager) && (bool) $actor->is_active;
    }

    /** Listing the Relationship Managers reporting to the acting Manager. */
    public function viewRelationshipManagers(User $actor): bool
    {
        return $actor->hasRole(UserRole::Manager);
    }

    /** Creating a Relationship Manager under the acting Manager. */
    public function createRelationshipManager(User $actor): bool
    {
        return $actor->hasRole(UserRole::Manager) && (bool) $actor->is_active;
    }

    /** Editing / activating / deactivating one of their Relationship Managers. */
    public function updateRelationshipManager(User $actor): bool
    {
        return $actor->hasRole(UserRole::Manager) && (bool) $actor->is_active;
    }

    /** Listing employees under the acting Manager's Relationship Managers. */
    public function viewEmployees(User $actor): bool
    {
        return $actor->hasRole(UserRole::Manager);
    }

    public function view(User $actor, Manager $profile): bool
    {
        return $actor->id === $profile->user_id || $actor->hasRole(UserRole::SuperAdmin);
    }

    public function update(User $actor, Manager $profile): bool
    {
        return $actor->id === $profile->user_id && $actor->hasRole(UserRole::Manager);
    }

    public function create(User $actor): bool
    {
        return $actor->hasRole(UserRole::SuperAdmin);
    }

    public function delete(User $actor): bool
    {
        return $actor->hasRole(UserRole::SuperAdmin);
    }
}
