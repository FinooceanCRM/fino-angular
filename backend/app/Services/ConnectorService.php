<?php

namespace App\Services;

use App\Enums\ConnectorStatus;
use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Connector;
use App\Models\User;
use App\Repositories\Contracts\ConnectorRepositoryInterface;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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
        private readonly LoanLeadRepositoryInterface $leads,
    ) {
    }

    /** Profile for the given connector user, auto-provisioned on first read. */
    public function profileFor(User $user): Connector
    {
        $this->assertConnector($user);

        $connector = $this->connectors->firstOrCreateForUser($user);
        $connector->setRelation('user', $user);
        $connector->loadMissing('referredBy:id,name,email');

        return $connector;
    }

    /**
     * Payout details, alternate_phone and business/address fields are
     * editable; email, referral_code and commission_rate are never touched
     * here — same read-only-sensitive-fields pattern as the Affiliate
     * profile module.
     *
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
            'payout_method',
            'payout_account_name',
            'payout_account_number',
            'payout_ifsc_or_upi',
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
     * Dashboard payload: welcome card, user information, role information,
     * account status, lead-submission stats, referral link/code, and
     * network + commission totals (base + referral-override combined).
     *
     * @return array<string, mixed>
     */
    public function dashboardFor(User $user): array
    {
        $this->assertConnector($user);

        $profile = $this->profileFor($user);
        $role = $user->roleEnum();
        $leadCounts = $this->connectors->referredLeadCounts($profile);
        $commissionTotals = $this->connectors->commissionTotals($profile);
        $directReferralCount = Connector::query()->where('referred_by_connector_id', $user->id)->count();

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
            'stats' => $this->statsFor($user),
            'referral' => [
                'code' => $profile->referral_code,
                'link' => rtrim((string) config('app.frontend_url'), '/').'/join-connector/'.$profile->referral_code,
                'direct_referrals' => $directReferralCount,
            ],
            'network_totals' => [
                'referral_count' => $leadCounts['total'],
                'converted_count' => $leadCounts['converted'],
                'commission_accrued' => $commissionTotals['accrued'],
                'commission_paid' => $commissionTotals['paid'],
                'pending_payout' => $commissionTotals['pending_payout'],
            ],
        ];
    }

    /**
     * Direct referrals (this connector's network) — not the whole
     * multi-level tree, just the connectors they personally invited.
     *
     * @param array<string, mixed> $filters
     */
    public function networkFor(User $user, array $filters = []): LengthAwarePaginator
    {
        $this->assertConnector($user);

        $profile = $this->profileFor($user);
        $perPage = (int) ($filters['per_page'] ?? 15);

        return $this->connectors->referralsFor($profile, $filters, $perPage);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function commissionsFor(User $user, array $filters = []): LengthAwarePaginator
    {
        $this->assertConnector($user);

        $profile = $this->profileFor($user);
        $perPage = (int) ($filters['per_page'] ?? 15);

        return $this->connectors->commissionsFor($profile, $filters, $perPage);
    }

    /**
     * Every connector, for Super Admin management.
     *
     * @param array<string, mixed> $filters
     */
    public function listForAdmin(array $filters = []): LengthAwarePaginator
    {
        return $this->connectors->paginateAll($filters, (int) ($filters['per_page'] ?? 15));
    }

    public function findForAdmin(int $connectorUserId): Connector
    {
        $user = User::query()->find($connectorUserId);

        if (! $user) {
            throw new DomainException('Connector not found.', 404);
        }

        $connector = $this->connectors->firstOrCreateForUser($user);
        $connector->loadMissing('referredBy:id,name,email');

        return $connector;
    }

    /**
     * Super Admin management: commission_rate override and status
     * (suspend/reactivate/deactivate). Changing status also flips the
     * underlying user's is_active, same as the Affiliate equivalent.
     *
     * @param array<string, mixed> $data
     */
    public function updateByAdmin(Connector $connector, array $data): Connector
    {
        $allowed = array_intersect_key($data, array_flip(['commission_rate', 'status']));

        if ($allowed === []) {
            return $connector;
        }

        return $this->transaction(function () use ($connector, $allowed): Connector {
            if (array_key_exists('status', $allowed)) {
                User::query()->whereKey($connector->user_id)->update([
                    'is_active' => $allowed['status'] === ConnectorStatus::Active->value,
                ]);
            }

            $updated = $this->connectors->update($connector, $allowed);
            $updated->setRelation('user', User::query()->find($connector->user_id));

            return $updated;
        });
    }

    /**
     * @return array<string, int>
     */
    private function statsFor(User $user): array
    {
        $statusCounts = $this->leads->statusCounts($user);

        return [
            'leads_submitted' => array_sum($statusCounts),
            'approved_leads' => (int) ($statusCounts[LeadStatus::Approved->value] ?? 0),
            'in_progress_leads' => (int) ($statusCounts[LeadStatus::InProgress->value] ?? 0),
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
