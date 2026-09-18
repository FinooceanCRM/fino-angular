<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\BankCriteria;
use App\Models\User;

/**
 * Bank criteria are readable by active users. Super Admins and Managers may
 * manage every row; Bankers may manage only criteria they own.
 */
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

    /** Bankers submit criteria for themselves; hierarchy roles manage globally. */
    public function create(User $actor): bool
    {
        return $actor->is_active
            && in_array($actor->roleEnum(), [
                UserRole::SuperAdmin,
                UserRole::Manager,
                UserRole::Banker,
            ], true);
    }

    public function update(User $actor, BankCriteria $criteria): bool
    {
        return match ($actor->roleEnum()) {
            UserRole::SuperAdmin, UserRole::Manager => $actor->is_active,
            UserRole::Banker => $actor->is_active && $criteria->banker_id === $actor->id,
            default => false,
        };
    }

    public function delete(User $actor, BankCriteria $criteria): bool
    {
        return match ($actor->roleEnum()) {
            UserRole::SuperAdmin, UserRole::Manager => $actor->is_active,
            UserRole::Banker => $actor->is_active && $criteria->banker_id === $actor->id,
            default => false,
        };
    }
}
