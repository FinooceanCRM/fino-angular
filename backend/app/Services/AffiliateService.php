<?php

namespace App\Services;

use App\Enums\AffiliateStatus;
use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Affiliate;
use App\Models\User;
use App\Repositories\Contracts\AffiliateRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Business rules for the Affiliate module.
 *
 * Affiliates are independent of the reporting hierarchy: no manager,
 * relationship manager or employee is involved in any of these operations.
 */
class AffiliateService extends BaseService
{
    public function __construct(private readonly AffiliateRepositoryInterface $affiliates)
    {
    }

    public function profileFor(User $user): Affiliate
    {
        $this->assertAffiliate($user);

        $affiliate = $this->affiliates->findByUserId($user->id);

        if (! $affiliate) {
            throw new DomainException('Affiliate profile not found.', 404);
        }

        $affiliate->setRelation('user', $user);

        return $affiliate;
    }

    /**
     * Payout details and alternate_phone are editable; email, referral_code
     * and commission_rate are never touched here — same
     * read-only-sensitive-fields pattern as every other profile module.
     *
     * @param array<string, mixed> $data
     */
    public function updateProfile(User $user, array $data): Affiliate
    {
        $this->assertAffiliate($user);

        $profileAttributes = array_intersect_key($data, array_flip([
            'alternate_phone',
            'payout_method',
            'payout_account_name',
            'payout_account_number',
            'payout_ifsc_or_upi',
        ]));

        $identityAttributes = array_intersect_key($data, array_flip(['name', 'phone']));

        return $this->transaction(function () use ($user, $profileAttributes, $identityAttributes): Affiliate {
            if ($identityAttributes !== []) {
                $user->fill($identityAttributes)->save();
            }

            $affiliate = $this->affiliates->findByUserId($user->id);

            if (! $affiliate) {
                throw new DomainException('Affiliate profile not found.', 404);
            }

            $affiliate = $this->affiliates->update($affiliate, $profileAttributes);
            $affiliate->setRelation('user', $user->refresh());

            return $affiliate;
        });
    }

    /**
     * Dashboard payload: welcome card, referral code/link, conversion and
     * commission totals, and account status.
     *
     * @return array<string, mixed>
     */
    public function dashboardFor(User $user): array
    {
        $this->assertAffiliate($user);

        $affiliate = $this->profileFor($user);
        $referralCounts = $this->affiliates->referralCounts($affiliate);
        $commissionTotals = $this->affiliates->commissionTotals($affiliate);

        return [
            'welcome' => [
                'headline' => 'Welcome back, '.$user->name.'.',
                'message' => 'This is your independent affiliate workspace.',
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'member_since' => $user->created_at?->toIso8601String(),
            ],
            'referral' => [
                'code' => $affiliate->referral_code,
                'link' => rtrim((string) config('app.frontend_url'), '/').'/ref/'.$affiliate->referral_code,
            ],
            'totals' => [
                'referral_count' => $referralCounts['total'],
                'converted_count' => $referralCounts['converted'],
                'commission_accrued' => $commissionTotals['accrued'],
                'commission_paid' => $commissionTotals['paid'],
                'pending_payout' => $commissionTotals['pending_payout'],
            ],
            'account_status' => [
                'is_active' => (bool) $user->is_active,
                'status' => $affiliate->statusEnum()->label(),
                'email_verified' => $affiliate->email_verified_at !== null,
            ],
        ];
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function referralsFor(User $user, array $filters = []): LengthAwarePaginator
    {
        $this->assertAffiliate($user);

        $affiliate = $this->profileFor($user);
        $perPage = (int) ($filters['per_page'] ?? 15);

        return $this->affiliates->referralsFor($affiliate, $filters, $perPage);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function commissionsFor(User $user, array $filters = []): LengthAwarePaginator
    {
        $this->assertAffiliate($user);

        $affiliate = $this->profileFor($user);
        $perPage = (int) ($filters['per_page'] ?? 15);

        return $this->affiliates->commissionsFor($affiliate, $filters, $perPage);
    }

    /**
     * Every affiliate, for Super Admin management.
     *
     * @param array<string, mixed> $filters
     */
    public function listForAdmin(array $filters = []): LengthAwarePaginator
    {
        return $this->affiliates->paginateAll($filters, (int) ($filters['per_page'] ?? 15));
    }

    public function findForAdmin(int $affiliateUserId): Affiliate
    {
        $affiliate = $this->affiliates->findByUserId($affiliateUserId);

        if (! $affiliate) {
            throw new DomainException('Affiliate not found.', 404);
        }

        $affiliate->loadMissing('user');

        return $affiliate;
    }

    /**
     * Super Admin management: commission_rate override and status
     * (suspend/reactivate/deactivate). Changing status also flips the
     * underlying user's is_active, so a suspended affiliate is actually
     * locked out — not just labelled suspended while still able to log in.
     *
     * @param array<string, mixed> $data
     */
    public function updateByAdmin(Affiliate $affiliate, array $data): Affiliate
    {
        $allowed = array_intersect_key($data, array_flip(['commission_rate', 'status']));

        if ($allowed === []) {
            return $affiliate;
        }

        return $this->transaction(function () use ($affiliate, $allowed): Affiliate {
            if (array_key_exists('status', $allowed)) {
                User::query()->whereKey($affiliate->user_id)->update([
                    'is_active' => $allowed['status'] === AffiliateStatus::Active->value,
                ]);
            }

            $updated = $this->affiliates->update($affiliate, $allowed);
            $updated->setRelation('user', User::query()->find($affiliate->user_id));

            return $updated;
        });
    }

    private function assertAffiliate(User $user): void
    {
        if (! $user->hasRole(UserRole::Affiliate)) {
            throw new DomainException('This resource is only available to affiliates.', 403);
        }
    }
}
