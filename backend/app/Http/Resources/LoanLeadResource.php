<?php

namespace App\Http\Resources;

use App\Models\LoanLead;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LoanLead
 */
class LoanLeadResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->statusEnum();

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'applicant_name' => $this->applicant_name,
            'applicant_email' => $this->applicant_email,
            'applicant_phone' => $this->applicant_phone,
            'loan_type' => $this->loan_type,
            'loan_amount' => (float) $this->loan_amount,
            'tenure_months' => $this->tenure_months,
            'monthly_income' => $this->monthly_income !== null ? (float) $this->monthly_income : null,
            'credit_score' => $this->credit_score,
            'employment_type' => $this->employment_type,
            'city' => $this->city,
            'state' => $this->state,
            'pincode' => $this->pincode,
            'status' => $status->value,
            'status_label' => $status->label(),
            'status_colour' => $status->colour(),
            'notes' => $this->notes,
            'connector' => $this->userSummary($this->whenLoaded('connector')),
            'assigned_employee' => $this->userSummary($this->whenLoaded('assignedEmployee')),
            'assigned_relationship_manager' => $this->userSummary($this->whenLoaded('assignedRelationshipManager')),
            'assigned_manager' => $this->userSummary($this->whenLoaded('assignedManager')),
            'created_by' => $this->userSummary($this->whenLoaded('creator')),
            'updated_by' => $this->userSummary($this->whenLoaded('updater')),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function userSummary(mixed $user): ?array
    {
        if (! $user instanceof \App\Models\User) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role instanceof \App\Enums\UserRole ? $user->role->value : (string) $user->role,
        ];
    }
}
