import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '@env/environment';

export interface PublicVendorRegistrationPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  /** The number the OTP is sent to — required. */
  phone: string;
  business_name: string;
  contact_person?: string;
  alternate_phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan_number?: string;
  gst_number?: string;
}

export interface PublicVendorOtpResult {
  message: string | null;
  /**
   * Only ever populated when the backend is running in debug/local mode —
   * there's no SMS gateway configured, so this saves digging through the
   * Laravel log for the code while testing. Never present in production.
   */
  devOtp: string | null;
  /**
   * False while the backend's signup OTP kill switch is off (no DLT/MSG91
   * approval yet — see config/vendors.php `otp_required`). The account is
   * then already active on registration; the caller should skip the OTP
   * step entirely rather than show a code field nothing will arrive for.
   */
  verificationRequired: boolean;
}

interface PublicVendorRegistrationApiResponse {
  success: boolean;
  message: string | null;
  data: { dev_otp?: string; verification_required?: boolean } | null;
}

/**
 * Bare HttpClient wrapper for the public "Join as Vendor" page and its
 * phone-OTP verification step (POST /public/vendors/register, /verify-otp,
 * /resend-otp). Mirrors PublicConnectorRegistrationService: these calls are
 * unauthenticated by design and have no business sharing plumbing with the
 * rest of the authenticated SPA's services.
 */
@Injectable({ providedIn: 'root' })
export class PublicVendorRegistrationService {
  private readonly http = inject(HttpClient);

  register(payload: PublicVendorRegistrationPayload): Observable<PublicVendorOtpResult> {
    return this.http
      .post<PublicVendorRegistrationApiResponse>(
        `${environment.apiBaseUrl}/public/vendors/register`,
        payload,
      )
      .pipe(map((response) => this.toOtpResult(response)));
  }

  verifyOtp(email: string, otp: string): Observable<string | null> {
    return this.http
      .post<PublicVendorRegistrationApiResponse>(`${environment.apiBaseUrl}/public/vendors/verify-otp`, {
        email,
        otp,
      })
      .pipe(map((response) => response.message));
  }

  resendOtp(email: string): Observable<PublicVendorOtpResult> {
    return this.http
      .post<PublicVendorRegistrationApiResponse>(`${environment.apiBaseUrl}/public/vendors/resend-otp`, {
        email,
      })
      .pipe(map((response) => this.toOtpResult(response)));
  }

  private toOtpResult(response: PublicVendorRegistrationApiResponse): PublicVendorOtpResult {
    return {
      message: response.message,
      devOtp: response.data?.dev_otp ?? null,
      verificationRequired: response.data?.verification_required ?? true,
    };
  }
}
