<?php

namespace App\Services;

use App\Models\LeadStatusHistory;
use App\Models\LoanLead;
use App\Models\TelecallerFollowUp;
use App\Models\User;
use App\Policies\TelecallerFollowUpPolicy;
use Illuminate\Support\Collection;

/**
 * Telecaller follow-up/note log against a lead she can see (own submissions
 * plus her department's PD queue). Access is gated by
 * {@see TelecallerFollowUpPolicy}, not here. Every mutation also writes a
 * plain {@see LeadStatusHistory} row so it surfaces in the shared lead
 * timeline — there is no separate activity-feed table.
 */
class TelecallerFollowUpService extends BaseService
{
    public function __construct(private readonly NotificationService $notifications) {}

    /**
     * @param  array{type: string, notes?: string|null, next_follow_up_at?: string|null}  $attributes
     */
    public function create(User $telecaller, LoanLead $lead, array $attributes): TelecallerFollowUp
    {
        return $this->transaction(function () use ($telecaller, $lead, $attributes): TelecallerFollowUp {
            $followUp = TelecallerFollowUp::query()->create([
                'loan_lead_id' => $lead->id,
                'telecaller_id' => $telecaller->id,
                'type' => $attributes['type'],
                'notes' => $attributes['notes'] ?? null,
                'next_follow_up_at' => $attributes['next_follow_up_at'] ?? null,
            ]);

            $this->recordTimeline(
                $lead,
                $telecaller,
                sprintf(
                    '%s logged a %s follow-up: %s',
                    $telecaller->name,
                    $attributes['type'],
                    $attributes['notes'] ?? '(no notes)',
                ),
            );

            $this->notifications->notify(
                $lead->assigned_manager_id,
                'lead.follow_up_logged',
                'Follow-up logged',
                sprintf('%s logged a %s follow-up on lead %s.', $telecaller->name, $attributes['type'], $lead->reference),
                ['lead_id' => $lead->id, 'follow_up_id' => $followUp->id],
            );

            return $followUp;
        });
    }

    public function complete(TelecallerFollowUp $followUp): TelecallerFollowUp
    {
        return $this->transaction(function () use ($followUp): TelecallerFollowUp {
            $followUp->fill(['completed_at' => now()])->save();

            $this->recordTimeline(
                $followUp->loanLead,
                $followUp->telecaller,
                sprintf('%s marked a follow-up complete.', $followUp->telecaller->name),
            );

            return $followUp->refresh();
        });
    }

    public function reschedule(TelecallerFollowUp $followUp, string $nextFollowUpAt): TelecallerFollowUp
    {
        return $this->transaction(function () use ($followUp, $nextFollowUpAt): TelecallerFollowUp {
            $followUp->fill(['next_follow_up_at' => $nextFollowUpAt])->save();

            $this->recordTimeline(
                $followUp->loanLead,
                $followUp->telecaller,
                sprintf('%s rescheduled a follow-up.', $followUp->telecaller->name),
            );

            return $followUp->refresh();
        });
    }

    /**
     * @return Collection<int, TelecallerFollowUp>
     */
    public function forLead(LoanLead $lead): Collection
    {
        return TelecallerFollowUp::query()
            ->where('loan_lead_id', $lead->id)
            ->with('telecaller:id,name,email,role')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * @return Collection<int, TelecallerFollowUp>
     */
    public function pendingForActor(User $telecaller, ?int $limit = null): Collection
    {
        $query = TelecallerFollowUp::query()
            ->where('telecaller_id', $telecaller->id)
            ->whereNull('completed_at')
            ->with(['telecaller:id,name,email,role', 'loanLead:id,reference,applicant_name'])
            ->orderBy('next_follow_up_at');

        if ($limit !== null) {
            $query->limit($limit);
        }

        return $query->get();
    }

    private function recordTimeline(LoanLead $lead, User $actor, string $remarks): void
    {
        $status = $lead->statusEnum()->value;

        LeadStatusHistory::query()->create([
            'loan_lead_id' => $lead->id,
            'from_status' => $status,
            'to_status' => $status,
            'changed_by' => $actor->id,
            'remarks' => $remarks,
        ]);
    }
}
