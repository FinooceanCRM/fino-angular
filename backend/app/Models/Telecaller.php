<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Telecaller-specific profile data attached 1:1 to a user with the
 * `telecaller` role. Identity fields live on the User model.
 */
class Telecaller extends Model
{
    use HasFactory;

    protected $table = 'telecallers';

    protected $fillable = [
        'user_id',
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
