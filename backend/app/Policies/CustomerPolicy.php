<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\User;

/**
 * Customer authorisation (Phase 3). Visibility (who sees which rows) is
 * enforced by {@see \App\Repositories\EloquentCustomerRepository}; `view`
 * trusts that scoping unconditionally — same pattern as
 * {@see LoanLeadPolicy::view()} — so a row the actor can already see never
 * 403s on its own show/notes/interactions/documents endpoints. `update` and
 * `delete` are narrower: only the customer's own creator, or a hierarchy
 * role (Super Admin/Manager/Relationship Manager), may mutate it.
 */
class CustomerPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->is_active;
    }

    public function view(User $actor, Customer $customer): bool
    {
        return $actor->is_active;
    }

    /** Every authenticated role may create customers — Customers is shared by all 8 roles. */
    public function create(User $actor): bool
    {
        return $actor->is_active;
    }

    public function update(User $actor, Customer $customer): bool
    {
        return $customer->created_by === $actor->id || $this->isHierarchyRole($actor);
    }

    public function delete(User $actor, Customer $customer): bool
    {
        return $this->isHierarchyRole($actor);
    }

    private function isHierarchyRole(User $actor): bool
    {
        return in_array($actor->roleEnum(), [
            UserRole::SuperAdmin,
            UserRole::Manager,
            UserRole::RelationshipManager,
        ], true);
    }
}
