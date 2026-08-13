<?php

namespace App\Repositories;

use App\Enums\UserRole;
use App\Models\LoanLead;
use App\Models\User;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;
use App\Services\UserHierarchyService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Lead reads are always scoped to the actor's position in the hierarchy.
 *
 * Super Admin  -> every lead
 * Manager      -> leads assigned to them, to their RMs or to those RMs' employees
 * RM           -> leads assigned to them or to their employees
 * Employee     -> leads assigned to them
 * Connector    -> leads they submitted
 */
class EloquentLoanLeadRepository implements LoanLeadRepositoryInterface
{
    public function __construct(private readonly UserHierarchyService $hierarchy)
    {
    }

    public function visibleQuery(User $actor): Builder
    {
        $query = LoanLead::query()->with([
            'creator:id,name,email,role',
            'connector:id,name,email,role',
            'assignedEmployee:id,name,email,role',
            'assignedRelationshipManager:id,name,email,role',
            'assignedManager:id,name,email,role',
        ]);

        return match ($actor->roleEnum()) {
            UserRole::SuperAdmin => $query,
            UserRole::Manager => $query->where(function (Builder $q) use ($actor): void {
                $rmIds = $this->hierarchy->relationshipManagerIds($actor);
                $employeeIds = User::query()
                    ->whereIn('relationship_manager_id', $rmIds ?: [0])
                    ->pluck('id')->all();

                $q->where('assigned_manager_id', $actor->id)
                    ->orWhereIn('assigned_relationship_manager_id', $rmIds ?: [0])
                    ->orWhereIn('assigned_employee_id', $employeeIds ?: [0]);
            }),
            UserRole::RelationshipManager => $query->where(function (Builder $q) use ($actor): void {
                $employeeIds = User::query()
                    ->where('relationship_manager_id', $actor->id)
                    ->pluck('id')->all();

                $q->where('assigned_relationship_manager_id', $actor->id)
                    ->orWhereIn('assigned_employee_id', $employeeIds ?: [0]);
            }),
            UserRole::Employee => $query->where('assigned_employee_id', $actor->id),
            UserRole::Connector => $query->where(function (Builder $q) use ($actor): void {
                $q->where('connector_id', $actor->id)->orWhere('created_by', $actor->id);
            }),
        };
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
                $q->where('applicant_name', 'like', $search)
                    ->orWhere('applicant_email', 'like', $search)
                    ->orWhere('applicant_phone', 'like', $search)
                    ->orWhere('reference', 'like', $search)
                    ->orWhere('city', 'like', $search);
            });
        }

        foreach (['status', 'loan_type', 'city', 'state'] as $column) {
            if (! empty($filters[$column])) {
                $query->where($column, $filters[$column]);
            }
        }

        if (! empty($filters['assigned_employee_id'])) {
            $query->where('assigned_employee_id', (int) $filters['assigned_employee_id']);
        }

        if (! empty($filters['connector_id'])) {
            $query->where('connector_id', (int) $filters['connector_id']);
        }

        if (! empty($filters['min_amount'])) {
            $query->where('loan_amount', '>=', (float) $filters['min_amount']);
        }

        if (! empty($filters['max_amount'])) {
            $query->where('loan_amount', '<=', (float) $filters['max_amount']);
        }

        $sort = in_array($filters['sort'] ?? '', ['created_at', 'loan_amount', 'applicant_name', 'status'], true)
            ? $filters['sort']
            : 'created_at';
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $direction)->paginate($perPage);
    }

    public function findVisible(User $actor, int $id): ?LoanLead
    {
        return $this->visibleQuery($actor)->whereKey($id)->first();
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): LoanLead
    {
        return LoanLead::query()->create($attributes);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(LoanLead $lead, array $attributes): LoanLead
    {
        $lead->fill($attributes)->save();

        return $lead->refresh();
    }

    public function delete(LoanLead $lead): bool
    {
        return (bool) $lead->delete();
    }

    /**
     * @return array<string, int>
     */
    public function statusCounts(User $actor): array
    {
        /** @var array<string, int> $counts */
        $counts = $this->visibleQuery($actor)
            ->select('status')
            ->selectRaw('count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status')
            ->map(static fn ($v): int => (int) $v)
            ->all();

        return $counts;
    }
}
