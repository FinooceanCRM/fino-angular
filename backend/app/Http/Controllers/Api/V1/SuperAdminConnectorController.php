<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\SuperAdmin\RejectConnectorPayoutRequest;
use App\Http\Requests\SuperAdmin\UpdateConnectorAdminRequest;
use App\Http\Resources\ConnectorPayoutResource;
use App\Http\Resources\ConnectorProfileResource;
use App\Models\ConnectorPayout;
use App\Services\ConnectorPayoutService;
use App\Services\ConnectorService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Super Admin connector management + payout decisions. Gated by the
 * `role:super_admin` route middleware (see SuperAdminController); the
 * payout actions additionally go through ConnectorPayoutPolicy::decide()
 * for defense in depth, matching SuperAdminAffiliateController's pattern.
 *
 * `{connector}` route params are the connector's USER id throughout — same
 * identifier loan_leads.connector_id/connector_commissions.connector_id
 * already use, not connectors.id.
 */
class SuperAdminConnectorController extends BaseApiController
{
    public function __construct(
        private readonly ConnectorService $connectors,
        private readonly ConnectorPayoutService $payouts,
    ) {
    }

    /** GET /api/v1/super-admin/connectors */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->connectors->listForAdmin($request->query());

        return $this->respondSuccess(
            ConnectorProfileResource::collection($paginator->items())->resolve($request),
            null,
            $this->paginationMeta($paginator),
        );
    }

    /** GET /api/v1/super-admin/connectors/{connector} */
    public function show(Request $request, int $connector): JsonResponse
    {
        $model = $this->connectors->findForAdmin($connector);

        return $this->respondSuccess((new ConnectorProfileResource($model))->resolve($request));
    }

    /** PUT /api/v1/super-admin/connectors/{connector} */
    public function update(UpdateConnectorAdminRequest $request, int $connector): JsonResponse
    {
        $model = $this->connectors->findForAdmin($connector);
        $updated = $this->connectors->updateByAdmin($model, $request->validated());

        return $this->respondSuccess((new ConnectorProfileResource($updated))->resolve($request), 'Connector updated.');
    }

    /** GET /api/v1/super-admin/connectors/payouts */
    public function payouts(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ConnectorPayout::class);

        $paginator = $this->payouts->listForAdmin($request->query());

        return $this->respondSuccess(
            ConnectorPayoutResource::collection($paginator->items())->resolve($request),
            null,
            $this->paginationMeta($paginator),
        );
    }

    /** POST /api/v1/super-admin/connectors/payouts/{payout}/approve */
    public function approvePayout(Request $request, int $payout): JsonResponse
    {
        $model = ConnectorPayout::query()->findOrFail($payout);
        $this->authorize('decide', $model);

        $updated = $this->payouts->approve($model, $request->user());

        return $this->respondSuccess((new ConnectorPayoutResource($updated))->resolve($request), 'Payout approved.');
    }

    /** POST /api/v1/super-admin/connectors/payouts/{payout}/mark-paid */
    public function markPayoutPaid(Request $request, int $payout): JsonResponse
    {
        $model = ConnectorPayout::query()->findOrFail($payout);
        $this->authorize('decide', $model);

        $updated = $this->payouts->markPaid($model);

        return $this->respondSuccess((new ConnectorPayoutResource($updated))->resolve($request), 'Payout marked as paid.');
    }

    /** POST /api/v1/super-admin/connectors/payouts/{payout}/reject */
    public function rejectPayout(RejectConnectorPayoutRequest $request, int $payout): JsonResponse
    {
        $model = ConnectorPayout::query()->findOrFail($payout);
        $this->authorize('decide', $model);

        $updated = $this->payouts->reject($model, $request->user(), $request->validated()['reason']);

        return $this->respondSuccess((new ConnectorPayoutResource($updated))->resolve($request), 'Payout rejected.');
    }

    /**
     * @return array<string, int>
     */
    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ];
    }
}
