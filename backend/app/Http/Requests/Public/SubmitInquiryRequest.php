<?php

namespace App\Http\Requests\Public;

use App\Enums\LoanType;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

/** Public website inquiry (anonymous, or authenticated as a customer). */
class SubmitInquiryRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'applicant_name' => ['required', 'string', 'min:2', 'max:191'],
            'applicant_phone' => ['required', 'string', 'regex:/^[0-9+\-\s()]{10,16}$/'],
            'applicant_email' => ['nullable', 'email', 'max:191'],
            'product' => ['nullable', 'string', 'max:64', 'required_without:loan_type'],
            'loan_type' => ['nullable', Rule::in(LoanType::values()), 'required_without:product'],
            'loan_amount' => ['required', 'numeric', 'min:1000', 'max:1000000000'],
            'tenure_months' => ['nullable', 'integer', 'min:3', 'max:360'],
            'monthly_income' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'existing_emi' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'employment_type' => ['nullable', Rule::in(['salaried', 'self_employed', 'business', 'professional', 'other'])],
            'city' => ['required', 'string', 'max:128'],
            'consent' => ['accepted'],
            'idempotency_key' => ['nullable', 'string', 'max:64'],
            'captcha_token' => ['nullable', 'string'],
            // Honeypot — see PublicLeadIntakeService for why this is not rejected here.
            'website' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'applicant_phone.regex' => 'Enter a valid mobile number.',
            'consent.accepted' => 'Please agree to be contacted about your request.',
        ];
    }
}
