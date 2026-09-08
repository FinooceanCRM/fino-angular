<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Vendor;

/**
 * Vendor profiles are strictly self-owned. Nobody in the reporting
 * hierarchy manages a vendor; only a Super Admin may read one. Same shape
 * as {@see ConnectorPolicy}.
 */
class VendorPolicy
{
    public function viewDashboard(User $actor): bool
    {
        return $actor->hasRole(UserRole::Vendor);
    }

    public function viewOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Vendor);
    }

    public function updateOwnProfile(User $actor): bool
    {
        return $actor->hasRole(UserRole::Vendor) && (bool) $actor->is_active;
    }

    public function view(User $actor, Vendor $vendor): bool
    {
        return $actor->id === $vendor->user_id
            || $actor->hasRole(UserRole::SuperAdmin);
    }

    public function update(User $actor, Vendor $vendor): bool
    {
        return $actor->id === $vendor->user_id && $actor->hasRole(UserRole::Vendor);
    }
}
