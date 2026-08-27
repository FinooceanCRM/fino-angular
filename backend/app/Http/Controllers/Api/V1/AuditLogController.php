<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends BaseApiController
{
    public function __construct(private readonly AuditLogService $audit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        $paginator = $this->audit->paginate([
            'search' => $request->query('search'),
            'entity_type' => $request->query('entity_type'),
            'category' => $request->query('category'),
            'from' => $request->query('from'),
            'to' => $request->query('to'),
        ], (int) $request->query('per_page', 15));

        return $this->respondSuccess(
            AuditLogResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'entity_types' => $this->audit->entityTypes(),
            ],
        );
    }

    public function show(Request $request, AuditLog $auditLog): JsonResponse
    {
        $this->authorize('view', $auditLog);

        return $this->respondSuccess((new AuditLogResource($auditLog))->resolve($request));
    }
}
