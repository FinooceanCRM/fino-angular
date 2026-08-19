<?php

namespace App\Models;

use App\Enums\UserRole;
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

    /**
     * Whether a lead has ever been moved off a user with the given role
     * before its current assignment — i.e. it's a true re-assignment (moved
     * from one Employee to another, or reassigned after already being
     * worked) rather than the lead's first-ever routing to that role.
     */
    public static function wasReassignedAwayFrom(int $loanLeadId, UserRole $role): bool
    {
        return static::query()
            ->where('loan_lead_id', $loanLeadId)
            ->where('status', 'released')
            ->whereHas('assignee', fn ($q) => $q->where('role', $role->value))
            ->exists();
    }
}
