import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import {
  AffiliateCommission,
  AffiliateDashboard,
  AffiliatePayout,
  AffiliateProfile,
  AffiliateReferral,
} from '@core/models/affiliate.model';
import { AuthenticatedUser } from '@core/models/user.model';

import { AffiliateService } from './affiliate.service';

const user: AuthenticatedUser = {
  id: 42,
  name: 'Affiliate One',
  email: 'affiliate1@finoocean.test',
  role: 'affiliate',
  role_label: 'Affiliate',
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

const profile: AffiliateProfile = {
  id: 1,
  user,
  referral_code: 'AFF1000A',
  commission_rate: 2.5,
  status: 'active',
  status_label: 'Active',
  status_colour: 'success',
  email_verified_at: '2026-01-01T00:00:00Z',
  alternate_phone: null,
  payout_method: 'bank_transfer',
  payout_account_name: 'Affiliate One',
  payout_account_number: '123456789012',
  payout_ifsc_or_upi: 'HDFC0001234',
  joined_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  referral_count: null,
  converted_count: null,
  commission_accrued: null,
  commission_paid: null,
};

const dashboard: AffiliateDashboard = {
  welcome: { headline: 'Welcome back, Affiliate One.', message: 'This is your independent affiliate workspace.' },
  user: { id: 42, name: 'Affiliate One', email: 'affiliate1@finoocean.test', phone: null, member_since: null },
  referral: { code: 'AFF1000A', link: 'http://localhost:4200/ref/AFF1000A' },
  totals: {
    referral_count: 3,
    converted_count: 1,
    commission_accrued: 2500,
    commission_paid: 0,
    pending_payout: 2500,
  },
  account_status: { is_active: true, status: 'Active', email_verified: true },
};

const referral: AffiliateReferral = {
  id: 1,
  reference: 'LD-ABCDEFGHIJ',
  applicant_name: 'Test Applicant',
  loan_type: 'personal',
  status: 'new',
  status_label: 'New',
  status_colour: 'default',
  created_at: '2026-01-01T00:00:00Z',
};

const commission: AffiliateCommission = {
  id: 1,
  loan_lead: { id: 1, reference: 'LD-ABCDEFGHIJ', applicant_name: 'Test Applicant' },
  commission_rate: 2.5,
  commission_amount: 2500,
  status: 'accrued',
  status_label: 'Accrued',
  status_colour: 'accent',
  accrued_at: '2026-01-01T00:00:00Z',
  paid_at: null,
};

const payout: AffiliatePayout = {
  id: 1,
  reference: 'PO-ABCDEFGHIJ',
  affiliate: { id: 42, name: 'Affiliate One', email: 'affiliate1@finoocean.test' },
  amount: 2500,
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

describe('AffiliateService', () => {
  let service: AffiliateService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AffiliateService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('fetches the dashboard', () => {
    let result: AffiliateDashboard | undefined;
    service.dashboard().subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/affiliates/dashboard'));
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: dashboard, message: null });

    expect(result).toEqual(dashboard);
  });

  it('fetches the profile', () => {
    let result: AffiliateProfile | undefined;
    service.profile().subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/affiliates/profile'));
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: profile, message: null });

    expect(result).toEqual(profile);
  });

  it('updates the profile', () => {
    let result: AffiliateProfile | undefined;
    service.updateProfile({ alternate_phone: '9999999999' }).subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/affiliates/profile'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ alternate_phone: '9999999999' });
    request.flush({ success: true, data: profile, message: 'Profile updated.' });

    expect(result).toEqual(profile);
  });

  it('fetches referrals with pagination meta', () => {
    let result: { items: AffiliateReferral[]; meta: unknown } | undefined;
    service.referrals({ page: 1, per_page: 15 }).subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/affiliates/referrals'));
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      data: [referral],
      message: null,
      meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
    });

    expect(result?.items).toEqual([referral]);
    expect(result?.meta).toEqual({ current_page: 1, per_page: 15, total: 1, last_page: 1 });
  });

  it('fetches commissions with pagination meta', () => {
    let result: { items: AffiliateCommission[]; meta: unknown } | undefined;
    service.commissions().subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/affiliates/commissions'));
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
    let result: { items: AffiliatePayout[]; meta: unknown } | undefined;
    service.payouts().subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/affiliates/payouts'));
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
    let result: AffiliatePayout | undefined;
    service.requestPayout().subscribe((value) => (result = value));

    const request = http.expectOne((r) => r.url.endsWith('/affiliates/payouts'));
    expect(request.request.method).toBe('POST');
    request.flush({ success: true, data: payout, message: 'Payout requested.' });

    expect(result).toEqual(payout);
  });
});
