/**
 * Full PD (pre-disbursement verification) data — mirrors the ~275-field
 * legacy WordPress Fluent Form #39 ('PD Form') dataset, recreated natively.
 * Field names are kept identical to the original form (not renamed to
 * camelCase/snake_case) so the Angular payload maps 1:1 onto the Laravel
 * `SubmitPdRequest` validation keys and the stored `pd_details` JSON.
 */

/** Response shape for `GET leads/:id/pd`. */
export interface PdShowResponse {
  pd_details: PdDetails | null;
  pd_completed_at: string | null;
  can_submit_pd: boolean;
}

export interface PdAddress {
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const EMPTY_PD_ADDRESS: PdAddress = {
  address_line_1: null, address_line_2: null, city: null, state: null,
  zip: null, country: null, latitude: null, longitude: null,
};

export interface PdExistingLoan {
  Sr__No_: string | null;
  Loan_Type: string | null;
  EMI_Amount: number | null;
  Bounced_in_month: string | null;
  Loan_Amount: number | null;
  No__Of_EMI_Paid: number | null;
  UNPAID__Overdue_Amount: number | null;
  Loan_Opening_Date: string | null;
  Total_No__of_Bounces: number | null;
  Status: string | null;
  Loan_Tenure: string | null;
  PAID_BOUNCES_EMI: number | null;
  REMARK: string | null;
}

export interface PdFamilyMember {
  Relation_of_Member: string | null;
  Co_Borrower: 'YES' | 'NO' | null;
  Name_As_Per_Bank_PAN_Card: string | null;
  Bank_Name___Branch_: string | null;
  Age: number | null;
  account_type: string | null;
  NO_OF_ENTRIES_IN_MONTH_BELOW_500: number | null;
  Education: string | null;
  Account_Number: string | null;
  OTHER_AMOUNT_CREDIT_IN_MONTH: number | null;
  Income_Type: string | null;
  IFSC_Code_1: string | null;
  Closing_Balance: number | null;
  Income_Amount: number | null;
}

export interface PdPartnerDirector {
  Partner__Director_Name: string | null;
  Partner__Director_Number: string | null;
  Partner___Director_KYC_Available: 'YES' | 'NO' | null;
  Partner___Director_3_YR_ITR: 'YES' | 'NO' | null;
}

export interface PdDetails {

  // (no section)
  LOAN_TYPE: string | null;
  If__HL_: string | null;
  If__LAP: string | null;
  If_Commercial_Property: string | null;
  If_Mudra_Loan: string | null;
  If_Loan_BT_: string | null;
  BT_Loan_Amount: number | null;
  Top_up_Loan_Amount: number | null;
  If_Insurance: string | null;
  If_Car_Loan: string | null;
  PURPOSE_OF_LOAN: string | null;
  Mother_s_maiden_Name: string | null;
  Age: number | null;
  Marital_Status: string | null;
  RESSIDENCIAL_TYPE: string | null;
  ANY_OTHER_SPECIFY: string | null;
  Caste_Category: string | null;
  General_Caste: string | null;
  SC_Caste: string | null;
  ST_Caste: string | null;
  OBC_Caste: string | null;
  Specific_Caste: string | null;

  // APPLICANTE PERSONAL ADDRESS
  Type_of_Current_Resident: string | null;
  SINCE_RESSIBENT: string | null;
  Landmark: string | null;

  // APPLICANTE EMPLOYMENT / BUSINESS INFORMATION
  Type_of_Customer: string | null;
  EMPLOYER_TYPE: string | null;
  Type_of_Work_Contract: string | null;
  Date_of_Joining: string | null;

  // APPLICANTE SALARY TYPE & BANK DETAILS
  Type_Salary: string | null;
  Bank_Salary: string | null;
  Bank_Name: string | null;
  Bank_Account_Number: number | null;
  SALARY_DEDUCTION: string | null;
  PF_Deduction_Amount: number | null;
  PT_Deduction_Amount: number | null;
  SOCIETY_LOAN_Deduction_Amount: number | null;
  PF_LOAN_Deduction_Amount: number | null;
  LIC_Deduction_Amount: number | null;
  OTHER_DEDUCTION_Amount: number | null;
  CURRENT_MONTH_SAL: string | null;
  PREVIOUS_MONTH: string | null;
  '2ND_PREVIOUS_MONTH': string | null;

