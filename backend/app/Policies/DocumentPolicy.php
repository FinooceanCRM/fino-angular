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
}
