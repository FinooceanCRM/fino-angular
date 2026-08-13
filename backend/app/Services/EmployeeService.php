<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Employee;
use App\Models\User;
use App\Repositories\Contracts\EmployeeRepositoryInterface;

/**
 * Business rules for the Employee module (Phase 6).
 *
 * An employee is the leaf of the reporting hierarchy:
 * Super Admin → Manager → Relationship Manager → Employee.
 * Every operation here is scoped to the authenticated employee only.
 */
class EmployeeService extends BaseService
{
    public function __construct(
        private readonly EmployeeRepositoryInterface $employees,
    ) {
    }

    /** Profile for the given employee user, auto-provisioned on first read. */
    public function profileFor(User $user): Employee
    {
        $this->assertEmployee($user);

        $employee = $this->employees->firstOrCreateForUser($user);
        $employee->setRelation('user', $user);

        return $employee;
    }

    /**
     * Employees may only change their own contact/profile details.
     * Role, status and reporting links are never editable here.
     *
     * @param array<string, mixed> $attributes
     */
    public function updateProfile(User $user, array $attributes): Employee
    {
        $this->assertEmployee($user);

        $profileAttributes = array_intersect_key($attributes, array_flip([
            'designation',
            'department',
            'alternate_phone',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'pincode',
            'emergency_contact_name',
            'emergency_contact_phone',
        ]));

        $identityAttributes = array_intersect_key($attributes, array_flip(['name', 'phone']));

        return $this->transaction(function () use ($user, $profileAttributes, $identityAttributes): Employee {
            if ($identityAttributes !== []) {
                $user->fill($identityAttributes)->save();
            }

            $employee = $this->employees->firstOrCreateForUser($user);
            $employee = $this->employees->update($employee, $profileAttributes);
            $employee->setRelation('user', $user->refresh());

            return $employee;
        });
    }

    /**
     * Dashboard payload: welcome, employee information, assigned relationship
     * manager, account status and quick actions. No lead or workflow data.
     *
     * @return array<string, mixed>
     */
    public function dashboardFor(User $user): array
    {
        $this->assertEmployee($user);

        $profile = $this->profileFor($user);
        $role = $user->roleEnum();

        return [
            'welcome' => [
                'headline' => 'Welcome back, '.$user->name.'.',
                'message' => 'This is your employee workspace.',
            ],
            'employee' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'employee_code' => $profile->employee_code,
                'designation' => $profile->designation,
                'department' => $profile->department,
                'date_of_joining' => $profile->date_of_joining?->toDateString(),
                'member_since' => $user->created_at?->toIso8601String(),
            ],
            'role' => [
                'value' => $role->value,
                'label' => $role->label(),
                'description' => 'Employees report to a Relationship Manager and can access only their own information.',
            ],
            'relationship_manager' => $this->summarise($user->relationshipManager),
            'manager' => $this->summarise($user->manager),
            'account_status' => [
                'is_active' => (bool) $user->is_active,
                'status' => $user->is_active ? 'Active' : 'Inactive',
                'profile_complete' => $this->isProfileComplete($profile),
            ],
            'quick_actions' => [
                ['label' => 'View profile', 'route' => '/employee/profile', 'icon' => 'badge'],
                ['label' => 'Edit profile', 'route' => '/employee/profile', 'icon' => 'edit'],
                ['label' => 'View my team', 'route' => '/employee/team', 'icon' => 'groups'],
            ],
        ];
    }

    /**
     * Team view: the employee's own details plus the reporting
     * Relationship Manager (and the Manager above them, read-only).
     *
     * @return array<string, mixed>
     */
    public function teamFor(User $user): array
    {
        $this->assertEmployee($user);

        $profile = $this->profileFor($user);
        $relationshipManager = $user->relationshipManager;

        return [
            'employee' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role_label' => $user->roleEnum()->label(),
                'employee_code' => $profile->employee_code,
                'designation' => $profile->designation,
                'department' => $profile->department,
                'is_active' => (bool) $user->is_active,
            ],
            'relationship_manager' => $this->summarise($relationshipManager),
            'manager' => $this->summarise($user->manager),
            'reporting_chain' => array_values(array_filter([
                $this->summarise($user->manager?->manager),
                $this->summarise($user->manager),
                $this->summarise($relationshipManager),
            ])),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function summarise(?User $user): ?array
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

    private function isProfileComplete(Employee $profile): bool
    {
        foreach (['designation', 'department', 'city', 'state', 'pincode'] as $field) {
            if (blank($profile->{$field})) {
                return false;
            }
        }

        return true;
    }

    private function assertEmployee(User $user): void
    {
        if (! $user->hasRole(UserRole::Employee)) {
            throw new DomainException('This resource is only available to employees.', 403);
        }
    }
}
