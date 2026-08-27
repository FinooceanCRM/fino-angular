<?php

namespace App\Models;

use App\Enums\AffiliatePayoutStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliatePayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'affiliate_id',
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
            'status' => AffiliatePayoutStatus::class,
            'requested_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function statusEnum(): AffiliatePayoutStatus
    {
        return $this->status instanceof AffiliatePayoutStatus
            ? $this->status
            : AffiliatePayoutStatus::from((string) $this->status);
    }

    /** The affiliate's user row (affiliate_id points at users, not affiliates). */
    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'affiliate_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(AffiliateCommission::class, 'payout_id');
    }
}
