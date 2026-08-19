<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Telecaller;
use App\Models\User;

/**
 * Telecaller profiles are strictly self-owned. Nobody in the reporting
 * hierarchy manages a telecaller; only a Super Admin may read one.
 */
class TelecallerPolicy
{
    public function viewDashboard(User $actor): bool
    {
        return $actor->hasRole(UserRole::Telecaller);
    }

    public function viewOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Telecaller);
    }

    public function updateOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Telecaller) && (bool) $actor->is_active;
    }

    public function view(User $actor, Telecaller $telecaller): bool
    {
        return $actor->id === $telecaller->user_id
            || $actor->hasRole(UserRole::SuperAdmin);
    }

    public function update(User $actor, Telecaller $telecaller): bool
    {
        return $actor->id === $telecaller->user_id && $actor->hasRole(UserRole::Telecaller);
    }
}
