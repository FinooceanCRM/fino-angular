<?php

namespace App\Services;

use App\Enums\Department;
use App\Enums\InquirySource;
use App\Enums\InquiryStatus;
use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Customer;
use App\Models\InquiryActivity;
use App\Models\InquiryRoutingRule;
use App\Models\LeadAssignment;
use App\Models\LeadStatusHistory;
use App\Models\LoanLead;
use App\Models\User;
use App\Support\CustomerFacingStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * The centralised "Customer Inquiries" queue — website and customer-portal
 * leads. Only Telecallers and Super Admins may touch it (enforced at the
 * route by `role:` AND again here, so a mis-wired route can't leak it).
 *
 * Ownership rule: the first Telecaller to act on an inquiry claims it
 * (`assigned_telecaller_id`); another Telecaller then gets a 409 instead of
 * silently double-processing. Super Admin may act on any inquiry.
 *
 * This service never widens LeadService / LoanLeadPolicy: Manager assignment
 * here is its own validated, row-locked path.
 */
class InquiryQueueService extends BaseService
{
    private const SORTABLE = ['created_at', 'loan_amount', 'next_follow_up_at', 'last_contacted_at', 'applicant_name'];

    public function __construct(
        private readonly NotificationService $notifications,
        private readonly AuditLogService $auditLog,
    ) {
    }

    public function assertStaff(User $actor): void
    {
        if (! in_array($actor->roleEnum(), [UserRole::Telecaller, UserRole::SuperAdmin], true)) {
            throw new DomainException('You are not authorised to access customer inquiries.', 403);
        }
    }

    private function base(): Builder
    {
        return LoanLead::query()
            ->whereIn('source', InquirySource::inquiryValues())
            ->with(['assignedTelecaller:id,name', 'assignedManager:id,name']);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(User $actor, array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $this->assertStaff($actor);

        $q = $this->base();

        if (! empty($filters['loan_type'])) {
            $q->where('loan_type', $filters['loan_type']);
        }
        if (! empty($filters['inquiry_status'])) {
            $q->where('inquiry_status', $filters['inquiry_status']);
        }
        if (! empty($filters['source'])) {
            $q->where('source', $filters['source']);
        }
        if (! empty($filters['offer_id'])) {
            $q->where('offer_id', (int) $filters['offer_id']);
        }
        if (! empty($filters['date_from'])) {
            $q->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $q->whereDate('created_at', '<=', $filters['date_to']);
        }
        if (($filters['assignment'] ?? null) === 'unassigned') {
            $q->whereNull('assigned_manager_id');
        } elseif (($filters['assignment'] ?? null) === 'assigned') {
            $q->whereNotNull('assigned_manager_id');
        }
        if (! empty($filters['mine'])) {
            $q->where('assigned_telecaller_id', $actor->id);
        }
        if (! empty($filters['follow_up_due'])) {
            $q->whereNotNull('next_follow_up_at')->where('next_follow_up_at', '<=', now());
        }
        if (! empty($filters['search'])) {
            $term = '%'.addcslashes((string) $filters['search'], '%_\\').'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('applicant_name', 'like', $term)
                    ->orWhere('applicant_phone', 'like', $term)
                    ->orWhere('applicant_email', 'like', $term)
                    ->orWhere('reference', 'like', $term);
            });
        }

        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'created_at';
        $dir = ($filters['dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $q->orderBy($sort, $dir)->orderByDesc('id')->paginate($perPage);
    }

    /** @return array<string, mixed> */
    public function stats(User $actor): array
    {
        $this->assertStaff($actor);

        $byStatus = $this->base()->selectRaw('inquiry_status, count(*) as total')
            ->groupBy('inquiry_status')->pluck('total', 'inquiry_status');

        return [
            'total' => (int) $byStatus->sum(),
            'by_status' => collect(InquiryStatus::cases())->mapWithKeys(
                fn (InquiryStatus $s): array => [$s->value => (int) ($byStatus[$s->value] ?? 0)],
            )->all(),
            'unassigned' => $this->base()->whereNull('assigned_manager_id')->count(),
            'follow_ups_due' => $this->base()->whereNotNull('next_follow_up_at')->where('next_follow_up_at', '<=', now())->count(),
            'mine' => $this->base()->where('assigned_telecaller_id', $actor->id)->count(),
        ];
    }

    public function find(User $actor, int $id): LoanLead
    {
        $this->assertStaff($actor);

        return $this->base()->with('customer:id,user_id,name')->findOrFail($id);
    }

    /**
     * Everything the detail view needs besides the lead itself.
     *
     * @return array<string, mixed>
     */
    public function context(LoanLead $lead): array
    {
        $assignments = LeadAssignment::query()
            ->with(['assignee:id,name,role', 'assigner:id,name,role'])
            ->where('loan_lead_id', $lead->id)
            ->orderByDesc('id')
            ->get();

        $duplicates = LoanLead::query()
            ->where('id', '!=', $lead->id)
            ->where('applicant_phone', $lead->applicant_phone)
            ->latest('id')
            ->limit(10)
            ->get(['id', 'reference', 'loan_type', 'status', 'source', 'created_at']);

        return [
            'activities' => InquiryActivity::query()->with('user:id,name,role')
                ->where('loan_lead_id', $lead->id)->orderByDesc('id')->get(),
            'assignments' => $assignments,
            'duplicates' => $duplicates,
            'status_history' => LeadStatusHistory::query()->where('loan_lead_id', $lead->id)->orderByDesc('id')->get(),
        ];
    }

    /** Claim (or confirm ownership of) an inquiry. Safe to call repeatedly. */
    public function claim(User $actor, int $id): LoanLead
    {
        $this->assertStaff($actor);

        return $this->transaction(function () use ($actor, $id): LoanLead {
            $lead = $this->lockedForWork($actor, $id);

            return $lead->fresh(['assignedTelecaller:id,name', 'assignedManager:id,name']) ?? $lead;
        });
    }

    public function updateStatus(User $actor, int $id, string $status, ?string $remarks, ?string $nextFollowUpAt): LoanLead
    {
        $this->assertStaff($actor);

        $target = InquiryStatus::tryFrom($status);
        if ($target === null || ! in_array($target, InquiryStatus::settable(), true)) {
            throw new DomainException('That inquiry status cannot be set manually.', 422, ['inquiry_status' => ['Invalid status.']]);
        }
        if ($target === InquiryStatus::FollowUp && blank($nextFollowUpAt)) {
            throw new DomainException('Choose when to follow up.', 422, ['next_follow_up_at' => ['A follow-up date is required.']]);
        }

        return $this->transaction(function () use ($actor, $id, $target, $remarks, $nextFollowUpAt): LoanLead {
            $lead = $this->lockedForWork($actor, $id);
            $this->assertNotClosedOut($lead);

            $from = $lead->inquiry_status;
            $updates = ['inquiry_status' => $target->value, 'updated_by' => $actor->id];
            if (in_array($target, [InquiryStatus::Contacted, InquiryStatus::Interested, InquiryStatus::FollowUp, InquiryStatus::Converted], true)) {
                $updates['last_contacted_at'] = now();
            }
            if ($target === InquiryStatus::FollowUp) {
                $updates['next_follow_up_at'] = $nextFollowUpAt;
            } elseif (in_array($target, [InquiryStatus::NotInterested, InquiryStatus::Interested, InquiryStatus::Converted], true)) {
                $updates['next_follow_up_at'] = null;
            }
            $lead->update($updates);

            $this->log($lead, $actor, 'status', $remarks, ['from' => $from, 'to' => $target->value, 'next_follow_up_at' => $nextFollowUpAt]);

            return $lead->fresh(['assignedTelecaller:id,name', 'assignedManager:id,name']) ?? $lead;
        });
    }

    /** Log a note or a customer contact, optionally scheduling the next follow-up. */
    public function addActivity(User $actor, int $id, string $type, string $body, ?string $nextFollowUpAt): InquiryActivity
    {
        $this->assertStaff($actor);

        if (! in_array($type, ['note', 'contact'], true)) {
            throw new DomainException('Unsupported activity type.', 422);
        }

        return $this->transaction(function () use ($actor, $id, $type, $body, $nextFollowUpAt): InquiryActivity {
            $lead = $this->lockedForWork($actor, $id);

            $updates = [];
            if ($type === 'contact') {
                $updates['last_contacted_at'] = now();
                if ($lead->inquiry_status === InquiryStatus::New->value) {
                    $updates['inquiry_status'] = InquiryStatus::Contacted->value;
                }
            }
            if ($nextFollowUpAt !== null) {
                $updates['next_follow_up_at'] = $nextFollowUpAt;
                if ($lead->inquiry_status !== InquiryStatus::Assigned->value) {
                    $updates['inquiry_status'] = InquiryStatus::FollowUp->value;
                }
            }
            if ($updates !== []) {
                $lead->update($updates + ['updated_by' => $actor->id]);
            }

            return $this->log($lead, $actor, $type, $body, ['next_follow_up_at' => $nextFollowUpAt]);
        });
    }

    /**
     * Managers an actor may route this inquiry to, with workload for ranking.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function assignableManagers(User $actor, LoanLead $lead): Collection
    {
        $this->assertStaff($actor);

        $ruleIds = $this->ruleManagerIds($lead);

        $managers = User::query()
            ->where('role', UserRole::Manager->value)
            ->where('is_active', true)
            ->when($ruleIds !== [] && $actor->roleEnum() === UserRole::Telecaller, fn (Builder $q) => $q->whereIn('id', $ruleIds))
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $load = LoanLead::query()
            ->whereIn('assigned_manager_id', $managers->pluck('id'))
            ->whereNotIn('status', [LeadStatus::Closed->value, LeadStatus::Rejected->value, LeadStatus::Disbursed->value])
            ->selectRaw('assigned_manager_id, count(*) as total')
            ->groupBy('assigned_manager_id')
            ->pluck('total', 'assigned_manager_id');

        return $managers->map(fn (User $m): array => [
            'id' => $m->id,
            'name' => $m->name,
            'email' => $m->email,
            'open_leads' => (int) ($load[$m->id] ?? 0),
            'matches_rule' => in_array($m->id, $ruleIds, true),
        ])->sortBy([['matches_rule', 'desc'], ['open_leads', 'asc']])->values();
    }

    /**
     * Atomic Manager assignment. Row-locks the lead so two actors can't both
     * route it; records previous/new owner, reason and who did it.
     */
    public function assignToManager(User $actor, int $id, int $managerId, ?string $reason): LoanLead
    {
        $this->assertStaff($actor);

        return $this->transaction(function () use ($actor, $id, $managerId, $reason): LoanLead {
            $lead = $this->lockedForWork($actor, $id);
            $isAdmin = $actor->roleEnum() === UserRole::SuperAdmin;

            if ($lead->assigned_manager_id !== null) {
                if (! $isAdmin) {
                    throw new DomainException('This inquiry has already been assigned to a manager.', 409);
                }
                if (blank($reason)) {
                    throw new DomainException('Give a reason for reassigning this inquiry.', 422, ['reason' => ['A reason is required to reassign.']]);
                }
            }

            $manager = User::query()->whereKey($managerId)
                ->where('role', UserRole::Manager->value)->where('is_active', true)->first();
            if ($manager === null) {
                throw new DomainException('Choose an active manager.', 422, ['manager_id' => ['Invalid manager.']]);
            }

            $ruleIds = $this->ruleManagerIds($lead);
            if (! $isAdmin && $ruleIds !== [] && ! in_array($manager->id, $ruleIds, true)) {
                throw new DomainException("This manager is not configured for this loan type's department.", 422, ['manager_id' => ['Manager not configured for this department.']]);
            }

            $previousManager = $lead->assignedManager;
            $previousStatus = $lead->statusEnum();

            $updates = [
                'assigned_manager_id' => $manager->id,
                'inquiry_status' => InquiryStatus::Assigned->value,
                'next_follow_up_at' => null,
                'updated_by' => $actor->id,
            ];
            if ($previousStatus === LeadStatus::New) {
                $updates['status'] = LeadStatus::Assigned->value;
            }
            $lead->update($updates);

            LeadAssignment::query()
                ->where('loan_lead_id', $lead->id)->where('status', 'active')
                ->update(['status' => 'released', 'released_at' => now()]);
            LeadAssignment::query()->create([
                'loan_lead_id' => $lead->id,
                'assigned_to' => $manager->id,
                'assigned_by' => $actor->id,
                'status' => 'active',
                'assigned_at' => now(),
                'remarks' => $reason,
            ]);

            if (isset($updates['status'])) {
                LeadStatusHistory::query()->create([
                    'loan_lead_id' => $lead->id,
                    'from_status' => $previousStatus->value,
                    'to_status' => LeadStatus::Assigned->value,
                    'changed_by' => $actor->id,
                    'remarks' => 'Assigned to '.$manager->name,
                ]);
            }

            $this->log($lead, $actor, 'assignment', $reason, [
                'previous_manager_id' => $previousManager?->id,
                'previous_manager' => $previousManager?->name,
                'manager_id' => $manager->id,
                'manager' => $manager->name,
            ]);

            $this->auditLog->record(
                $actor,
                'Inquiry assigned to '.$manager->name,
                'Lead',
                $lead->reference,
                sprintf('%s assigned inquiry %s to %s%s.', $actor->name, $lead->reference, $manager->name,
                    $previousManager ? ' (was '.$previousManager->name.')' : ''),
                'lead_assignment',
                $lead->id,
            );

            $this->notifications->notify(
                $manager->id,
                'lead.assigned',
                'Lead assigned to you',
                sprintf('Website inquiry %s (%s) was assigned to you by %s.', $lead->reference, $lead->applicant_name, $actor->name),
                ['lead_id' => $lead->id],
            );
            $this->notifyCustomer($lead);

            return $lead->fresh(['assignedTelecaller:id,name', 'assignedManager:id,name']) ?? $lead;
        });
    }

    /** @return Collection<int, InquiryRoutingRule> */
    public function routingRules(User $actor): Collection
    {
        $this->assertStaff($actor);

        return InquiryRoutingRule::query()->with('manager:id,name,email')->orderBy('department')->get();
    }

    /**
     * Replace the managers configured for one department. Super Admin only.
     *
     * @param array<int, int> $managerIds
     */
    public function setRoutingRule(User $actor, string $department, array $managerIds): Collection
    {
        if ($actor->roleEnum() !== UserRole::SuperAdmin) {
            throw new DomainException('Only a Super Admin can change routing rules.', 403);
        }
        if (Department::tryFrom($department) === null) {
            throw new DomainException('Unknown department.', 422, ['department' => ['Unknown department.']]);
        }

        $managerIds = array_values(array_unique(array_map('intval', $managerIds)));
        $valid = User::query()->whereIn('id', $managerIds)->where('role', UserRole::Manager->value)->where('is_active', true)->pluck('id')->all();
        if (count($valid) !== count($managerIds)) {
            throw new DomainException('Every routing target must be an active manager.', 422, ['manager_ids' => ['Invalid manager selected.']]);
        }

        return $this->transaction(function () use ($actor, $department, $managerIds): Collection {
            InquiryRoutingRule::query()->where('department', $department)->whereNotIn('manager_id', $managerIds ?: [0])->delete();
            foreach ($managerIds as $id) {
                InquiryRoutingRule::query()->updateOrCreate(['department' => $department, 'manager_id' => $id], ['is_active' => true]);
            }

            $this->auditLog->record(
                $actor,
                'Inquiry routing updated',
                'InquiryRoutingRule',
                $department,
                sprintf('%s set %d routing manager(s) for %s.', $actor->name, count($managerIds), $department),
                'settings',
            );

            return $this->routingRules($actor);
        });
    }

    /**
     * Lock the lead row and enforce the ownership rule. A Telecaller who
     * isn't the owner gets 409; an unowned inquiry is claimed on first touch.
     */
    private function lockedForWork(User $actor, int $id): LoanLead
    {
        $lead = LoanLead::query()
            ->whereIn('source', InquirySource::inquiryValues())
            ->lockForUpdate()
            ->findOrFail($id);

        if ($actor->roleEnum() === UserRole::Telecaller) {
            if ($lead->assigned_telecaller_id === null) {
                $lead->update(['assigned_telecaller_id' => $actor->id]);
                $this->log($lead, $actor, 'note', 'Claimed this inquiry.', ['claimed' => true]);
            } elseif ($lead->assigned_telecaller_id !== $actor->id) {
                $owner = User::query()->whereKey($lead->assigned_telecaller_id)->value('name');
                throw new DomainException(sprintf('This inquiry is already being handled by %s.', $owner ?? 'another telecaller'), 409);
            }
        }

        return $lead;
    }

    private function assertNotClosedOut(LoanLead $lead): void
    {
        if ($lead->inquiry_status === InquiryStatus::Assigned->value) {
            throw new DomainException('This inquiry has been assigned to a manager and is now processed in the lead workflow.', 409);
        }
    }

    /** @return array<int, int> */
    private function ruleManagerIds(LoanLead $lead): array
    {
        return InquiryRoutingRule::query()
            ->where('department', $lead->department?->value)
            ->where('is_active', true)
            ->pluck('manager_id')
            ->all();
    }

    /** @param array<string, mixed> $meta */
    private function log(LoanLead $lead, User $actor, string $type, ?string $body, array $meta = []): InquiryActivity
    {
        return InquiryActivity::query()->create([
            'loan_lead_id' => $lead->id,
            'user_id' => $actor->id,
            'type' => $type,
            'body' => $body,
            'meta' => $meta,
        ]);
    }

    private function notifyCustomer(LoanLead $lead): void
    {
        if ($lead->customer_id === null) {
            return;
        }
        $userId = Customer::query()->whereKey($lead->customer_id)->value('user_id');
        if ($userId === null) {
            return;
        }
        $view = CustomerFacingStatus::for($lead->statusEnum());
        $this->notifications->notify(
            (int) $userId,
            'customer.status_changed',
            'Application update: '.$view['label'],
            sprintf('%s — %s', $lead->reference, $view['message']),
            ['lead_id' => $lead->id],
        );
    }
}
