import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '@env/environment';

export interface PublicBankerRegistrationPayload {
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  password_confirmation: string;
  /** The number the OTP is sent to — required. */
  phone: string;
  city: string;
  state: string;
  pincode?: string;
  country: string;
  pan_number?: string;
  bank_name?: string;
  branch_address?: string;
  branch_location?: string;
  bank_city?: string;
  bank_state?: string;
  /** Loan-product keys the banker handles — multi-select. */
  products?: string[];
  manager_name?: string;
  manager_email?: string;
  manager_phone?: string;
}

export interface PublicBankerOtpResult {
  message: string | null;
  /**
   * Only ever populated when the backend is running in debug/local mode —
   * there's no SMS gateway configured, so this saves digging through the
   * Laravel log for the code while testing. Never present in production.
   */
  devOtp: string | null;
  /**
   * False while the backend's signup OTP kill switch is off (no DLT/MSG91
   * approval yet — see config/bankers.php `otp_required`). The account is
   * then already active on registration; the caller should skip the OTP
   * step entirely rather than show a code field nothing will arrive for.
   */
  verificationRequired: boolean;
}

interface PublicBankerRegistrationApiResponse {
  success: boolean;
  message: string | null;
  data: { dev_otp?: string; verification_required?: boolean } | null;
}

/**
 * Bare HttpClient wrapper for the public "Join as Banker" page and its
 * phone-OTP verification step (POST /public/bankers/register, /verify-otp,
 * /resend-otp). Mirrors PublicVendorRegistrationService: these calls are
 * unauthenticated by design and have no business sharing plumbing with the
 * rest of the authenticated SPA's services.
 */
@Injectable({ providedIn: 'root' })
export class PublicBankerRegistrationService {
  private readonly http = inject(HttpClient);

  register(payload: PublicBankerRegistrationPayload): Observable<PublicBankerOtpResult> {
    return this.http
      .post<PublicBankerRegistrationApiResponse>(
        `${environment.apiBaseUrl}/public/bankers/register`,
        payload,
      )
      .pipe(map((response) => this.toOtpResult(response)));
  }

  verifyOtp(email: string, otp: string): Observable<string | null> {
    return this.http
      .post<PublicBankerRegistrationApiResponse>(`${environment.apiBaseUrl}/public/bankers/verify-otp`, {
        email,
        otp,
      })
      .pipe(map((response) => response.message));
  }

  resendOtp(email: string): Observable<PublicBankerOtpResult> {
    return this.http
      .post<PublicBankerRegistrationApiResponse>(`${environment.apiBaseUrl}/public/bankers/resend-otp`, {
        email,
      })
      .pipe(map((response) => this.toOtpResult(response)));
  }

  private toOtpResult(response: PublicBankerRegistrationApiResponse): PublicBankerOtpResult {
    return {
      message: response.message,
      devOtp: response.data?.dev_otp ?? null,
      verificationRequired: response.data?.verification_required ?? true,
    };
  }
}
