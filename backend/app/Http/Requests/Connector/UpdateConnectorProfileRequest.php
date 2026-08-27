<?php

namespace App\Http\Requests\Connector;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateConnectorProfileRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->can('updateOwnProfile', \App\Models\Connector::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:150'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],

            'company_name' => ['sometimes', 'nullable', 'string', 'max:190'],
            'contact_person' => ['sometimes', 'nullable', 'string', 'max:150'],
            'alternate_phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'address_line1' => ['sometimes', 'nullable', 'string', 'max:190'],
            'address_line2' => ['sometimes', 'nullable', 'string', 'max:190'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'pincode' => ['sometimes', 'nullable', 'string', 'regex:/^[0-9]{4,10}$/'],
            'pan_number' => ['sometimes', 'nullable', 'string', 'regex:/^[A-Za-z0-9]{10}$/'],
            'gst_number' => ['sometimes', 'nullable', 'string', 'max:20'],
            'payout_method' => ['sometimes', 'nullable', 'string', Rule::in(['bank_transfer', 'upi'])],
            'payout_account_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'payout_account_number' => ['sometimes', 'nullable', 'string', 'max:64'],
            'payout_ifsc_or_upi' => ['sometimes', 'nullable', 'string', 'max:64'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'pincode.regex' => 'The pincode must contain 4 to 10 digits.',
            'pan_number.regex' => 'The PAN number must be 10 alphanumeric characters.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('pan_number') && is_string($this->input('pan_number'))) {
            $this->merge(['pan_number' => strtoupper(trim($this->input('pan_number')))]);
        }

        if ($this->has('gst_number') && is_string($this->input('gst_number'))) {
            $this->merge(['gst_number' => strtoupper(trim($this->input('gst_number')))]);
        }

        // Blank optional inputs from the Angular form are stored as NULL.
        $nullable = [
            'phone', 'company_name', 'contact_person', 'alternate_phone',
            'address_line1', 'address_line2', 'city', 'state',
            'pincode', 'pan_number', 'gst_number',
            'payout_account_name', 'payout_account_number', 'payout_ifsc_or_upi',
        ];

        $blanked = [];
        foreach ($nullable as $field) {
            if ($this->has($field) && is_string($this->input($field)) && trim($this->input($field)) === '') {
                $blanked[$field] = null;
            }
        }

        if ($blanked !== []) {
            $this->merge($blanked);
        }
    }
}

