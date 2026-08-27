<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\User;

/** Read-only feature: only Super Admin and Manager may see the audit trail. */
class AuditLogPolicy
{
    public function viewAny(User $actor): bool
    {
        return in_array($actor->roleEnum(), [UserRole::SuperAdmin, UserRole::Manager], true);
    }

    public function view(User $actor, AuditLog $auditLog): bool
    {
        return $this->viewAny($actor);
    }
}
