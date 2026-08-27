<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

/** Read-only feature: the accounting ledger is Super Admin only. */
class LedgerPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->hasRole(UserRole::SuperAdmin);
    }
}
