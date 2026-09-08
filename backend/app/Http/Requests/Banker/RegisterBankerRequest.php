<?php

namespace App\Http\Requests\Banker;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

/**
 * Public "Join as Banker" signup. Mirrors {@see \App\Http\Requests\Vendor\RegisterVendorRequest}
 * — the full field set from the registration form: personal details, the
 * bank's branch details, the loan products the banker handles (multi-select)
 * and the reporting manager's contact.
 *
 * Only City/State, email, password (+ confirmation) and country are marked
 * required on the form; `name` and `phone` are also required here because
 * the account identity and the OTP delivery both depend on them.
 */
class RegisterBankerRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Personal — "User Registration Fields" block.
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:180', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'max:100', 'confirmed'],
            // The number the OTP is sent to.
            'phone' => ['required', 'string', 'regex:/^[0-9]{10,15}$/'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'regex:/^$|^[0-9]{4,10}$/'],
            'country' => ['required', 'string', 'max:100'],
            'pan_number' => ['nullable', 'string', 'regex:/^$|^[A-Za-z0-9]{10}$/'],

            // Bank — "Bank Details" block.
            'bank_name' => ['nullable', 'string', 'max:190'],
            'branch_address' => ['nullable', 'string', 'max:190'],
            'branch_location' => ['nullable', 'string', 'max:190'],
            'bank_city' => ['nullable', 'string', 'max:100'],
            'bank_state' => ['nullable', 'string', 'max:100'],

            // Products the banker handles — "Product" block, multi-select.
            'products' => ['nullable', 'array'],
            'products.*' => ['string', Rule::in(array_keys(config('bankers.products')))],

            // Reporting manager — "Manager Details" block.
            'manager_name' => ['nullable', 'string', 'max:150'],
            'manager_email' => ['nullable', 'email', 'max:180'],
            'manager_phone' => ['nullable', 'string', 'max:20'],
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
            'products.*.in' => 'One of the selected products is not recognised.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }

        if (is_string($this->input('manager_email')) && $this->input('manager_email') !== '') {
            $this->merge(['manager_email' => mb_strtolower(trim($this->input('manager_email')))]);
        }

        if ($this->has('phone') && is_string($this->input('phone'))) {
            $this->merge(['phone' => preg_replace('/[^0-9]/', '', $this->input('phone'))]);
        }

        if ($this->has('pan_number') && is_string($this->input('pan_number'))) {
            $this->merge(['pan_number' => strtoupper(trim($this->input('pan_number')))]);
        }
    }
}
