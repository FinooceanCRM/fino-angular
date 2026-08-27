<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\DocumentType;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\CustomerDocument\UploadCustomerDocumentRequest;
use App\Http\Resources\CustomerDocumentResource;
use App\Models\CustomerDocument;
use App\Services\CustomerDocumentService;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerDocumentController extends BaseApiController
{
    public function __construct(
        private readonly CustomerDocumentService $documents,
        private readonly CustomerService $customers,
    ) {}

    public function index(Request $request, int $customer): JsonResponse
    {
        $model = $this->customers->findVisible($request->user(), $customer);
        $this->authorize('viewAny', [CustomerDocument::class, $model]);

        $paginator = $this->documents->paginateForCustomer($model, [
            'document_type' => $request->query('document_type'),
        ], (int) $request->query('per_page', 25));

        return $this->respondSuccess(
            CustomerDocumentResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'document_types' => DocumentType::catalogue(),
            ],
        );
    }

    public function store(UploadCustomerDocumentRequest $request, int $customer): JsonResponse
    {
        $model = $this->customers->findVisible($request->user(), $customer);
        $this->authorize('create', [CustomerDocument::class, $model]);

        $document = $this->documents->upload(
            $request->user(),
            $model,
            $request->file('file'),
            $request->validated()['document_type'],
            $request->validated()['remarks'] ?? null,
        );

        return $this->respondCreated(
            (new CustomerDocumentResource($document))->resolve($request),
            'Document uploaded.',
        );
    }

    public function download(Request $request, CustomerDocument $document): StreamedResponse
    {
        $this->customers->findVisible($request->user(), (int) $document->customer_id);
        $this->authorize('view', $document);

        return $this->documents->stream($document);
    }

    public function verify(Request $request, CustomerDocument $document): JsonResponse
    {
        $this->customers->findVisible($request->user(), (int) $document->customer_id);
        $this->authorize('update', $document);

        $updated = $this->documents->verify($request->user(), $document);

        return $this->respondSuccess((new CustomerDocumentResource($updated))->resolve($request), 'Document verified.');
    }

    public function reject(Request $request, CustomerDocument $document): JsonResponse
    {
        $this->customers->findVisible($request->user(), (int) $document->customer_id);
        $this->authorize('update', $document);

        $updated = $this->documents->reject($request->user(), $document, $request->input('reason'));

        return $this->respondSuccess((new CustomerDocumentResource($updated))->resolve($request), 'Document rejected.');
    }
}
