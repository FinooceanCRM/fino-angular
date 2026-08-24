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

            // ---- Form 26-derived conditional fields (all optional at the
            // Laravel-validation layer; the frontend enforces which of these
            // are actually required for a given loan type/employment type
            // combination via lead-form.component.ts's own logic). ----
            'details.type_of_salary' => ['nullable', 'string', Rule::in(['account_salary', 'cash_salary'])],
            'details.type_of_account_salary' => ['nullable', 'string', Rule::in(['neft_rtgs', 'upi_transfer', 'cheque'])],
            'details.gross_salary' => ['nullable', 'numeric', 'min:0'],
            'details.min_income_turnover' => ['nullable', 'numeric', 'min:0'],
            'details.home_loan_purpose' => ['nullable', 'string', Rule::in([
                'home_purchase', 'home_construction', 'home_improvement_extension', 'home_loan_balance_transfer',
            ])],
            'details.construction_status' => ['nullable', 'string', Rule::in([
                'ready_to_move', 'under_construction', 'not_yet_started',
            ])],
            'details.collateral_available' => ['nullable', 'string', Rule::in(['yes', 'no'])],
            'details.collateral_type' => ['nullable', 'string', Rule::in([
                'residential_property', 'commercial_property', 'fd_insurance_policy', 'other',
            ])],
            'details.collateral_market_value' => ['nullable', 'numeric', 'min:0'],
            'details.home_loan_checklist' => ['nullable', 'array'],
            'details.home_loan_checklist.*' => ['string', 'max:64'],
            'details.ownership_documents' => ['nullable', 'array'],
            'details.ownership_documents.*' => ['string', 'max:64'],
        ];
    }
}
