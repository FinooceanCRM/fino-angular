<?php

namespace App\Http\Requests\Affiliate;

use App\Http\Requests\BaseFormRequest;
use App\Models\Affiliate;
use Illuminate\Validation\Rule;

class UpdateAffiliateProfileRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->can('updateOwnProfile', Affiliate::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:150'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],

            'alternate_phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'payout_method' => ['sometimes', 'nullable', 'string', Rule::in(['bank_transfer', 'upi'])],
            'payout_account_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'payout_account_number' => ['sometimes', 'nullable', 'string', 'max:64'],
            'payout_ifsc_or_upi' => ['sometimes', 'nullable', 'string', 'max:64'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Blank optional inputs from the Angular form are stored as NULL.
        $nullable = [
            'phone', 'alternate_phone', 'payout_account_name',
            'payout_account_number', 'payout_ifsc_or_upi',
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
