<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateMatchingEngineSettingsRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'min_cibil_score' => ['required', 'integer', 'min:300', 'max:900'],
            'min_match_score' => ['required', 'integer', 'min:0', 'max:100'],
            'auto_run_on_create' => ['required', 'boolean'],

            'enabled_loan_types' => ['required', 'array'],
            'enabled_loan_types.*' => ['string', 'max:64'],

            'loan_amount_limits' => ['required', 'array'],
            'loan_amount_limits.*.loan_type' => ['required', 'string', 'max:64'],
            'loan_amount_limits.*.min_amount' => ['required', 'numeric', 'min:0'],
            'loan_amount_limits.*.max_amount' => ['required', 'numeric', 'gte:loan_amount_limits.*.min_amount'],

            'city_mapping' => ['required', 'array'],
            'city_mapping.*.city' => ['required', 'string', 'max:191'],
            'city_mapping.*.state' => ['required', 'string', 'max:191'],
            'city_mapping.*.tier' => ['required', Rule::in(['Tier 1', 'Tier 2', 'Tier 3'])],
            'city_mapping.*.serviceable' => ['required', 'boolean'],
        ];
    }
}
