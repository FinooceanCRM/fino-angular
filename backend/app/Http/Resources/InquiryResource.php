<?php

namespace App\Http\Resources;

use App\Enums\InquirySource;
use App\Enums\InquiryStatus;
use App\Enums\LoanType;
use App\Models\LoanLead;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff-side view of a website/portal inquiry (Telecaller + Super Admin only).
 *
 * @mixin LoanLead
 */
class InquiryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $details = (array) $this->details;
        $status = InquiryStatus::tryFrom((string) $this->inquiry_status);
        $source = InquirySource::tryFrom((string) $this->source);
        $eligibility = $details['eligibility'] ?? null;

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'applicant_name' => $this->applicant_name,
            'applicant_phone' => $this->applicant_phone,
            'applicant_email' => $this->applicant_email,
            'loan_type' => $this->loan_type,
            'loan_type_label' => LoanType::tryFrom((string) $this->loan_type)?->label(),
            'product_name' => $details['product_name'] ?? null,
            'department' => $this->department?->value,
            'loan_amount' => (float) $this->loan_amount,
            'tenure_months' => $this->tenure_months,
            'city' => $this->city,
            'source' => $this->source,
            'source_label' => $source?->label(),
            'inquiry_status' => $this->inquiry_status,
            'inquiry_status_label' => $status?->label(),
            'lead_status' => $this->statusEnum()->value,
            'lead_status_label' => $this->statusEnum()->label(),
            'eligibility_band' => $eligibility['band'] ?? null,
            'eligibility_headline' => $eligibility['headline'] ?? null,
            // Set only for leads that came from an offer: which one, how the visitor arrived, what they asked for.
            'offer' => ($this->offer_id === null && $this->source !== InquirySource::CallbackPopup->value) ? null : [
                'id' => $this->offer_id,
                'kind' => $this->offer_id === null ? 'callback' : 'offer',
                'name' => $details['offer']['name'] ?? ($this->offer_id !== null ? $this->offer?->name : null),
                'type' => $details['offer']['type'] ?? null,
                'interested_service' => $details['offer']['interested_service'] ?? null,
                'message' => $details['offer']['message'] ?? null,
                'account_status' => ($details['offer']['account_status'] ?? $details['callback']['account_status'] ?? 'guest'),
                'marketing_consent' => (bool) ($details['offer']['marketing_consent'] ?? false),
                'visitor_id' => $this->visitor_id,
            ],
            'has_account' => $this->customer_id !== null,
            'resubmission_count' => (int) $this->resubmission_count,
            'assigned_telecaller' => $this->whenLoaded('assignedTelecaller', fn () => $this->assignedTelecaller?->only(['id', 'name'])),
            'assigned_manager' => $this->whenLoaded('assignedManager', fn () => $this->assignedManager?->only(['id', 'name'])),
            'last_contacted_at' => $this->last_contacted_at?->toIso8601String(),
            'next_follow_up_at' => $this->next_follow_up_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * @param array<string, mixed> $context from InquiryQueueService::context()
     * @return array<string, mixed>
     */
    public static function detail(LoanLead $lead, array $context, Request $request): array
    {
        $details = (array) $lead->details;

        return (new self($lead))->toArray($request) + [
            'monthly_income' => $lead->monthly_income !== null ? (float) $lead->monthly_income : null,
            'employment_type' => $lead->employment_type,
            'existing_emi' => $details['existing_emi'] ?? null,
            'eligibility' => $details['eligibility'] ?? null,
            'consent_at' => $details['consent_at'] ?? $details['offer']['privacy_consent_at'] ?? $details['callback']['privacy_consent_at'] ?? null,
            'activities' => $context['activities']->map(fn ($a): array => [
                'id' => $a->id,
                'type' => $a->type,
                'body' => $a->body,
                'meta' => $a->meta,
                'user' => $a->user?->only(['id', 'name']),
                'created_at' => $a->created_at?->toIso8601String(),
            ])->values(),
            'assignments' => $context['assignments']->map(fn ($a): array => [
                'id' => $a->id,
                'assignee' => $a->assignee?->only(['id', 'name']),
                'assigned_by' => $a->assigner?->only(['id', 'name']),
                'status' => $a->status,
                'remarks' => $a->remarks,
                'assigned_at' => $a->assigned_at?->toIso8601String(),
                'released_at' => $a->released_at?->toIso8601String(),
            ])->values(),
            // Other leads sharing this phone number — a warning only; nothing is merged.
            'possible_duplicates' => $context['duplicates']->map(fn ($d): array => [
                'id' => $d->id,
                'reference' => $d->reference,
                'loan_type' => $d->loan_type,
                'status' => $d->status instanceof \BackedEnum ? $d->status->value : $d->status,
                'source' => $d->source,
                'created_at' => $d->created_at?->toIso8601String(),
            ])->values(),
        ];
    }
}
