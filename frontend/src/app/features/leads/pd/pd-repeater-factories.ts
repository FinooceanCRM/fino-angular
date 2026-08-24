import { FormBuilder, FormGroup } from '@angular/forms';

import { PdExistingLoan, PdFamilyMember, PdPartnerDirector } from '@core/models/pd.model';

/**
 * Row-group factories for the 3 Full PD repeaters (existing loans, family
 * members, partner/director info). Shared between each repeater's own
 * "Add row" action and the master `PdFormComponent`'s pre-fill logic (when
 * resuming a partially-completed PD), so both build identically-shaped rows.
 */

export function buildExistingLoanRow(fb: FormBuilder, seed?: Partial<PdExistingLoan>): FormGroup {
  return fb.group({
    Sr__No_: [seed?.Sr__No_ ?? null],
    Loan_Type: [seed?.Loan_Type ?? null],
    EMI_Amount: [seed?.EMI_Amount ?? null],
    Bounced_in_month: [seed?.Bounced_in_month ?? null],
    Loan_Amount: [seed?.Loan_Amount ?? null],
    No__Of_EMI_Paid: [seed?.No__Of_EMI_Paid ?? null],
    UNPAID__Overdue_Amount: [seed?.UNPAID__Overdue_Amount ?? null],
    Loan_Opening_Date: [seed?.Loan_Opening_Date ?? null],
    Total_No__of_Bounces: [seed?.Total_No__of_Bounces ?? null],
    Status: [seed?.Status ?? null],
    Loan_Tenure: [seed?.Loan_Tenure ?? null],
    PAID_BOUNCES_EMI: [seed?.PAID_BOUNCES_EMI ?? null],
    REMARK: [seed?.REMARK ?? null],
  });
}

export function buildFamilyMemberRow(fb: FormBuilder, seed?: Partial<PdFamilyMember>): FormGroup {
  return fb.group({
    Relation_of_Member: [seed?.Relation_of_Member ?? null],
    Co_Borrower: [seed?.Co_Borrower ?? null],
    Name_As_Per_Bank_PAN_Card: [seed?.Name_As_Per_Bank_PAN_Card ?? null],
    Bank_Name___Branch_: [seed?.Bank_Name___Branch_ ?? null],
    Age: [seed?.Age ?? null],
    account_type: [seed?.account_type ?? null],
    NO_OF_ENTRIES_IN_MONTH_BELOW_500: [seed?.NO_OF_ENTRIES_IN_MONTH_BELOW_500 ?? null],
    Education: [seed?.Education ?? null],
    Account_Number: [seed?.Account_Number ?? null],
    OTHER_AMOUNT_CREDIT_IN_MONTH: [seed?.OTHER_AMOUNT_CREDIT_IN_MONTH ?? null],
    Income_Type: [seed?.Income_Type ?? null],
    IFSC_Code_1: [seed?.IFSC_Code_1 ?? null],
    Closing_Balance: [seed?.Closing_Balance ?? null],
    Income_Amount: [seed?.Income_Amount ?? null],
  });
}

export function buildPartnerDirectorRow(fb: FormBuilder, seed?: Partial<PdPartnerDirector>): FormGroup {
  return fb.group({
    Partner__Director_Name: [seed?.Partner__Director_Name ?? null],
    Partner__Director_Number: [seed?.Partner__Director_Number ?? null],
    Partner___Director_KYC_Available: [seed?.Partner___Director_KYC_Available ?? null],
    Partner___Director_3_YR_ITR: [seed?.Partner___Director_3_YR_ITR ?? null],
  });
}
