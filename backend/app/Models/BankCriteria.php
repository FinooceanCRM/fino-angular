<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankCriteria extends Model
{
    use HasFactory;

    protected $table = 'bank_criteria';

    protected $fillable = [
        'bank_name',
        'product_name',
        'loan_type',
        'min_loan_amount',
        'max_loan_amount',
        'min_monthly_income',
        'min_credit_score',
        'min_age',
        'max_age',
        'employment_type',
        'interest_rate',
        'eligibility_rules',
        'is_active',
        'banker_id',
    ];

    protected function casts(): array
    {
        return [
            'min_loan_amount' => 'decimal:2',
            'max_loan_amount' => 'decimal:2',
            'min_monthly_income' => 'decimal:2',
            'interest_rate' => 'decimal:2',
            'eligibility_rules' => 'array',
            'is_active' => 'boolean',
        ];
    }


    public function banker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'banker_id');
    }

    public function matches(): HasMany
    {
        return $this->hasMany(LeadMatch::class);
    }
}
