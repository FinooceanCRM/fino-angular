<?php

namespace App\Models;

use App\Enums\BankerStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Banker-specific profile data attached 1:1 to a user with the
 * `banker` role. Identity fields (name, email, password, role) live on the
 * User model.
 *
 * A banker is either created directly by a Super Admin (status `active`
 * from the start) or self-registers through the public "Join as Banker"
 * page, in which case the row stays `pending_verification` until the phone
 * OTP is confirmed.
 */
class Banker extends Model
{
    use HasFactory;

    protected $table = 'bankers';

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'bank_name',
        'branch',
        'branch_address',
        'branch_location',
        'bank_city',
        'bank_state',
        'designation',
        'employee_code',
        'alternate_phone',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'pincode',
        'country',
        'pan_number',
        'products',
        'manager_name',
        'manager_email',
        'manager_phone',
        'status',
        'otp_code',
        'otp_expires_at',
        'phone_verified_at',
        'joined_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'products' => 'array',
            'otp_expires_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'joined_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function statusEnum(): BankerStatus
    {
        return $this->status instanceof BankerStatus
            ? $this->status
            : BankerStatus::from((string) ($this->status ?? BankerStatus::Active->value));
    }
}