  // APPLICANTE OTHER INCOME SOURCE INFORMATION
  Total_Income_from_other_source_salaried: number | null;
  Source_name_salaried: string | null;
  other_Specify__Name: string | null;
  Type_of_Business: string | null;
  Partnership_Business: string | null;
  Rental_Income_Amount: number | null;
  Agriculture_Income_Amount: number | null;
  Pension_Amount: number | null;
  Part_time_Income_Amount: number | null;
  other_Specify__Amount: number | null;

  // APPLICANTE EMPLOYER / COMPANY INFORMATION
  Current_Employer_Company_Name: string | null;

  // APPLICANTE COMPANY / EMPLOYER INFORMATION
  Employer_Name: string | null;
  Date_of_Joining_1: string | null;
  Designation: string | null;
  Department: string | null;
  TOTAL_EXPIRIANCE_IN_CURRENT_COMPANY: number | null;

  // CURRENT COMPANY's 2 REFERENCES
  Full_name_References_1: string | null;
  Designation_1: string | null;
  Department_1: string | null;
  Mobile_Number: string | null;
  Full_name_References_2: string | null;
  Designation_2: string | null;
  Department_2: string | null;
  Mobile_No_2: string | null;

  // APPLICANTE PROFESSION INFORMATION
  Profession_Type: string | null;
  PROFESSIONAL_CERTIFICATE: string | null;
  Professional_Name: string | null;

  // APPLICANTE PROFESSIONAL INCORPORATION & INCOME INFORMATION
  Date_of_Incorporation_DD_MM_YY: string | null;
  Type_of_Professional_License: string | null;
  OTHER_SPECIFY_PROFESSIONAL_LICENSE: string | null;
  Income_Amount_from_Profession: number | null;
  Source_name: string | null;
  Rental_Income_Amount_Professional: number | null;
  Agriculture_Income_Amount_Professional: number | null;
  Pension_Amount_Professional: number | null;
  BROKRAGE_Amount_Professional: number | null;
  other_Specify__Amount_Professional: number | null;
  Total_Income_from_other_source_Professional: number | null;

  // APPLICANTE PROFESSION OFFICE INFORMATION
  OFFICE_Premises_Type: string | null;
  OTHER_SPECIFY_2: string | null;

  // APPLICANT's 3 YEARS ITR DETAILS
  itr_current_date: string | null;
  itr_current_turnover: number | null;
  itr_current_income: number | null;
  itr_current_depreciation: number | null;
  itr_current_remark: string | null;
  itr_previous_date: string | null;
  itr_previous_turnover: number | null;
  itr_previous_income: number | null;
  itr_previous_depreciation: number | null;
  itr_previous_remark: string | null;
  itr_third_date: string | null;
  itr_third_turnover: number | null;
  itr_third_income: number | null;
  itr_third_depreciation: number | null;
  itr_third_remark: string | null;

  // FIRM 3 YEARS ITR DETAILS
  Date_of_Filing: string | null;
  itr_current_turnover_1: number | null;
  itr_current_income_1: number | null;
  itr_current_depreciation_1: number | null;
  itr_current_remark_1: string | null;
  Date_of_Filing_2: string | null;
  itr_current_turnover_2: number | null;
  itr_current_income_2: number | null;
  itr_current_depreciation_2: number | null;
  itr_current_remark_2: string | null;
  Date_of_Filing_3: string | null;
  itr_current_turnover_3: number | null;
  itr_current_income_3: number | null;
  itr_current_depreciation_3: number | null;
  itr_current_remark_3: string | null;
  Annual_Turnover_without_ITR_1: number | null;
  Net_Income_without_ITR_1: number | null;

  // APPLICANTE's BUSINESS & PARTNER INFORMATION
  Nature_of_Business: string | null;
  BUSINESS_CATEGORY: string | null;
  PARTNERSHIP: string | null;
  Type_of_Firm: string | null;
  PROPRITORSHIP_FIRM: string | null;
  Pvt__Ltd__LLP_FIRM: string | null;
  OPC_FIRM: string | null;

  // APPLICANTE BUSINESS INCORPORATION & INCOME INFORMATION
  Business__Employement_Name: string | null;
  Date_of_Incorporation: string | null;
  Income_from_Business__Employement: number | null;

  // APPLICANTE'S OTHER INCOME SOURCE INFROMATION APART FROM OWNED BUSINESS
  Total_Income_from_other_source_Business: number | null;
  Other_Income_Source: string | null;
  Other_Specify_Source: string | null;
  Rental_Income_Amount_Business: number | null;
  Agriculture_Income_Amount_Business: number | null;
  Pension_Amount_Business: number | null;
  other_Specify__Amount_Business: number | null;

