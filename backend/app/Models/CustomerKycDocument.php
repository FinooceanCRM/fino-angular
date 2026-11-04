<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerKycDocument extends Model
{
    protected $fillable = ['user_id', 'type', 'original_name', 'path', 'mime_type', 'size_bytes', 'status', 'remarks', 'reference'];

    protected function casts(): array
    {
        return ['size_bytes' => 'integer'];
    }
}
