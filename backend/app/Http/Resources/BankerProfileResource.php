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
        $productLabels = config('bankers.products');

        return [
            'id' => $this->id,
            'user' => (new UserResource($this->user))->resolve($request),

            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'country' => $this->country,
            'pan_number' => $this->pan_number,

            'bank_name' => $this->bank_name,
            'branch' => $this->branch,
            'branch_address' => $this->branch_address,
            'branch_location' => $this->branch_location,
            'bank_city' => $this->bank_city,
            'bank_state' => $this->bank_state,
            'designation' => $this->designation,
            'employee_code' => $this->employee_code,

            'products' => array_values($this->products ?? []),
            'product_labels' => array_values(array_map(
                static fn (string $key): string => $productLabels[$key] ?? $key,
                $this->products ?? [],
            )),

            'manager_name' => $this->manager_name,
            'manager_email' => $this->manager_email,
            'manager_phone' => $this->manager_phone,

            'alternate_phone' => $this->alternate_phone,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'pincode' => $this->pincode,

            'status' => $this->statusEnum()->value,
            'status_label' => $this->statusEnum()->label(),
            'phone_verified_at' => $this->phone_verified_at?->toIso8601String(),
            'joined_at' => $this->joined_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
