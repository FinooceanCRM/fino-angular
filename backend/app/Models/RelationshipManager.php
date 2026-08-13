<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Relationship Manager profile data attached 1:1 to a user with the
 * `relationship_manager` role. Identity and hierarchy fields live on User.
 */
class RelationshipManager extends Model
{
    use HasFactory;

    protected $table = 'relationship_managers';

    protected $fillable = [
        'user_id',
        'rm_code',
        'designation',
        'branch',
        'region',
        'date_of_joining',
        'alternate_phone',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'pincode',
    ];

    protected function casts(): array
    {
        return [
            'date_of_joining' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
