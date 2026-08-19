<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Telecaller;
use App\Models\User;
use App\Repositories\Contracts\TelecallerRepositoryInterface;

/**
 * Business rules for the Telecaller module.
 *
 * Telecallers are independent of the reporting hierarchy: no manager,
 * relationship manager or employee is involved in any of these operations.
 * Their department is chosen explicitly at creation (see
 * UserService::applyHierarchyDefaults), the same way a Manager's is.
 */
class TelecallerService extends BaseService
{
    public function __construct(private readonly TelecallerRepositoryInterface $telecallers)
    {
    }

    /** Profile for the given telecaller user, auto-provisioned on first read. */
    public function profileFor(User $user): Telecaller
    {
        $this->assertTelecaller($user);

        $telecaller = $this->telecallers->firstOrCreateForUser($user);
        $telecaller->setRelation('user', $user);

        return $telecaller;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function updateProfile(User $user, array $attributes): Telecaller
    {
        $this->assertTelecaller($user);

        $profileAttributes = array_intersect_key($attributes, array_flip([
            'designation',
            'employee_code',
            'alternate_phone',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'pincode',
        ]));

        $identityAttributes = array_intersect_key($attributes, array_flip(['name', 'phone']));

        return $this->transaction(function () use ($user, $profileAttributes, $identityAttributes): Telecaller {
            if ($identityAttributes !== []) {
                $user->fill($identityAttributes)->save();
            }

            $telecaller = $this->telecallers->firstOrCreateForUser($user);
            $telecaller = $this->telecallers->update($telecaller, $profileAttributes);
            $telecaller->setRelation('user', $user->refresh());

            return $telecaller;
        });
    }

    /**
     * Dashboard payload: welcome card, user information, role information
     * and account status. Lead-related stats are added once the PD
     * workflow (telecaller lead visibility) is wired up.
     *
     * @return array<string, mixed>
     */
    public function dashboardFor(User $user): array
    {
        $this->assertTelecaller($user);

        $profile = $this->profileFor($user);
        $role = $user->roleEnum();

        return [
            'welcome' => [
                'headline' => 'Welcome back, '.$user->name.'.',
                'message' => 'Leads awaiting a pre-disbursement call.',
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'department' => $user->department?->value,
                'department_label' => $user->department?->label(),
                'member_since' => $user->created_at?->toIso8601String(),
            ],
            'role' => [
                'value' => $role->value,
                'label' => $role->label(),
                'independent' => true,
                'description' => 'Telecallers operate outside the Super Admin → Manager → Relationship Manager → Employee hierarchy.',
            ],
            'account_status' => [
                'is_active' => (bool) $user->is_active,
                'status' => $user->is_active ? 'Active' : 'Inactive',
                'profile_complete' => $this->isProfileComplete($profile),
            ],
        ];
    }

    private function isProfileComplete(Telecaller $profile): bool
    {
        foreach (['designation', 'city', 'state'] as $field) {
            if (blank($profile->{$field})) {
                return false;
            }
        }

        return true;
    }

    private function assertTelecaller(User $user): void
    {
        if (! $user->hasRole(UserRole::Telecaller)) {
            throw new DomainException('This resource is only available to telecallers.', 403);
        }
    }
}
