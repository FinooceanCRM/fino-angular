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
            'user' => (new UserResource($this->whenLoaded('user')))->resolve($request),
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
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
