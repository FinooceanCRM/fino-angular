<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Telecaller;
use App\Models\User;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;
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
    public function __construct(
        private readonly TelecallerRepositoryInterface $telecallers,
        private readonly LoanLeadRepositoryInterface $leads,
        private readonly TelecallerFollowUpService $followUps,
    ) {
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
     * Dashboard payload: welcome card, user information, role information,
     * account status, her own submitted-lead stats, her PD queue counts and
     * her pending follow-ups.
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
            'submitted_leads' => $this->submittedLeadStats($user),
            'recent_leads' => $this->recentLeads($user),
            'pd_queue' => $this->pdQueueStats($user),
            'pending_follow_ups' => $this->pendingFollowUps($user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function submittedLeadStats(User $user): array
    {
        $statusCounts = $this->leads->statusCounts($user, ['created_by' => $user->id]);

        return [
            'total' => array_sum($statusCounts),
            'by_status' => $statusCounts,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function recentLeads(User $user): array
    {
        return $this->leads->visibleQuery($user)
            ->where('created_by', $user->id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'reference', 'applicant_name', 'loan_amount', 'status', 'created_at'])
            ->map(static fn ($lead): array => [
                'id' => $lead->id,
                'reference' => $lead->reference,
                'applicant_name' => $lead->applicant_name,
                'loan_amount' => $lead->loan_amount,
                'status' => $lead->statusEnum()->value,
                'status_label' => $lead->statusEnum()->label(),
                'created_at' => $lead->created_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @return array<string, int>
     */
    private function pdQueueStats(User $user): array
    {
        $query = $this->leads->visibleQuery($user)->where('department', $user->department?->value)
            ->whereHas('creator', function ($q): void {
                $q->where('role', UserRole::Employee->value);
            });

        return [
            'pending' => (clone $query)->whereNull('pd_completed_at')->count(),
            'completed' => (clone $query)->whereNotNull('pd_completed_at')->count(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function pendingFollowUps(User $user): array
    {
        return $this->followUps->pendingForActor($user, 5)
            ->map(static fn ($followUp): array => [
                'id' => $followUp->id,
                'type' => $followUp->type,
                'notes' => $followUp->notes,
                'next_follow_up_at' => optional($followUp->next_follow_up_at)->toIso8601String(),
                'lead' => $followUp->loanLead ? [
                    'id' => $followUp->loanLead->id,
                    'reference' => $followUp->loanLead->reference,
                    'applicant_name' => $followUp->loanLead->applicant_name,
                ] : null,
            ])
            ->all();
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
