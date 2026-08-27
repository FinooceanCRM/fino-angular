<?php

namespace App\Repositories;

use App\Models\Customer;
use App\Models\User;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Services\LeadService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Customer visibility (Phase 3): an actor sees customers they created, OR
 * customers linked (via `customer_lead`) to a lead they can already see.
 * Reuses {@see LeadService::visibleLeadIds()} for the lead-visibility half
 * of that rule, so Customers automatically inherits the same hierarchy
 * scoping (own + team's for Manager/RM/Super Admin) that Leads already has —
 * no separate hierarchy logic to keep in sync here.
 */
class EloquentCustomerRepository implements CustomerRepositoryInterface
{
    public function __construct(private readonly LeadService $leads) {}

    public function visibleQuery(User $actor): Builder
    {
        $leadIds = $this->leads->visibleLeadIds($actor);

        return Customer::query()
            ->with('creator:id,name,email,role')
            ->where(function (Builder $q) use ($actor, $leadIds): void {
                $q->where('created_by', $actor->id);

                if ($leadIds !== []) {
                    $q->orWhereHas('leads', function (Builder $lq) use ($leadIds): void {
                        $lq->whereIn('loan_leads.id', $leadIds);
                    });
                }
            });
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginateVisible(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->visibleQuery($actor);

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where(function (Builder $q) use ($search): void {
                $q->where('name', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('phone', 'like', $search);
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['segment'])) {
            $query->where('segment', $filters['segment']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function findVisible(User $actor, int $id): ?Customer
    {
        return $this->visibleQuery($actor)->whereKey($id)->first();
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): Customer
    {
        return Customer::query()->create($attributes);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Customer $customer, array $attributes): Customer
    {
        $customer->fill($attributes)->save();

        return $customer->refresh();
    }

    public function delete(Customer $customer): bool
    {
        return (bool) $customer->delete();
    }
}
