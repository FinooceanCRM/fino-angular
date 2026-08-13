<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Connector;
use App\Models\User;
use App\Repositories\Contracts\ConnectorRepositoryInterface;

/**
 * Business rules for the Connector module.
 *
 * Connectors are independent of the reporting hierarchy: no manager,
 * relationship manager or employee is involved in any of these operations.
 */
class ConnectorService extends BaseService
{
    public function __construct(
        private readonly ConnectorRepositoryInterface $connectors,
    ) {
    }

    /** Profile for the given connector user, auto-provisioned on first read. */
    public function profileFor(User $user): Connector
    {
        $this->assertConnector($user);

        $connector = $this->connectors->firstOrCreateForUser($user);
        $connector->setRelation('user', $user);

        return $connector;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function updateProfile(User $user, array $attributes): Connector
    {
        $this->assertConnector($user);

        $profileAttributes = array_intersect_key($attributes, array_flip([
            'company_name',
            'contact_person',
            'alternate_phone',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'pincode',
            'pan_number',
            'gst_number',
        ]));

        $identityAttributes = array_intersect_key($attributes, array_flip(['name', 'phone']));

        return $this->transaction(function () use ($user, $profileAttributes, $identityAttributes): Connector {
            if ($identityAttributes !== []) {
                $user->fill($identityAttributes)->save();
            }

            $connector = $this->connectors->firstOrCreateForUser($user);
            $connector = $this->connectors->update($connector, $profileAttributes);
            $connector->setRelation('user', $user->refresh());

            return $connector;
        });
    }

    /**
     * Dashboard payload: welcome card, user information, role information
     * and account status. No lead or workflow data by design.
     *
     * @return array<string, mixed>
     */
    public function dashboardFor(User $user): array
    {
        $this->assertConnector($user);

        $profile = $this->profileFor($user);
        $role = $user->roleEnum();

        return [
            'welcome' => [
                'headline' => 'Welcome back, '.$user->name.'.',
                'message' => 'This is your independent connector workspace.',
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'member_since' => $user->created_at?->toIso8601String(),
            ],
            'role' => [
                'value' => $role->value,
                'label' => $role->label(),
                'independent' => true,
                'description' => 'Connectors operate outside the Super Admin → Manager → Relationship Manager → Employee hierarchy.',
            ],
            'account_status' => [
                'is_active' => (bool) $user->is_active,
                'status' => $user->is_active ? 'Active' : 'Inactive',
                'profile_complete' => $this->isProfileComplete($profile),
            ],
        ];
    }

    private function isProfileComplete(Connector $profile): bool
    {
        foreach (['company_name', 'contact_person', 'city', 'state', 'pincode'] as $field) {
            if (blank($profile->{$field})) {
                return false;
            }
        }

        return true;
    }

    private function assertConnector(User $user): void
    {
        if (! $user->hasRole(UserRole::Connector)) {
            throw new DomainException('This resource is only available to connectors.', 403);
        }
    }
}
