<?php

namespace App\Http\Requests\Public;

use App\Enums\LoanType;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class SubmitPublicLeadRequest extends BaseFormRequest
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
            'city' => ['required', 'string', 'max:128'],
            'referral_code' => ['nullable', 'string', 'max:32'],
            'captcha_token' => ['required', 'string'],
            // Honeypot: real visitors never see this field, so it must
            // arrive empty. Deliberately no "must be blank" validation rule
            // here — a bot that DOES fill it still has to sail through
            // validation so PublicLeadIntakeService can silently drop the
            // submission (still 201) without tipping the bot off.
            'website' => ['nullable', 'string', 'max:255'],
        ];
    }
}
