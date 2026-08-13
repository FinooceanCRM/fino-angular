<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'lead_status_history';

    protected $fillable = [
        'loan_lead_id',
        'from_status',
        'to_status',
        'changed_by',
        'remarks',
    ];

    public function loanLead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
