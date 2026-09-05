<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\ConnectorPayout;
use App\Models\User;

/**
 * A connector may request and view their own payouts; a Super Admin or an
 * Accounts user may see the platform-wide queue or decide (approve/mark
 * paid/reject) one. Same shape as AffiliatePayoutPolicy.
 */
class ConnectorPayoutPolicy
{
    public function requestOwn(User $actor): bool
    {
        return $actor->hasRole(UserRole::Connector) && (bool) $actor->is_active;
    }

    public function viewOwn(User $actor): bool
    {
        return $actor->hasRole(UserRole::Connector);
    }

    public function viewAny(User $actor): bool
    {
        return $actor->hasRole(UserRole::SuperAdmin, UserRole::Accounts);
    }

    public function view(User $actor, ConnectorPayout $payout): bool
    {
        return $actor->id === $payout->connector_id || $actor->hasRole(UserRole::SuperAdmin, UserRole::Accounts);
    }

    public function decide(User $actor, ConnectorPayout $payout): bool
    {
        return $actor->hasRole(UserRole::SuperAdmin, UserRole::Accounts);
    }
}
