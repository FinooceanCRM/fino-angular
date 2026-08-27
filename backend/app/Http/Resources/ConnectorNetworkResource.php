<?php

namespace App\Http\Resources;

use App\Models\Connector;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A connector's own view of ONE direct referral in their network.
 * Deliberately lighter than ConnectorProfileResource: a sub-connector's
 * PAN/GST/payout bank details are private to them and their own
 * inviter/admin has no business seeing them here.
 *
 * @mixin Connector
 */
class ConnectorNetworkResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
                'is_active' => (bool) $this->user->is_active,
            ],
            'referral_code' => $this->referral_code,
            'status' => $this->status->value,
            'status_label' => $this->statusEnum()->label(),
            'status_colour' => $this->statusEnum()->colour(),
            'joined_at' => optional($this->joined_at)->toIso8601String(),
        ];
    }
}
