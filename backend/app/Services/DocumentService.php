<?php

namespace App\Services;

use App\Enums\DocumentType;
use App\Exceptions\DomainException;
use App\Models\Document;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Lead document storage (Phase 9). Files live on the local disk under
 * storage/app/lead-documents and are streamed back through the API.
 *
 * verify()/reject() and kycQueueForRm() are a Phase 5 (Part B) addition,
 * backing the RM KYC Verification workspace — the mock's status pills had
 * no way to transition them; a real system needs that, so this is a small,
 * reasonable additive extension to an existing feature (no new table).
 */
class DocumentService extends BaseService
{
    private const DISK = 'local';

    /**
     * The mock RM KYC provider's document types (PAN Card / Aadhaar Card /
     * Income Proof / Bank Statement / Photograph — the last has no real
     * `DocumentType` equivalent) mapped onto the real enum's closest cases.
     *
     * @var array<int, string>
     */
    private const KYC_DOCUMENT_TYPES = [
        'pan_card',
        'pan',
        'aadhaar_front',
        'aadhaar_back',
        'aadhaar',
        'income_proof',
        'bank_statement',
    ];

    public function __construct(
        private readonly NotificationService $notifications,
        private readonly LeadService $leads,
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginateForLead(LoanLead $lead, array $filters = [], int $perPage = 25): LengthAwarePaginator
    {
        return Document::query()
            ->with('uploader:id,name,email,role')
            ->where('loan_lead_id', $lead->id)
            ->when(! empty($filters['document_type']), fn ($q) => $q->where('document_type', $filters['document_type']))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function upload(User $actor, LoanLead $lead, UploadedFile $file, string $documentType, ?string $remarks = null): Document
    {
        $path = $file->store('lead-documents/'.$lead->id, self::DISK);

        if ($path === false) {
            throw new DomainException('The document could not be stored.', 500);
        }

        $document = Document::query()->create([
            'loan_lead_id' => $lead->id,
            'uploaded_by' => $actor->id,
            'document_type' => $documentType,
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size_bytes' => $file->getSize() ?: 0,
            'status' => 'pending',
            'remarks' => $remarks,
        ]);

        $this->notifications->notifyMany(
            [
                $lead->assigned_employee_id,
                $lead->assigned_relationship_manager_id,
                $lead->assigned_manager_id,
            ],
            'document.uploaded',
            'Document uploaded',
            sprintf('%s uploaded a document for lead %s.', $actor->name, $lead->reference),
            ['lead_id' => $lead->id, 'document_id' => $document->id],
        );

        return $document;
    }

    public function stream(Document $document): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        if (! Storage::disk(self::DISK)->exists($document->path)) {
            throw new DomainException('The stored file is missing.', 404);
        }

        return Storage::disk(self::DISK)->download($document->path, $document->original_name);
    }

    public function delete(Document $document): bool
    {
        Storage::disk(self::DISK)->delete($document->path);

        return (bool) $document->delete();
    }

    public function verify(User $actor, Document $document): Document
    {
        $document->update(['status' => 'verified']);

        $this->notifyUploader($actor, $document, 'document.verified', 'Document verified', 'verified');

        return $document->refresh();
    }

    public function reject(User $actor, Document $document, string $reason): Document
    {
        $document->update([
            'status' => 'rejected',
            'remarks' => $reason,
        ]);

        $this->notifyUploader($actor, $document, 'document.rejected', 'Document rejected', 'rejected: '.$reason);

        return $document->refresh();
    }

    /**
     * The KYC review queue for an RM: documents on leads visible to them
     * (reusing {@see LeadService::visibleLeadIds()}, the same hierarchy
     * scoping already established for Leads/Tasks), narrowed to
     * KYC-relevant document types.
     */
    public function kycQueueForRm(User $rm, ?string $status = null): Collection
    {
        $leadIds = $this->leads->visibleLeadIds($rm);

        return Document::query()
            ->with(['uploader:id,name,email,role', 'loanLead:id,reference,applicant_name'])
            ->whereIn('loan_lead_id', $leadIds ?: [0])
            ->whereIn('document_type', self::KYC_DOCUMENT_TYPES)
            ->when($status !== null, fn ($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->get();
    }

    private function notifyUploader(User $actor, Document $document, string $event, string $title, string $verb): void
    {
        if ($document->uploaded_by === null) {
            return;
        }

        $type = DocumentType::tryFrom((string) $document->document_type);

        $this->notifications->notify(
            $document->uploaded_by,
            $event,
            $title,
            sprintf('%s %s your "%s" document.', $actor->name, $verb, $type?->label() ?? $document->document_type),
            ['document_id' => $document->id, 'lead_id' => $document->loan_lead_id],
        );
    }
}
