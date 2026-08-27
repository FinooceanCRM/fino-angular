<?php

namespace App\Models;

use App\Enums\ConnectorPayoutStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConnectorPayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'connector_id',
        'reference',
        'amount',
        'method',
        'status',
        'failure_reason',
        'requested_at',
        'processed_at',
        'processed_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'status' => ConnectorPayoutStatus::class,
            'requested_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function statusEnum(): ConnectorPayoutStatus
    {
        return $this->status instanceof ConnectorPayoutStatus
            ? $this->status
            : ConnectorPayoutStatus::from((string) $this->status);
    }

    /** The connector's user row (connector_id points at users, not connectors). */
    public function connector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'connector_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(ConnectorCommission::class, 'payout_id');
    }
}
