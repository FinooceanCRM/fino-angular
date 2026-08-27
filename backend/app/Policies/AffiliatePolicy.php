<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Affiliate;
use App\Models\User;

/**
 * Affiliate profiles are strictly self-owned. Nobody in the reporting
 * hierarchy manages an affiliate; only a Super Admin may read one.
 */
class AffiliatePolicy
{
    public function viewDashboard(User $actor): bool
    {
        return $actor->hasRole(UserRole::Affiliate);
    }

    public function viewOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Affiliate);
    }

    public function updateOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Affiliate) && (bool) $actor->is_active;
    }

    public function viewReferrals(User $actor): bool
    {
        return $actor->hasRole(UserRole::Affiliate);
    }

    public function viewCommissions(User $actor): bool
    {
        return $actor->hasRole(UserRole::Affiliate);
    }

    public function view(User $actor, Affiliate $affiliate): bool
    {
        return $actor->id === $affiliate->user_id
            || $actor->hasRole(UserRole::SuperAdmin);
    }

    public function update(User $actor, Affiliate $affiliate): bool
    {
        return $actor->id === $affiliate->user_id && $actor->hasRole(UserRole::Affiliate);
    }
}
