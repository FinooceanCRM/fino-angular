<?php

namespace App\Http\Requests\Banker;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateBankerProfileRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->can('updateOwnProfile', \App\Models\Banker::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:150'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],

            'first_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'pan_number' => ['sometimes', 'nullable', 'string', 'regex:/^$|^[A-Za-z0-9]{10}$/'],

            'bank_name' => ['sometimes', 'nullable', 'string', 'max:190'],
            'branch' => ['sometimes', 'nullable', 'string', 'max:150'],
            'branch_address' => ['sometimes', 'nullable', 'string', 'max:190'],
            'branch_location' => ['sometimes', 'nullable', 'string', 'max:190'],
            'bank_city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'bank_state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'designation' => ['sometimes', 'nullable', 'string', 'max:150'],
            'employee_code' => ['sometimes', 'nullable', 'string', 'max:40'],

            'products' => ['sometimes', 'nullable', 'array'],
            'products.*' => ['string', Rule::in(array_keys(config('bankers.products')))],

            'manager_name' => ['sometimes', 'nullable', 'string', 'max:150'],
            'manager_email' => ['sometimes', 'nullable', 'email', 'max:180'],
            'manager_phone' => ['sometimes', 'nullable', 'string', 'max:20'],

            'alternate_phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'address_line1' => ['sometimes', 'nullable', 'string', 'max:190'],
            'address_line2' => ['sometimes', 'nullable', 'string', 'max:190'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'pincode' => ['sometimes', 'nullable', 'string', 'regex:/^[0-9]{4,10}$/'],
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
        // Blank optional inputs from the Angular form are stored as NULL.
        $nullable = [
            'phone', 'first_name', 'last_name', 'country', 'pan_number',
            'bank_name', 'branch', 'branch_address', 'branch_location',
            'bank_city', 'bank_state', 'designation', 'employee_code',
            'manager_name', 'manager_email', 'manager_phone',
            'alternate_phone', 'address_line1', 'address_line2', 'city',
            'state', 'pincode',
        ];

        $blanked = [];
        foreach ($nullable as $field) {
            if ($this->has($field) && is_string($this->input($field)) && trim($this->input($field)) === '') {
                $blanked[$field] = null;
            }
        }

        if (is_string($this->input('pan_number')) && $this->input('pan_number') !== '') {
            $blanked['pan_number'] = strtoupper(trim($this->input('pan_number')));
        }

        if (is_string($this->input('manager_email')) && $this->input('manager_email') !== '') {
            $blanked['manager_email'] = mb_strtolower(trim($this->input('manager_email')));
        }

        if ($blanked !== []) {
            $this->merge($blanked);
        }
    }
}
