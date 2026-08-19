<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\LeadAccessRequest;
use App\Models\LeadFollowUp;
use App\Models\LoanLead;
use App\Models\User;

/**
 * Follow-ups (§11 of the Banker workflow) are a Banker-only tool, and only
 * once they hold full access to the lead — same gate as status changes and
 * documents.
 */
class LeadFollowUpPolicy
{
    public function viewAny(User $actor, LoanLead $lead): bool
    {
        return $this->create($actor, $lead);
    }

    public function create(User $actor, LoanLead $lead): bool
    {
        return $actor->roleEnum() === UserRole::Banker
            && $lead->assigned_banker_id === $actor->id
            && LeadAccessRequest::grantsFullAccess($lead->id, $actor->id);
    }

    public function complete(User $actor, LeadFollowUp $followUp): bool
    {
        return $actor->roleEnum() === UserRole::Banker && $followUp->banker_id === $actor->id;
    }
}
