import { AuthenticatedUser } from './user.model';

/** Accounts/finance staff profile data (users table holds the identity). */
export interface AccountsProfile {
  id: number;
  user: AuthenticatedUser;
  designation: string | null;
  branch: string | null;
  employee_code: string | null;
  alternate_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  updated_at: string | null;
}

export interface UpdateAccountsProfilePayload {
  name?: string;
  phone?: string | null;
  designation?: string | null;
  branch?: string | null;
  employee_code?: string | null;
  alternate_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

export interface AccountsMonthPoint {
  month: string;
  value: number;
}

export interface AccountsPayoutStatusBucket {
  count: number;
  amount: number;
}

export interface AccountsLedgerActivity {
  id: number;
  date: string | null;
  type: string;
  type_label: string;
  description: string;
  debit: number | null;
  credit: number | null;
}

/** GET accounts/dashboard — see App\Services\AccountsService::dashboardFor. */
export interface AccountsDashboard {
  welcome: {
    headline: string;
    message: string;
  };
  kpis: {
    disbursed_this_month: number;
    disbursed_ytd: number;
    commission_payable: number;
    paid_this_month: number;
    pending_payouts_count: number;
    pending_payouts_amount: number;
  };
  disbursement_trend: AccountsMonthPoint[];
  commission_trend: {
    accrued: AccountsMonthPoint[];
    paid: AccountsMonthPoint[];
  };
  payout_status_breakdown: {
    pending: AccountsPayoutStatusBucket;
    processing: AccountsPayoutStatusBucket;
    paid: AccountsPayoutStatusBucket;
    failed: AccountsPayoutStatusBucket;
  };
  recent_activity: AccountsLedgerActivity[];
}
