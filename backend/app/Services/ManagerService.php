<?php

namespace App\Services;

use App\Enums\Department;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Employee;
use App\Models\Manager;
use App\Models\RelationshipManager;
use App\Models\User;
use App\Repositories\Contracts\ManagerRepositoryInterface;
use Illuminate\Support\Facades\Hash;

/**
 * Business rules for the Manager module (Phase 8).
 *
 * Super Admin → Manager → Relationship Manager → Employee.
 * Every read and write here is scoped to the authenticated Manager: their own
 * profile, the Relationship Managers whose `manager_id` points at them, and
 * the Employees assigned to those Relationship Managers. Another Manager's
 * subtree and Super Admin functionality are never reachable from this service.
 */
class ManagerService extends BaseService
{
    public function __construct(
        private readonly ManagerRepositoryInterface $profiles,
    ) {
    }

    /** Profile for the given Manager user, auto-provisioned on first read. */
    public function profileFor(User $user): Manager
    {
        $this->assertManager($user);

        $profile = $this->profiles->firstOrCreateForUser($user);
        $profile->setRelation('user', $user);

        return $profile;
    }

    /**
     * A Manager may only change their own contact/profile details. Role,
     * status, manager_code and the reporting link to the Super Admin are never
     * editable here.
     *
     * @param array<string, mixed> $attributes
     */
    public function updateProfile(User $user, array $attributes): Manager
    {
        $this->assertManager($user);

        $profileAttributes = array_intersect_key($attributes, array_flip([
            'designation',
            'branch',
            'region',
            'alternate_phone',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'pincode',
        ]));

        $identityAttributes = array_intersect_key($attributes, array_flip(['name', 'phone']));

        return $this->transaction(function () use ($user, $profileAttributes, $identityAttributes): Manager {
            if ($identityAttributes !== []) {
                $user->fill($identityAttributes)->save();
            }

            $profile = $this->profiles->firstOrCreateForUser($user);
            $profile = $this->profiles->update($profile, $profileAttributes);
            $profile->setRelation('user', $user->refresh());

            return $profile;
        });
    }

