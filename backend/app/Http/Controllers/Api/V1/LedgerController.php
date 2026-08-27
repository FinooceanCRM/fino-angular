<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\LedgerResource;
use App\Models\LedgerEntry;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The accounting ledger (Phase 2) — read-only. Gated by the `role:super_admin`
 * route middleware plus `permission:commissions.view`, mirroring
 * SuperAdminAffiliateController/SuperAdminConnectorController.
 */
class LedgerController extends BaseApiController
{
    public function __construct(private readonly LedgerService $ledger)
    {
    }

    /** GET /api/v1/super-admin/ledger */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', LedgerEntry::class);

        $paginator = $this->ledger->paginate([
            'search' => $request->query('search'),
            'type' => $request->query('type'),
            'from' => $request->query('from'),
            'to' => $request->query('to'),
        ], (int) $request->query('per_page', 15));

        return $this->respondSuccess(
            LedgerResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        );
    }
}
