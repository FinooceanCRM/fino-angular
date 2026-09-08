<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Vendor;
use App\Services\VendorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Vendor module endpoints. Every action is scoped to the authenticated
 * vendor; no hierarchy lookup happens here. Same shape as
 * {@see ConnectorController}.
 */
class VendorController extends BaseApiController
{
    public function __construct(private readonly VendorService $vendors) {}

    /** GET /api/v1/vendors/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', Vendor::class);

        return $this->respondSuccess($this->vendors->dashboardFor($request->user()));
    }
}
