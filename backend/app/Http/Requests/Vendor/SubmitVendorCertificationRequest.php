<?php

namespace App\Http\Requests\Vendor;

use App\Http\Requests\BaseFormRequest;
use App\Support\Verhoeff;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Full server-side validation for a Vendor Certification submission — a
 * faithful port of the reference app's `pages/submit.php` + the `Validator`
 * class (helpers/validation.php). Every client-side rule in the wizard is
 * mirrored here; the server is the authority.
 */
class SubmitVendorCertificationRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Step 2 — personal
            'full_name' => ['required', 'string', 'min:2', 'max:150'],
            'guardian_name' => ['required', 'string', 'min:2', 'max:150'],
            'gender' => ['required', Rule::in(['Male', 'Female', 'Other'])],
            'age' => ['required', 'integer', 'min:1', 'max:120'],
            'dob' => ['required', 'date', 'before:today'],
            'mobile' => ['required', 'regex:/^[6-9]\d{9}$/'],
            'alt_mobile' => ['nullable', 'regex:/^[6-9]\d{9}$/'],
            'email' => ['nullable', 'email', 'max:150'],
            'aadhaar_number' => ['nullable', 'regex:/^[2-9]\d{11}$/'],
            'occupation' => ['nullable', 'string', 'max:120'],
            'education' => ['nullable', 'string', 'max:80'],
            'category' => ['nullable', 'string', 'max:80'],
            'social_category' => ['required', 'string', 'max:40'],

            // Step 2 — business
            'shop_name' => ['required', 'string', 'min:2', 'max:180'],
            'business_type' => ['required', 'string', 'min:2', 'max:120'],
            'vendor_category' => ['required', 'string', 'min:2', 'max:120'],
            'years_in_business' => ['required', 'integer', 'min:0', 'max:90'],
            'ownership' => ['required', 'string', 'min:2', 'max:60'],
            'gst_number' => ['nullable', 'regex:/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/'],
            'license_number' => ['nullable', 'string', 'max:60'],
            'daily_income' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'monthly_income' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'employees' => ['nullable', 'integer', 'min:0', 'max:500'],
            'seasonal_business' => ['nullable', Rule::in(['Yes', 'No'])],
            'business_open_time' => ['nullable', 'regex:/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/'],
            'business_close_time' => ['nullable', 'regex:/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/'],
            'weekly_holiday' => ['nullable', Rule::in([
                'None', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
            ])],

            // Step 3 — location & address
            'location_mode' => ['nullable', Rule::in(['gps', 'manual'])],
            'gps_latitude' => ['required', 'numeric', 'between:-90,90'],
            'gps_longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'gps_heading' => ['nullable', 'numeric', 'between:0,360'],
            'gps_speed' => ['nullable', 'numeric', 'min:0'],
            'gps_captured_at' => ['nullable', 'string', 'max:40'],
            'location_verified' => ['nullable', 'boolean'],
            'house_no' => ['nullable', 'string', 'max:60'],
            'building' => ['nullable', 'string', 'max:150'],
            'street' => ['nullable', 'string', 'max:150'],
            'area' => ['nullable', 'string', 'max:150'],
            'village' => ['nullable', 'string', 'max:150'],
            'address' => ['required', 'string', 'min:6', 'max:500'],
            'landmark' => ['nullable', 'string', 'max:200'],
            'city' => ['required', 'string', 'min:2', 'max:120'],
            'district' => ['required', 'string', 'min:2', 'max:120'],
            'state' => ['required', 'string', 'min:2', 'max:120'],
            'pin_code' => ['required', 'regex:/^[1-9]\d{5}$/'],
            'country' => ['nullable', 'string', 'max:80'],

            // Step 5 — declarations (both must be accepted)
            'declaration_truth' => ['accepted'],
            'declaration_submit' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'mobile.regex' => 'Mobile number must be a valid 10-digit Indian mobile number.',
            'alt_mobile.regex' => 'Alternate mobile must be a valid 10-digit Indian mobile number.',
            'aadhaar_number.regex' => 'Aadhaar number must be 12 digits and cannot start with 0 or 1.',
            'gst_number.regex' => 'Please enter a valid 15-character GST number.',
            'pin_code.regex' => 'PIN code must be 6 digits.',
            'declaration_truth.accepted' => 'Please confirm that the information provided is true.',
            'declaration_submit.accepted' => 'Please agree to submit this certification.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $aadhaar = preg_replace('/\D/', '', (string) $this->input('aadhaar_number', ''));
            if ($aadhaar !== '' && ! Verhoeff::isValid($aadhaar)) {
                $validator->errors()->add(
                    'aadhaar_number',
                    'Aadhaar number failed the checksum test. Please re-check it.',
                );
            }
        });
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        foreach (['mobile', 'alt_mobile', 'aadhaar_number', 'pin_code'] as $field) {
            if (is_string($this->input($field))) {
                $merge[$field] = preg_replace('/\D/', '', $this->input($field)) ?: null;
            }
        }
        foreach (['gst_number', 'license_number'] as $field) {
            if (is_string($this->input($field)) && $this->input($field) !== '') {
                $merge[$field] = strtoupper(trim($this->input($field)));
            }
        }
        foreach (['declaration_truth', 'declaration_submit', 'location_verified'] as $field) {
            if ($this->has($field)) {
                $merge[$field] = filter_var($this->input($field), FILTER_VALIDATE_BOOLEAN);
            }
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }
}
