<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Bank\StoreBankCriteriaRequest;
use App\Http\Requests\Bank\UpdateBankCriteriaRequest;
use App\Http\Resources\BankCriteriaResource;
use App\Models\BankCriteria;
use App\Services\BankCriteriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankCriteriaController extends BaseApiController
{
    public function __construct(private readonly BankCriteriaService $banks)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', BankCriteria::class);

        $paginator = $this->banks->paginate([
            'search' => $request->query('search'),
            'loan_type' => $request->query('loan_type'),
            'is_active' => $request->query('is_active'),
        ], (int) $request->query('per_page', 15));

        return $this->respondSuccess(
            BankCriteriaResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        );
    }

    public function show(Request $request, BankCriteria $bank): JsonResponse
    {
        $this->authorize('view', $bank);

        return $this->respondSuccess((new BankCriteriaResource($bank))->resolve($request));
    }

    public function store(StoreBankCriteriaRequest $request): JsonResponse
    {
        $this->authorize('create', BankCriteria::class);

        $created = $this->banks->create($request->validated());

        return $this->respondCreated(
            (new BankCriteriaResource($created))->resolve($request),
            'Bank criteria created.',
        );
    }

    public function update(UpdateBankCriteriaRequest $request, BankCriteria $bank): JsonResponse
    {
        $this->authorize('update', $bank);

        $updated = $this->banks->update($bank, $request->validated());

        return $this->respondSuccess(
            (new BankCriteriaResource($updated))->resolve($request),
            'Bank criteria updated.',
        );
    }

    public function destroy(Request $request, BankCriteria $bank): JsonResponse
    {
        $this->authorize('delete', $bank);

        $this->banks->delete($bank);

        return $this->respondSuccess(null, 'Bank criteria deleted.');
    }
}
