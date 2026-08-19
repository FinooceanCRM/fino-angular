<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\SuperAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Super Admin dashboard. Platform-wide, unscoped — access is gated by the
 * `role:super_admin` route middleware, mirroring ReportController.
 */
class SuperAdminController extends BaseApiController
{
    public function __construct(private readonly SuperAdminService $superAdmin)
    {
    }

    /** GET /api/v1/super-admin/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->superAdmin->dashboardFor($request->user()));
    }
}
