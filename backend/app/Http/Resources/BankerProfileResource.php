<?php

namespace App\Http\Resources;

use App\Models\Banker;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Banker
 */
class BankerProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => (new UserResource($this->user))->resolve($request),
            'bank_name' => $this->bank_name,
            'branch' => $this->branch,
            'designation' => $this->designation,
            'employee_code' => $this->employee_code,
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
