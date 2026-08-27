<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\AffiliatePayout;
use App\Models\User;

/**
 * An affiliate may request and view their own payouts; only a Super Admin
 * may see the platform-wide queue or decide (approve/mark paid/reject) one.
 * Same shape as LeadAccessRequestPolicy.
 */
class AffiliatePayoutPolicy
{
    public function requestOwn(User $actor): bool
    {
        return $actor->hasRole(UserRole::Affiliate) && (bool) $actor->is_active;
    }

    public function viewOwn(User $actor): bool
    {
        return $actor->hasRole(UserRole::Affiliate);
    }

    public function viewAny(User $actor): bool
    {
        return $actor->hasRole(UserRole::SuperAdmin);
    }

    public function view(User $actor, AffiliatePayout $payout): bool
    {
        return $actor->id === $payout->affiliate_id || $actor->hasRole(UserRole::SuperAdmin);
    }

    public function decide(User $actor, AffiliatePayout $payout): bool
    {
        return $actor->hasRole(UserRole::SuperAdmin);
    }
}
