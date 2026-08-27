<?php

namespace App\Repositories;

use App\Enums\ConnectorCommissionStatus;
use App\Enums\ConnectorStatus;
use App\Enums\LeadStatus;
use App\Models\Connector;
use App\Models\ConnectorCommission;
use App\Models\LoanLead;
use App\Models\User;
use App\Repositories\Contracts\ConnectorRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentConnectorRepository implements ConnectorRepositoryInterface
{
    /** Characters excludes visually ambiguous ones: 0/O, 1/I/L. */
    private const REFERRAL_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    private const REFERRAL_CODE_LENGTH = 8;

    public function findByUser(User $user): ?Connector
    {
        return Connector::query()->where('user_id', $user->id)->first();
    }

    /**
     * A connector created directly by a Super Admin (via the generic
     * /users endpoint) has no connectors row until this first read —
     * unlike a self-registered one, which always has one from
     * ConnectorRegistrationService::register(). An admin-created connector
     * is already `users.is_active = true` with no verification step, so
     * the auto-provisioned row is backfilled as already `active` (not the
     * new-row default `pending_verification`) with its own referral code,
     * so invite functionality works for them too.
     */
    public function firstOrCreateForUser(User $user): Connector
    {
        $connector = Connector::query()->firstOrCreate(['user_id' => $user->id], [
            'referral_code' => $this->generateUniqueReferralCode(),
            'status' => ConnectorStatus::Active->value,
            'phone_verified_at' => now(),
            'joined_at' => now(),
        ]);
        $connector->setRelation('user', $user);

        return $connector;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Connector $connector, array $attributes): Connector
    {
        $connector->fill($attributes)->save();

        return $connector->refresh();
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function referralsFor(Connector $connector, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Connector::query()
            ->where('referred_by_connector_id', $connector->user_id)
            ->with('user:id,name,email,phone,is_active');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * @return array{total: int, converted: int}
     */
    public function referredLeadCounts(Connector $connector): array
    {
        $base = LoanLead::query()->where('connector_id', $connector->user_id);

        return [
            'total' => (clone $base)->count(),
            'converted' => (clone $base)->where('status', LeadStatus::Disbursed->value)->count(),
        ];
    }

    /**
     * @return array{accrued: float, paid: float, pending_payout: float}
     */
    public function commissionTotals(Connector $connector): array
    {
        $base = ConnectorCommission::query()->where('connector_id', $connector->user_id);

        return [
            'accrued' => (float) (clone $base)
                ->whereIn('status', [ConnectorCommissionStatus::Accrued->value, ConnectorCommissionStatus::Paid->value])
                ->sum('commission_amount'),
            'paid' => (float) (clone $base)->where('status', ConnectorCommissionStatus::Paid->value)->sum('commission_amount'),
            'pending_payout' => (float) (clone $base)->where('status', ConnectorCommissionStatus::Accrued->value)->sum('commission_amount'),
        ];
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function commissionsFor(Connector $connector, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = ConnectorCommission::query()
            ->where('connector_id', $connector->user_id)
            ->with(['loanLead:id,reference,applicant_name', 'sourceConnector:id,name,email']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderByDesc('accrued_at')->paginate($perPage);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginateAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        // Full `user` load (not a trimmed column list) — see the same note
        // on EloquentAffiliateRepository::paginateAll() for why: a
        // ConnectorResource nesting UserResource needs role/department/etc,
        // which a trimmed select would leave null and crash on.
        $query = Connector::query()->with('user')->with('referredBy:id,name,email');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->whereHas('user', function ($q) use ($search): void {
                $q->where('name', 'like', $search)->orWhere('email', 'like', $search);
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

        $paginator->getCollection()->each(function (Connector $connector): void {
            $leadCounts = $this->referredLeadCounts($connector);
            $commissionTotals = $this->commissionTotals($connector);

            $connector->setAttribute('referral_count', $leadCounts['total']);
            $connector->setAttribute('converted_count', $leadCounts['converted']);
            $connector->setAttribute('commission_accrued', $commissionTotals['accrued']);
            $connector->setAttribute('commission_paid', $commissionTotals['paid']);
            $connector->setAttribute('network_size', Connector::query()
                ->where('referred_by_connector_id', $connector->user_id)->count());
        });

        return $paginator;
    }

    private function generateUniqueReferralCode(): string
    {
        $lastIndex = strlen(self::REFERRAL_CODE_ALPHABET) - 1;

        do {
            $code = '';
            for ($i = 0; $i < self::REFERRAL_CODE_LENGTH; $i++) {
                $code .= self::REFERRAL_CODE_ALPHABET[random_int(0, $lastIndex)];
            }
        } while (Connector::query()->where('referral_code', $code)->exists());

        return $code;
    }
}
