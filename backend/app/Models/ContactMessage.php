<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A message sent from the public Contact page. */
class ContactMessage extends Model
{
    protected $fillable = ['name', 'email', 'phone', 'inquiry_type', 'message', 'ip_address', 'handled_at'];

    protected function casts(): array
    {
        return ['handled_at' => 'datetime'];
    }
}
