<?php

namespace App\Http\Resources;

use App\Models\VendorCertification;
use App\Services\VendorCertificationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin VendorCertification
 */
class VendorCertificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $columns = [
            'full_name', 'guardian_name', 'gender', 'age', 'mobile', 'alt_mobile', 'email',
            'aadhaar_number', 'occupation', 'education', 'category', 'social_category',
            'shop_name', 'business_type', 'vendor_category', 'years_in_business', 'ownership',
            'gst_number', 'license_number', 'employees', 'seasonal_business', 'weekly_holiday',
            'gps_heading', 'gps_speed', 'location_mode',
            'house_no', 'building', 'street', 'area', 'village', 'address', 'landmark',
            'city', 'district', 'state', 'pin_code', 'country',
            'declaration_truth', 'declaration_submit', 'remarks',
        ];

        $data = [
            'id' => $this->id,
            'certificate_number' => $this->certificate_number,
            'status' => $this->status?->value,
            'status_label' => $this->status ? $this->statusEnum()->label() : null,
            'status_colour' => $this->status ? $this->statusEnum()->colour() : null,

            'dob' => $this->dob?->toDateString(),
            'daily_income' => $this->daily_income !== null ? (float) $this->daily_income : null,
            'monthly_income' => $this->monthly_income !== null ? (float) $this->monthly_income : null,
            'business_open_time' => $this->business_open_time,
            'business_close_time' => $this->business_close_time,

            'gps_latitude' => $this->gps_latitude !== null ? (float) $this->gps_latitude : null,
            'gps_longitude' => $this->gps_longitude !== null ? (float) $this->gps_longitude : null,
            'accuracy' => $this->accuracy !== null ? (float) $this->accuracy : null,
            'gps_captured_at' => $this->gps_captured_at?->toIso8601String(),
            'location_verified' => (bool) $this->location_verified,

            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            'images' => VendorCertificationImageResource::collection(
                $this->whenLoaded('images', fn () => $this->images, collect()),
            ),
        ];

        foreach ($columns as $column) {
            $data[$column] = $this->{$column};
        }

        // Certificate metadata is only meaningful once submitted.
        if ($this->certificate_number !== null) {
            $data['certificate'] = app(VendorCertificationService::class)
                ->certificateData($this->resource);
        }

        return $data;
    }
}
