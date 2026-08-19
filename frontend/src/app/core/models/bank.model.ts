export interface EligibilityRule {
  field: string;
  operator: string;
  value: string | number | string[] | null;
  label?: string;
}

export interface BankCriteria {
  id: number;
  bank_name: string;
  product_name: string;
  loan_type: string;
  min_loan_amount: number;
  max_loan_amount: number | null;
  min_monthly_income: number;
  min_credit_score: number | null;
  min_age: number | null;
  max_age: number | null;
  employment_type: string | null;
  interest_rate: number | null;
  eligibility_rules: EligibilityRule[];
  is_active: boolean;
  banker_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BankCriteriaPayload {
  bank_name: string;
  product_name: string;
  loan_type: string;
  min_loan_amount: number;
  max_loan_amount?: number | null;
  min_monthly_income: number;
  min_credit_score?: number | null;
  employment_type?: string | null;
  interest_rate?: number | null;
  eligibility_rules?: EligibilityRule[];
  is_active: boolean;
}
