<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\SuperAdmin\RejectAffiliatePayoutRequest;
use App\Http\Requests\SuperAdmin\UpdateAffiliateAdminRequest;
use App\Http\Resources\AffiliatePayoutResource;
use App\Http\Resources\AffiliateResource;
use App\Models\AffiliatePayout;
use App\Services\AffiliatePayoutService;
use App\Services\AffiliateService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Super Admin affiliate management + payout decisions. Gated by the
 * `role:super_admin` route middleware (see SuperAdminController); the
 * payout actions additionally go through AffiliatePayoutPolicy::decide()
 * for defense in depth, matching LeadAccessRequestController's pattern.
 *
 * `{affiliate}` route params are the affiliate's USER id throughout — same
 * identifier loan_leads.affiliate_id and affiliate_commissions.affiliate_id
 * already use, not affiliates.id.
 */
class SuperAdminAffiliateController extends BaseApiController
{
    public function __construct(
        private readonly AffiliateService $affiliates,
        private readonly AffiliatePayoutService $payouts,
    ) {
    }

    /** GET /api/v1/super-admin/affiliates */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->affiliates->listForAdmin($request->query());

        return $this->respondSuccess(
            AffiliateResource::collection($paginator->items())->resolve($request),
            null,
            $this->paginationMeta($paginator),
        );
    }

    /** GET /api/v1/super-admin/affiliates/{affiliate} */
    public function show(Request $request, int $affiliate): JsonResponse
    {
        $model = $this->affiliates->findForAdmin($affiliate);

        return $this->respondSuccess((new AffiliateResource($model))->resolve($request));
    }

    /** PUT /api/v1/super-admin/affiliates/{affiliate} */
    public function update(UpdateAffiliateAdminRequest $request, int $affiliate): JsonResponse
    {
        $model = $this->affiliates->findForAdmin($affiliate);
        $updated = $this->affiliates->updateByAdmin($model, $request->validated());

        return $this->respondSuccess((new AffiliateResource($updated))->resolve($request), 'Affiliate updated.');
    }

    /** GET /api/v1/super-admin/affiliates/payouts */
    public function payouts(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AffiliatePayout::class);

        $paginator = $this->payouts->listForAdmin($request->query());

        return $this->respondSuccess(
            AffiliatePayoutResource::collection($paginator->items())->resolve($request),
            null,
            $this->paginationMeta($paginator),
        );
    }

    /** POST /api/v1/super-admin/affiliates/payouts/{payout}/approve */
    public function approvePayout(Request $request, int $payout): JsonResponse
    {
        $model = AffiliatePayout::query()->findOrFail($payout);
        $this->authorize('decide', $model);

        $updated = $this->payouts->approve($model, $request->user());

        return $this->respondSuccess((new AffiliatePayoutResource($updated))->resolve($request), 'Payout approved.');
    }

    /** POST /api/v1/super-admin/affiliates/payouts/{payout}/mark-paid */
    public function markPayoutPaid(Request $request, int $payout): JsonResponse
    {
        $model = AffiliatePayout::query()->findOrFail($payout);
        $this->authorize('decide', $model);

        $updated = $this->payouts->markPaid($model);

        return $this->respondSuccess((new AffiliatePayoutResource($updated))->resolve($request), 'Payout marked as paid.');
    }

    /** POST /api/v1/super-admin/affiliates/payouts/{payout}/reject */
    public function rejectPayout(RejectAffiliatePayoutRequest $request, int $payout): JsonResponse
    {
        $model = AffiliatePayout::query()->findOrFail($payout);
        $this->authorize('decide', $model);

        $updated = $this->payouts->reject($model, $request->user(), $request->validated()['reason']);

        return $this->respondSuccess((new AffiliatePayoutResource($updated))->resolve($request), 'Payout rejected.');
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
