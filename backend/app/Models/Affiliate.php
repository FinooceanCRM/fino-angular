<?php

namespace App\Models;

use App\Enums\AffiliateStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Affiliate-specific profile data attached 1:1 to a user with the
 * `affiliate` role. Identity fields live on the User model.
 */
class Affiliate extends Model
{
    use HasFactory;

    protected $table = 'affiliates';

    protected $fillable = [
        'user_id',
        'referral_code',
        'commission_rate',
        'status',
        'email_verified_at',
        'alternate_phone',
        'payout_method',
        'payout_account_name',
        'payout_account_number',
        'payout_ifsc_or_upi',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'status' => AffiliateStatus::class,
            'email_verified_at' => 'datetime',
            'payout_account_number' => 'encrypted',
            'payout_ifsc_or_upi' => 'encrypted',
            'joined_at' => 'datetime',
        ];
    }

    public function statusEnum(): AffiliateStatus
    {
        return $this->status instanceof AffiliateStatus
            ? $this->status
            : AffiliateStatus::from((string) $this->status);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
