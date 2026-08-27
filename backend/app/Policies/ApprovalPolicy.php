<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Approval;
use App\Models\User;

/**
 * Approval Center authorisation (Phase 5). Banker/Lead/Document approvals
 * are, per the mock, decided centrally by a Manager-level role (every seed
 * row's `decidedBy` is a Manager) — `approve`/`reject` are restricted
 * accordingly. `viewAny`/`create`/comment stay open to any authenticated
 * user, mirroring how the mock lets various roles submit requests that a
 * Manager decides.
 */
class ApprovalPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->is_active;
    }

    public function view(User $actor, Approval $approval): bool
    {
        return $actor->is_active;
    }

    public function create(User $actor): bool
    {
        return $actor->is_active;
    }

    public function decide(User $actor, Approval $approval): bool
    {
        return $actor->is_active && in_array($actor->roleEnum(), [
            UserRole::SuperAdmin,
            UserRole::Manager,
            UserRole::RelationshipManager,
        ], true);
    }

    public function comment(User $actor, Approval $approval): bool
    {
        return $actor->is_active;
    }
}
