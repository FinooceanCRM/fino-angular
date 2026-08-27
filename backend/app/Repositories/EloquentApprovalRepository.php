<?php

namespace App\Repositories;

use App\Models\Approval;
use App\Repositories\Contracts\ApprovalRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Approvals are not row-scoped by a reporting hierarchy the way Tasks/Leads
 * are — the mock's Banker/Lead/Document approvals are decided centrally by a
 * Manager-level role (enforced in {@see \App\Policies\ApprovalPolicy}), and
 * every authenticated user may see/create/comment on them, matching the
 * mock's Approval Center being visible to whoever can reach it.
 */
class EloquentApprovalRepository implements ApprovalRepositoryInterface
{
    private function baseQuery(): Builder
    {
        return Approval::query()->with([
            'requester:id,name,email,phone,role',
            'decider:id,name,email,phone,role',
            'lead:id,reference,applicant_name,loan_type,loan_amount,city,assigned_banker_id',
            'lead.assignedBanker:id,name,email,phone,role',
        ]);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->baseQuery();

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderByDesc('requested_at')->paginate($perPage);
    }

    /**
     * @return Collection<int, Approval>
     */
    public function byType(string $type): Collection
    {
        return $this->baseQuery()->where('type', $type)->orderByDesc('requested_at')->get();
    }

    public function pendingCount(string $type): int
    {
        return Approval::query()->where('type', $type)->where('status', 'pending')->count();
    }

    public function find(int $id): ?Approval
    {
        return $this->baseQuery()->whereKey($id)->first();
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): Approval
    {
        return Approval::query()->create($attributes);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Approval $approval, array $attributes): Approval
    {
        $approval->fill($attributes)->save();

        return $approval->refresh();
    }
}
