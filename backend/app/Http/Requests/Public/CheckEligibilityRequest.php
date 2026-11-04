<?php

namespace App\Http\Requests\Public;

use App\Enums\LoanType;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class CheckEligibilityRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'product' => ['nullable', 'string', 'max:64', 'required_without:loan_type'],
            'loan_type' => ['nullable', Rule::in(LoanType::values()), 'required_without:product'],
            'loan_amount' => ['required', 'numeric', 'min:1000', 'max:1000000000'],
            'tenure_months' => ['nullable', 'integer', 'min:3', 'max:360'],
            'monthly_income' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'existing_emi' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'employment_type' => ['nullable', Rule::in(['salaried', 'self_employed', 'business', 'professional', 'other'])],
        ];
    }
}
