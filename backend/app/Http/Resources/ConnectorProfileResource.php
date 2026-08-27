<?php

namespace App\Http\Resources;

use App\Models\Connector;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Connector
 */
class ConnectorProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => (new UserResource($this->user))->resolve($request),
            'company_name' => $this->company_name,
            'contact_person' => $this->contact_person,
            'alternate_phone' => $this->alternate_phone,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'pincode' => $this->pincode,
            'pan_number' => $this->pan_number,
            'gst_number' => $this->gst_number,
            'referral_code' => $this->referral_code,
            'referred_by' => $this->whenLoaded('referredBy', fn () => $this->referredBy ? [
                'id' => $this->referredBy->id,
                'name' => $this->referredBy->name,
                'email' => $this->referredBy->email,
            ] : null),
            'commission_rate' => $this->commission_rate !== null ? (float) $this->commission_rate : null,
            'status' => $this->status?->value,
            'status_label' => $this->status ? $this->statusEnum()->label() : null,
            'status_colour' => $this->status ? $this->statusEnum()->colour() : null,
            'phone_verified_at' => optional($this->phone_verified_at)->toIso8601String(),
            'joined_at' => optional($this->joined_at)->toIso8601String(),
            'payout_method' => $this->payout_method,
            'payout_account_name' => $this->payout_account_name,
            'payout_account_number' => $this->payout_account_number,
            'payout_ifsc_or_upi' => $this->payout_ifsc_or_upi,
            // Only set by ConnectorService::listForAdmin() (via
            // EloquentConnectorRepository::paginateAll()) — null on every
            // other path, where these aggregates aren't computed.
            'referral_count' => $this->referral_count,
            'converted_count' => $this->converted_count,
            'commission_accrued' => $this->commission_accrued,
            'commission_paid' => $this->commission_paid,
            'network_size' => $this->network_size,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
