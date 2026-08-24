/**
 * Section → field mapping for rendering a submitted `PdDetails` blob as a
 * read-only summary (lead overview page). Mirrors the section grouping and
 * field order already used by the Full PD form's own section components
 * (see `features/leads/pd/sections/*`), generated from the same source
 * Form 39 export so labels match what the telecaller/manager actually
 * filled in.
 */
import { PdDetails } from './pd.model';

export interface PdSummaryField {
  key: keyof PdDetails;
  label: string;
}

export interface PdSummarySection {
  title: string;
  fields: PdSummaryField[];
}

export const PD_SUMMARY_SECTIONS: readonly PdSummarySection[] = [
  {
    title: "Loan & Personal",
    fields: [
      { key: "LOAN_TYPE", label: "LOAN TYPE" },
      { key: "If__HL_", label: "If -HL" },
      { key: "If__LAP", label: "If -LAP" },
      { key: "If_Commercial_Property", label: "If Commercial Property" },
      { key: "If_Mudra_Loan", label: "If Mudra Loan" },
      { key: "If_Loan_BT_", label: "If Loan BT" },
      { key: "BT_Loan_Amount", label: "BT Loan Amount" },
      { key: "Top_up_Loan_Amount", label: "Top up Loan Amount" },
      { key: "If_Insurance", label: "If Insurance" },
      { key: "If_Car_Loan", label: "If Car Loan" },
      { key: "PURPOSE_OF_LOAN", label: "PURPOSE OF LOAN" },
      { key: "Mother_s_maiden_Name", label: "Mother's maiden Name" },
      { key: "Age", label: "Age" },
      { key: "Marital_Status", label: "Marital Status" },
      { key: "RESSIDENCIAL_TYPE", label: "RESSIDENCIAL TYPE" },
      { key: "ANY_OTHER_SPECIFY", label: "ANY OTHER SPECIFY" },
      { key: "Caste_Category", label: "Caste Category" },
      { key: "General_Caste", label: "General Caste" },
      { key: "SC_Caste", label: "SC Caste" },
      { key: "ST_Caste", label: "ST Caste" },
      { key: "OBC_Caste", label: "OBC Caste" },
      { key: "Specific_Caste", label: "Specific Caste" },
    ],
  },
  {
    title: "APPLICANTE PERSONAL ADDRESS",
    fields: [
      { key: "Type_of_Current_Resident", label: "Type of Current Resident" },
      { key: "SINCE_RESSIBENT", label: "SINCE RESSIBENT" },
      { key: "Landmark", label: "Landmark" },
    ],
  },
  {
    title: "APPLICANTE EMPLOYMENT / BUSINESS INFORMATION",
    fields: [
      { key: "Type_of_Customer", label: "Type of Customer" },
      { key: "EMPLOYER_TYPE", label: "EMPLOYER TYPE" },
      { key: "Type_of_Work_Contract", label: "Type of Work Contract" },
      { key: "Date_of_Joining", label: "Date of Joining" },
    ],
  },
  {
    title: "APPLICANTE SALARY TYPE & BANK DETAILS",
    fields: [
      { key: "Type_Salary", label: "Type Salary" },
      { key: "Bank_Salary", label: "Bank Salary" },
      { key: "Bank_Name", label: "Bank Name" },
      { key: "Bank_Account_Number", label: "Bank Account Number" },
      { key: "SALARY_DEDUCTION", label: "SALARY DEDUCTION" },
      { key: "PF_Deduction_Amount", label: "PF Deduction Amount" },
      { key: "PT_Deduction_Amount", label: "PT Deduction Amount" },
      { key: "SOCIETY_LOAN_Deduction_Amount", label: "SOCIETY LOAN Deduction Amount" },
      { key: "PF_LOAN_Deduction_Amount", label: "PF LOAN Deduction Amount" },
      { key: "LIC_Deduction_Amount", label: "LIC Deduction Amount" },
      { key: "OTHER_DEDUCTION_Amount", label: "OTHER DEDUCTION Amount" },
      { key: "CURRENT_MONTH_SAL", label: "CURRENT MONTH SAL" },
      { key: "PREVIOUS_MONTH", label: "PREVIOUS MONTH" },
      { key: "2ND_PREVIOUS_MONTH", label: "2ND PREVIOUS MONTH" },
    ],
  },
  {
    title: "APPLICANTE OTHER INCOME SOURCE INFORMATION",
    fields: [
      { key: "Total_Income_from_other_source_salaried", label: "Total Income from other source" },
      { key: "Source_name_salaried", label: "Source name" },
      { key: "other_Specify__Name", label: "other(Specify) Name" },
      { key: "Type_of_Business", label: "Type of Business" },
      { key: "Partnership_Business", label: "Partnership Business" },
      { key: "Rental_Income_Amount", label: "Rental Income Amount" },
      { key: "Agriculture_Income_Amount", label: "Agriculture Income Amount" },
      { key: "Pension_Amount", label: "Pension Amount" },
      { key: "Part_time_Income_Amount", label: "Part time Income Amount" },
      { key: "other_Specify__Amount", label: "other(Specify) Amount" },
    ],
  },
  {
    title: "APPLICANTE EMPLOYER / COMPANY INFORMATION",
    fields: [
      { key: "Current_Employer_Company_Name", label: "Current Employer/Company Name" },
    ],
  },
  {
    title: "APPLICANTE COMPANY / EMPLOYER INFORMATION",
    fields: [
      { key: "Employer_Name", label: "Employer Name" },
      { key: "Date_of_Joining_1", label: "Date of Joining" },
      { key: "Designation", label: "Designation" },
      { key: "Department", label: "Department" },
      { key: "TOTAL_EXPIRIANCE_IN_CURRENT_COMPANY", label: "TOTAL EXPIRIANCE IN CURRENT COMPANY" },
    ],
  },
  {
    title: "CURRENT COMPANY's 2 REFERENCES",
    fields: [
      { key: "Full_name_References_1", label: "References 1" },
      { key: "Designation_1", label: "Designation" },
      { key: "Department_1", label: "Department" },
      { key: "Mobile_Number", label: "Mobile No." },
      { key: "Full_name_References_2", label: "References 2" },
      { key: "Designation_2", label: "Designation" },
      { key: "Department_2", label: "Department" },
      { key: "Mobile_No_2", label: "Mobile No." },
    ],
  },
  {
    title: "APPLICANTE PROFESSION INFORMATION",
    fields: [
      { key: "Profession_Type", label: "Profession Type" },
      { key: "PROFESSIONAL_CERTIFICATE", label: "PROFESSIONAL CERTIFICATE" },
      { key: "Professional_Name", label: "Professional Name" },
    ],
  },
  {
    title: "APPLICANTE PROFESSIONAL INCORPORATION & INCOME INFORMATION",
    fields: [
      { key: "Date_of_Incorporation_DD_MM_YY", label: "Date of Incorporation DD/MM/YY" },
      { key: "Type_of_Professional_License", label: "Type of Professional License" },
      { key: "OTHER_SPECIFY_PROFESSIONAL_LICENSE", label: "OTHER SPECIFY PROFESSIONAL LICENSE" },
      { key: "Income_Amount_from_Profession", label: "Income Amount from Profession" },
      { key: "Source_name", label: "Source name" },
      { key: "Rental_Income_Amount_Professional", label: "Rental Income Amount" },
      { key: "Agriculture_Income_Amount_Professional", label: "Agriculture Income Amount" },
      { key: "Pension_Amount_Professional", label: "Pension Amount" },
      { key: "BROKRAGE_Amount_Professional", label: "BROKRAGE Amount" },
      { key: "other_Specify__Amount_Professional", label: "other(Specify) Amount" },
      { key: "Total_Income_from_other_source_Professional", label: "Total Income from other source" },
    ],
  },
  {
    title: "APPLICANTE PROFESSION OFFICE INFORMATION",
    fields: [
      { key: "OFFICE_Premises_Type", label: "OFFICE Premises Type" },
      { key: "OTHER_SPECIFY_2", label: "OTHER SPECIFY" },
    ],
  },
  {
    title: "APPLICANT's 3 YEARS ITR DETAILS",
    fields: [
      { key: "itr_current_date", label: "Date / Time" },
      { key: "itr_current_turnover", label: "Turnover" },
      { key: "itr_current_income", label: "Income" },
      { key: "itr_current_depreciation", label: "Depreciation" },
      { key: "itr_current_remark", label: "Remark" },
      { key: "itr_previous_date", label: "itr_previous_date" },
      { key: "itr_previous_turnover", label: "itr_previous_turnover" },
      { key: "itr_previous_income", label: "itr_previous_income" },
      { key: "itr_previous_depreciation", label: "itr_previous_depreciation" },
      { key: "itr_previous_remark", label: "Remark" },
      { key: "itr_third_date", label: "itr_third_date" },
      { key: "itr_third_turnover", label: "itr_third_turnover" },
      { key: "itr_third_income", label: "itr_third_income" },
      { key: "itr_third_depreciation", label: "itr_third_depreciation" },
      { key: "itr_third_remark", label: "Remark" },
    ],
  },
  {
    title: "FIRM 3 YEARS ITR DETAILS",
    fields: [
      { key: "Date_of_Filing", label: "Date / Time" },
      { key: "itr_current_turnover_1", label: "Turnover" },
      { key: "itr_current_income_1", label: "Income" },
      { key: "itr_current_depreciation_1", label: "Depreciation" },
      { key: "itr_current_remark_1", label: "Remark" },
      { key: "Date_of_Filing_2", label: "Date / Time" },
      { key: "itr_current_turnover_2", label: "Turnover" },
      { key: "itr_current_income_2", label: "Income" },
      { key: "itr_current_depreciation_2", label: "Depreciation" },
      { key: "itr_current_remark_2", label: "Remark" },
      { key: "Date_of_Filing_3", label: "Date / Time" },
      { key: "itr_current_turnover_3", label: "Turnover" },
      { key: "itr_current_income_3", label: "Income" },
      { key: "itr_current_depreciation_3", label: "Depreciation" },
      { key: "itr_current_remark_3", label: "Remark" },
      { key: "Annual_Turnover_without_ITR_1", label: "Annual Turnover" },
      { key: "Net_Income_without_ITR_1", label: "Net Income" },
    ],
  },
  {
    title: "APPLICANTE's BUSINESS & PARTNER INFORMATION",
    fields: [
      { key: "Nature_of_Business", label: "Nature of Business" },
      { key: "BUSINESS_CATEGORY", label: "BUSINESS CATEGORY" },
      { key: "PARTNERSHIP", label: "PARTNERSHIP" },
      { key: "Type_of_Firm", label: "Type of Firm" },
      { key: "PROPRITORSHIP_FIRM", label: "PROPRITORSHIP FIRM" },
      { key: "Pvt__Ltd__LLP_FIRM", label: "Pvt. Ltd/ LLP FIRM" },
      { key: "OPC_FIRM", label: "OPC FIRM" },
    ],
  },
  {
    title: "APPLICANTE BUSINESS INCORPORATION & INCOME INFORMATION",
    fields: [
      { key: "Business__Employement_Name", label: "Business /Employement Name" },
      { key: "Date_of_Incorporation", label: "Date of Incorporation" },
      { key: "Income_from_Business__Employement", label: "Income from Business /Employement" },
    ],
  },
  {
    title: "APPLICANTE'S OTHER INCOME SOURCE INFROMATION APART FROM OWNED BUSINESS",
    fields: [
      { key: "Total_Income_from_other_source_Business", label: "Total Income from other source" },
      { key: "Other_Income_Source", label: "Other Income Source" },
      { key: "Other_Specify_Source", label: "Other Specify Source" },
      { key: "Rental_Income_Amount_Business", label: "Rental Income Amount" },
      { key: "Agriculture_Income_Amount_Business", label: "Agriculture Income Amount" },
      { key: "Pension_Amount_Business", label: "Pension Amount" },
      { key: "other_Specify__Amount_Business", label: "other(Specify) Amount" },
    ],
  },
  {
    title: "BUSINESS OFFICE ADDRESS",
    fields: [
      { key: "BUSINESS_Premises_Type", label: "BUSINESS Premises Type" },
    ],
  },
  {
    title: "HOME / MORTGAGE / LAP LOAN PROPERTY INFORMATION",
    fields: [
      { key: "Name_of_Property_Owner", label: "Name of Property Owner" },
      { key: "Relation_with_applicant", label: "Relation with applicant" },
      { key: "Available_Property_Document", label: "Available Property Document" },
      { key: "Gaothan", label: "Gaothan" },
      { key: "REGISTERAD_AGREEMENT_TO_SALE___REGISTERED_POWER_OF_ATORNY", label: "REGISTERAD ATS / POA" },
      { key: "BHADEPATTA_PROPERTY", label: "BHADEPATTA PROPERTY" },
    ],
  },
  {
    title: "HOME / MORTGAGE / LAP LOAN PROPERTY ADDRESS",
    fields: [
      { key: "Mauza_1", label: "Mauza" },
      { key: "khasara_No_1", label: "Kh. No." },
      { key: "P_H__No_1", label: "P.H. No." },
      { key: "Survey_No_1", label: "Survey No." },
      { key: "Society_No__1", label: "Society No." },
      { key: "Other", label: "Other" },
      { key: "Other2", label: "Other2" },
      { key: "Other3", label: "Other3" },
      { key: "City", label: "City" },
      { key: "Tahsil", label: "Tahsil" },
      { key: "District", label: "District" },
      { key: "State", label: "State" },
      { key: "Property_Loan_Type", label: "Property Loan Type" },
      { key: "Property_Selected_", label: "Property Selected ?" },
      { key: "Total_Agreement_Value", label: "Total Agreement Value" },
      { key: "OCR_Paid", label: "OCR Paid" },
      { key: "Source", label: "Source" },
      { key: "OCR_Balance", label: "OCR Balance" },
      { key: "Source2", label: "Source2" },
      { key: "Completion_State_Of_Property", label: "Completion State Of Property" },
      { key: "Land_Areaa", label: "Land Areaa" },
      { key: "Built_up_Area1", label: "Built up Area1" },
      { key: "Estimated_Cost", label: "Estimated Cost" },
      { key: "Land_Area", label: "Land Area" },
      { key: "Existing_Construction_Area", label: "Existing Construction Area" },
      { key: "Existing_Construction_Stage", label: "Existing Construction Stage" },
      { key: "Proposed_Construction", label: "Proposed Construction" },
      { key: "Estimated_Market_Value", label: "Estimated Market Value" },
      { key: "Land_Land_Sharing_Area_in_Sqft", label: "Land / Land Sharing Area" },
      { key: "Built_up_Area_in_Sqft", label: "Built up Area" },
    ],
  },
];
