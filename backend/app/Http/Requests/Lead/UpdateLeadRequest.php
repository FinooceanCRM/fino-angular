<?php

namespace App\Http\Requests\Lead;

use App\Enums\LoanType;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'applicant_name' => ['sometimes', 'string', 'max:191'],
            'applicant_email' => ['nullable', 'email', 'max:191'],
            'applicant_phone' => ['sometimes', 'string', 'max:32'],
            'loan_type' => ['sometimes', Rule::in(LoanType::values())],
            'loan_amount' => ['sometimes', 'numeric', 'min:1'],
            'tenure_months' => ['nullable', 'integer', 'min:1', 'max:600'],
            'monthly_income' => ['nullable', 'numeric', 'min:0'],
            'credit_score' => ['nullable', 'integer', 'min:0', 'max:900'],
            'employment_type' => ['nullable', 'string', 'max:64'],
            'city' => ['sometimes', 'string', 'max:128'],
            'state' => ['sometimes', 'string', 'max:128'],
            'pincode' => ['nullable', 'string', 'max:12'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'details' => ['nullable', 'array'],

            // ---- LeadApplicantDetails fields; see StoreLeadRequest for the
            // same rules and rationale (kept in sync). A field missing a rule
            // here is silently dropped by validated() before it ever reaches
            // LeadService, so every key the frontend can send under `details`
            // must be listed. ----
            'details.gender' => ['nullable', 'string', Rule::in(['male', 'female', 'other'])],
            'details.dob' => ['nullable', 'date'],
            'details.alternative_phone' => ['nullable', 'string', 'max:32'],
            'details.age' => ['nullable', 'integer', 'min:18', 'max:75'],
            'details.marital_status' => ['nullable', 'string', Rule::in(['single', 'married', 'divorced', 'widowed'])],
            'details.caste_category' => ['nullable', 'string', Rule::in(['general', 'obc', 'sc', 'st', 'other'])],
            'details.company_name' => ['nullable', 'string', 'max:191'],
            'details.net_salary' => ['nullable', 'numeric', 'min:0'],
            'details.salary_account_type' => ['nullable', 'string', Rule::in(['savings', 'current', 'neft', 'imps', 'cheque'])],
            'details.purpose_of_loan' => ['nullable', 'string', Rule::in([
                'debt_consolidation', 'medical_emergency', 'wedding', 'travel', 'home_renovation',
                'vehicle_purchase', 'business_mudra', 'education', 'other',
            ])],
            'details.gst_number' => ['nullable', 'string', 'max:15'],
            'details.insurance_type' => ['nullable', 'string', Rule::in(['none', 'life', 'health', 'property'])],
            'details.car_type' => ['nullable', 'string', Rule::in(['new_car', 'used_car'])],
            'details.mudra_loan_type' => ['nullable', 'string', Rule::in(['shishu', 'kishor', 'tarun'])],
            'details.landmark' => ['nullable', 'string', 'max:191'],
            'details.current_address' => ['nullable', 'string', 'max:500'],
            'details.residential_type' => ['nullable', 'string', Rule::in(['owned', 'rented', 'parental', 'company_provided', 'other'])],
            'details.since_resident' => ['nullable', 'string', 'max:50'],
            'details.property_type' => ['nullable', 'string', Rule::in([
                'new_purchase', 'resale', 'under_construction', 'plot_purchase', 'construction', 'extension',
            ])],
            'details.lap_property_type' => ['nullable', 'string', Rule::in([
                'residential', 'commercial', 'semi_commercial', 'under_construction',
            ])],
            'details.balance_transfer_type' => ['nullable', 'string', Rule::in([
                'none', 'home_loan', 'lap', 'personal_loan', 'business_loan',
            ])],
            'details.balance_transfer_loan_amount' => ['nullable', 'numeric', 'min:0'],
            'details.topup_loan_amount' => ['nullable', 'numeric', 'min:0'],

            // ---- Form 26-derived conditional fields. ----
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
