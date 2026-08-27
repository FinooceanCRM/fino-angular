<?php

namespace App\Http\Resources;

use App\Enums\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\CustomerDocument
 */
class CustomerDocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $type = DocumentType::tryFrom((string) $this->document_type);

        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
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
            'download_url' => url('/api/v1/customers/documents/'.$this->id.'/download'),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
