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
     * @param  array{type: string, priority?: string|null, notes?: string|null, next_follow_up_at?: string|null}  $attributes
     */
    public function create(User $telecaller, LoanLead $lead, array $attributes): TelecallerFollowUp
    {
        return $this->transaction(function () use ($telecaller, $lead, $attributes): TelecallerFollowUp {
            $followUp = TelecallerFollowUp::query()->create([
                'loan_lead_id' => $lead->id,
                'telecaller_id' => $telecaller->id,
                'type' => $attributes['type'],
                'priority' => $attributes['priority'] ?? 'medium',
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
     * All of the telecaller's own follow-ups, narrowed by the reminder
     * filter used on the Follow-ups page: `all`, `today`, `pending`
     * (default — not yet completed), `completed`, or `overdue`.
     *
     * @return Collection<int, TelecallerFollowUp>
     */
    public function forActor(User $telecaller, string $filter = 'pending', ?int $limit = null): Collection
    {
        $query = TelecallerFollowUp::query()
            ->where('telecaller_id', $telecaller->id)
            ->with(['telecaller:id,name,email,role', 'loanLead:id,reference,applicant_name'])
            ->orderBy('next_follow_up_at');

        match ($filter) {
            'today' => $query->whereNull('completed_at')->whereDate('next_follow_up_at', now()->toDateString()),
            'overdue' => $query->whereNull('completed_at')
                ->whereNotNull('next_follow_up_at')
                ->whereDate('next_follow_up_at', '<', now()->toDateString()),
            'upcoming' => $query->whereNull('completed_at')
                ->whereDate('next_follow_up_at', '>', now()->toDateString()),
            'completed' => $query->whereNotNull('completed_at'),
            'all' => null,
            // 'pending' (and any unrecognised filter) excludes overdue
            // follow-ups too — a lapsed next_follow_up_at belongs in the
            // Overdue bucket only, not both.
            default => $query->whereNull('completed_at')->where(function ($q): void {
                $q->whereNull('next_follow_up_at')
                    ->orWhereDate('next_follow_up_at', '>=', now()->toDateString());
            }),
        };

        if ($limit !== null) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Overdue/Today/Upcoming counts for the dashboard reminder KPI cards and
     * the login-time reminder popup.
     *
     * @return array{overdue: int, today: int, upcoming: int}
     */
    public function reminderCounts(User $telecaller): array
    {
        $base = TelecallerFollowUp::query()
            ->where('telecaller_id', $telecaller->id)
            ->whereNull('completed_at');

        return [
            'overdue' => (clone $base)->whereNotNull('next_follow_up_at')
                ->whereDate('next_follow_up_at', '<', now()->toDateString())->count(),
            'today' => (clone $base)->whereDate('next_follow_up_at', now()->toDateString())->count(),
            'upcoming' => (clone $base)->whereDate('next_follow_up_at', '>', now()->toDateString())->count(),
        ];
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
