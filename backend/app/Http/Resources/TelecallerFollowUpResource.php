<?php

namespace App\Http\Resources;

use App\Models\LoanLead;
use App\Models\TelecallerFollowUp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TelecallerFollowUp
 */
class TelecallerFollowUpResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'priority' => $this->priority,
            'notes' => $this->notes,
            'next_follow_up_at' => optional($this->next_follow_up_at)->toIso8601String(),
            'completed_at' => optional($this->completed_at)->toIso8601String(),
            'is_overdue' => $this->isOverdue(),
            'is_today' => $this->isToday(),
            'telecaller' => $this->userSummary($this->whenLoaded('telecaller')),
            'lead' => $this->leadSummary($this->whenLoaded('loanLead')),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }

    /** Overdue = not completed, and the follow-up date is a past day (not today). */
    private function isOverdue(): bool
    {
        return $this->completed_at === null
            && $this->next_follow_up_at !== null
            && $this->next_follow_up_at->isPast()
            && ! $this->next_follow_up_at->isToday();
    }

    private function isToday(): bool
    {
        return $this->completed_at === null
            && $this->next_follow_up_at !== null
            && $this->next_follow_up_at->isToday();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function userSummary(mixed $user): ?array
    {
        if (! $user instanceof User) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function leadSummary(mixed $lead): ?array
    {
        if (! $lead instanceof LoanLead) {
            return null;
        }

        return [
            'id' => $lead->id,
            'reference' => $lead->reference,
            'applicant_name' => $lead->applicant_name,
        ];
    }
}
