<?php

namespace App\Http\Resources;

use App\Models\Affiliate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Affiliate
 */
class AffiliateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => (new UserResource($this->user))->resolve($request),
            'referral_code' => $this->referral_code,
            'commission_rate' => $this->commission_rate !== null ? (float) $this->commission_rate : null,
            'status' => $this->status->value,
            'status_label' => $this->statusEnum()->label(),
            'status_colour' => $this->statusEnum()->colour(),
            'email_verified_at' => optional($this->email_verified_at)->toIso8601String(),
            'alternate_phone' => $this->alternate_phone,
            'payout_method' => $this->payout_method,
            'payout_account_name' => $this->payout_account_name,
            'payout_account_number' => $this->payout_account_number,
            'payout_ifsc_or_upi' => $this->payout_ifsc_or_upi,
            'joined_at' => optional($this->joined_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            // Only set by AffiliateService::listForAdmin() (via
            // EloquentAffiliateRepository::paginateAll()) — null on every
            // other path (self-service profile), where these aggregates
            // are unnecessary and would cost an extra query per read.
            'referral_count' => $this->referral_count,
            'converted_count' => $this->converted_count,
            'commission_accrued' => $this->commission_accrued,
            'commission_paid' => $this->commission_paid,
        ];
    }
}
