<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerUpiId extends Model
{
    protected $fillable = ['user_id', 'vpa', 'is_primary', 'status'];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }
}
