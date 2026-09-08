<?php

namespace App\Models;

use App\Enums\VendorStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Vendor-specific profile data attached 1:1 to a user with the `vendor`
 * role. Identity fields live on the User model. Standalone role, outside
 * the reporting hierarchy — same shape as {@see Connector} minus the
 * referral-network / commission plumbing.
 */
class Vendor extends Model
{
    use HasFactory;

    protected $table = 'vendors';

    protected $fillable = [
        'user_id',
        'business_name',
        'contact_person',
        'alternate_phone',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'pincode',
        'pan_number',
        'gst_number',
        'status',
        'otp_code',
        'otp_expires_at',
        'phone_verified_at',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => VendorStatus::class,
            'otp_expires_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'joined_at' => 'datetime',
        ];
    }

    public function statusEnum(): VendorStatus
    {
        return $this->status instanceof VendorStatus
            ? $this->status
            : VendorStatus::from((string) $this->status);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
