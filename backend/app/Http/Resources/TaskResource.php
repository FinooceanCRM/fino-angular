<?php

namespace App\Http\Resources;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Task
 */
class TaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'related_to' => $this->relatedTo(),
            'lead_id' => $this->loan_lead_id,
            'priority' => $this->priority,
            'due_at' => optional($this->due_at)->toIso8601String(),
            'status' => $this->status,
            'display_status' => $this->displayStatus(),
            'assigned_to' => $this->userSummary($this->whenLoaded('assignee')),
            'created_by' => $this->userSummary($this->whenLoaded('creator')),
            'completed_at' => optional($this->completed_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }

    /**
     * The mock's `relatedTo` free-text display string, derived rather than
     * stored: the linked lead's reference/applicant name when present, else
     * 'General'.
     */
    private function relatedTo(): string
    {
        if ($this->relationLoaded('lead') && $this->lead !== null) {
            return sprintf('%s — %s', $this->lead->reference, $this->lead->applicant_name);
        }

        return 'General';
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
            'role' => $user->role instanceof UserRole ? $user->role->value : (string) $user->role,
        ];
    }
}
