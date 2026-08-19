<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Banker;
use App\Models\User;

/**
 * Banker profiles are strictly self-owned. Nobody in the reporting
 * hierarchy manages a banker; only a Super Admin may read one.
 */
class BankerPolicy
{
    public function viewDashboard(User $actor): bool
    {
        return $actor->hasRole(UserRole::Banker);
    }

    public function viewOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Banker);
    }

    public function updateOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Banker) && (bool) $actor->is_active;
    }

    public function view(User $actor, Banker $banker): bool
    {
        return $actor->id === $banker->user_id
            || $actor->hasRole(UserRole::SuperAdmin);
    }

    public function update(User $actor, Banker $banker): bool
    {
        return $actor->id === $banker->user_id && $actor->hasRole(UserRole::Banker);
    }
}
