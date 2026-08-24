<?php

namespace App\Http\Requests\Lead;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

/**
 * Full PD (pre-disbursement verification) data capture — Phase 6 successor.
 *
 * Recreates the ~275-field dataset the legacy WordPress Fluent Form #39
 * ('PD Form') collected. Every field is nullable: the source form had zero
 * required fields (verified against the exported form definition), and a
 * Telecaller/Manager/Super Admin may need to save partial progress. Fields
 * are grouped into the same sections as the original form for readability;
 * each key is validated individually rather than accepted as a raw blob.
 */
class SubmitPdRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // (no section)
            'LOAN_TYPE' => ['nullable', 'string', 'max:191'],
            'If__HL_' => ['nullable', 'string', 'max:191'],
            'If__LAP' => ['nullable', 'string', 'max:191'],
            'If_Commercial_Property' => ['nullable', 'string', 'max:191'],
            'If_Mudra_Loan' => ['nullable', 'string', 'max:191'],
            'If_Loan_BT_' => ['nullable', 'string', 'max:191'],
            'BT_Loan_Amount' => ['nullable', 'numeric'],
            'Top_up_Loan_Amount' => ['nullable', 'numeric'],
            'If_Insurance' => ['nullable', 'string', 'max:191'],
            'If_Car_Loan' => ['nullable', 'string', 'max:191'],
            'PURPOSE_OF_LOAN' => ['nullable', 'string', 'max:191'],
            'Mother_s_maiden_Name' => ['nullable', 'string', 'max:191'],
            'Age' => ['nullable', 'numeric'],
            'Marital_Status' => ['nullable', 'string', 'max:191'],
            'RESSIDENCIAL_TYPE' => ['nullable', 'string', 'max:191'],
            'ANY_OTHER_SPECIFY' => ['nullable', 'string', 'max:191'],
            'Caste_Category' => ['nullable', 'string', 'max:191'],
            'General_Caste' => ['nullable', 'string', 'max:191'],
            'SC_Caste' => ['nullable', 'string', 'max:191'],
            'ST_Caste' => ['nullable', 'string', 'max:191'],
            'OBC_Caste' => ['nullable', 'string', 'max:191'],
            'Specific_Caste' => ['nullable', 'string', 'max:191'],

            // APPLICANTE PERSONAL ADDRESS
            'Type_of_Current_Resident' => ['nullable', 'string', 'max:191'],
            'SINCE_RESSIBENT' => ['nullable', 'string', 'max:191'],
            'Landmark' => ['nullable', 'string', 'max:191'],

            // APPLICANTE EMPLOYMENT / BUSINESS INFORMATION
            'Type_of_Customer' => ['nullable', 'string', 'max:191'],
            'EMPLOYER_TYPE' => ['nullable', 'string', 'max:191'],
            'Type_of_Work_Contract' => ['nullable', 'string', 'max:191'],
            'Date_of_Joining' => ['nullable', 'date'],

            // APPLICANTE SALARY TYPE & BANK DETAILS
            'Type_Salary' => ['nullable', 'string', 'max:191'],
            'Bank_Salary' => ['nullable', 'string', 'max:191'],
            'Bank_Name' => ['nullable', 'string', 'max:191'],
            'Bank_Account_Number' => ['nullable', 'numeric'],
            'SALARY_DEDUCTION' => ['nullable', 'string', 'max:191'],
            'PF_Deduction_Amount' => ['nullable', 'numeric'],
            'PT_Deduction_Amount' => ['nullable', 'numeric'],
            'SOCIETY_LOAN_Deduction_Amount' => ['nullable', 'numeric'],
            'PF_LOAN_Deduction_Amount' => ['nullable', 'numeric'],
            'LIC_Deduction_Amount' => ['nullable', 'numeric'],
            'OTHER_DEDUCTION_Amount' => ['nullable', 'numeric'],
            'CURRENT_MONTH_SAL' => ['nullable', 'string', 'max:191'],
            'PREVIOUS_MONTH' => ['nullable', 'string', 'max:191'],
            '2ND_PREVIOUS_MONTH' => ['nullable', 'string', 'max:191'],

            // APPLICANTE OTHER INCOME SOURCE INFORMATION
            'Total_Income_from_other_source_salaried' => ['nullable', 'numeric'],
            'Source_name_salaried' => ['nullable', 'string', 'max:191'],
            'other_Specify__Name' => ['nullable', 'string', 'max:191'],
            'Type_of_Business' => ['nullable', 'string', 'max:191'],
            'Partnership_Business' => ['nullable', 'string', Rule::in(['YES', 'NO'])],
            'Rental_Income_Amount' => ['nullable', 'numeric'],
            'Agriculture_Income_Amount' => ['nullable', 'numeric'],
            'Pension_Amount' => ['nullable', 'numeric'],
            'Part_time_Income_Amount' => ['nullable', 'numeric'],
            'other_Specify__Amount' => ['nullable', 'numeric'],

            // APPLICANTE EMPLOYER / COMPANY INFORMATION
            'Current_Employer_Company_Name' => ['nullable', 'string', 'max:191'],

            // APPLICANTE COMPANY / EMPLOYER INFORMATION
            'Employer_Name' => ['nullable', 'string', 'max:191'],
            'Date_of_Joining_1' => ['nullable', 'date'],
            'Designation' => ['nullable', 'string', 'max:191'],
            'Department' => ['nullable', 'string', 'max:191'],
            'TOTAL_EXPIRIANCE_IN_CURRENT_COMPANY' => ['nullable', 'numeric'],

            // CURRENT COMPANY's 2 REFERENCES
            'Full_name_References_1' => ['nullable', 'string', 'max:191'],
            'Designation_1' => ['nullable', 'string', 'max:191'],
            'Department_1' => ['nullable', 'string', 'max:191'],
            'Mobile_Number' => ['nullable', 'string', 'max:32'],
            'Full_name_References_2' => ['nullable', 'string', 'max:191'],
            'Designation_2' => ['nullable', 'string', 'max:191'],
            'Department_2' => ['nullable', 'string', 'max:191'],
            'Mobile_No_2' => ['nullable', 'string', 'max:32'],

            // APPLICANTE PROFESSION INFORMATION
            'Profession_Type' => ['nullable', 'string', 'max:191'],
            'PROFESSIONAL_CERTIFICATE' => ['nullable', 'string', 'max:191'],
            'Professional_Name' => ['nullable', 'string', 'max:191'],

            // APPLICANTE PROFESSIONAL INCORPORATION & INCOME INFORMATION
            'Date_of_Incorporation_DD_MM_YY' => ['nullable', 'date'],
            'Type_of_Professional_License' => ['nullable', 'string', 'max:191'],
            'OTHER_SPECIFY_PROFESSIONAL_LICENSE' => ['nullable', 'string', 'max:191'],
            'Income_Amount_from_Profession' => ['nullable', 'numeric'],
            'Source_name' => ['nullable', 'string', 'max:191'],
            'Rental_Income_Amount_Professional' => ['nullable', 'numeric'],
            'Agriculture_Income_Amount_Professional' => ['nullable', 'numeric'],
            'Pension_Amount_Professional' => ['nullable', 'numeric'],
            'BROKRAGE_Amount_Professional' => ['nullable', 'numeric'],
            'other_Specify__Amount_Professional' => ['nullable', 'numeric'],
            'Total_Income_from_other_source_Professional' => ['nullable', 'numeric'],

            // APPLICANTE PROFESSION OFFICE INFORMATION
            'OFFICE_Premises_Type' => ['nullable', 'string', 'max:191'],
            'OTHER_SPECIFY_2' => ['nullable', 'string', 'max:191'],

            // APPLICANT's 3 YEARS ITR DETAILS
            'itr_current_date' => ['nullable', 'date'],
            'itr_current_turnover' => ['nullable', 'numeric'],
            'itr_current_income' => ['nullable', 'numeric'],
            'itr_current_depreciation' => ['nullable', 'numeric'],
            'itr_current_remark' => ['nullable', 'string', 'max:191'],
            'itr_previous_date' => ['nullable', 'date'],
            'itr_previous_turnover' => ['nullable', 'numeric'],
            'itr_previous_income' => ['nullable', 'numeric'],
            'itr_previous_depreciation' => ['nullable', 'numeric'],
            'itr_previous_remark' => ['nullable', 'string', 'max:191'],
            'itr_third_date' => ['nullable', 'date'],
            'itr_third_turnover' => ['nullable', 'numeric'],
            'itr_third_income' => ['nullable', 'numeric'],
            'itr_third_depreciation' => ['nullable', 'numeric'],
            'itr_third_remark' => ['nullable', 'string', 'max:191'],

            // FIRM 3 YEARS ITR DETAILS
            'Date_of_Filing' => ['nullable', 'date'],
            'itr_current_turnover_1' => ['nullable', 'numeric'],
            'itr_current_income_1' => ['nullable', 'numeric'],
            'itr_current_depreciation_1' => ['nullable', 'numeric'],
            'itr_current_remark_1' => ['nullable', 'string', 'max:191'],
            'Date_of_Filing_2' => ['nullable', 'date'],
            'itr_current_turnover_2' => ['nullable', 'numeric'],
            'itr_current_income_2' => ['nullable', 'numeric'],
            'itr_current_depreciation_2' => ['nullable', 'numeric'],
            'itr_current_remark_2' => ['nullable', 'string', 'max:191'],
            'Date_of_Filing_3' => ['nullable', 'date'],
            'itr_current_turnover_3' => ['nullable', 'numeric'],
            'itr_current_income_3' => ['nullable', 'numeric'],
            'itr_current_depreciation_3' => ['nullable', 'numeric'],
            'itr_current_remark_3' => ['nullable', 'string', 'max:191'],
            'Annual_Turnover_without_ITR_1' => ['nullable', 'numeric'],
            'Net_Income_without_ITR_1' => ['nullable', 'numeric'],

            // APPLICANTE's BUSINESS & PARTNER INFORMATION
            'Nature_of_Business' => ['nullable', 'string', 'max:191'],
            'BUSINESS_CATEGORY' => ['nullable', 'string', 'max:191'],
            'PARTNERSHIP' => ['nullable', 'string', Rule::in(['YES', 'NO'])],
            'Type_of_Firm' => ['nullable', 'string', 'max:191'],
            'PROPRITORSHIP_FIRM' => ['nullable', 'string', 'max:191'],
            'Pvt__Ltd__LLP_FIRM' => ['nullable', 'string', 'max:191'],
            'OPC_FIRM' => ['nullable', 'string', 'max:191'],

            // APPLICANTE BUSINESS INCORPORATION & INCOME INFORMATION
            'Business__Employement_Name' => ['nullable', 'string', 'max:191'],
            'Date_of_Incorporation' => ['nullable', 'date'],
            'Income_from_Business__Employement' => ['nullable', 'numeric'],

            // APPLICANTE'S OTHER INCOME SOURCE INFROMATION APART FROM OWNED BUSINESS
            'Total_Income_from_other_source_Business' => ['nullable', 'numeric'],
            'Other_Income_Source' => ['nullable', 'string', 'max:191'],
            'Other_Specify_Source' => ['nullable', 'string', 'max:191'],
            'Rental_Income_Amount_Business' => ['nullable', 'numeric'],
            'Agriculture_Income_Amount_Business' => ['nullable', 'numeric'],
            'Pension_Amount_Business' => ['nullable', 'numeric'],
            'other_Specify__Amount_Business' => ['nullable', 'numeric'],

            // BUSINESS OFFICE ADDRESS
            'BUSINESS_Premises_Type' => ['nullable', 'string', 'max:191'],

            // HOME / MORTGAGE / LAP LOAN PROPERTY INFORMATION 
            'Name_of_Property_Owner' => ['nullable', 'string', 'max:191'],
            'Relation_with_applicant' => ['nullable', 'string', 'max:191'],
            'Available_Property_Document' => ['nullable', 'string', 'max:191'],
            'Gaothan' => ['nullable', 'string', 'max:191'],
            'REGISTERAD_AGREEMENT_TO_SALE___REGISTERED_POWER_OF_ATORNY' => ['nullable', 'string', 'max:191'],
            'BHADEPATTA_PROPERTY' => ['nullable', 'string', 'max:191'],

            // HOME / MORTGAGE / LAP LOAN PROPERTY ADDRESS 
            'Mauza_1' => ['nullable', 'string', 'max:191'],
            'khasara_No_1' => ['nullable', 'string', 'max:191'],
            'P_H__No_1' => ['nullable', 'string', 'max:191'],
            'Survey_No_1' => ['nullable', 'string', 'max:191'],
            'Society_No__1' => ['nullable', 'string', 'max:191'],
            'Other' => ['nullable', 'string', 'max:191'],
            'Other2' => ['nullable', 'string', 'max:191'],
            'Other3' => ['nullable', 'string', 'max:191'],
            'City' => ['nullable', 'string', 'max:191'],
            'Tahsil' => ['nullable', 'string', 'max:191'],
            'District' => ['nullable', 'string', 'max:191'],
            'State' => ['nullable', 'string', 'max:191'],
            'Property_Loan_Type' => ['nullable', 'string', 'max:191'],
            'Property_Selected_' => ['nullable', 'string', 'max:191'],
            'Total_Agreement_Value' => ['nullable', 'numeric'],
            'OCR_Paid' => ['nullable', 'numeric'],
            'Source' => ['nullable', 'string', 'max:191'],
            'OCR_Balance' => ['nullable', 'numeric'],
            'Source2' => ['nullable', 'string', 'max:191'],
            'Completion_State_Of_Property' => ['nullable', 'numeric'],
            'Land_Areaa' => ['nullable', 'string', 'max:191'],
            'Built_up_Area1' => ['nullable', 'string', 'max:191'],
            'Estimated_Cost' => ['nullable', 'numeric'],
            'Land_Area' => ['nullable', 'string', 'max:191'],
            'Existing_Construction_Area' => ['nullable', 'string', 'max:191'],
            'Existing_Construction_Stage' => ['nullable', 'string', 'max:191'],
            'Proposed_Construction' => ['nullable', 'string', 'max:191'],
            'Estimated_Market_Value' => ['nullable', 'numeric'],
            'Land_Land_Sharing_Area_in_Sqft' => ['nullable', 'numeric'],
            'Built_up_Area_in_Sqft' => ['nullable', 'numeric'],

            // ---- Address groups (line1/line2/city/state/zip/country/lat/long) ----
            'Current_Residential_Address' => ['nullable', 'array'],
            'Current_Residential_Address.address_line_1' => ['nullable', 'string', 'max:191'],
            'Current_Residential_Address.address_line_2' => ['nullable', 'string', 'max:191'],
            'Current_Residential_Address.city' => ['nullable', 'string', 'max:128'],
            'Current_Residential_Address.state' => ['nullable', 'string', 'max:128'],
            'Current_Residential_Address.zip' => ['nullable', 'string', 'max:12'],
            'Current_Residential_Address.country' => ['nullable', 'string', 'max:128'],
            'Current_Residential_Address.latitude' => ['nullable', 'numeric'],
            'Current_Residential_Address.longitude' => ['nullable', 'numeric'],
            'Permanent_Address' => ['nullable', 'array'],
            'Permanent_Address.address_line_1' => ['nullable', 'string', 'max:191'],
            'Permanent_Address.address_line_2' => ['nullable', 'string', 'max:191'],
            'Permanent_Address.city' => ['nullable', 'string', 'max:128'],
            'Permanent_Address.state' => ['nullable', 'string', 'max:128'],
            'Permanent_Address.zip' => ['nullable', 'string', 'max:12'],
            'Permanent_Address.country' => ['nullable', 'string', 'max:128'],
            'Permanent_Address.latitude' => ['nullable', 'numeric'],
            'Permanent_Address.longitude' => ['nullable', 'numeric'],
            'Current_Employer_Company_Address' => ['nullable', 'array'],
            'Current_Employer_Company_Address.address_line_1' => ['nullable', 'string', 'max:191'],
            'Current_Employer_Company_Address.address_line_2' => ['nullable', 'string', 'max:191'],
            'Current_Employer_Company_Address.city' => ['nullable', 'string', 'max:128'],
            'Current_Employer_Company_Address.state' => ['nullable', 'string', 'max:128'],
            'Current_Employer_Company_Address.zip' => ['nullable', 'string', 'max:12'],
            'Current_Employer_Company_Address.country' => ['nullable', 'string', 'max:128'],
            'Current_Employer_Company_Address.latitude' => ['nullable', 'numeric'],
            'Current_Employer_Company_Address.longitude' => ['nullable', 'numeric'],
            'Employer_Address' => ['nullable', 'array'],
            'Employer_Address.address_line_1' => ['nullable', 'string', 'max:191'],
            'Employer_Address.address_line_2' => ['nullable', 'string', 'max:191'],
            'Employer_Address.city' => ['nullable', 'string', 'max:128'],
            'Employer_Address.state' => ['nullable', 'string', 'max:128'],
            'Employer_Address.zip' => ['nullable', 'string', 'max:12'],
            'Employer_Address.country' => ['nullable', 'string', 'max:128'],
            'Employer_Address.latitude' => ['nullable', 'numeric'],
            'Employer_Address.longitude' => ['nullable', 'numeric'],
            'Office_Address' => ['nullable', 'array'],
            'Office_Address.address_line_1' => ['nullable', 'string', 'max:191'],
            'Office_Address.address_line_2' => ['nullable', 'string', 'max:191'],
            'Office_Address.city' => ['nullable', 'string', 'max:128'],
            'Office_Address.state' => ['nullable', 'string', 'max:128'],
            'Office_Address.zip' => ['nullable', 'string', 'max:12'],
            'Office_Address.country' => ['nullable', 'string', 'max:128'],
            'Office_Address.latitude' => ['nullable', 'numeric'],
            'Office_Address.longitude' => ['nullable', 'numeric'],
            'Business__Employement_Address' => ['nullable', 'array'],
            'Business__Employement_Address.address_line_1' => ['nullable', 'string', 'max:191'],
            'Business__Employement_Address.address_line_2' => ['nullable', 'string', 'max:191'],
            'Business__Employement_Address.city' => ['nullable', 'string', 'max:128'],
            'Business__Employement_Address.state' => ['nullable', 'string', 'max:128'],
            'Business__Employement_Address.zip' => ['nullable', 'string', 'max:12'],
            'Business__Employement_Address.country' => ['nullable', 'string', 'max:128'],
            'Business__Employement_Address.latitude' => ['nullable', 'numeric'],
            'Business__Employement_Address.longitude' => ['nullable', 'numeric'],
            'Property_Address__as_per_site_' => ['nullable', 'array'],
            'Property_Address__as_per_site_.address_line_1' => ['nullable', 'string', 'max:191'],
            'Property_Address__as_per_site_.address_line_2' => ['nullable', 'string', 'max:191'],
            'Property_Address__as_per_site_.city' => ['nullable', 'string', 'max:128'],
            'Property_Address__as_per_site_.state' => ['nullable', 'string', 'max:128'],
            'Property_Address__as_per_site_.zip' => ['nullable', 'string', 'max:12'],
            'Property_Address__as_per_site_.country' => ['nullable', 'string', 'max:128'],
            'Property_Address__as_per_site_.latitude' => ['nullable', 'numeric'],
            'Property_Address__as_per_site_.longitude' => ['nullable', 'numeric'],

            // ---- Repeaters ----
            'existing_loans' => ['nullable', 'array'],
            'existing_loans.*.Sr__No_' => ['nullable', 'string', 'max:16'],
            'existing_loans.*.Loan_Type' => ['nullable', 'string', 'max:191'],
            'existing_loans.*.EMI_Amount' => ['nullable', 'numeric'],
            'existing_loans.*.Bounced_in_month' => ['nullable', 'string', 'max:191'],
            'existing_loans.*.Loan_Amount' => ['nullable', 'numeric'],
            'existing_loans.*.No__Of_EMI_Paid' => ['nullable', 'numeric'],
            'existing_loans.*.UNPAID__Overdue_Amount' => ['nullable', 'numeric'],
            'existing_loans.*.Loan_Opening_Date' => ['nullable', 'string', 'max:32'],
            'existing_loans.*.Total_No__of_Bounces' => ['nullable', 'numeric'],
            'existing_loans.*.Status' => ['nullable', 'string', 'max:191'],
            'existing_loans.*.Loan_Tenure' => ['nullable', 'string', 'max:32'],
            'existing_loans.*.PAID_BOUNCES_EMI' => ['nullable', 'numeric'],
            'existing_loans.*.REMARK' => ['nullable', 'string', 'max:191'],

            'family_members' => ['nullable', 'array'],
            'family_members.*.Relation_of_Member' => ['nullable', 'string', 'max:191'],
            'family_members.*.Co_Borrower' => ['nullable', 'string', Rule::in(['YES', 'NO'])],
            'family_members.*.Name_As_Per_Bank_PAN_Card' => ['nullable', 'string', 'max:191'],
            'family_members.*.Bank_Name___Branch_' => ['nullable', 'string', 'max:191'],
            'family_members.*.Age' => ['nullable', 'numeric'],
            'family_members.*.account_type' => ['nullable', 'string', 'max:191'],
            'family_members.*.NO_OF_ENTRIES_IN_MONTH_BELOW_500' => ['nullable', 'numeric'],
            'family_members.*.Education' => ['nullable', 'string', 'max:191'],
            'family_members.*.Account_Number' => ['nullable', 'string', 'max:64'],
            'family_members.*.OTHER_AMOUNT_CREDIT_IN_MONTH' => ['nullable', 'numeric'],
            'family_members.*.Income_Type' => ['nullable', 'string', 'max:191'],
            'family_members.*.IFSC_Code_1' => ['nullable', 'string', 'max:16'],
            'family_members.*.Closing_Balance' => ['nullable', 'numeric'],
            'family_members.*.Income_Amount' => ['nullable', 'numeric'],

            'partner_directors' => ['nullable', 'array'],
            'partner_directors.*.Partner__Director_Name' => ['nullable', 'string', 'max:191'],
            'partner_directors.*.Partner__Director_Number' => ['nullable', 'string', 'max:32'],
            'partner_directors.*.Partner___Director_KYC_Available' => ['nullable', 'string', Rule::in(['YES', 'NO'])],
            'partner_directors.*.Partner___Director_3_YR_ITR' => ['nullable', 'string', Rule::in(['YES', 'NO'])],

        ];
    }
}
