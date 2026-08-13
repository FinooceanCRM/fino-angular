<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Document;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Lead document storage (Phase 9). Files live on the local disk under
 * storage/app/lead-documents and are streamed back through the API.
 */
class DocumentService extends BaseService
{
    private const DISK = 'local';

    public function __construct(private readonly NotificationService $notifications)
    {
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

    public function upload(User $actor, LoanLead $lead, UploadedFile $file, string $documentType): Document
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
}
