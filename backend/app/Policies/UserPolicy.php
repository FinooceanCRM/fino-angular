<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Models\User;
use App\Services\UserHierarchyService;

class UserPolicy
{
    public function __construct(private readonly UserHierarchyService $hierarchy)
    {
    }

    public function viewAny(User $actor): bool
    {
        return Permission::roleHas($actor->roleEnum(), Permission::ViewUsers);
    }

    public function view(User $actor, User $target): bool
    {
        return $this->viewAny($actor) && $this->hierarchy->canManage($actor, $target);
    }

    public function create(User $actor): bool
    {
        return Permission::roleHas($actor->roleEnum(), Permission::CreateUsers);
    }

    public function update(User $actor, User $target): bool
    {
        return Permission::roleHas($actor->roleEnum(), Permission::UpdateUsers)
            && $this->hierarchy->canManage($actor, $target);
    }

    public function delete(User $actor, User $target): bool
    {
        if ($actor->id === $target->id) {
            return false;
        }

        return $actor->roleEnum() === UserRole::SuperAdmin
            && Permission::roleHas($actor->roleEnum(), Permission::DeleteUsers);
    }
}
