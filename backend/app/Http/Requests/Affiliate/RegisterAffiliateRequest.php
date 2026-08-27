<?php

namespace App\Http\Requests\Affiliate;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class RegisterAffiliateRequest extends BaseFormRequest
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
            'alternate_phone' => ['nullable', 'string', 'max:20'],
            'payout_method' => ['nullable', 'string', Rule::in(['bank_transfer', 'upi'])],
            'payout_account_name' => ['nullable', 'string', 'max:120'],
            'payout_account_number' => ['nullable', 'string', 'max:64'],
            'payout_ifsc_or_upi' => ['nullable', 'string', 'max:64'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
    }
}
