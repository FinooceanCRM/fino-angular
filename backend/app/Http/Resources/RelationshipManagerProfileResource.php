<?php

namespace App\Http\Resources;

use App\Models\RelationshipManager;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin RelationshipManager
 */
class RelationshipManagerProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => (new UserResource($this->user))->resolve($request),
            'rm_code' => $this->rm_code,
            'designation' => $this->designation,
            'branch' => $this->branch,
            'region' => $this->region,
            'date_of_joining' => $this->date_of_joining?->toDateString(),
            'alternate_phone' => $this->alternate_phone,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'pincode' => $this->pincode,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
