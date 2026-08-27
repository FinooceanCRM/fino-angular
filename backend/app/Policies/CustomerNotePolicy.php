<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

/**
 * Customer notes (Phase 3). The parent Customer is already visibility-scoped
 * before either method here runs (the controller resolves it via
 * `CustomerService::findVisible()` first) — same "simple, visible-if-parent-
 * visible" reasoning as {@see CustomerDocumentPolicy}. Invoked via
 * `authorize('viewAny', [CustomerNote::class, $customer])` /
 * `authorize('create', [CustomerNote::class, $customer])`.
 */
class CustomerNotePolicy
{
    public function viewAny(User $actor, Customer $customer): bool
    {
        return $actor->is_active;
    }

    public function create(User $actor, Customer $customer): bool
    {
        return $actor->is_active;
    }
}
