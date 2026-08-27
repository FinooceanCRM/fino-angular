<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'description',
        'loan_lead_id',
        'priority',
        'due_at',
        'status',
        'assigned_to',
        'created_by',
        'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(LoanLead::class, 'loan_lead_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The mock `TaskDataProvider.displayStatus()` derivation, replicated
     * server-side so neither the Resource nor any frontend consumer needs
     * to reimplement date-math: stored completed/cancelled pass through;
     * else compare `due_at`'s calendar date (app timezone) to today.
     */
    public function displayStatus(): string
    {
        if ($this->status === 'completed') {
            return 'completed';
        }

        if ($this->status === 'cancelled') {
            return 'cancelled';
        }

        $now = now();
        $due = $this->due_at;

        if ($due->isSameDay($now)) {
            return 'due_today';
        }

        return $due->lt($now) ? 'overdue' : 'upcoming';
    }
}
