<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One step of the anonymous offer funnel. Holds no personal data — only a random visitor id. */
class OfferEvent extends Model
{
    public const UPDATED_AT = null;

    /** Types the public website may report. `lead` and `duplicate` are written by the server only. */
    public const PUBLIC_TYPES = ['impression', 'click', 'landing_visit'];

    protected $fillable = ['offer_id', 'visitor_id', 'type', 'page', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }
}