  // BUSINESS OFFICE ADDRESS
  BUSINESS_Premises_Type: string | null;

  // HOME / MORTGAGE / LAP LOAN PROPERTY INFORMATION 
  Name_of_Property_Owner: string | null;
  Relation_with_applicant: string | null;
  Available_Property_Document: string | null;
  Gaothan: string | null;
  REGISTERAD_AGREEMENT_TO_SALE___REGISTERED_POWER_OF_ATORNY: string | null;
  BHADEPATTA_PROPERTY: string | null;

  // HOME / MORTGAGE / LAP LOAN PROPERTY ADDRESS 
  Mauza_1: string | null;
  khasara_No_1: string | null;
  P_H__No_1: string | null;
  Survey_No_1: string | null;
  Society_No__1: string | null;
  Other: string | null;
  Other2: string | null;
  Other3: string | null;
  City: string | null;
  Tahsil: string | null;
  District: string | null;
  State: string | null;
  Property_Loan_Type: string | null;
  Property_Selected_: string | null;
  Total_Agreement_Value: number | null;
  OCR_Paid: number | null;
  Source: string | null;
  OCR_Balance: number | null;
  Source2: string | null;
  Completion_State_Of_Property: number | null;
  Land_Areaa: string | null;
  Built_up_Area1: string | null;
  Estimated_Cost: number | null;
  Land_Area: string | null;
  Existing_Construction_Area: string | null;
  Existing_Construction_Stage: string | null;
  Proposed_Construction: string | null;
  Estimated_Market_Value: number | null;
  Land_Land_Sharing_Area_in_Sqft: number | null;
  Built_up_Area_in_Sqft: number | null;

  // Address groups
  Current_Residential_Address: PdAddress;
  Permanent_Address: PdAddress;
  Current_Employer_Company_Address: PdAddress;
  Employer_Address: PdAddress;
  Office_Address: PdAddress;
  Business__Employement_Address: PdAddress;
  Property_Address__as_per_site_: PdAddress;