    /**
     * Dashboard payload: manager information, team counts and the team
     * hierarchy (RMs with their employees).
     *
     * @return array<string, mixed>
     */
    public function dashboardFor(User $user): array
    {
        $this->assertManager($user);

        $profile = $this->profileFor($user);
        $role = $user->roleEnum();

        $relationshipManagers = $this->profiles->relationshipManagersFor($user);
        $employees = $this->profiles->employeesFor($user);

        return [
            'welcome' => [
                'headline' => 'Welcome back, '.$user->name.'.',
                'message' => 'This is your Manager workspace.',
            ],
            'manager' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'manager_code' => $profile->manager_code,
                'designation' => $profile->designation,
                'branch' => $profile->branch,
                'region' => $profile->region,
                'date_of_joining' => $profile->date_of_joining?->toDateString(),
                'member_since' => $user->created_at?->toIso8601String(),
            ],
            'role' => [
                'value' => $role->value,
                'label' => $role->label(),
                'description' => 'Managers own their Relationship Managers and the employees below them.',
            ],
            'reports_to' => $this->summariseUser($user->manager),
            'team_summary' => [
                'relationship_manager_count' => $relationshipManagers->count(),
                'active_relationship_manager_count' => $relationshipManagers
                    ->filter(fn (User $rm): bool => (bool) $rm->is_active)
                    ->count(),
                'employee_count' => $employees->count(),
                'active_employee_count' => $employees
                    ->filter(fn (User $employee): bool => (bool) $employee->is_active)
                    ->count(),
                'total_members' => $relationshipManagers->count() + $employees->count(),
            ],
            'hierarchy' => $this->buildHierarchy($relationshipManagers, $employees),
            'account_status' => [
                'is_active' => (bool) $user->is_active,
                'status' => $user->is_active ? 'Active' : 'Inactive',
                'profile_complete' => $this->isProfileComplete($profile),
            ],
            'quick_actions' => [
                ['label' => 'View profile', 'route' => '/manager/profile', 'icon' => 'badge'],
                ['label' => 'Relationship Managers', 'route' => '/manager/relationship-managers', 'icon' => 'supervisor_account'],
                ['label' => 'My employees', 'route' => '/manager/employees', 'icon' => 'groups'],
            ],
        ];
    }

    /**
     * Relationship Managers owned by this Manager, with employee counts.
     *
     * @return array<string, mixed>
     */
    public function relationshipManagersFor(User $user): array
    {
        $this->assertManager($user);

        $relationshipManagers = $this->profiles->relationshipManagersFor($user);
        $employees = $this->profiles->employeesFor($user);

        $rmProfiles = RelationshipManager::query()
            ->whereIn('user_id', $relationshipManagers->pluck('id')->all())
            ->get()
            ->keyBy('user_id');

        return [
            'total' => $relationshipManagers->count(),
            'relationship_managers' => $relationshipManagers
                ->map(function (User $rm) use ($rmProfiles, $employees): array {
                    $profile = $rmProfiles->get($rm->id);
                    $assigned = $employees->filter(
                        fn (User $employee): bool => (int) $employee->relationship_manager_id === $rm->id,
                    );

                    return [
                        'id' => $rm->id,
                        'name' => $rm->name,
                        'email' => $rm->email,
                        'phone' => $rm->phone,
                        'role_label' => $rm->roleEnum()->label(),
                        'is_active' => (bool) $rm->is_active,
                        'status' => $rm->is_active ? 'Active' : 'Inactive',
                        'rm_code' => $profile?->rm_code,
                        'designation' => $profile?->designation,
                        'branch' => $profile?->branch,
                        'region' => $profile?->region,
                        'employee_count' => $assigned->count(),
                        'active_employee_count' => $assigned
                            ->filter(fn (User $employee): bool => (bool) $employee->is_active)
                            ->count(),
                    ];
                })
                ->values()
                ->all(),
        ];
    }

    /**
     * Create a Relationship Manager underneath this Manager. The new RM is
     * always attached to the acting Manager; the caller cannot choose a parent.
     *
     * @param array<string, mixed> $attributes
     */
    public function createRelationshipManager(User $user, array $attributes): User
    {
        $this->assertManager($user);

        // Department lives at the RM level: one Manager runs Personal Loan,
        // Home Loan and Mortgage Loan at once, each handled by a different
        // RM, so the RM's department is chosen explicitly here rather than
        // inherited from the Manager (who has none of their own).
        $department = $attributes['department'] ?? null;
        if (! is_string($department) || Department::tryFrom($department) === null) {
            throw new DomainException('A department must be assigned.', 422);
        }

        return $this->transaction(function () use ($user, $attributes, $department): User {
            $rm = User::query()->create([
                'name' => $attributes['name'],
                'email' => $attributes['email'],
                'password' => Hash::make($attributes['password']),
                'phone' => $attributes['phone'] ?? null,
                'role' => UserRole::RelationshipManager,
                'manager_id' => $user->id,
                'relationship_manager_id' => null,
                'employee_id' => null,
                'department' => $department,
                'is_active' => (bool) ($attributes['is_active'] ?? true),
            ]);

            $profile = $this->profileRepositoryFor($rm);
            $profile->fill(array_intersect_key($attributes, array_flip([
                'designation',
                'branch',
                'region',
            ])))->save();

            return $rm->refresh();
        });
    }

    /**
     * Update / activate / deactivate a Relationship Manager owned by this
     * Manager. Role and the reporting link are never editable.
     *
     * @param array<string, mixed> $attributes
     */
    public function updateRelationshipManager(User $user, int $relationshipManagerId, array $attributes): User
    {
        $this->assertManager($user);

        $rm = $this->profiles->findOwnedRelationshipManager($user, $relationshipManagerId);

        if ($rm === null) {
            throw new DomainException('This Relationship Manager is not part of your team.', 403);
        }

        return $this->transaction(function () use ($rm, $attributes): User {
            $identity = array_intersect_key($attributes, array_flip(['name', 'email', 'phone', 'is_active']));

            if (array_key_exists('password', $attributes) && $attributes['password'] !== null) {
                $identity['password'] = Hash::make($attributes['password']);
            }

            if ($identity !== []) {
                $rm->fill($identity)->save();
            }

            $profileAttributes = array_intersect_key($attributes, array_flip([
                'designation',
                'branch',
                'region',
            ]));

            if ($profileAttributes !== []) {
                $this->profileRepositoryFor($rm)->fill($profileAttributes)->save();
            }

            return $rm->refresh();
        });
    }

    /**
     * Employees under this Manager's Relationship Managers (read-only).
     *
     * @return array<string, mixed>
     */
    public function employeesFor(User $user): array
    {
        $this->assertManager($user);

        $employees = $this->profiles->employeesFor($user);
        $relationshipManagers = $this->profiles->relationshipManagersFor($user)->keyBy('id');

        $employeeProfiles = Employee::query()
            ->whereIn('user_id', $employees->pluck('id')->all())
            ->get()
            ->keyBy('user_id');

        return [
            'total' => $employees->count(),
            'employees' => $employees
                ->map(function (User $employee) use ($employeeProfiles, $relationshipManagers): array {
                    $profile = $employeeProfiles->get($employee->id);
                    $rm = $relationshipManagers->get((int) $employee->relationship_manager_id);

                    return [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'email' => $employee->email,
                        'phone' => $employee->phone,
                        'role_label' => $employee->roleEnum()->label(),
                        'is_active' => (bool) $employee->is_active,
                        'status' => $employee->is_active ? 'Active' : 'Inactive',
                        'employee_code' => $profile?->employee_code,
                        'designation' => $profile?->designation,
                        'department' => $profile?->department,
                        'relationship_manager' => $rm === null ? null : [
                            'id' => $rm->id,
                            'name' => $rm->name,
                            'email' => $rm->email,
                        ],
                    ];
                })
                ->values()
                ->all(),
        ];
    }

    /**
     * @param \Illuminate\Support\Collection<int, User> $relationshipManagers
     * @param \Illuminate\Support\Collection<int, User> $employees
     * @return array<int, array<string, mixed>>
     */
    private function buildHierarchy($relationshipManagers, $employees): array
    {
        return $relationshipManagers->map(function (User $rm) use ($employees): array {
            return [
                'id' => $rm->id,
                'name' => $rm->name,
                'email' => $rm->email,
                'is_active' => (bool) $rm->is_active,
                'employees' => $employees
                    ->filter(fn (User $employee): bool => (int) $employee->relationship_manager_id === $rm->id)
                    ->map(fn (User $employee): array => [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'email' => $employee->email,
                        'is_active' => (bool) $employee->is_active,
                    ])
                    ->values()
                    ->all(),
            ];
        })->values()->all();
    }

    private function profileRepositoryFor(User $rm): RelationshipManager
    {
        return RelationshipManager::query()->firstOrCreate(['user_id' => $rm->id]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function summariseUser(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->roleEnum()->value,
            'role_label' => $user->roleEnum()->label(),
            'is_active' => (bool) $user->is_active,
        ];
    }

    private function isProfileComplete(Manager $profile): bool
    {
        foreach (['designation', 'branch', 'region', 'city', 'state'] as $field) {
            if (blank($profile->{$field})) {
                return false;
            }
        }

        return true;
    }

    private function assertManager(User $user): void
    {
        if (! $user->hasRole(UserRole::Manager)) {
            throw new DomainException('This workspace is only available to Managers.', 403);
        }
    }
}
