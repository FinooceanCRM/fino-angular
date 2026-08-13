<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\RelationshipManager;
use App\Models\User;

/**
 * Relationship Manager module authorisation (Phase 7).
 *
 * The module is self-scoped: an RM reaches only their own profile, the
 * employees assigned to them and the connectors assigned to them. Manager and
 * Super Admin routes remain out of reach; this policy never grants them.
 */
class RelationshipManagerPolicy
{
    public function viewDashboard(User $actor): bool
    {
        return $actor->hasRole(UserRole::RelationshipManager);
    }

    public function viewOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::RelationshipManager);
    }

    public function updateOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::RelationshipManager) && (bool) $actor->is_active;
    }

    /** Listing employees assigned to the authenticated Relationship Manager. */
    public function viewEmployees(User $actor): bool
    {
        return $actor->hasRole(UserRole::RelationshipManager);
    }

    /** Listing connectors assigned to the authenticated Relationship Manager. */
    public function viewConnectors(User $actor): bool
    {
        return $actor->hasRole(UserRole::RelationshipManager);
    }

    public function view(User $actor, RelationshipManager $profile): bool
    {
        if ($actor->id === $profile->user_id) {
            return true;
        }

        if ($actor->hasRole(UserRole::SuperAdmin)) {
            return true;
        }

        $owner = $profile->user;

        return $owner !== null
            && $actor->hasRole(UserRole::Manager)
            && (int) $owner->manager_id === $actor->id;
    }

    public function update(User $actor, RelationshipManager $profile): bool
    {
        return $actor->id === $profile->user_id && $actor->hasRole(UserRole::RelationshipManager);
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
