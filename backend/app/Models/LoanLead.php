<?php

namespace App\Models;

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
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'loan_amount' => 'decimal:2',
            'monthly_income' => 'decimal:2',
            'tenure_months' => 'integer',
            'credit_score' => 'integer',
            'status' => LeadStatus::class,
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
