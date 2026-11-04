<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/** An offer shown to guest visitors (popup + landing page). Managed by the super admin. */
class LeadOffer extends Model
{
    use SoftDeletes;

    public const TYPES = [
        'free_consultation' => 'Free Consultation',
        'free_demo' => 'Free Demo',
        'exclusive_discount' => 'Exclusive Discount',
        'free_assessment' => 'Free Business Assessment',
        'custom_quotation' => 'Customized Quotation',
        'other' => 'Other',
    ];

    protected $fillable = [
        'slug', 'name', 'type', 'badge_text', 'headline', 'description', 'benefits', 'cta_text', 'image_path',
        'is_active', 'show_popup', 'valid_from', 'valid_until', 'sort_order', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'benefits' => 'array',
            'is_active' => 'boolean',
            'show_popup' => 'boolean',
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    public function events(): HasMany
    {
        return $this->hasMany(OfferEvent::class, 'offer_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(LoanLead::class, 'offer_id');
    }

    /** Active, and inside its validity window (if one is set). */
    public function isLive(): bool
    {
        return $this->is_active
            && ($this->valid_from === null || $this->valid_from->isPast())
            && ($this->valid_until === null || $this->valid_until->isFuture());
    }
}
