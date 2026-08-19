<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\DocumentType;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Document\UploadDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Services\DocumentService;
use App\Services\LeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends BaseApiController
{
    public function __construct(
        private readonly DocumentService $documents,
        private readonly LeadService $leads,
    ) {}

    public function index(Request $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('viewDocuments', $model);

        $paginator = $this->documents->paginateForLead($model, [
            'document_type' => $request->query('document_type'),
        ], (int) $request->query('per_page', 25));

        return $this->respondSuccess(
            DocumentResource::collection($paginator->items())->resolve($request),
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

    public function store(UploadDocumentRequest $request, int $lead): JsonResponse
    {
        $model = $this->leads->findVisible($request->user(), $lead);
        $this->authorize('uploadDocument', $model);

        $document = $this->documents->upload(
            $request->user(),
            $model,
            $request->file('file'),
            $request->validated()['document_type'],
            $request->validated()['remarks'] ?? null,
        );

        return $this->respondCreated(
            (new DocumentResource($document))->resolve($request),
            'Document uploaded.',
        );
    }

    public function download(Request $request, Document $document): StreamedResponse
    {
        $this->leads->findVisible($request->user(), (int) $document->loan_lead_id);
        $this->authorize('view', $document);

        return $this->documents->stream($document);
    }

    public function destroy(Request $request, Document $document): JsonResponse
    {
        $this->leads->findVisible($request->user(), (int) $document->loan_lead_id);
        $this->authorize('delete', $document);

        $this->documents->delete($document);

        return $this->respondSuccess(null, 'Document deleted.');
    }
}
