<?php

namespace App\Http\Resources;

use App\Models\AffiliatePayout;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AffiliatePayout
 */
class AffiliatePayoutResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'affiliate' => $this->userSummary($this->whenLoaded('affiliate')),
            'amount' => (float) $this->amount,
            'method' => $this->method,
            'status' => $this->status->value,
            'status_label' => $this->statusEnum()->label(),
            'status_colour' => $this->statusEnum()->colour(),
            'failure_reason' => $this->failure_reason,
            'requested_at' => optional($this->requested_at)->toIso8601String(),
            'processed_at' => optional($this->processed_at)->toIso8601String(),
            'processed_by' => $this->userSummary($this->whenLoaded('processedBy')),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function userSummary(mixed $user): ?array
    {
        if (! $user instanceof User) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }
}
