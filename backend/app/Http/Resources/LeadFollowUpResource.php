<?php

namespace App\Http\Resources;

use App\Models\LeadFollowUp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LeadFollowUp
 */
class LeadFollowUpResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'notes' => $this->notes,
            'next_follow_up_at' => optional($this->next_follow_up_at)->toIso8601String(),
            'completed_at' => optional($this->completed_at)->toIso8601String(),
            'banker' => $this->userSummary($this->whenLoaded('banker')),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
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
}
