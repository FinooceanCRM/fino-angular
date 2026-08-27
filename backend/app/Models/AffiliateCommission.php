<?php

namespace App\Models;

use App\Enums\AffiliateCommissionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliateCommission extends Model
{
    use HasFactory;

    protected $fillable = [
        'affiliate_id',
        'loan_lead_id',
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
            'commission_rate' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'status' => AffiliateCommissionStatus::class,
            'accrued_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function statusEnum(): AffiliateCommissionStatus
    {
        return $this->status instanceof AffiliateCommissionStatus
            ? $this->status
            : AffiliateCommissionStatus::from((string) $this->status);
    }

    /** The affiliate's user row (affiliate_id points at users, not affiliates). */
    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'affiliate_id');
    }

    public function loanLead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class);
    }

    public function payout(): BelongsTo
    {
        return $this->belongsTo(AffiliatePayout::class, 'payout_id');
    }
}
