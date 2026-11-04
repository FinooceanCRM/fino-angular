<?php

namespace App\Http\Requests\Portal;

use App\Enums\LoanType;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

/** Loan application from inside the customer portal (name/email are pre-filled from the account and may be changed). */
class ApplyRequest extends BaseFormRequest
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
            'city' => ['required', 'string', 'max:128'],
            'applicant_phone' => ['nullable', 'string', 'regex:/^[0-9+\-\s()]{10,16}$/'],
            // Pre-filled from the account by the form; the customer may change them for this application.
            'applicant_name' => ['nullable', 'string', 'min:2', 'max:150'],
            'applicant_email' => ['nullable', 'email', 'max:190'],
            'update_profile' => ['nullable', 'boolean'],
            'consent' => ['accepted'],
            'idempotency_key' => ['nullable', 'string', 'max:64'],
            'otp_token' => ['nullable', 'string', 'max:64'],
            // Extra details collected by the step-by-step application. All optional.
            'applicant' => ['nullable', 'array'],
            'applicant.dob' => ['nullable', 'date', 'before_or_equal:-18 years', 'after:1900-01-01'],
            'applicant.gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'applicant.marital_status' => ['nullable', Rule::in(['single', 'married', 'divorced', 'widowed'])],
            'applicant.pan' => ['nullable', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/'],
            'applicant.aadhaar' => ['nullable', 'digits:12'],
            'employment' => ['nullable', 'array'],
            'employment.company' => ['nullable', 'string', 'max:150'],
            'employment.designation' => ['nullable', 'string', 'max:100'],
            'employment.experience_years' => ['nullable', 'numeric', 'min:0', 'max:60'],
            'employment.office_address' => ['nullable', 'string', 'max:255'],
            'loan' => ['nullable', 'array'],
            'loan.purpose' => ['nullable', 'string', 'max:64'],
            'loan.has_existing_loans' => ['nullable', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $applicant = (array) $this->input('applicant', []);
        if (isset($applicant['pan']) && is_string($applicant['pan'])) {
            $applicant['pan'] = strtoupper(trim($applicant['pan']));
        }
        if (isset($applicant['aadhaar']) && is_string($applicant['aadhaar'])) {
            $applicant['aadhaar'] = preg_replace('/[\s-]+/', '', $applicant['aadhaar']);
        }
        if ($applicant !== []) {
            $this->merge(['applicant' => $applicant]);
        }
    }
}
