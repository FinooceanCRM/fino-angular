<?php

namespace App\Http\Requests\Vendor;

use App\Http\Requests\BaseFormRequest;
use App\Http\Requests\Connector\RegisterConnectorRequest;
use Illuminate\Validation\Rule;

/**
 * Public "Join as Vendor" signup. Mirrors {@see RegisterConnectorRequest}
 * — trimmed to the fields a vendor needs (no payout details, no referral
 * invite code).
 */
class RegisterVendorRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'max:100', 'confirmed'],
            // The number the OTP is sent to — distinct from alternate_phone
            // below (an optional secondary contact number).
            'phone' => ['required', 'string', 'regex:/^[0-9]{10,15}$/'],
            'business_name' => ['required', 'string', 'max:190'],
            'contact_person' => ['nullable', 'string', 'max:150'],
            'alternate_phone' => ['nullable', 'string', 'max:20'],
            'address_line1' => ['nullable', 'string', 'max:190'],
            'address_line2' => ['nullable', 'string', 'max:190'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'regex:/^$|^[0-9]{4,10}$/'],
            'pan_number' => ['nullable', 'string', 'regex:/^$|^[A-Za-z0-9]{10}$/'],
            'gst_number' => ['nullable', 'string', 'max:20'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a valid phone number (10 to 15 digits).',
            'pincode.regex' => 'The pincode must contain 4 to 10 digits.',
            'pan_number.regex' => 'The PAN number must be 10 alphanumeric characters.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }

        if ($this->has('phone') && is_string($this->input('phone'))) {
            $this->merge(['phone' => preg_replace('/[^0-9]/', '', $this->input('phone'))]);
        }

        if ($this->has('pan_number') && is_string($this->input('pan_number'))) {
            $this->merge(['pan_number' => strtoupper(trim($this->input('pan_number')))]);
        }

        if ($this->has('gst_number') && is_string($this->input('gst_number'))) {
            $this->merge(['gst_number' => strtoupper(trim($this->input('gst_number')))]);
        }
    }
}
