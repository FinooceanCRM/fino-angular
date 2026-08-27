<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

/** The permissions matrix (view + edit) is Super Admin only. */
class PermissionPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->roleEnum() === UserRole::SuperAdmin;
    }

    public function manage(User $actor): bool
    {
        return $actor->roleEnum() === UserRole::SuperAdmin;
    }
}
