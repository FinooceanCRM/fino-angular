<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerProfile extends Model
{
    protected $fillable = [
        'user_id', 'dob', 'gender', 'marital_status', 'occupation', 'pan', 'aadhaar', 'employment_type', 'company', 'designation',
        'experience_years', 'monthly_income', 'office_address', 'work_city', 'language', 'photo_path',
        'current_address', 'permanent_address', 'permanent_same_as_current', 'communication_prefs',
        'deletion_requested_at', 'deletion_reason', 'deletion_comments',
    ];

    /** The Aadhaar number never leaves the server inside a serialised model. */
    protected $hidden = ['aadhaar'];

    protected function casts(): array
    {
        return [
            'dob' => 'date:Y-m-d',
            'aadhaar' => 'encrypted',
            'experience_years' => 'float',
            'monthly_income' => 'float',
            'current_address' => 'array',
            'permanent_address' => 'array',
            'permanent_same_as_current' => 'boolean',
            'communication_prefs' => 'array',
            'deletion_requested_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
