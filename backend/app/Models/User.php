<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'manager_id',
        'relationship_manager_id',
        'employee_id',
        'phone',
        'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
        ];
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(self::class, 'manager_id');
    }

    public function relationshipManager(): BelongsTo
    {
        return $this->belongsTo(self::class, 'relationship_manager_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(self::class, 'employee_id');
    }

    /** Direct reports where this user is the manager. */
    public function managedUsers(): HasMany
    {
        return $this->hasMany(self::class, 'manager_id');
    }

    /** Direct reports where this user is the relationship manager. */
    public function relationshipManagedUsers(): HasMany
    {
        return $this->hasMany(self::class, 'relationship_manager_id');
    }

    public function loanLeads(): HasMany
    {
        return $this->hasMany(LoanLead::class, 'created_by');
    }

    public function leadAssignments(): HasMany
    {
        return $this->hasMany(LeadAssignment::class, 'assigned_to');
    }

    public function bankCriteria(): HasMany
    {
        return $this->hasMany(BankCriteria::class, 'banker_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'uploaded_by');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /** Role as a typed enum, regardless of how it was hydrated. */
    public function roleEnum(): UserRole
    {
        return $this->role instanceof UserRole
            ? $this->role
            : UserRole::from((string) $this->role);
    }

    public function hasRole(UserRole|string ...$roles): bool
    {
        $current = $this->role instanceof UserRole ? $this->role->value : (string) $this->role;

        foreach ($roles as $role) {
            if (($role instanceof UserRole ? $role->value : $role) === $current) {
                return true;
            }
        }

        return false;
    }
}
