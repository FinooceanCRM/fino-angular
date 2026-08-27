<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Connector\UpdateConnectorProfileRequest;
use App\Http\Resources\ConnectorCommissionResource;
use App\Http\Resources\ConnectorNetworkResource;
use App\Http\Resources\ConnectorPayoutResource;
use App\Http\Resources\ConnectorProfileResource;
use App\Models\Connector;
use App\Models\ConnectorPayout;
use App\Services\ConnectorPayoutService;
use App\Services\ConnectorService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Connector module endpoints. Every action is scoped to the authenticated
 * connector; no hierarchy lookup happens here.
 */
class ConnectorController extends BaseApiController
{
    public function __construct(
        private readonly ConnectorService $connectors,
        private readonly ConnectorPayoutService $payouts,
    ) {
    }

    /** GET /api/v1/connectors/dashboard */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard', Connector::class);

        return $this->respondSuccess($this->connectors->dashboardFor($request->user()));
    }

    /** GET /api/v1/connectors/profile */
    public function profile(Request $request): JsonResponse
    {
        $this->authorize('viewOwnProfile', Connector::class);

        $profile = $this->connectors->profileFor($request->user());

        return $this->respondSuccess((new ConnectorProfileResource($profile))->resolve($request));
    }

    /** PUT /api/v1/connectors/profile */
    public function updateProfile(UpdateConnectorProfileRequest $request): JsonResponse
    {
        $profile = $this->connectors->updateProfile($request->user(), $request->validated());

        return $this->respondSuccess(
            (new ConnectorProfileResource($profile))->resolve($request),
            'Profile updated.',
        );
    }

    /** GET /api/v1/connectors/network — connectors this one directly invited. */
    public function network(Request $request): JsonResponse
    {
        $this->authorize('viewNetwork', Connector::class);

        $paginator = $this->connectors->networkFor($request->user(), $request->query());

        return $this->respondSuccess(
            ConnectorNetworkResource::collection($paginator->items())->resolve($request),
            null,
            $this->paginationMeta($paginator),
        );
    }

    /** GET /api/v1/connectors/commissions */
    public function commissions(Request $request): JsonResponse
    {
        $this->authorize('viewCommissions', Connector::class);

        $paginator = $this->connectors->commissionsFor($request->user(), $request->query());

        return $this->respondSuccess(
            ConnectorCommissionResource::collection($paginator->items())->resolve($request),
            null,
            $this->paginationMeta($paginator),
        );
    }

    /** POST /api/v1/connectors/payouts */
    public function requestPayout(Request $request): JsonResponse
    {
        $this->authorize('requestOwn', ConnectorPayout::class);

        $payout = $this->payouts->requestPayout($request->user());

        return $this->respondCreated(
            (new ConnectorPayoutResource($payout))->resolve($request),
            'Payout requested.',
        );
    }

    /** GET /api/v1/connectors/payouts */
    public function payoutHistory(Request $request): JsonResponse
    {
        $this->authorize('viewOwn', ConnectorPayout::class);

        $paginator = $this->payouts->listForConnector($request->user(), $request->query());

        return $this->respondSuccess(
            ConnectorPayoutResource::collection($paginator->items())->resolve($request),
            null,
            $this->paginationMeta($paginator),
        );
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
