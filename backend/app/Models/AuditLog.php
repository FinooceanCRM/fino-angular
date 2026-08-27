<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only audit trail. Rows are written exclusively via
 * {@see \App\Services\AuditLogService::record()} — there is no update or
 * delete path, and actor identity is snapshotted at write time so a row
 * still reads correctly after the actor is renamed or deleted.
 */
class AuditLog extends Model
{
    use HasFactory;

    /** Append-only: no updated_at column. */
    const UPDATED_AT = null;

    protected $table = 'audit_logs';

    protected $fillable = [
        'actor_id',
        'actor_name',
        'actor_role',
        'action',
        'entity_type',
        'entity_id',
        'entity_label',
        'description',
        'category',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'entity_id' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
