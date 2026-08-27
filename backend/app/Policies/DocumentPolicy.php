<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Document;
use App\Models\LeadAccessRequest;
use App\Models\User;

class DocumentPolicy
{
    /**
     * A Banker may only view (and therefore download) a document once
     * granted full access to its lead — documents can include Aadhaar/PAN
     * scans, which are exactly what "full access" gates.
     */
    public function view(User $actor, Document $document): bool
    {
        if (! $actor->is_active) {
            return false;
        }

        if ($actor->roleEnum() !== UserRole::Banker) {
            return true;
        }

        return LeadAccessRequest::grantsFullAccess((int) $document->loan_lead_id, $actor->id);
    }

    public function delete(User $actor, Document $document): bool
    {
        return $document->uploaded_by === $actor->id
            || in_array($actor->roleEnum(), [
                UserRole::SuperAdmin,
                UserRole::Manager,
                UserRole::RelationshipManager,
            ], true);
    }

    /**
     * KYC review (Phase 5, Part B) — RM-only workflow in the mock (every
     * `RelationshipManagerKycDataProvider` action reviews the RM's own
     * leads); Manager/Super Admin also granted, matching the hierarchy-role
     * shape used elsewhere (e.g. {@see self::delete()}).
     */
    public function verify(User $actor, Document $document): bool
    {
        return $actor->is_active && in_array($actor->roleEnum(), [
            UserRole::SuperAdmin,
            UserRole::Manager,
            UserRole::RelationshipManager,
        ], true);
    }

    public function reject(User $actor, Document $document): bool
    {
        return $this->verify($actor, $document);
    }
}
