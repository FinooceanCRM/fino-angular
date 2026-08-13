<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\BankCriteria;
use App\Models\User;

/** Bank criteria are readable by the hierarchy, writable by Super Admin only. */
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

    public function create(User $actor): bool
    {
        return $actor->roleEnum() === UserRole::SuperAdmin;
    }

    public function update(User $actor, BankCriteria $criteria): bool
    {
        return $actor->roleEnum() === UserRole::SuperAdmin;
    }

    public function delete(User $actor, BankCriteria $criteria): bool
    {
        return $actor->roleEnum() === UserRole::SuperAdmin;
    }
}
