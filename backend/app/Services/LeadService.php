<?php

namespace App\Services;

use App\Enums\LeadStatus;
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
            $attributes['updated_by'] = $actor->id;
            $attributes['status'] = LeadStatus::New->value;

            if ($actor->roleEnum() === UserRole::Connector) {
                $attributes['connector_id'] = $actor->id;
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
        $attributes['updated_by'] = $actor->id;

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
        $this->guardAssignment($actor, $assignee);

        return $this->transaction(function () use ($actor, $lead, $assignee, $remarks): LoanLead {
            $attributes = ['updated_by' => $actor->id];

            switch ($assignee->roleEnum()) {
                case UserRole::RelationshipManager:
                    $attributes['assigned_relationship_manager_id'] = $assignee->id;
                    $attributes['assigned_manager_id'] = $assignee->manager_id;
                    break;
                case UserRole::Employee:
                    $attributes['assigned_employee_id'] = $assignee->id;
                    $attributes['assigned_relationship_manager_id'] = $assignee->relationship_manager_id;
                    $attributes['assigned_manager_id'] = $assignee->manager_id;
                    break;
                case UserRole::Manager:
                    $attributes['assigned_manager_id'] = $assignee->id;
                    break;
                default:
                    throw new DomainException('Leads can only be assigned to managers, relationship managers or employees.', 422);
            }

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
                'updated_by' => $actor->id,
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
        $query = User::query()->where('is_active', true)->select(['id', 'name', 'email', 'role']);

        $query = match ($actor->roleEnum()) {
            UserRole::SuperAdmin => $query->whereIn('role', [
                UserRole::Manager->value,
                UserRole::RelationshipManager->value,
                UserRole::Employee->value,
            ]),
            UserRole::Manager => $query->where(function ($q) use ($actor): void {
                $q->where('manager_id', $actor->id)
                    ->whereIn('role', [UserRole::RelationshipManager->value, UserRole::Employee->value]);
            }),
            UserRole::RelationshipManager => $query
                ->where('relationship_manager_id', $actor->id)
                ->where('role', UserRole::Employee->value),
            default => $query->whereRaw('1 = 0'),
        };

        return $query->orderBy('name')->get()->map(static fn (User $u): array => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role instanceof UserRole ? $u->role->value : (string) $u->role,
        ])->all();
    }

    private function guardAssignment(User $actor, User $assignee): void
    {
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
