<?php

namespace App\Models;

use App\Enums\ConnectorCommissionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConnectorCommission extends Model
{
    use HasFactory;

    protected $fillable = [
        'connector_id',
        'loan_lead_id',
        'source_connector_id',
        'level',
        'commission_rate',
        'commission_amount',
        'status',
        'accrued_at',
        'paid_at',
        'payout_id',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'commission_rate' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'status' => ConnectorCommissionStatus::class,
            'accrued_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function statusEnum(): ConnectorCommissionStatus
    {
        return $this->status instanceof ConnectorCommissionStatus
            ? $this->status
            : ConnectorCommissionStatus::from((string) $this->status);
    }

    /** The connector's user row (connector_id points at users, not connectors). */
    public function connector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'connector_id');
    }

    /** For an override row (level >= 1): the descendant whose earning this override is derived from. */
    public function sourceConnector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'source_connector_id');
    }

    public function loanLead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class);
    }

    public function payout(): BelongsTo
    {
        return $this->belongsTo(ConnectorPayout::class, 'payout_id');
    }
}
