<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Accountant;
use App\Models\User;

/**
 * Accounts profiles are strictly self-owned. Nobody in the reporting
 * hierarchy manages an accounts user; only a Super Admin may read one —
 * same shape as BankerPolicy.
 */
class AccountantPolicy
{
    public function viewDashboard(User $actor): bool
    {
        return $actor->hasRole(UserRole::Accounts);
    }

    public function viewOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Accounts);
    }

    public function updateOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Accounts) && (bool) $actor->is_active;
    }

    public function view(User $actor, Accountant $accountant): bool
    {
        return $actor->id === $accountant->user_id
            || $actor->hasRole(UserRole::SuperAdmin);
    }

    public function update(User $actor, Accountant $accountant): bool
    {
        return $actor->id === $accountant->user_id && $actor->hasRole(UserRole::Accounts);
    }
}
