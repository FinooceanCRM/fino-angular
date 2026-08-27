<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'segment',
        'status',
        'notes',
        'created_by',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Leads this customer has been linked to over time (many-to-many). */
    public function leads(): BelongsToMany
    {
        return $this->belongsToMany(LoanLead::class, 'customer_lead')->withTimestamps();
    }

    public function notes(): HasMany
    {
        return $this->hasMany(CustomerNote::class);
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(CustomerInteraction::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CustomerDocument::class);
    }
}
