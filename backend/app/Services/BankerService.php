<?php

namespace App\Services;

use App\Enums\AccessRequestStatus;
use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Banker;
use App\Models\BankCriteria;
use App\Models\LeadAccessRequest;
use App\Models\LeadMatch;
use App\Models\User;
use App\Repositories\Contracts\BankerRepositoryInterface;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;

/**
 * Business rules for the Banker module.
 *
 * Bankers are independent of the reporting hierarchy: no manager,
 * relationship manager or employee is involved in any of these operations.
 * A banker's leads come from the matching engine (leads matched against
 * their own bank_criteria rows) and from access requests they've been
 * granted.
 */
class BankerService extends BaseService
{
    public function __construct(
        private readonly BankerRepositoryInterface $bankers,
        private readonly LoanLeadRepositoryInterface $leads,
    ) {
    }

    /** Profile for the given banker user, auto-provisioned on first read. */
    public function profileFor(User $user): Banker
    {
        $this->assertBanker($user);

        $banker = $this->bankers->firstOrCreateForUser($user);
        $banker->setRelation('user', $user);

        return $banker;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function updateProfile(User $user, array $attributes): Banker
    {
        $this->assertBanker($user);

        $profileAttributes = array_intersect_key($attributes, array_flip([
            'first_name',
            'last_name',
            'country',
            'pan_number',
            'bank_name',
            'branch',
            'branch_address',
            'branch_location',
            'bank_city',
            'bank_state',
            'designation',
            'employee_code',
            'products',
            'manager_name',
            'manager_email',
            'manager_phone',
            'alternate_phone',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'pincode',
        ]));

        $identityAttributes = array_intersect_key($attributes, array_flip(['name', 'phone']));

        return $this->transaction(function () use ($user, $profileAttributes, $identityAttributes): Banker {
            if ($identityAttributes !== []) {
                $user->fill($identityAttributes)->save();
            }

            $banker = $this->bankers->firstOrCreateForUser($user);
            $banker = $this->bankers->update($banker, $profileAttributes);
            $banker->setRelation('user', $user->refresh());

            return $banker;
        });
    }

    /**
     * Dashboard payload: welcome card, user information, role information,
     * account status and real lead/criteria statistics.
     *
     * @return array<string, mixed>
     */
    public function dashboardFor(User $user): array
    {
        $this->assertBanker($user);

        $profile = $this->profileFor($user);
        $role = $user->roleEnum();

        return [
            'welcome' => [
                'headline' => 'Welcome back, '.$user->name.'.',
                'message' => 'Leads matched against your bank\'s criteria.',
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
                'description' => 'Bankers operate outside the Super Admin → Manager → Relationship Manager → Employee hierarchy.',
            ],
            'account_status' => [
                'is_active' => (bool) $user->is_active,
                'status' => $user->is_active ? 'Active' : 'Inactive',
                'profile_complete' => $this->isProfileComplete($profile),
            ],
            'stats' => $this->statsFor($user),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function statsFor(User $user): array
    {
        $matchedLeadsCount = LeadMatch::query()
            ->whereHas('bankCriteria', fn ($q) => $q->where('banker_id', $user->id))
            ->count();

        $activeCriteriaCount = BankCriteria::query()
            ->where('banker_id', $user->id)
            ->where('is_active', true)
            ->count();

        $statusCounts = $this->leads->statusCounts($user);
        $assignedLeadsCount = array_sum($statusCounts);
        $disbursedLeadsCount = (int) ($statusCounts[LeadStatus::Disbursed->value] ?? 0);

        $pendingAccessRequests = LeadAccessRequest::query()
            ->where('banker_id', $user->id)
            ->where('status', AccessRequestStatus::Pending->value)
            ->count();

        return [
            'matched_leads' => $matchedLeadsCount,
            'active_criteria_sets' => $activeCriteriaCount,
            'assigned_leads' => $assignedLeadsCount,
            'disbursed_leads' => $disbursedLeadsCount,
            'pending_access_requests' => $pendingAccessRequests,
        ];
    }

    private function isProfileComplete(Banker $profile): bool
    {
        foreach (['bank_name', 'branch', 'designation', 'city', 'state'] as $field) {
            if (blank($profile->{$field})) {
                return false;
            }
        }

        return true;
    }

    private function assertBanker(User $user): void
    {
        if (! $user->hasRole(UserRole::Banker)) {
            throw new DomainException('This resource is only available to bankers.', 403);
        }
    }
}
