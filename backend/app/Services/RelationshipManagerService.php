<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Connector;
use App\Models\Employee;
use App\Models\RelationshipManager;
use App\Models\User;
use App\Repositories\Contracts\RelationshipManagerRepositoryInterface;

/**
 * Business rules for the Relationship Manager module (Phase 7).
 *
 * Super Admin → Manager → Relationship Manager → Employee.
 * Every read here is scoped to the authenticated Relationship Manager: their
 * own profile, the employees assigned to them and the connectors assigned to
 * them. Manager and Super Admin data is never exposed beyond the read-only
 * reporting Manager summary.
 */
class RelationshipManagerService extends BaseService
{
    public function __construct(
        private readonly RelationshipManagerRepositoryInterface $profiles,
    ) {
    }

    /** Profile for the given RM user, auto-provisioned on first read. */
    public function profileFor(User $user): RelationshipManager
    {
        $this->assertRelationshipManager($user);

        $profile = $this->profiles->firstOrCreateForUser($user);
        $profile->setRelation('user', $user);

        return $profile;
    }

    /**
     * An RM may only change their own contact/profile details. Role, status,
     * rm_code and reporting links are never editable here.
     *
     * @param array<string, mixed> $attributes
     */
    public function updateProfile(User $user, array $attributes): RelationshipManager
    {
        $this->assertRelationshipManager($user);

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

        return $this->transaction(function () use ($user, $profileAttributes, $identityAttributes): RelationshipManager {
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
     * Dashboard payload: welcome, team summary, employee count, connector
     * count and account status. No lead, matching or reporting data.
     *
     * @return array<string, mixed>
     */
    public function dashboardFor(User $user): array
    {
        $this->assertRelationshipManager($user);

        $profile = $this->profileFor($user);
        $role = $user->roleEnum();
        $employeeCount = $this->profiles->countEmployees($user);
        $connectorCount = $this->profiles->countConnectors($user);

        return [
            'welcome' => [
                'headline' => 'Welcome back, '.$user->name.'.',
                'message' => 'This is your Relationship Manager workspace.',
            ],
            'relationship_manager' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'rm_code' => $profile->rm_code,
                'designation' => $profile->designation,
                'branch' => $profile->branch,
                'region' => $profile->region,
                'date_of_joining' => $profile->date_of_joining?->toDateString(),
                'member_since' => $user->created_at?->toIso8601String(),
            ],
            'role' => [
                'value' => $role->value,
                'label' => $role->label(),
                'description' => 'Relationship Managers report to a Manager and can access only their own team.',
            ],
            'manager' => $this->summariseUser($user->manager),
            'team_summary' => [
                'employee_count' => $employeeCount,
                'connector_count' => $connectorCount,
                'total_members' => $employeeCount + $connectorCount,
                'active_employee_count' => $this->profiles->employeesFor($user)
                    ->filter(fn (User $employee): bool => (bool) $employee->is_active)
                    ->count(),
            ],
            'account_status' => [
                'is_active' => (bool) $user->is_active,
                'status' => $user->is_active ? 'Active' : 'Inactive',
                'profile_complete' => $this->isProfileComplete($profile),
            ],
            'quick_actions' => [
                ['label' => 'View profile', 'route' => '/relationship-manager/profile', 'icon' => 'badge'],
                ['label' => 'My employees', 'route' => '/relationship-manager/employees', 'icon' => 'groups'],
                ['label' => 'My connectors', 'route' => '/relationship-manager/connectors', 'icon' => 'hub'],
            ],
        ];
    }

    /**
     * Employees assigned to this Relationship Manager (read-only).
     *
     * @return array<string, mixed>
     */
    public function employeesFor(User $user): array
    {
        $this->assertRelationshipManager($user);

        $employees = $this->profiles->employeesFor($user);

        $employeeProfiles = Employee::query()
            ->whereIn('user_id', $employees->pluck('id')->all())
            ->get()
            ->keyBy('user_id');

        return [
            'total' => $employees->count(),
            'employees' => $employees->map(function (User $employee) use ($employeeProfiles): array {
                $profile = $employeeProfiles->get($employee->id);

                return [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'role_label' => $employee->roleEnum()->label(),
                    'is_active' => (bool) $employee->is_active,
                    'employee_code' => $profile?->employee_code,
                    'designation' => $profile?->designation,
                    'department' => $profile?->department,
                    'city' => $profile?->city,
                    'date_of_joining' => $profile?->date_of_joining?->toDateString(),
                ];
            })->values()->all(),
        ];
    }

    /**
     * Connectors assigned to this Relationship Manager (read-only).
     * Connectors remain outside the reporting hierarchy.
     *
     * @return array<string, mixed>
     */
    public function connectorsFor(User $user): array
    {
        $this->assertRelationshipManager($user);

        $connectors = $this->profiles->connectorsFor($user);

        return [
            'total' => $connectors->count(),
            'connectors' => $connectors->map(function (Connector $connector): array {
                $owner = $connector->user;

                return [
                    'id' => $connector->id,
                    'user_id' => $connector->user_id,
                    'name' => $owner?->name,
                    'email' => $owner?->email,
                    'phone' => $owner?->phone,
                    'is_active' => (bool) ($owner?->is_active),
                    'company_name' => $connector->company_name,
                    'contact_person' => $connector->contact_person,
                    'city' => $connector->city,
                    'state' => $connector->state,
                ];
            })->values()->all(),
        ];
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

    private function isProfileComplete(RelationshipManager $profile): bool
    {
        foreach (['designation', 'branch', 'city', 'state', 'pincode'] as $field) {
            if (blank($profile->{$field})) {
                return false;
            }
        }

        return true;
    }

    private function assertRelationshipManager(User $user): void
    {
        if (! $user->hasRole(UserRole::RelationshipManager)) {
            throw new DomainException('This resource is only available to relationship managers.', 403);
        }
    }
}
