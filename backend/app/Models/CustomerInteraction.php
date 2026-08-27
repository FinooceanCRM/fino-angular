<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerInteraction extends Model
{
    use HasFactory;

    /** created_at only — entries are never edited, mirroring the mock. */
    const UPDATED_AT = null;

    protected $fillable = [
        'customer_id',
        'icon',
        'title',
        'subtitle',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
