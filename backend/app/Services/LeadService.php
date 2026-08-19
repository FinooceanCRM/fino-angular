<?php

namespace App\Services;

use App\Enums\Department;
use App\Enums\LeadStatus;
use App\Enums\LoanType;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\LeadAssignment;
use App\Models\LeadStatusHistory;
use App\Models\LoanLead;
use App\Models\User;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

/**
 * Lead lifecycle: creation, hierarchy-scoped reads, assignment and status
 * transitions (Phase 9). Authorisation lives in LoanLeadPolicy; this service
 * enforces the workflow rules that policies cannot express.
 */
class LeadService extends BaseService
{
    public function __construct(
        private readonly LoanLeadRepositoryInterface $leads,
        private readonly NotificationService $notifications,
        private readonly LeadMatchingService $matching,
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(User $actor, array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->leads->paginateVisible($actor, $filters, $perPage);
    }

    public function findVisible(User $actor, int $id): LoanLead
    {
        $lead = $this->leads->findVisible($actor, $id);

        if ($lead === null) {
            throw new DomainException('Lead not found or not visible to you.', 404);
        }

        return $lead;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(User $actor, array $attributes): LoanLead
    {
        return $this->transaction(function () use ($actor, $attributes): LoanLead {
            $attributes['reference'] = 'LD-'.strtoupper(Str::random(10));
            $attributes['created_by'] = $actor->id;

            $attributes['status'] = LeadStatus::New->value;
            $attributes['department'] = Department::fromLoanType(LoanType::from($attributes['loan_type']))->value;

            if ($actor->roleEnum() === UserRole::Connector) {
                $attributes['connector_id'] = $actor->id;
            } else {
                $attributes = array_merge($attributes, $this->cascadeAssignmentAttributes($actor));
            }

            $lead = $this->leads->create($attributes);

            LeadStatusHistory::query()->create([
                'loan_lead_id' => $lead->id,
                'from_status' => null,
                'to_status' => LeadStatus::New->value,
                'changed_by' => $actor->id,
                'remarks' => 'Lead created.',
            ]);

            $this->notifications->notifyMany(
                [$lead->assigned_relationship_manager_id, $lead->assigned_manager_id],
                'lead.created',
                'New lead submitted',
                sprintf('%s submitted lead %s.', $actor->name, $lead->reference),
                ['lead_id' => $lead->id],
            );

            return $lead;
        });
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(User $actor, LoanLead $lead, array $attributes): LoanLead
    {
        unset($attributes['reference'], $attributes['status'], $attributes['created_by']);

        if (! empty($attributes['loan_type'])) {
            $attributes['department'] = Department::fromLoanType(LoanType::from($attributes['loan_type']))->value;
        }

        return $this->leads->update($lead, $attributes);
    }

    public function delete(LoanLead $lead): bool
    {
        return $this->leads->delete($lead);
    }

    /**
     * Assign a lead down the hierarchy.
     *
     * Super Admin -> anybody. Manager -> their RMs. RM -> their employees.
     */
    public function assign(User $actor, LoanLead $lead, User $assignee, ?string $remarks = null): LoanLead
    {
        $this->guardAssignment($actor, $lead, $assignee);

        return $this->transaction(function () use ($actor, $lead, $assignee, $remarks): LoanLead {
            $attributes = ['updated_by' => $actor->id];

            $cascade = $this->cascadeAssignmentAttributes($assignee);
            if ($cascade === []) {
                throw new DomainException('Leads can only be assigned to managers, relationship managers, employees or bankers.', 422);
            }
            $attributes = array_merge($attributes, $cascade);

            $previousStatus = $lead->statusEnum();
            if ($previousStatus === LeadStatus::New) {
                $attributes['status'] = LeadStatus::Assigned->value;
            }

            $lead = $this->leads->update($lead, $attributes);

            LeadAssignment::query()
                ->where('loan_lead_id', $lead->id)
                ->where('status', 'active')
                ->update(['status' => 'released', 'released_at' => now()]);

            LeadAssignment::query()->create([
                'loan_lead_id' => $lead->id,
                'assigned_to' => $assignee->id,
                'assigned_by' => $actor->id,
                'status' => 'active',
                'assigned_at' => now(),
                'remarks' => $remarks,
            ]);

            if (($attributes['status'] ?? null) !== null) {
                $this->recordStatus($lead, $previousStatus->value, LeadStatus::Assigned->value, $actor->id, 'Assigned to '.$assignee->name);
            }

            $this->notifications->notify(
                $assignee->id,
                'lead.assigned',
                'Lead assigned to you',
                sprintf('Lead %s was assigned to you by %s.', $lead->reference, $actor->name),
                ['lead_id' => $lead->id],
            );

            return $lead;
        });
    }

    public function changeStatus(User $actor, LoanLead $lead, string $status, ?string $remarks = null): LoanLead
    {
        $target = LeadStatus::tryFrom($status);
        if ($target === null) {
            throw new DomainException('Unknown lead status.', 422);
        }

        $current = $lead->statusEnum();
        if ($current->isTerminal()) {
            throw new DomainException('This lead is closed and can no longer change status.', 422);
        }

        if ($current === $target) {
            return $lead;
        }

        return $this->transaction(function () use ($actor, $lead, $current, $target, $remarks): LoanLead {
            $lead = $this->leads->update($lead, [
        'status' => $target->value,
    ]);

            $this->recordStatus($lead, $current->value, $target->value, $actor->id, $remarks);

            $this->notifications->notifyMany(
                [
                    $lead->connector_id,
                    $lead->created_by,
                    $lead->assigned_employee_id,
                    $lead->assigned_relationship_manager_id,
                    $lead->assigned_manager_id,
                ],
                'lead.status_changed',
                'Lead status updated',
                sprintf('Lead %s moved to %s.', $lead->reference, $target->label()),
                ['lead_id' => $lead->id, 'status' => $target->value],
            );

            return $lead;
        });
    }

    /**
     * Telecaller PD (pre-disbursement verification call) workflow, Phase 6.
     *
     * Lead created -> Telecaller opens lead (employee info is already
     * eager-loaded via the `creator` relation on every visibility query) ->
     * PD completed (this) -> Manager review, triggered by the notification
     * below. Deliberately does not touch `status`: only Super Admin,
     * Manager and Relationship Manager may change lead status.
     */
    public function completePd(User $actor, LoanLead $lead, ?string $remarks = null): LoanLead
    {
        if ($lead->pd_completed_at !== null) {
            throw new DomainException('PD has already been completed for this lead.', 422);
        }

        return $this->transaction(function () use ($actor, $lead, $remarks): LoanLead {
            $lead = $this->leads->update($lead, [
                'pd_completed_at' => now(),
                'pd_completed_by' => $actor->id,
                'updated_by' => $actor->id,
            ]);

            $this->notifications->notifyMany(
                [$lead->assigned_relationship_manager_id, $lead->assigned_manager_id],
                'lead.pd_completed',
                'PD completed — ready for review',
                sprintf('%s completed the PD call for lead %s.', $actor->name, $lead->reference).($remarks ? ' '.$remarks : ''),
                ['lead_id' => $lead->id],
            );

            return $lead;
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function runMatching(LoanLead $lead): array
    {
        return $this->matching->matchAndStore($lead);
    }

    /**
     * Users the actor may assign leads to.
     *
     * @return array<int, array<string, mixed>>
     */
    public function assignableUsers(User $actor): array
    {
        $query = User::query()->where('is_active', true)
            ->select(['id', 'name', 'email', 'role', 'relationship_manager_id', 'manager_id']);

        $query = match ($actor->roleEnum()) {
            UserRole::SuperAdmin => $query->where(function ($q): void {
                $q->whereIn('role', [
                    UserRole::Manager->value,
                    UserRole::RelationshipManager->value,
                    UserRole::Employee->value,
                ])->orWhere('role', UserRole::Banker->value);
            }),
            UserRole::Manager, UserRole::RelationshipManager => $query->where(function ($q) use ($actor): void {
                $q->where(function ($sub) use ($actor): void {
                    if ($actor->roleEnum() === UserRole::Manager) {
                        $sub->where('manager_id', $actor->id)
                            ->whereIn('role', [UserRole::RelationshipManager->value, UserRole::Employee->value]);
                    } else {
                        $sub->where('relationship_manager_id', $actor->id)
                            ->where('role', UserRole::Employee->value);
                    }
                })->orWhere('role', UserRole::Banker->value);
            }),
            default => $query->whereRaw('1 = 0'),
        };

        return $query->orderBy('name')->get()->map(static fn (User $u): array => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role instanceof UserRole ? $u->role->value : (string) $u->role,
            'relationship_manager_id' => $u->relationship_manager_id,
            'manager_id' => $u->manager_id,
        ])->all();
    }

    /**
     * The assignment columns implied by a user's position in the hierarchy:
     * assigning to (or creating as) an Employee also fills their RM and
     * Manager, assigning to an RM also fills their Manager. Returns an
     * empty array for roles that don't cascade (Super Admin, Banker,
     * Connector), so callers can decide how to handle that case.
     *
     * @return array<string, int|null>
     */
    private function cascadeAssignmentAttributes(User $user): array
    {
        return match ($user->roleEnum()) {
            UserRole::RelationshipManager => [
                'assigned_relationship_manager_id' => $user->id,
                'assigned_manager_id' => $user->manager_id,
            ],
            UserRole::Employee => [
                'assigned_employee_id' => $user->id,
                'assigned_relationship_manager_id' => $user->relationship_manager_id,
                'assigned_manager_id' => $user->manager_id,
            ],
            UserRole::Manager => [
                'assigned_manager_id' => $user->id,
            ],
            UserRole::Banker => [
                'assigned_banker_id' => $user->id,
            ],
            default => [],
        };
    }

    private function guardAssignment(User $actor, LoanLead $lead, User $assignee): void
    {
        // Bankers sit outside the manager/RM/employee hierarchy (like
        // Connector), so there's no subtree to check — any actor who can
        // already assign leads (Super Admin, Manager, RM; enforced by
        // LoanLeadPolicy::assign) may route a lead to any active banker.
        // Bankers are also not department-scoped, so no department check.
        if ($assignee->roleEnum() === UserRole::Banker) {
            $allowed = in_array($actor->roleEnum(), [
                UserRole::SuperAdmin,
                UserRole::Manager,
                UserRole::RelationshipManager,
            ], true);

            if (! $allowed) {
                throw new DomainException('You cannot assign leads to this user.', 403);
            }

            return;
        }

        $allowed = match ($actor->roleEnum()) {
            UserRole::SuperAdmin => true,
            UserRole::Manager => $assignee->manager_id === $actor->id,
            UserRole::RelationshipManager => $assignee->relationship_manager_id === $actor->id
                && $assignee->roleEnum() === UserRole::Employee,
            default => false,
        };

        if (! $allowed) {
            throw new DomainException('You cannot assign leads to this user.', 403);
        }

        // Department isolation: a Manager runs all three departments at
        // once, but each RM (and every Employee under them) only ever
        // works leads inside their own department. Without this check a
        // Manager could route a lead to an RM whose own (department-scoped)
        // visibility would then never show it to them.
        if ($assignee->department !== null && $assignee->department->value !== $lead->department?->value) {
            throw new DomainException("This lead's department does not match the assignee's department.", 422);
        }
    }

    private function recordStatus(LoanLead $lead, ?string $from, string $to, int $changedBy, ?string $remarks): void
    {
        LeadStatusHistory::query()->create([
            'loan_lead_id' => $lead->id,
            'from_status' => $from,
            'to_status' => $to,
            'changed_by' => $changedBy,
            'remarks' => $remarks,
        ]);
    }
}
