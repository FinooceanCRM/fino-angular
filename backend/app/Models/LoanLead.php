<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanLead extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'reference',
        'applicant_name',
        'applicant_email',
        'applicant_phone',
        'loan_type',
        'loan_amount',
        'tenure_months',
        'monthly_income',
        'credit_score',
        'employment_type',
        'city',
        'state',
        'pincode',
        'status',
        'created_by',
        'connector_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'loan_amount' => 'decimal:2',
            'monthly_income' => 'decimal:2',
            'tenure_months' => 'integer',
            'credit_score' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function connector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'connector_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(LeadAssignment::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(LeadMatch::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(LeadStatusHistory::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
