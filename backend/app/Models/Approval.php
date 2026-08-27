<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Approval extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'subtitle',
        'requested_by',
        'requested_at',
        'status',
        'decided_by',
        'decided_at',
        'decision_remarks',
        'loan_lead_id',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'decided_at' => 'datetime',
        ];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class, 'loan_lead_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ApprovalComment::class)->orderBy('created_at');
    }
}
