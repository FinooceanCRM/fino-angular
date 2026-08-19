<?php

namespace App\Services;

use App\Models\LeadFollowUp;
use App\Models\LoanLead;
use App\Models\User;
use App\Policies\LeadFollowUpPolicy;
use Illuminate\Support\Collection;

/**
 * Banker-only follow-up log (§11 of the Banker workflow) — calls, meetings,
 * reminders and free-form notes against a lead the banker has full access
 * to. Access is gated by {@see LeadFollowUpPolicy}, not here.
 */
class LeadFollowUpService extends BaseService
{
    public function __construct(private readonly NotificationService $notifications) {}

    /**
     * @param  array{type: string, notes?: string|null, next_follow_up_at?: string|null}  $attributes
     */
    public function create(User $banker, LoanLead $lead, array $attributes): LeadFollowUp
    {
        return $this->transaction(function () use ($banker, $lead, $attributes): LeadFollowUp {
            $followUp = LeadFollowUp::query()->create([
                'loan_lead_id' => $lead->id,
                'banker_id' => $banker->id,
                'type' => $attributes['type'],
                'notes' => $attributes['notes'] ?? null,
                'next_follow_up_at' => $attributes['next_follow_up_at'] ?? null,
            ]);

            $this->notifications->notify(
                $lead->assigned_manager_id,
                'lead.follow_up_logged',
                'Follow-up logged',
                sprintf('%s logged a %s follow-up on lead %s.', $banker->name, $attributes['type'], $lead->reference),
                ['lead_id' => $lead->id, 'follow_up_id' => $followUp->id],
            );

            return $followUp;
        });
    }

    public function complete(LeadFollowUp $followUp): LeadFollowUp
    {
        $followUp->fill(['completed_at' => now()])->save();

        return $followUp->refresh();
    }

    /**
     * @return Collection<int, LeadFollowUp>
     */
    public function forLead(LoanLead $lead): Collection
    {
        return LeadFollowUp::query()
            ->where('loan_lead_id', $lead->id)
            ->with('banker:id,name,email,role')
            ->orderByDesc('created_at')
            ->get();
    }
}
