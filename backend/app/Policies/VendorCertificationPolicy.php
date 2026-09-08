<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\VendorCertification;

/**
 * A Vendor Certification is strictly self-owned: only the vendor who created
 * it (and a Super Admin, read-only) may see it. `vendor_id` is always the
 * authenticated user's id — the browser never supplies it.
 */
class VendorCertificationPolicy
{
    public function manage(User $actor): bool
    {
        return $actor->hasRole(UserRole::Vendor) && (bool) $actor->is_active;
    }

    public function view(User $actor, VendorCertification $certification): bool
    {
        return $actor->id === $certification->vendor_id
            || $actor->hasRole(UserRole::SuperAdmin);
    }

    public function update(User $actor, VendorCertification $certification): bool
    {
        return $actor->id === $certification->vendor_id
            && $actor->hasRole(UserRole::Vendor)
            && (bool) $actor->is_active;
    }

    public function delete(User $actor, VendorCertification $certification): bool
    {
        return $actor->id === $certification->vendor_id && $actor->hasRole(UserRole::Vendor);
    }
}
