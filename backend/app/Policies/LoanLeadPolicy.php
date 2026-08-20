<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\LeadAccessRequest;
use App\Models\LeadAssignment;
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
            // A Banker may only update a lead once granted full access —
            // being merely matched or directly assigned (a Priority Lead)
            // isn't enough; see LeadAccessRequest::grantsFullAccess().
            UserRole::Banker => $lead->assigned_banker_id === $actor->id
                && LeadAccessRequest::grantsFullAccess($lead->id, $actor->id),
            // Telecallers record PD outcomes through a dedicated action
            // (Phase 6), not by editing lead fields directly.
            UserRole::Telecaller => false,
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

    /**
     * Business rule: only Super Admin, Manager and Relationship Manager may
     * change a lead's status unconditionally — not the assigned Employee or
     * Telecaller. A Banker may too, but only once granted full access to the
     * lead (see {@see self::update()}); until then their Priority/Assigned
     * leads are read-only.
     *
     * An Employee gets a narrower version of that same carve-out: they may
     * change status (and leave the accompanying remark) only the first time
     * a lead is routed to an Employee. Once the lead has been reassigned —
     * moved to a different Employee, or handed elsewhere and back — the
     * assigned Employee drops to documents-only and status becomes
     * read-only for them; see {@see self::uploadDocument()}.
     *
     * A Telecaller may change status only on leads she personally
     * submitted — her PD-queue leads (employee-generated, not her own)
     * stay status-read-only for her; see {@see self::completePd()} for the
     * dedicated PD action instead.
     */
    public function changeStatus(User $actor, LoanLead $lead): bool
    {
        if (in_array($actor->roleEnum(), [
            UserRole::SuperAdmin,
            UserRole::Manager,
            UserRole::RelationshipManager,
        ], true)) {
            return true;
        }

        if ($actor->roleEnum() === UserRole::Employee) {
            return $lead->assigned_employee_id === $actor->id
                && ! LeadAssignment::wasReassignedAwayFrom($lead->id, UserRole::Employee);
        }

        if ($actor->roleEnum() === UserRole::Telecaller) {
            return $lead->created_by === $actor->id;
        }

        return $actor->roleEnum() === UserRole::Banker
            && $lead->assigned_banker_id === $actor->id
            && LeadAccessRequest::grantsFullAccess($lead->id, $actor->id);
    }

    public function match(User $actor, LoanLead $lead): bool
    {
        return ! in_array($actor->roleEnum(), [UserRole::Connector, UserRole::Banker, UserRole::Telecaller], true);
    }

    /**
     * The lead's own creator may always attach documents to it — most
     * visibly, so the Attach Documents step of lead creation works for
     * every role, not just the ones {@see self::update()} already covers
     * (e.g. a Banker isn't granted full access to their own brand-new lead
     * until later, but must still be able to attach it during creation).
     */
    public function uploadDocument(User $actor, LoanLead $lead): bool
    {
        return $this->update($actor, $lead)
            || $actor->roleEnum() === UserRole::Connector
            || $lead->created_by === $actor->id;
    }

    /**
     * Stricter than {@see self::view()}: a Banker may see a lead's basic
     * (masked) info the moment it's matched or assigned to them, but may
     * only reach its documents — which can include Aadhaar/PAN scans —
     * once granted full access. Every other role already passes `view`.
     */
    public function viewDocuments(User $actor, LoanLead $lead): bool
    {
        if ($actor->roleEnum() !== UserRole::Banker) {
            return true;
        }

        return $lead->assigned_banker_id === $actor->id
            && LeadAccessRequest::grantsFullAccess($lead->id, $actor->id);
    }

    /**
     * Telecaller PD (pre-disbursement verification call) workflow, Phase 6.
     * Visibility already confines a Telecaller to employee-generated leads
     * in their own department; this just guards against completing PD
     * twice.
     */
    public function completePd(User $actor, LoanLead $lead): bool
    {
        return $actor->roleEnum() === UserRole::Telecaller && $lead->pd_completed_at === null;
    }
}
