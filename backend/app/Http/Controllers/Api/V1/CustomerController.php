<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerService;
use App\Services\LeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer Management API (Phase 3). Every read is hierarchy-scoped via
 * {@see CustomerService}, the same shape as {@see LeadController}.
 */
class CustomerController extends BaseApiController
{
    public function __construct(
        private readonly CustomerService $customers,
        private readonly LeadService $leads,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Customer::class);
        $actor = $request->user();

        $paginator = $this->customers->paginate($actor, [
            'search' => $request->query('search'),
            'status' => $request->query('status'),
            'segment' => $request->query('segment'),
        ], (int) $request->query('per_page', 15));

        $paginator->getCollection()->loadMissing(['leads:id,reference,applicant_name']);

        return $this->respondSuccess(
            CustomerResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        );
    }

    public function show(Request $request, int $customer): JsonResponse
    {
        $model = $this->customers->findVisible($request->user(), $customer);
        $this->authorize('view', $model);

        $model->load(['creator:id,name,email,role', 'leads:id,reference,applicant_name']);

        return $this->respondSuccess((new CustomerResource($model))->resolve($request));
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $customer = $this->customers->create($request->user(), $request->validated());
        $customer->load('creator:id,name,email,role');

        return $this->respondCreated(
            (new CustomerResource($customer))->resolve($request),
            'Customer created.',
        );
    }

    public function update(UpdateCustomerRequest $request, int $customer): JsonResponse
    {
        $model = $this->customers->findVisible($request->user(), $customer);
        $this->authorize('update', $model);

        $updated = $this->customers->update($request->user(), $model, $request->validated());
        $updated->load(['creator:id,name,email,role', 'leads:id,reference,applicant_name']);

        return $this->respondSuccess(
            (new CustomerResource($updated))->resolve($request),
            'Customer updated.',
        );
    }

    public function destroy(Request $request, int $customer): JsonResponse
    {
        $model = $this->customers->findVisible($request->user(), $customer);
        $this->authorize('delete', $model);

        $this->customers->delete($model);

        return $this->respondSuccess(null, 'Customer deleted.');
    }

    public function linkLead(Request $request, int $customer): JsonResponse
    {
        $model = $this->customers->findVisible($request->user(), $customer);
        $this->authorize('update', $model);

        $validated = $request->validate(['lead_id' => ['required', 'integer']]);

        // Only link leads the actor can actually see — findVisible() throws
        // a 404 DomainException otherwise, same guard used everywhere else.
        $this->leads->findVisible($request->user(), (int) $validated['lead_id']);

        $this->customers->linkLead($request->user(), $model, (int) $validated['lead_id']);
        $model->load('leads:id,reference,applicant_name');

        return $this->respondSuccess((new CustomerResource($model))->resolve($request), 'Lead linked.');
    }

    public function unlinkLead(Request $request, int $customer): JsonResponse
    {
        $model = $this->customers->findVisible($request->user(), $customer);
        $this->authorize('update', $model);

        $validated = $request->validate(['lead_id' => ['required', 'integer']]);

        $this->customers->unlinkLead($request->user(), $model, (int) $validated['lead_id']);
        $model->load('leads:id,reference,applicant_name');

        return $this->respondSuccess((new CustomerResource($model))->resolve($request), 'Lead unlinked.');
    }
}
