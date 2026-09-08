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
 * Manager      -> leads assigned to them, to their RMs or to those RMs' employees,
 *                 plus every lead they personally submitted ("My Submitted
 *                 Leads" — e.g. via their own personal referral link).
 *                 NOT department-scoped: one Manager runs all three
 *                 departments (PL/HL/ML) at once, split across separate RMs.
 * RM           -> leads assigned to them or to their employees, in their own
 *                 department, plus every lead they personally submitted
 *                 (that part is not department-scoped, same carve-out as
 *                 Telecaller's below).
 * Employee     -> leads assigned to them (cascaded onto their own creations at
 *                 Lead::create time), plus every lead they personally submitted.
 * Connector    -> leads they submitted
 * Banker       -> leads assigned to them, plus leads matched against their own
 *                 bank_criteria, plus every lead they personally submitted.
 * Telecaller   -> employee-generated leads in their own department (the PD call queue),
 *                 every lead explicitly assigned to them by Super
 *                 Admin/Manager/RM for PD calling, plus every lead they
 *                 personally submitted ("My Submitted Leads")
 * Accounts     -> every lead, read-only (reconciling disbursed amounts
 *                 against the ledger/commissions)
 */
class EloquentLoanLeadRepository implements LoanLeadRepositoryInterface
{
    public function __construct(private readonly UserHierarchyService $hierarchy) {}

    public function visibleQuery(User $actor): Builder
    {
        $query = LoanLead::query()->with([
            'creator:id,name,email,role',
            'connector:id,name,email,role',
            'vendor:id,name,email,role',
            'assignedEmployee:id,name,email,role',
            'assignedRelationshipManager:id,name,email,role',
            'assignedManager:id,name,email,role',
            'assignedBanker:id,name,email,role',
            'assignedTelecaller:id,name,email,role',
            'pdCompletedBy:id,name,email,role',
        ]);

        return match ($actor->roleEnum()) {
            // Accounts needs full visibility too — reconciling disbursed
            // amounts against the ledger/commissions means seeing every
            // disbursed lead platform-wide, same as Super Admin. Accounts
            // never gets a write path onto a lead (see LoanLeadPolicy).
            UserRole::SuperAdmin, UserRole::Accounts => $query,
            UserRole::Manager => $query->where(function (Builder $q) use ($actor): void {
                $rmIds = $this->hierarchy->relationshipManagerIds($actor);
                $employeeIds = User::query()
                    ->whereIn('relationship_manager_id', $rmIds ?: [0])
                    ->pluck('id')->all();

                $q->where('assigned_manager_id', $actor->id)
                    ->orWhereIn('assigned_relationship_manager_id', $rmIds ?: [0])
                    ->orWhereIn('assigned_employee_id', $employeeIds ?: [0])
                    ->orWhere('created_by', $actor->id);
            }),
            UserRole::RelationshipManager => $query->where(function (Builder $q) use ($actor): void {
                $employeeIds = User::query()
                    ->where('relationship_manager_id', $actor->id)
                    ->pluck('id')->all();

                $q->where(function (Builder $assigned) use ($actor, $employeeIds): void {
                    $assigned->where('assigned_relationship_manager_id', $actor->id)
                        ->orWhereIn('assigned_employee_id', $employeeIds ?: [0]);
                })->where('department', $actor->department?->value);

                $q->orWhere('created_by', $actor->id);
            }),
            UserRole::Employee => $query->where(function (Builder $q) use ($actor): void {
                $q->where('assigned_employee_id', $actor->id)
                    ->orWhere('created_by', $actor->id);
            }),
            UserRole::Connector => $query->where(function (Builder $q) use ($actor): void {
                $q->where('connector_id', $actor->id)->orWhere('created_by', $actor->id);
            }),
            // An affiliate sees leads submitted through their own referral
            // link — never a creator themselves (public referral submissions
            // always have created_by = null), so unlike Connector this is a
            // single condition.
            UserRole::Affiliate => $query->where('affiliate_id', $actor->id),
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
            // A telecaller sees three populations: her PD call queue
            // (employee-submitted leads in her own department), every lead
            // explicitly routed to her via `assigned_telecaller_id` (Super
            // Admin/Manager/RM assigning a specific lead to a specific
            // telecaller — she isn't hierarchy-cascaded onto automatically,
            // so this is the only way a lead outside her department/creator
            // scope ever reaches her), plus every lead she personally
            // submitted, regardless of department.
            UserRole::Telecaller => $query->where(function (Builder $q) use ($actor): void {
                $q->where(function (Builder $pd) use ($actor): void {
                    $pd->where('department', $actor->department?->value)
                        ->whereHas('creator', function (Builder $cq): void {
                            $cq->where('role', UserRole::Employee->value);
                        });
                })
                    ->orWhere('assigned_telecaller_id', $actor->id)
                    ->orWhere('created_by', $actor->id);
            }),
            // A vendor only ever sees loan requests they submitted
            // themselves — matched on `vendor_id` (stamped by
            // LeadService::create) or `created_by`, mirroring Connector.
            UserRole::Vendor => $query->where(function (Builder $q) use ($actor): void {
                $q->where('vendor_id', $actor->id)->orWhere('created_by', $actor->id);
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

        if (! empty($filters['assigned_telecaller_id'])) {
            $query->where('assigned_telecaller_id', (int) $filters['assigned_telecaller_id']);
        }

        if (! empty($filters['connector_id'])) {
            $query->where('connector_id', (int) $filters['connector_id']);
        }

        if (! empty($filters['created_by'])) {
            $query->where('created_by', (int) $filters['created_by']);
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
     * @param  array<string, mixed>  $filters
     * @return array<string, int>
     */
    public function statusCounts(User $actor, array $filters = []): array
    {
        $query = $this->visibleQuery($actor);

        if (! empty($filters['created_by'])) {
            $query->where('created_by', (int) $filters['created_by']);
        }

        /** @var array<string, int> $counts */
        $counts = $query
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
     * *origin*, fixed once at request time: a lead a Manager assigned directly
     * starts in Assigned Leads and moves into Priority Leads after the
     * banker's "Request Full Details" is approved. Matched leads remain in
     * Assigned Leads after an approved "Send Request".
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
                ->whereHas('accessRequests', function (Builder $rq) use ($actor): void {
                    $rq->where('banker_id', $actor->id)
                        ->where('status', AccessRequestStatus::Approved->value)
                        ->where('origin', AccessRequestOrigin::Priority->value);
                }),
            'assigned' => $query
                ->where('assigned_banker_id', $actor->id)
                ->whereDoesntHave('accessRequests', function (Builder $rq) use ($actor): void {
                    $rq->where('banker_id', $actor->id)
                        ->where('status', AccessRequestStatus::Approved->value)
                        ->where('origin', AccessRequestOrigin::Priority->value);
                }),
            'submitted' => $query->where('created_by', $actor->id),
            default => null,
        };
    }
}
