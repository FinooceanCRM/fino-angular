<?php

namespace App\Http\Resources;

use App\Enums\UserRole;
use App\Models\LeadAccessRequest;
use App\Models\LoanLead;
use App\Models\User;
use App\Services\LeadAccessRequestService;
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
        $actor = $request->user();
        $isBanker = $actor?->roleEnum() === UserRole::Banker;
        $fullAccess = ! $isBanker || LeadAccessRequest::grantsFullAccess($this->id, $actor->id);

        $details = $this->details;
        if ($isBanker && ! $fullAccess && is_array($details)) {
            foreach (['alternative_phone', 'current_address', 'landmark'] as $key) {
                if (array_key_exists($key, $details)) {
                    $details[$key] = null;
                }
            }
        }

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'applicant_name' => $this->applicant_name,
            'applicant_email' => $isBanker && ! $fullAccess ? null : $this->applicant_email,
            'applicant_phone' => $isBanker && ! $fullAccess ? null : $this->applicant_phone,
            'loan_type' => $this->loan_type,
            'department' => $this->department?->value,
            'department_label' => $this->department?->label(),
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
            'details' => $details,
            'connector' => $this->userSummary($this->whenLoaded('connector')),
            'assigned_employee' => $this->userSummary($this->whenLoaded('assignedEmployee')),
            'assigned_relationship_manager' => $this->userSummary($this->whenLoaded('assignedRelationshipManager')),
            'assigned_manager' => $this->userSummary($this->whenLoaded('assignedManager')),
            'assigned_banker' => $this->userSummary($this->whenLoaded('assignedBanker')),
            'assigned_telecaller' => $this->userSummary($this->whenLoaded('assignedTelecaller')),
            'created_by' => $this->userSummary($this->whenLoaded('creator')),
            'updated_by' => $this->userSummary($this->whenLoaded('updater')),
            'pd_completed_at' => optional($this->pd_completed_at)->toIso8601String(),
            'pd_completed_by' => $this->userSummary($this->whenLoaded('pdCompletedBy')),
            'pd_details' => $isBanker && ! $fullAccess ? null : $this->pd_details,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            // Banker-workspace-only flags. `full_access` is meaningful (and
            // always true) for every other role too, so the frontend can
            // gate purely off this field without knowing whose role it is.
            'full_access' => $fullAccess,
            'match_score' => $isBanker
                ? app(LeadAccessRequestService::class)->matchScoreFor($actor, $this->resource)
                : null,
            // Mirrors LoanLeadPolicy::changeStatus()/assign() so the
            // frontend can hide the Change Status / Assign forms for
            // whoever can't actually use them (e.g. an Employee once the
            // lead has been reassigned) without re-deriving the policy.
            'can_change_status' => $actor !== null && $actor->can('changeStatus', $this->resource),
            'can_assign' => $actor !== null && $actor->can('assign', $this->resource),
            // Mirrors LoanLeadPolicy::submitPd() so the frontend can show/hide
            // the "Complete Full PD" action without re-deriving the policy —
            // same pattern as can_change_status/can_assign above.
            'can_submit_pd' => $actor !== null && $actor->can('submitPd', $this->resource),
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
            'role' => $user->role instanceof UserRole ? $user->role->value : (string) $user->role,
        ];
    }
}
