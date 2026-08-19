import { AuthenticatedUser } from './user.model';

/** Connector-specific profile data (users table holds the identity). */
export interface ConnectorProfile {
  id: number;
  user: AuthenticatedUser;
  company_name: string | null;
  contact_person: string | null;
  alternate_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  pan_number: string | null;
  gst_number: string | null;
  updated_at: string | null;
}

export interface UpdateConnectorProfilePayload {
  name?: string;
  phone?: string | null;
  company_name?: string | null;
  contact_person?: string | null;
  alternate_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  pan_number?: string | null;
  gst_number?: string | null;
}

export interface ConnectorDashboard {
  welcome: {
    headline: string;
    message: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    member_since: string | null;
  };
  role: {
    value: string;
    label: string;
    independent: boolean;
    description: string;
  };
  account_status: {
    is_active: boolean;
    status: string;
    profile_complete: boolean;
  };
  stats: {
    leads_submitted: number;
    approved_leads: number;
    in_progress_leads: number;
  };
}
