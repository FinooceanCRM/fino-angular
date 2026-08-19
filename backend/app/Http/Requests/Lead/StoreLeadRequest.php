<?php

namespace App\Http\Requests\Lead;

use App\Enums\LoanType;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class StoreLeadRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'applicant_name' => ['required', 'string', 'max:191'],
            'applicant_email' => ['nullable', 'email', 'max:191'],
            'applicant_phone' => ['required', 'string', 'max:32'],
            'loan_type' => ['required', Rule::in(LoanType::values())],
            'loan_amount' => ['required', 'numeric', 'min:1'],
            'tenure_months' => ['nullable', 'integer', 'min:1', 'max:600'],
            'monthly_income' => ['nullable', 'numeric', 'min:0'],
            'credit_score' => ['nullable', 'integer', 'min:0', 'max:900'],
            'employment_type' => ['nullable', 'string', 'max:64'],
            'city' => ['required', 'string', 'max:128'],
            'state' => ['required', 'string', 'max:128'],
            'pincode' => ['nullable', 'string', 'max:12'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'details' => ['nullable', 'array'],
        ];
    }
}
