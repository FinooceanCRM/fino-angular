<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Banker-specific profile data attached 1:1 to a user with the
 * `banker` role. Identity fields live on the User model.
 */
class Banker extends Model
{
    use HasFactory;

    protected $table = 'bankers';

    protected $fillable = [
        'user_id',
        'bank_name',
        'branch',
        'designation',
        'employee_code',
        'alternate_phone',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'pincode',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
