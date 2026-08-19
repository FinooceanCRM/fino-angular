<?php

namespace App\Http\Requests\Telecaller;

use App\Http\Requests\BaseFormRequest;

class UpdateTelecallerProfileRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->can('updateOwnProfile', \App\Models\Telecaller::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:150'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],

            'designation' => ['sometimes', 'nullable', 'string', 'max:150'],
            'employee_code' => ['sometimes', 'nullable', 'string', 'max:40'],
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
        ];
    }

    protected function prepareForValidation(): void
    {
        // Blank optional inputs from the Angular form are stored as NULL.
        $nullable = [
            'phone', 'designation', 'employee_code', 'alternate_phone',
            'address_line1', 'address_line2', 'city', 'state', 'pincode',
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
