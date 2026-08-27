<?php

namespace App\Http\Resources;

use App\Enums\UserRole;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Approval
 */
class ApprovalResource extends JsonResource
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
            'subtitle' => $this->subtitle,
            'requested_by' => $this->userSummary($this->whenLoaded('requester')),
            'requested_at' => optional($this->requested_at)->toIso8601String(),
            'status' => $this->status,
            'decided_by' => $this->userSummary($this->whenLoaded('decider')),
            'decided_at' => optional($this->decided_at)->toIso8601String(),
            'decision_remarks' => $this->decision_remarks,
            'lead_id' => $this->loan_lead_id,
            'lead' => $this->leadSummary($this->whenLoaded('lead')),
            'comments' => ApprovalCommentResource::collection($this->whenLoaded('comments')),
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
            'phone' => $user->phone,
            'role' => $user->role instanceof UserRole ? $user->role->value : (string) $user->role,
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
            'loan_type' => $lead->loan_type,
            'loan_amount' => (float) $lead->loan_amount,
            'city' => $lead->city,
            'banker' => $this->userSummary($lead->relationLoaded('assignedBanker') ? $lead->assignedBanker : null),
        ];
    }
}
