/** Vendor module domain models. */

export type VendorStatus =
  | 'pending_verification'
  | 'active'
  | 'inactive'
  | 'suspended';

export interface VendorIdentity {
  name: string;
  email: string;
  business_name: string | null;
  status: VendorStatus | null;
  status_label: string | null;
  /** Maps to a Material theme palette: primary | accent | warn | success | default. */
  status_colour: string | null;
  joined_at: string | null;
}

/**
 * Payload of `GET /api/v1/vendors/dashboard`. `stats` counters are wired to
 * real data in Phase 3 (certifications) and Phase 4 (loan requests); until
 * then they are zero.
 */
export interface VendorDashboard {
  welcome: {
    headline: string;
    message: string;
  };
  vendor: VendorIdentity;
  stats: {
    certifications_total: number;
    loan_requests_total: number;
  };
}
