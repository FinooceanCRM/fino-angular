import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  Address,
  BankAccount,
  BankForm,
  CommunicationPrefs,
  KycSummary,
  PrefillView,
  ProfileView,
  SessionRow,
  UpiId,
} from '@core/models/customer-profile.model';

import { ApiService } from './api.service';
import { DownloadService } from './download.service';

/** Customer "Profile" section API (`/customer/profile`, `/kyc`, `/bank-accounts`, `/upi-ids`, …). */
@Injectable({ providedIn: 'root' })
export class CustomerProfileService {
  private readonly api = inject(ApiService);
  private readonly downloads = inject(DownloadService);

  /** Object URL of the profile photo (the file sits behind a bearer token, so it can't be a plain <img src>). */
  readonly photoUrl = signal<string | null>(null);

  profile(): Observable<ProfileView> {
    return this.api.get<ProfileView>('customer/profile');
  }

  /** Everything we already know about the customer, to pre-fill forms. */
  prefill(): Observable<PrefillView> {
    return this.api.get<PrefillView>('customer/profile/prefill');
  }

  saveDetails(body: {
    dob?: string | null; gender?: string | null; marital_status?: string | null; occupation?: string | null; language?: string;
    pan?: string | null; aadhaar?: string | null; employment_type?: string | null; company?: string | null; designation?: string | null;
    experience_years?: number | null; monthly_income?: number | null; office_address?: string | null; work_city?: string | null;
  }): Observable<ProfileView> {
    return this.api.patch<ProfileView>('customer/profile/details', body);
  }

  saveContact(body: { name: string; phone: string }): Observable<unknown> {
    return this.api.put('customer/profile', body);
  }

  saveAddresses(body: { current_address?: Address; permanent_same_as_current?: boolean; permanent_address?: Address }): Observable<ProfileView> {
    return this.api.put<ProfileView>('customer/profile/addresses', body);
  }

  loadPhoto(): void {
    this.api.download('customer/profile/photo').subscribe({
      next: (blob) => {
        const old = this.photoUrl();
        this.photoUrl.set(URL.createObjectURL(blob));
        if (old) URL.revokeObjectURL(old);
      },
      error: () => this.photoUrl.set(null),
    });
  }

  uploadPhoto(file: File): Observable<unknown> {
    const form = new FormData();
    form.append('file', file);

    return this.api.upload('customer/profile/photo', form).pipe(tap(() => this.loadPhoto()));
  }

  removePhoto(): Observable<unknown> {
    return this.api.delete('customer/profile/photo').pipe(tap(() => this.photoUrl.set(null)));
  }

  kyc(): Observable<KycSummary> {
    return this.api.get<KycSummary>('customer/kyc');
  }

  uploadKyc(type: string, file: File, number?: string): Observable<{ id: number; status: string; kyc: KycSummary }> {
    const form = new FormData();
    form.append('file', file);
    if (number) form.append('number', number);

    return this.api.upload(`customer/kyc/${type}`, form);
  }

  /** Opens a KYC file in a new tab. */
  viewKyc(id: number): void {
    this.api.download(`customer/kyc/documents/${id}/download`).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }

  /** The raw file of a KYC document, for in-page previews. */
  kycBlob(id: number): Observable<Blob> {
    return this.api.download(`customer/kyc/documents/${id}/download`);
  }

  banks(): Observable<BankAccount[]> {
    return this.api.get<BankAccount[]>('customer/bank-accounts');
  }

  addBank(form: BankForm): Observable<BankAccount[]> {
    return this.api.post<BankAccount[]>('customer/bank-accounts', form);
  }

  primaryBank(id: number): Observable<BankAccount[]> {
    return this.api.post<BankAccount[]>(`customer/bank-accounts/${id}/primary`);
  }

  deleteBank(id: number): Observable<BankAccount[]> {
    return this.api.delete<BankAccount[]>(`customer/bank-accounts/${id}`);
  }

  upiIds(): Observable<UpiId[]> {
    return this.api.get<UpiId[]>('customer/upi-ids');
  }

  addUpi(vpa: string): Observable<UpiId[]> {
    return this.api.post<UpiId[]>('customer/upi-ids', { vpa });
  }

  primaryUpi(id: number): Observable<UpiId[]> {
    return this.api.post<UpiId[]>(`customer/upi-ids/${id}/primary`);
  }

  deleteUpi(id: number): Observable<UpiId[]> {
    return this.api.delete<UpiId[]>(`customer/upi-ids/${id}`);
  }

  communication(): Observable<CommunicationPrefs> {
    return this.api.get<CommunicationPrefs>('customer/communication');
  }

  saveCommunication(body: Partial<CommunicationPrefs>): Observable<CommunicationPrefs> {
    return this.api.put<CommunicationPrefs>('customer/communication', body);
  }

  changePassword(current: string, next: string, confirm: string): Observable<unknown> {
    return this.api.post('auth/password', { current_password: current, password: next, password_confirmation: confirm });
  }

  sessions(): Observable<SessionRow[]> {
    return this.api.get<SessionRow[]>('customer/security/sessions');
  }

  signOutOthers(): Observable<{ signed_out: number }> {
    return this.api.delete<{ signed_out: number }>('customer/security/sessions/others');
  }

  /** Saves a JSON copy of the customer's own data. */
  async downloadMyData(): Promise<void> {
    const data = await new Promise<unknown>((resolve, reject) => this.api.get<unknown>('customer/data-export').subscribe({ next: resolve, error: reject }));
    await this.downloads.save(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'my-finoocean-data.json');
  }

  requestDeletion(body: { password: string; reason: string; comments: string; confirm: boolean }): Observable<unknown> {
    return this.api.post('customer/account/deletion-request', body);
  }

  cancelDeletion(): Observable<unknown> {
    return this.api.delete('customer/account/deletion-request');
  }

  deactivate(password: string): Observable<unknown> {
    return this.api.post('customer/account/deactivate', { password });
  }
}
