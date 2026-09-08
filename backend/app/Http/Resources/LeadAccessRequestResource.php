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
                'source_name' => $lead->connector?->name ?? $lead->creator?->name,
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

        $profile = $user->relationLoaded('bankerProfile') ? $user->bankerProfile : null;
        $productLabels = config('bankers.products');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->roleEnum()->value,

            'first_name' => $profile?->first_name,
            'last_name' => $profile?->last_name,
            'alternate_phone' => $profile?->alternate_phone,
            'country' => $profile?->country,
            'pan_number' => $profile?->pan_number,
            'city' => $profile?->city,
            'state' => $profile?->state,
            'pincode' => $profile?->pincode,

            'bank_name' => $profile?->bank_name,
            'branch' => $profile?->branch,
            'branch_address' => $profile?->branch_address,
            'branch_location' => $profile?->branch_location,
            'bank_city' => $profile?->bank_city,
            'bank_state' => $profile?->bank_state,
            'designation' => $profile?->designation,
            'employee_code' => $profile?->employee_code,

            'products' => $profile ? array_values($profile->products ?? []) : [],
            'product_labels' => $profile ? array_values(array_map(
                static fn (string $key): string => $productLabels[$key] ?? $key,
                $profile->products ?? [],
            )) : [],

            'manager_name' => $profile?->manager_name,
            'manager_email' => $profile?->manager_email,
            'manager_phone' => $profile?->manager_phone,
        ];
    }
}
