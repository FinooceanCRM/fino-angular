<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\CustomerNote\StoreCustomerNoteRequest;
use App\Http\Resources\CustomerNoteResource;
use App\Models\CustomerNote;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerNoteController extends BaseApiController
{
    public function __construct(private readonly CustomerService $customers) {}

    public function index(Request $request, int $customer): JsonResponse
    {
        $model = $this->customers->findVisible($request->user(), $customer);
        $this->authorize('viewAny', [CustomerNote::class, $model]);

        $notes = $model->notes()->orderByDesc('created_at')->get();

        return $this->respondSuccess(CustomerNoteResource::collection($notes)->resolve($request));
    }

    public function store(StoreCustomerNoteRequest $request, int $customer): JsonResponse
    {
        $model = $this->customers->findVisible($request->user(), $customer);
        $this->authorize('create', [CustomerNote::class, $model]);

        $note = $this->customers->addNote($request->user(), $model, $request->validated()['body']);

        return $this->respondCreated((new CustomerNoteResource($note))->resolve($request), 'Note added.');
    }
}
