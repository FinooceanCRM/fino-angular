<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Connector-specific profile data attached 1:1 to a user with the
 * `connector` role. Identity fields live on the User model.
 */
class Connector extends Model
{
    use HasFactory;

    protected $table = 'connectors';

    protected $fillable = [
        'user_id',
        'relationship_manager_id',
        'company_name',
        'contact_person',
        'alternate_phone',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'pincode',
        'pan_number',
        'gst_number',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Optional point of contact. Connectors stay outside the hierarchy. */
    public function relationshipManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'relationship_manager_id');
    }
}
