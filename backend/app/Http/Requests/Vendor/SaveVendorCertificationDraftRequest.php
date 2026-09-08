<?php

namespace App\Http\Requests\Vendor;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

/**
 * A draft is not a submission — nothing here is *required*. These rules only
 * keep obviously malformed values out of the row; the real gate is
 * {@see SubmitVendorCertificationRequest}. Mirrors the reference app's
 * `helpers/draft.php`, which stored whatever scalar fields were posted.
 */
class SaveVendorCertificationDraftRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // personal
            'full_name' => ['nullable', 'string', 'max:150'],
            'guardian_name' => ['nullable', 'string', 'max:150'],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'age' => ['nullable', 'integer', 'min:0', 'max:120'],
            'dob' => ['nullable', 'date'],
            'mobile' => ['nullable', 'string', 'max:15'],
            'alt_mobile' => ['nullable', 'string', 'max:15'],
            'email' => ['nullable', 'string', 'max:150'],
            'aadhaar_number' => ['nullable', 'string', 'max:20'],
            'occupation' => ['nullable', 'string', 'max:120'],
            'education' => ['nullable', 'string', 'max:80'],
            'category' => ['nullable', 'string', 'max:80'],
            'social_category' => ['nullable', 'string', 'max:40'],

            // business
            'shop_name' => ['nullable', 'string', 'max:180'],
            'business_type' => ['nullable', 'string', 'max:120'],
            'vendor_category' => ['nullable', 'string', 'max:120'],
            'years_in_business' => ['nullable', 'integer', 'min:0', 'max:120'],
            'ownership' => ['nullable', 'string', 'max:60'],
            'gst_number' => ['nullable', 'string', 'max:30'],
            'license_number' => ['nullable', 'string', 'max:60'],
            'daily_income' => ['nullable', 'numeric', 'min:0'],
            'monthly_income' => ['nullable', 'numeric', 'min:0'],
            'employees' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'seasonal_business' => ['nullable', Rule::in(['Yes', 'No'])],
            'business_open_time' => ['nullable', 'string', 'max:8'],
            'business_close_time' => ['nullable', 'string', 'max:8'],
            'weekly_holiday' => ['nullable', 'string', 'max:20'],

            // location / gps
            'gps_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'gps_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'gps_heading' => ['nullable', 'numeric'],
            'gps_speed' => ['nullable', 'numeric'],
            'gps_captured_at' => ['nullable', 'string', 'max:40'],
            'location_verified' => ['nullable', 'boolean'],
            'location_mode' => ['nullable', Rule::in(['gps', 'manual'])],

            // address
            'house_no' => ['nullable', 'string', 'max:60'],
            'building' => ['nullable', 'string', 'max:150'],
            'street' => ['nullable', 'string', 'max:150'],
            'area' => ['nullable', 'string', 'max:150'],
            'village' => ['nullable', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'landmark' => ['nullable', 'string', 'max:200'],
            'city' => ['nullable', 'string', 'max:120'],
            'district' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'pin_code' => ['nullable', 'string', 'max:10'],
            'country' => ['nullable', 'string', 'max:80'],

            // declarations
            'declaration_truth' => ['nullable', 'boolean'],
            'declaration_submit' => ['nullable', 'boolean'],
        ];
    }
}
