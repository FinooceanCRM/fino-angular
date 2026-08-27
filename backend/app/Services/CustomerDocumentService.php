<?php

namespace App\Services;

use App\Enums\DocumentType;
use App\Exceptions\DomainException;
use App\Models\Customer;
use App\Models\CustomerDocument;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Customer document storage (Phase 3). Files live on the local disk under
 * storage/app/customer-documents and are streamed back through the API —
 * the same real-storage mechanism {@see DocumentService} uses for lead
 * documents (the mock only ever recorded a filename/size, never bytes).
 *
 * Also adds verify()/reject() — the mock's status pills had no way to
 * transition them; a real system needs that, so this is a small, reasonable
 * addition beyond the mock spec.
 */
class CustomerDocumentService extends BaseService
{
    private const DISK = 'local';

    public function __construct(private readonly CustomerService $customers)
    {
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginateForCustomer(Customer $customer, array $filters = [], int $perPage = 25): LengthAwarePaginator
    {
        return CustomerDocument::query()
            ->with('uploader:id,name,email,role')
            ->where('customer_id', $customer->id)
            ->when(! empty($filters['document_type']), fn ($q) => $q->where('document_type', $filters['document_type']))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function upload(User $actor, Customer $customer, UploadedFile $file, string $documentType, ?string $remarks = null): CustomerDocument
    {
        $path = $file->store('customer-documents/'.$customer->id, self::DISK);

        if ($path === false) {
            throw new DomainException('The document could not be stored.', 500);
        }

        $document = CustomerDocument::query()->create([
            'customer_id' => $customer->id,
            'uploaded_by' => $actor->id,
            'document_type' => $documentType,
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size_bytes' => $file->getSize() ?: 0,
            'status' => 'pending',
            'remarks' => $remarks,
        ]);

        $type = DocumentType::tryFrom($documentType);
        $this->customers->logInteraction(
            $actor,
            $customer,
            'description',
            'Document uploaded',
            ($type?->label() ?? $documentType).' — '.$document->original_name,
        );

        return $document;
    }

    public function verify(User $actor, CustomerDocument $document): CustomerDocument
    {
        $document->update(['status' => 'verified']);

        $this->customers->logInteraction($actor, $document->customer, 'verified', 'Document verified', $document->original_name);

        return $document->refresh();
    }

    public function reject(User $actor, CustomerDocument $document, ?string $reason = null): CustomerDocument
    {
        $document->update([
            'status' => 'rejected',
            'remarks' => $reason ?? $document->remarks,
        ]);

        $this->customers->logInteraction($actor, $document->customer, 'cancel', 'Document rejected', $reason ?? $document->original_name);

        return $document->refresh();
    }

    public function stream(CustomerDocument $document): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        if (! Storage::disk(self::DISK)->exists($document->path)) {
            throw new DomainException('The stored file is missing.', 404);
        }

        return Storage::disk(self::DISK)->download($document->path, $document->original_name);
    }
}
