<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerBankAccount extends Model
{
    protected $fillable = [
        'user_id', 'holder_name', 'bank_name', 'account_number_encrypted', 'account_last4', 'ifsc',
        'account_type', 'branch', 'is_primary', 'status',
    ];

    /** The encrypted number must never leave the server, even by accident in a JSON dump. */
    protected $hidden = ['account_number_encrypted'];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }
}
