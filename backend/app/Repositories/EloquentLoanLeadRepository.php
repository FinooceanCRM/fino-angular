<?php

namespace App\Repositories;

use App\Enums\AccessRequestOrigin;
use App\Enums\AccessRequestStatus;
use App\Enums\UserRole;
use App\Models\LoanLead;
use App\Models\User;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;
use App\Services\LeadMatchingService;
use App\Services\UserHierarchyService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Lead reads are always scoped to the actor's position in the hierarchy,
 * and — for Relationship Manager and Telecaller — further scoped to the
 * actor's own department (department isolation).
 *
 * Super Admin  -> every lead
 * Manager      -> leads assigned to them, to their RMs or to those RMs' employees.
 *                 NOT department-scoped: one Manager runs all three
 *                 departments (PL/HL/ML) at once, split across separate RMs.
 * RM           -> leads assigned to them or to their employees, in their own department
 * Employee     -> leads assigned to them (cascaded onto their own creations at Lead::create time)
 * Connector    -> leads they submitted
 * Banker       -> leads assigned to them, plus leads matched against their own bank_criteria
 * Telecaller   -> employee-generated leads in their own department (the PD call queue)
 */
class EloquentLoanLeadRepository implements LoanLeadRepositoryInterface
{
    public function __construct(private readonly UserHierarchyService $hierarchy) {}

    public function visibleQuery(User $actor): Builder
    {
        $query = LoanLead::query()->with([
            'creator:id,name,email,role',
            'connector:id,name,email,role',
            'assignedEmployee:id,name,email,role',
            'assignedRelationshipManager:id,name,email,role',
            'assignedManager:id,name,email,role',
            'assignedBanker:id,name,email,role',
            'pdCompletedBy:id,name,email,role',
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
            })->where('department', $actor->department?->value),
            UserRole::Employee => $query->where('assigned_employee_id', $actor->id),
            UserRole::Connector => $query->where(function (Builder $q) use ($actor): void {
                $q->where('connector_id', $actor->id)->orWhere('created_by', $actor->id);
            }),
            // A banker sees leads assigned to them, every lead currently
            // matched against one of their own bank_criteria rows (so they
            // can find something to request access to), and every lead they
            // submitted themselves ("My Submitted Leads"). Bankers are not
            // department-scoped, same as they're not department-assigned.
            UserRole::Banker => $query->where(function (Builder $q) use ($actor): void {
                $q->where('assigned_banker_id', $actor->id)
                    ->orWhere('created_by', $actor->id)
                    ->orWhereHas('matches.bankCriteria', function (Builder $bq) use ($actor): void {
                        $bq->where('banker_id', $actor->id);
                    });
            }),
            // A telecaller's PD call queue: employee-submitted leads in
            // their own department. Assignment cascades don't reach
            // Telecaller (it sits outside the hierarchy), so this is scoped
            // by department + creator role rather than an assigned_* column.
            UserRole::Telecaller => $query->where('department', $actor->department?->value)
                ->whereHas('creator', function (Builder $q): void {
                    $q->where('role', UserRole::Employee->value);
                }),
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginateVisible(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->visibleQuery($actor);

        if ($actor->roleEnum() === UserRole::Banker && ! empty($filters['banker_bucket'])) {
            $this->applyBankerBucket($query, $actor, (string) $filters['banker_bucket']);
        }

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

        if (! empty($filters['status'])) {
            $statuses = is_array($filters['status'])
                ? $filters['status']
                : explode(',', (string) $filters['status']);

            if (count($statuses) > 1) {
                $query->whereIn('status', $statuses);
            } else {
                $query->where('status', $statuses[0]);
            }
        }

        foreach (['loan_type', 'city', 'state'] as $column) {
            if (! empty($filters[$column])) {
                $query->where($column, $filters[$column]);
            }
        }

        if (! empty($filters['assigned_employee_id'])) {
            $query->where('assigned_employee_id', (int) $filters['assigned_employee_id']);
        }

        if (! empty($filters['assigned_relationship_manager_id'])) {
            $query->where('assigned_relationship_manager_id', (int) $filters['assigned_relationship_manager_id']);
        }

        if (! empty($filters['assigned_banker_id'])) {
            $query->where('assigned_banker_id', (int) $filters['assigned_banker_id']);
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

        if (! empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }

        if (! empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
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
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): LoanLead
    {
        return LoanLead::query()->create($attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
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

    /**
     * Narrows an already banker-visible query to one of the Banker
     * workspace's four buckets. `assigned_banker_id` is a single column
     * regardless of how a lead got assigned, so "Priority" vs "Assigned" is
     * NOT a function of current approval state (full access can be granted
     * either way — see {@see LeadAccessRequest::grantsFullAccess()}) but of
     * *origin*, fixed once at request time: a lead only ever graduates into
     * Assigned Leads if the banker reached it themselves via an approved
     * "Send Request" from Matched Leads. A lead a Manager assigned directly
     * stays a Priority Lead for good, even after its own "Request Full
     * Details" is approved — see {@see LeadAccessRequest::approvedFromMatched()}.
     */
    private function applyBankerBucket(Builder $query, User $actor, string $bucket): void
    {
        match ($bucket) {
            'matched' => $query
                ->where(function (Builder $q) use ($actor): void {
                    $q->whereNull('assigned_banker_id')->orWhere('assigned_banker_id', '!=', $actor->id);
                })
                ->whereHas('matches', function (Builder $mq) use ($actor): void {
                    $mq->whereHas('bankCriteria', fn (Builder $bq) => $bq->where('banker_id', $actor->id))
                        ->where('match_score', '>=', LeadMatchingService::MATCHED_LEADS_MIN_SCORE);
                }),
            'priority' => $query
                ->where('assigned_banker_id', $actor->id)
                ->whereDoesntHave('accessRequests', function (Builder $rq) use ($actor): void {
                    $rq->where('banker_id', $actor->id)
                        ->where('status', AccessRequestStatus::Approved->value)
                        ->where('origin', AccessRequestOrigin::Matched->value);
                }),
            'assigned' => $query
                ->where('assigned_banker_id', $actor->id)
                ->whereHas('accessRequests', function (Builder $rq) use ($actor): void {
                    $rq->where('banker_id', $actor->id)
                        ->where('status', AccessRequestStatus::Approved->value)
                        ->where('origin', AccessRequestOrigin::Matched->value);
                }),
            'submitted' => $query->where('created_by', $actor->id),
            default => null,
        };
    }
}
