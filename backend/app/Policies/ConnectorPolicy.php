<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\User;

/**
 * Connector profiles are strictly self-owned. Nobody in the reporting
 * hierarchy manages a connector; only a Super Admin may read one.
 */
class ConnectorPolicy
{
    public function viewDashboard(User $actor): bool
    {
        return $actor->hasRole(UserRole::Connector);
    }

    public function viewOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Connector);
    }

    public function updateOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Connector) && (bool) $actor->is_active;
    }

    public function viewNetwork(User $actor): bool
    {
        return $actor->hasRole(UserRole::Connector);
    }

    public function viewCommissions(User $actor): bool
    {
        return $actor->hasRole(UserRole::Connector);
    }

    public function view(User $actor, Connector $connector): bool
    {
        return $actor->id === $connector->user_id
            || $actor->hasRole(UserRole::SuperAdmin);
    }

    public function update(User $actor, Connector $connector): bool
    {
        return $actor->id === $connector->user_id && $actor->hasRole(UserRole::Connector);
    }
}
