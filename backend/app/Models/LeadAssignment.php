<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_lead_id',
        'assigned_to',
        'assigned_by',
        'status',
        'assigned_at',
        'released_at',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    public function loanLead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
