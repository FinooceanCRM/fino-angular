<?php

namespace App\Http\Requests\Bank;

use App\Enums\LoanType;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class StoreBankCriteriaRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'bank_name' => ['required', 'string', 'max:191'],
            'product_name' => ['required', 'string', 'max:191'],
            'loan_type' => ['required', Rule::in(LoanType::values())],
            'min_loan_amount' => ['required', 'numeric', 'min:0'],
            'max_loan_amount' => ['nullable', 'numeric', 'gte:min_loan_amount'],
            'min_monthly_income' => ['required', 'numeric', 'min:0'],
            'min_credit_score' => ['nullable', 'integer', 'min:0', 'max:900'],
            'min_age' => ['nullable', 'integer', 'min:18', 'max:99'],
            'max_age' => ['nullable', 'integer', 'min:18', 'max:99'],
            'employment_type' => ['nullable', 'string', 'max:64'],
            'interest_rate' => ['nullable', 'numeric', 'min:0', 'max:99.99'],
            'eligibility_rules' => ['nullable', 'array'],
            'eligibility_rules.*.field' => ['required_with:eligibility_rules', 'string', 'max:64'],
            'eligibility_rules.*.operator' => ['required_with:eligibility_rules', 'string', 'max:16'],
            'eligibility_rules.*.value' => ['nullable'],
            'eligibility_rules.*.label' => ['nullable', 'string', 'max:191'],
            'is_active' => ['boolean'],
        ];
    }
}
