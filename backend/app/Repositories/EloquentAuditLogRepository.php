<?php

namespace App\Repositories;

use App\Models\AuditLog;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class EloquentAuditLogRepository implements AuditLogRepositoryInterface
{
    /**
     * @param array<string, mixed> $attributes
     */
    public function create(array $attributes): AuditLog
    {
        return AuditLog::query()->create($attributes);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = AuditLog::query();

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where(function (Builder $q) use ($search): void {
                $q->where('actor_name', 'like', $search)
                    ->orWhere('entity_label', 'like', $search)
                    ->orWhere('description', 'like', $search);
            });
        }

        if (! empty($filters['entity_type'])) {
            $query->where('entity_type', $filters['entity_type']);
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['from'])) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * @return array<int, string>
     */
    public function distinctEntityTypes(): array
    {
        return AuditLog::query()
            ->select('entity_type')
            ->distinct()
            ->orderBy('entity_type')
            ->pluck('entity_type')
            ->all();
    }

    public function findOrFail(int $id): AuditLog
    {
        return AuditLog::query()->findOrFail($id);
    }
}
