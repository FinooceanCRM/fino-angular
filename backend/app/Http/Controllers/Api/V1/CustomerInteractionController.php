<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\CustomerInteractionResource;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Read-only Activity History feed for a customer. */
class CustomerInteractionController extends BaseApiController
{
    public function __construct(private readonly CustomerService $customers) {}

    public function index(Request $request, int $customer): JsonResponse
    {
        $model = $this->customers->findVisible($request->user(), $customer);
        $this->authorize('view', $model);

        $interactions = $model->interactions()->orderBy('created_at')->get();

        return $this->respondSuccess(CustomerInteractionResource::collection($interactions)->resolve($request));
    }
}
