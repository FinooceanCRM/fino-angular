<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadMatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_lead_id',
        'bank_criteria_id',
        'match_score',
        'status',
        'reasons',
    ];

    protected function casts(): array
    {
        return [
            'match_score' => 'integer',
            'reasons' => 'array',
        ];
    }

    public function loanLead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class);
    }

    public function bankCriteria(): BelongsTo
    {
        return $this->belongsTo(BankCriteria::class);
    }
}
