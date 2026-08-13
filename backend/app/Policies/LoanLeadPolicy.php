<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\LoanLead;
use App\Models\User;

/**
 * Lead authorisation (Phase 9).
 *
 * Visibility itself is enforced by the repository scope; the policy governs
 * what an actor may DO with a lead they can already see.
 */
class LoanLeadPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->is_active;
    }

    public function view(User $actor, LoanLead $lead): bool
    {
        return $actor->is_active;
    }

    /** Everyone in the workflow may create leads. */
    public function create(User $actor): bool
    {
        return $actor->is_active;
    }

    public function update(User $actor, LoanLead $lead): bool
    {
        return match ($actor->roleEnum()) {
            UserRole::SuperAdmin, UserRole::Manager, UserRole::RelationshipManager => true,
            UserRole::Employee => $lead->assigned_employee_id === $actor->id,
            UserRole::Connector => $lead->connector_id === $actor->id
                && in_array($lead->statusEnum()->value, ['new', 'assigned'], true),
        };
    }

    public function delete(User $actor, LoanLead $lead): bool
    {
        return $actor->roleEnum() === UserRole::SuperAdmin;
    }

    /** Only the hierarchy may route leads; connectors and employees may not. */
    public function assign(User $actor, LoanLead $lead): bool
    {
        return in_array($actor->roleEnum(), [
            UserRole::SuperAdmin,
            UserRole::Manager,
            UserRole::RelationshipManager,
        ], true);
    }

    public function changeStatus(User $actor, LoanLead $lead): bool
    {
        return match ($actor->roleEnum()) {
            UserRole::SuperAdmin, UserRole::Manager, UserRole::RelationshipManager => true,
            UserRole::Employee => $lead->assigned_employee_id === $actor->id,
            UserRole::Connector => false,
        };
    }

    public function match(User $actor, LoanLead $lead): bool
    {
        return $actor->roleEnum() !== UserRole::Connector;
    }

    public function uploadDocument(User $actor, LoanLead $lead): bool
    {
        return $this->update($actor, $lead) || $actor->roleEnum() === UserRole::Connector;
    }
}
