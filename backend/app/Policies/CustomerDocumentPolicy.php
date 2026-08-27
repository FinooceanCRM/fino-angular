<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\CustomerDocument;
use App\Models\User;

/**
 * Customer documents (Phase 3). `viewAny`/`create` take the parent Customer
 * directly (invoked as `authorize('create', [CustomerDocument::class,
 * $customer])`) since there's no document yet to check at upload time;
 * visibility of the parent already gates them. `update` backs the
 * verify/reject actions — deliberately narrower than upload, restricted to
 * the same hierarchy roles that may delete a customer.
 */
class CustomerDocumentPolicy
{
    public function viewAny(User $actor, Customer $customer): bool
    {
        return $actor->is_active;
    }

    public function create(User $actor, Customer $customer): bool
    {
        return $actor->is_active;
    }

    public function view(User $actor, CustomerDocument $document): bool
    {
        return $actor->is_active;
    }

    /** Backs verify()/reject() — only a hierarchy role may transition a document's status. */
    public function update(User $actor, CustomerDocument $document): bool
    {
        return in_array($actor->roleEnum(), [
            UserRole::SuperAdmin,
            UserRole::Manager,
            UserRole::RelationshipManager,
        ], true);
    }
}
