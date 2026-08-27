<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Approval;
use App\Models\ApprovalComment;
use App\Models\User;
use App\Repositories\Contracts\ApprovalRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Approval Center (Phase 5, Part A) — Banker / Lead / Document approval
 * requests, replacing the mock `ManagerApprovalDataProvider`'s seed rows for
 * these three types. Creation here is deliberately plain (type/title/
 * subtitle/lead) rather than auto-wired into every upstream business trigger
 * (banker onboarding, a lead status transition, a document needing review)
 * — that wiring is undefined/out of scope for this phase.
 */
class ApprovalService extends BaseService
{
    public function __construct(
        private readonly ApprovalRepositoryInterface $approvals,
        private readonly AuditLogService $auditLog,
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->approvals->paginate($filters, $perPage);
    }

    /**
     * @return Collection<int, Approval>
     */
    public function byType(string $type): Collection
    {
        return $this->approvals->byType($type);
    }

    public function pendingCount(string $type): int
    {
        return $this->approvals->pendingCount($type);
    }

    public function find(int $id): Approval
    {
        $approval = $this->approvals->find($id);

        if ($approval === null) {
            throw new DomainException('Approval request not found.', 404);
        }

        return $approval;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(User $actor, array $payload): Approval
    {
        return $this->transaction(function () use ($actor, $payload): Approval {
            $approval = $this->approvals->create([
                'type' => $payload['type'],
                'title' => $payload['title'],
                'subtitle' => $payload['subtitle'] ?? null,
                'loan_lead_id' => $payload['loan_lead_id'] ?? null,
                'requested_by' => $actor->id,
                'requested_at' => now(),
                'status' => 'pending',
            ]);

            $this->auditLog->record(
                $actor,
                'Requested',
                'Approval',
                $approval->title,
                sprintf('%s requested %s approval for "%s".', $actor->name, $approval->type, $approval->title),
                'other',
                $approval->id,
            );

            return $approval;
        });
    }

    public function approve(User $actor, Approval $approval, ?string $remarks = null): Approval
    {
        $this->guardPending($approval);

        $updated = $this->approvals->update($approval, [
            'status' => 'approved',
            'decided_by' => $actor->id,
            'decided_at' => now(),
            'decision_remarks' => $remarks,
        ]);

        $this->auditLog->record(
            $actor,
            'Approved',
            'Approval',
            $updated->title,
            sprintf('%s approved "%s".', $actor->name, $updated->title),
            'other',
            $updated->id,
        );

        return $updated;
    }

    public function reject(User $actor, Approval $approval, string $reason): Approval
    {
        $this->guardPending($approval);

        $updated = $this->approvals->update($approval, [
            'status' => 'rejected',
            'decided_by' => $actor->id,
            'decided_at' => now(),
            'decision_remarks' => $reason,
        ]);

        $this->auditLog->record(
            $actor,
            'Rejected',
            'Approval',
            $updated->title,
            sprintf('%s rejected "%s": %s', $actor->name, $updated->title, $reason),
            'other',
            $updated->id,
        );

        return $updated;
    }

    public function addComment(User $actor, Approval $approval, string $body): ApprovalComment
    {
        $comment = ApprovalComment::query()->create([
            'approval_id' => $approval->id,
            'author_id' => $actor->id,
            'body' => $body,
            'created_at' => now(),
        ]);

        $comment->setRelation('author', $actor);

        return $comment;
    }

    private function guardPending(Approval $approval): void
    {
        if ($approval->status !== 'pending') {
            throw new DomainException('This approval request has already been decided.', 422);
        }
    }
}
