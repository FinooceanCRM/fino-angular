<?php

namespace App\Http\Resources;

use App\Models\LeadAccessRequest;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LeadAccessRequest
 */
class LeadAccessRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->statusEnum();
        $origin = $this->originEnum();
        $lead = $this->whenLoaded('loanLead');

        return [
            'id' => $this->id,
            'status' => $status->value,
            'status_label' => $status->label(),
            'status_colour' => $status->colour(),
            'origin' => $origin->value,
            'origin_label' => $origin->label(),
            'remarks' => $this->remarks,
            'decision_remarks' => $this->decision_remarks,
            'lead' => $lead instanceof LoanLead ? [
                'id' => $lead->id,
                'reference' => $lead->reference,
                'applicant_name' => $lead->applicant_name,
                'loan_type' => $lead->loan_type,
                'loan_amount' => (float) $lead->loan_amount,
                'city' => $lead->city,
                'status' => $lead->statusEnum()->value,
            ] : null,
            'banker' => $this->userSummary($this->whenLoaded('banker')),
            'decided_by' => $this->userSummary($this->whenLoaded('decidedBy')),
            'decided_at' => optional($this->decided_at)->toIso8601String(),
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
