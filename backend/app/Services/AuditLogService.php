<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Writes and reads the append-only audit trail. {@see self::record()} is
 * called directly from other Services alongside their own mutations — there
 * is no public mutating HTTP endpoint for this feature.
 */
class AuditLogService extends BaseService
{
    public function __construct(private readonly AuditLogRepositoryInterface $logs)
    {
    }

    public function record(
        ?User $actor,
        string $action,
        string $entityType,
        string $entityLabel,
        string $description,
        string $category,
        ?int $entityId = null,
    ): AuditLog {
        return $this->logs->create([
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'System',
            'actor_role' => $actor?->roleEnum()->value ?? 'system',
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'entity_label' => $entityLabel,
            'description' => $description,
            'category' => $category,
            'ip_address' => request()?->ip(),
        ]);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->logs->paginate($filters, $perPage);
    }

    /**
     * @return array<int, string>
     */
    public function entityTypes(): array
    {
        return $this->logs->distinctEntityTypes();
    }

    public function find(int $id): AuditLog
    {
        return $this->logs->findOrFail($id);
    }
}
