<?php

namespace App\Models;

use App\Enums\Department;
use App\Enums\LeadStatus;
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
        'department',
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
        'updated_by',
        'connector_id',
        'assigned_employee_id',
        'assigned_relationship_manager_id',
        'assigned_manager_id',
        'assigned_banker_id',
        'pd_completed_at',
        'pd_completed_by',
        'notes',
        'details',
    ];

    protected function casts(): array
    {
        return [
            'loan_amount' => 'decimal:2',
            'monthly_income' => 'decimal:2',
            'tenure_months' => 'integer',
            'credit_score' => 'integer',
            'status' => LeadStatus::class,
            'department' => Department::class,
            'pd_completed_at' => 'datetime',
            'details' => 'array',
        ];
    }

    public function statusEnum(): LeadStatus
    {
        return $this->status instanceof LeadStatus
            ? $this->status
            : LeadStatus::from((string) $this->status);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function connector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'connector_id');
    }

    public function assignedEmployee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_employee_id');
    }

    public function assignedRelationshipManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_relationship_manager_id');
    }

    public function assignedManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_manager_id');
    }

    public function assignedBanker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_banker_id');
    }

    public function pdCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pd_completed_by');
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

    public function accessRequests(): HasMany
    {
        return $this->hasMany(LeadAccessRequest::class);
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(LeadFollowUp::class);
    }
}
