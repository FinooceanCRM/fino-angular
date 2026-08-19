<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\LeadAccessRequest;
use App\Models\LoanLead;
use App\Models\User;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;

/**
 * A banker may request access to a lead they can already see (matched
 * against their own criteria, per repository visibility). A Manager/RM/
 * Super Admin who can see that same lead may approve or reject the request
 * — the same actors who are allowed to assign leads at all.
 */
class LeadAccessRequestPolicy
{
    public function __construct(private readonly LoanLeadRepositoryInterface $leads)
    {
    }

    public function create(User $actor, LoanLead $lead): bool
    {
        return $actor->hasRole(UserRole::Banker)
            && $this->leads->findVisible($actor, $lead->id) !== null;
    }

    public function view(User $actor, LeadAccessRequest $request): bool
    {
        if ($actor->id === $request->banker_id) {
            return true;
        }

        return $this->leads->findVisible($actor, $request->loan_lead_id) !== null;
    }

    public function decide(User $actor, LeadAccessRequest $request): bool
    {
        return in_array($actor->roleEnum(), [
            UserRole::SuperAdmin,
            UserRole::Manager,
            UserRole::RelationshipManager,
        ], true) && $this->leads->findVisible($actor, $request->loan_lead_id) !== null;
    }
}
