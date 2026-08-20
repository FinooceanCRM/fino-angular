<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelecallerFollowUp extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_lead_id',
        'telecaller_id',
        'type',
        'notes',
        'next_follow_up_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'next_follow_up_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function loanLead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class);
    }

    public function telecaller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'telecaller_id');
    }
}
