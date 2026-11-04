<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Public\CheckEligibilityRequest;
use App\Services\EligibilityService;
use Illuminate\Http\JsonResponse;

/** Unauthenticated, read-only website content + the preliminary eligibility check. */
class PublicCatalogController extends BaseApiController
{
    public function __construct(private readonly EligibilityService $eligibility)
    {
    }

    public function products(): JsonResponse
    {
        return $this->respondSuccess(config('loan_products.products'), null, [
            'disclaimer' => config('loan_products.disclaimer'),
        ]);
    }

    public function product(string $slug): JsonResponse
    {
        $product = collect(config('loan_products.products'))->firstWhere('slug', $slug);

        if ($product === null) {
            return $this->respondError('Loan product not found.', 404);
        }

        return $this->respondSuccess($product, null, ['disclaimer' => config('loan_products.disclaimer')]);
    }

    public function eligibility(CheckEligibilityRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (blank($data['loan_type'] ?? null)) {
            $product = collect(config('loan_products.products'))->firstWhere('slug', $data['product']);
            if ($product === null) {
                return $this->respondError('Loan product not found.', 422, ['product' => ['Unknown loan product.']]);
            }
            $data['loan_type'] = $product['loan_type'];
        }

        return $this->respondSuccess($this->eligibility->check($data));
    }
}
