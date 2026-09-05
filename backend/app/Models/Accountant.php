<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Accounts/finance staff profile data attached 1:1 to a user with the
 * `accounts` role. Identity fields live on the User model.
 */
class Accountant extends Model
{
    use HasFactory;

    protected $table = 'accountants';

    protected $fillable = [
        'user_id',
        'designation',
        'branch',
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
