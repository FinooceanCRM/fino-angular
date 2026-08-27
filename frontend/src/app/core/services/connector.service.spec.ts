import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import {
  ConnectorCommission,
  ConnectorDashboard,
  ConnectorNetworkMember,
  ConnectorPayout,
  ConnectorProfile,
} from '@core/models/connector.model';
import { AuthenticatedUser } from '@core/models/user.model';

import { ConnectorService } from './connector.service';

const user: AuthenticatedUser = {
  id: 42,
  name: 'Connector One',
  email: 'connector1@finoocean.test',
  role: 'connector',
  role_label: 'Connector',
  manager_id: null,
  relationship_manager_id: null,
  employee_id: null,
  department: null,
  department_label: null,
  phone: null,
  is_active: true,
  email_notifications: true,
  sms_notifications: true,
  notify_on_assignment: true,
  notify_on_approval: true,
  created_at: null,
};

const profile: ConnectorProfile = {
  id: 1,
  user,
  company_name: null,
  contact_person: null,
  alternate_phone: null,
  address_line1: null,
  address_line2: null,
  city: null,
  state: null,
  pincode: null,
  pan_number: null,
  gst_number: null,
  referral_code: 'CONN0001A',
  referred_by: null,
  commission_rate: 1.5,
  status: 'active',
  status_label: 'Active',
  status_colour: 'success',
  phone_verified_at: '2026-01-01T00:00:00Z',
  joined_at: '2026-01-01T00:00:00Z',
  payout_method: 'bank_transfer',
  payout_account_name: 'Connector One',
  payout_account_number: '123456789012',
  payout_ifsc_or_upi: 'HDFC0001234',
  referral_count: null,
  converted_count: null,
  commission_accrued: null,
  commission_paid: null,
  network_size: null,
  updated_at: '2026-01-01T00:00:00Z',
};

const dashboard: ConnectorDashboard = {
  welcome: { headline: 'Welcome back, Connector One.', message: 'Your independent connector workspace.' },
  user: { id: 42, name: 'Connector One', email: 'connector1@finoocean.test', phone: null, member_since: null },
  role: { value: 'connector', label: 'Connector', independent: true, description: '' },
  account_status: { is_active: true, status: 'Active', profile_complete: true },
  stats: { leads_submitted: 3, approved_leads: 1, in_progress_leads: 1 },
  referral: { code: 'CONN0001A', link: 'http://localhost:4200/join-connector/CONN0001A', direct_referrals: 1 },
  network_totals: {
    referral_count: 3,
    converted_count: 1,
    commission_accrued: 1000,
    commission_paid: 0,
    pending_payout: 1000,
  },
};

const networkMember: ConnectorNetworkMember = {
  id: 2,
  user: { id: 43, name: 'Connector Two', email: 'connector2@finoocean.test', phone: null, is_active: true },
  referral_code: 'CONN0002B',
  status: 'active',
  status_label: 'Active',
  status_colour: 'success',
  joined_at: '2026-01-02T00:00:00Z',
};

const commission: ConnectorCommission = {
  id: 1,
  loan_lead: { id: 1, reference: 'LD-ABCDEFGHIJ', applicant_name: 'Test Applicant' },
  level: 0,
  source_connector: null,
  commission_rate: 1.5,
  commission_amount: 1000,
  status: 'accrued',
  status_label: 'Accrued',
  status_colour: 'accent',
  accrued_at: '2026-01-01T00:00:00Z',
  paid_at: null,
};

const payout: ConnectorPayout = {
  id: 1,
  reference: 'PO-ABCDEFGHIJ',
  connector: { id: 42, name: 'Connector One', email: 'connector1@finoocean.test' },
  amount: 1000,
  method: 'bank_transfer',
  status: 'pending',
  status_label: 'Pending',
  status_colour: 'accent',
  failure_reason: null,
  requested_at: '2026-01-01T00:00:00Z',
  processed_at: null,
  processed_by: null,
  created_at: '2026-01-01T00:00:00Z',
};

describe('ConnectorService', () => {
  let service: ConnectorService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ConnectorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('fetches the dashboard', () => {
    let result: ConnectorDashboard | undefined;
    service.dashboard().subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/connectors/dashboard'));
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: dashboard, message: null });

    expect(result).toEqual(dashboard);
  });

  it('fetches the profile', () => {
    let result: ConnectorProfile | undefined;
    service.profile().subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/connectors/profile'));
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: profile, message: null });

    expect(result).toEqual(profile);
  });

  it('updates the profile', () => {
    let result: ConnectorProfile | undefined;
    service.updateProfile({ alternate_phone: '9999999999' }).subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/connectors/profile'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ alternate_phone: '9999999999' });
    request.flush({ success: true, data: profile, message: 'Profile updated.' });

    expect(result).toEqual(profile);
  });

  it('fetches the network with pagination meta', () => {
    let result: { items: ConnectorNetworkMember[]; meta: unknown } | undefined;
    service.network({ page: 1, per_page: 15 }).subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/connectors/network'));
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      data: [networkMember],
      message: null,
      meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
    });

    expect(result?.items).toEqual([networkMember]);
    expect(result?.meta).toEqual({ current_page: 1, per_page: 15, total: 1, last_page: 1 });
  });

  it('fetches commissions with pagination meta', () => {
    let result: { items: ConnectorCommission[]; meta: unknown } | undefined;
    service.commissions().subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/connectors/commissions'));
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      data: [commission],
      message: null,
      meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
    });

    expect(result?.items).toEqual([commission]);
  });

  it('fetches payout history with pagination meta', () => {
    let result: { items: ConnectorPayout[]; meta: unknown } | undefined;
    service.payouts().subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/connectors/payouts'));
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      data: [payout],
      message: null,
      meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
    });

    expect(result?.items).toEqual([payout]);
  });

  it('requests a payout', () => {
    let result: ConnectorPayout | undefined;
    service.requestPayout().subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/connectors/payouts'));
    expect(request.request.method).toBe('POST');
    request.flush({ success: true, data: payout, message: 'Payout requested.' });

    expect(result).toEqual(payout);
  });
});
