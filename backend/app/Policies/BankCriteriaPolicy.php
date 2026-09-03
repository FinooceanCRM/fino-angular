<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\BankCriteria;
use App\Models\User;

/** Bank criteria are readable by active users and writable by Super Admin or Manager. */
class BankCriteriaPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->is_active;
    }

    public function view(User $actor, BankCriteria $criteria): bool
    {
        return $actor->is_active;
    }

    /** Super Admin and Managers can create bank criteria. */
    public function create(User $actor): bool
    {
        return in_array($actor->roleEnum(), [UserRole::SuperAdmin, UserRole::Manager], true);
    }

    public function update(User $actor, BankCriteria $criteria): bool
    {
        return in_array($actor->roleEnum(), [UserRole::SuperAdmin, UserRole::Manager], true);
    }

    public function delete(User $actor, BankCriteria $criteria): bool
    {
        return in_array($actor->roleEnum(), [UserRole::SuperAdmin, UserRole::Manager], true);
    }
}
