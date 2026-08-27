<?php

namespace App\Models;

use App\Enums\ConnectorStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Connector-specific profile data attached 1:1 to a user with the
 * `connector` role. Identity fields live on the User model.
 */
class Connector extends Model
{
    use HasFactory;

    protected $table = 'connectors';

    protected $fillable = [
        'user_id',
        'relationship_manager_id',
        'company_name',
        'contact_person',
        'alternate_phone',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'pincode',
        'pan_number',
        'gst_number',
        'referral_code',
        'referred_by_connector_id',
        'commission_rate',
        'status',
        'otp_code',
        'otp_expires_at',
        'phone_verified_at',
        'joined_at',
        'payout_method',
        'payout_account_name',
        'payout_account_number',
        'payout_ifsc_or_upi',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'status' => ConnectorStatus::class,
            'otp_expires_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'joined_at' => 'datetime',
            'payout_account_number' => 'encrypted',
            'payout_ifsc_or_upi' => 'encrypted',
        ];
    }

    public function statusEnum(): ConnectorStatus
    {
        return $this->status instanceof ConnectorStatus
            ? $this->status
            : ConnectorStatus::from((string) $this->status);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Optional point of contact. Connectors stay outside the hierarchy. */
    public function relationshipManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'relationship_manager_id');
    }

    /** The connector who invited this one, if any — referral network, not the reporting hierarchy. */
    public function referredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by_connector_id');
    }

    /** Connectors this one directly invited. */
    public function referrals(): HasMany
    {
        return $this->hasMany(self::class, 'referred_by_connector_id', 'user_id');
    }
}
