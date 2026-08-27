<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read string $author_name
 */
class CustomerNote extends Model
{
    use HasFactory;

    /** created_at only — notes are never edited, mirroring the mock. */
    const UPDATED_AT = null;

    protected $fillable = [
        'customer_id',
        'author_id',
        'author_name',
        'body',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
