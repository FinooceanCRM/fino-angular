<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\LoanLead;
use App\Models\TelecallerFollowUp;
use App\Models\User;

/**
 * Telecaller follow-ups/notes may be logged on any lead the telecaller can
 * already see (repository-scoped: her own submissions plus her department's
 * PD queue) — unlike the Banker log, there is no additional full-access
 * gate here.
 */
class TelecallerFollowUpPolicy
{
    public function viewAny(User $actor, LoanLead $lead): bool
    {
        return $this->create($actor, $lead);
    }

    public function create(User $actor, LoanLead $lead): bool
    {
        return $actor->roleEnum() === UserRole::Telecaller;
    }

    public function complete(User $actor, TelecallerFollowUp $followUp): bool
    {
        return $actor->roleEnum() === UserRole::Telecaller && $followUp->telecaller_id === $actor->id;
    }

    public function reschedule(User $actor, TelecallerFollowUp $followUp): bool
    {
        return $this->complete($actor, $followUp);
    }
}