  // Repeaters
  existing_loans: PdExistingLoan[];
  family_members: PdFamilyMember[];
  partner_directors: PdPartnerDirector[];
}
export function emptyPdDetails(): PdDetails {
  return {
    LOAN_TYPE: null,
    If__HL_: null,
    If__LAP: null,
    If_Commercial_Property: null,
    If_Mudra_Loan: null,
    If_Loan_BT_: null,
    BT_Loan_Amount: null,
    Top_up_Loan_Amount: null,
    If_Insurance: null,
    If_Car_Loan: null,
    PURPOSE_OF_LOAN: null,
    Mother_s_maiden_Name: null,
    Age: null,
    Marital_Status: null,
    RESSIDENCIAL_TYPE: null,
    ANY_OTHER_SPECIFY: null,
    Caste_Category: null,
    General_Caste: null,
    SC_Caste: null,
    ST_Caste: null,
    OBC_Caste: null,
    Specific_Caste: null,
    Type_of_Current_Resident: null,
    SINCE_RESSIBENT: null,
    Landmark: null,
    Type_of_Customer: null,
    EMPLOYER_TYPE: null,
    Type_of_Work_Contract: null,
    Date_of_Joining: null,
    Type_Salary: null,
    Bank_Salary: null,
    Bank_Name: null,
    Bank_Account_Number: null,
    SALARY_DEDUCTION: null,
    PF_Deduction_Amount: null,
    PT_Deduction_Amount: null,
    SOCIETY_LOAN_Deduction_Amount: null,
    PF_LOAN_Deduction_Amount: null,
    LIC_Deduction_Amount: null,
    OTHER_DEDUCTION_Amount: null,
    CURRENT_MONTH_SAL: null,
    PREVIOUS_MONTH: null,
    '2ND_PREVIOUS_MONTH': null,
    Total_Income_from_other_source_salaried: null,
    Source_name_salaried: null,
    other_Specify__Name: null,
    Type_of_Business: null,
    Partnership_Business: null,
    Rental_Income_Amount: null,
    Agriculture_Income_Amount: null,
    Pension_Amount: null,
    Part_time_Income_Amount: null,
    other_Specify__Amount: null,
    Current_Employer_Company_Name: null,
    Employer_Name: null,
    Date_of_Joining_1: null,
    Designation: null,
    Department: null,
    TOTAL_EXPIRIANCE_IN_CURRENT_COMPANY: null,
    Full_name_References_1: null,
    Designation_1: null,
    Department_1: null,
    Mobile_Number: null,
    Full_name_References_2: null,
    Designation_2: null,
    Department_2: null,
    Mobile_No_2: null,
    Profession_Type: null,
    PROFESSIONAL_CERTIFICATE: null,
    Professional_Name: null,
    Date_of_Incorporation_DD_MM_YY: null,
    Type_of_Professional_License: null,
    OTHER_SPECIFY_PROFESSIONAL_LICENSE: null,
    Income_Amount_from_Profession: null,
    Source_name: null,
    Rental_Income_Amount_Professional: null,
    Agriculture_Income_Amount_Professional: null,
    Pension_Amount_Professional: null,
    BROKRAGE_Amount_Professional: null,
    other_Specify__Amount_Professional: null,
    Total_Income_from_other_source_Professional: null,
    OFFICE_Premises_Type: null,
    OTHER_SPECIFY_2: null,
    itr_current_date: null,
    itr_current_turnover: null,
    itr_current_income: null,
    itr_current_depreciation: null,
    itr_current_remark: null,
    itr_previous_date: null,
    itr_previous_turnover: null,
    itr_previous_income: null,
    itr_previous_depreciation: null,
    itr_previous_remark: null,
    itr_third_date: null,
    itr_third_turnover: null,
    itr_third_income: null,
    itr_third_depreciation: null,
    itr_third_remark: null,
    Date_of_Filing: null,
    itr_current_turnover_1: null,
    itr_current_income_1: null,
    itr_current_depreciation_1: null,
    itr_current_remark_1: null,
    Date_of_Filing_2: null,
    itr_current_turnover_2: null,
    itr_current_income_2: null,
    itr_current_depreciation_2: null,
    itr_current_remark_2: null,
    Date_of_Filing_3: null,
    itr_current_turnover_3: null,
    itr_current_income_3: null,
    itr_current_depreciation_3: null,
    itr_current_remark_3: null,
    Annual_Turnover_without_ITR_1: null,
    Net_Income_without_ITR_1: null,
    Nature_of_Business: null,
    BUSINESS_CATEGORY: null,
    PARTNERSHIP: null,
    Type_of_Firm: null,
    PROPRITORSHIP_FIRM: null,
    Pvt__Ltd__LLP_FIRM: null,
    OPC_FIRM: null,
    Business__Employement_Name: null,
    Date_of_Incorporation: null,
    Income_from_Business__Employement: null,
    Total_Income_from_other_source_Business: null,
    Other_Income_Source: null,
    Other_Specify_Source: null,
    Rental_Income_Amount_Business: null,
    Agriculture_Income_Amount_Business: null,
    Pension_Amount_Business: null,
    other_Specify__Amount_Business: null,
    BUSINESS_Premises_Type: null,
    Name_of_Property_Owner: null,
    Relation_with_applicant: null,
    Available_Property_Document: null,
    Gaothan: null,
    REGISTERAD_AGREEMENT_TO_SALE___REGISTERED_POWER_OF_ATORNY: null,
    BHADEPATTA_PROPERTY: null,
    Mauza_1: null,
    khasara_No_1: null,
    P_H__No_1: null,
    Survey_No_1: null,
    Society_No__1: null,
    Other: null,
    Other2: null,
    Other3: null,
    City: null,
    Tahsil: null,
    District: null,
    State: null,
    Property_Loan_Type: null,
    Property_Selected_: null,
    Total_Agreement_Value: null,
    OCR_Paid: null,
    Source: null,
    OCR_Balance: null,
    Source2: null,
    Completion_State_Of_Property: null,
    Land_Areaa: null,
    Built_up_Area1: null,
    Estimated_Cost: null,
    Land_Area: null,
    Existing_Construction_Area: null,
    Existing_Construction_Stage: null,
    Proposed_Construction: null,
    Estimated_Market_Value: null,
    Land_Land_Sharing_Area_in_Sqft: null,
    Built_up_Area_in_Sqft: null,
    Current_Residential_Address: { ...EMPTY_PD_ADDRESS },
    Permanent_Address: { ...EMPTY_PD_ADDRESS },
    Current_Employer_Company_Address: { ...EMPTY_PD_ADDRESS },
    Employer_Address: { ...EMPTY_PD_ADDRESS },
    Office_Address: { ...EMPTY_PD_ADDRESS },
    Business__Employement_Address: { ...EMPTY_PD_ADDRESS },
    Property_Address__as_per_site_: { ...EMPTY_PD_ADDRESS },
    existing_loans: [],
    family_members: [],
    partner_directors: [],
  };
}
