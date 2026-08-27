<?php

namespace App\Http\Resources;

use App\Enums\DocumentType;
use App\Models\Document;
use App\Models\LoanLead;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Document
 */
class DocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $type = DocumentType::tryFrom((string) $this->document_type);

        return [
            'id' => $this->id,
            'loan_lead_id' => $this->loan_lead_id,
            'document_type' => $this->document_type,
            'document_type_label' => $type?->label() ?? (string) $this->document_type,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => (int) $this->size_bytes,
            'status' => $this->status,
            'remarks' => $this->remarks,
            'uploaded_by' => $this->whenLoaded('uploader', fn (): ?array => $this->uploader ? [
                'id' => $this->uploader->id,
                'name' => $this->uploader->name,
            ] : null),
            // Lead reference/applicant name — populated when the `loanLead`
            // relation is eager-loaded (the RM KYC queue's primary use of
            // this Resource; Phase 5, Part B), null otherwise.
            'lead' => $this->when($this->relationLoaded('loanLead'), fn (): ?array => $this->loanLead instanceof LoanLead ? [
                'id' => $this->loanLead->id,
                'reference' => $this->loanLead->reference,
                'applicant_name' => $this->loanLead->applicant_name,
            ] : null),
            'download_url' => url('/api/v1/documents/'.$this->id.'/download'),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
