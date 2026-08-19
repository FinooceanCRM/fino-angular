import { Injectable, signal } from '@angular/core';

export interface ManagerProfileData {
  name: string;
  email: string;
  managerCode: string;
  phone: string;
  alternatePhone: string;
  designation: string;
  branch: string;
  region: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ManagerProfileUpdatePayload {
  name: string;
  phone: string;
  alternatePhone: string;
  designation: string;
  branch: string;
  region: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ManagerSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  notifyOnAssignment: boolean;
  notifyOnApproval: boolean;
}

const SEED_PROFILE: ManagerProfileData = {
  name: 'Rahul Mehta',
  email: 'rahul.mehta@finoocean.com',
  managerCode: 'MGR-1001',
  phone: '+91 98765 43210',
  alternatePhone: '',
  designation: 'Regional Manager',
  branch: 'Mumbai HQ',
  region: 'West',
  addressLine1: '4th Floor, Finoocean Towers',
  addressLine2: 'Bandra Kurla Complex',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400051',
};

const SEED_SETTINGS: ManagerSettings = {
  emailNotifications: true,
  smsNotifications: false,
  notifyOnAssignment: true,
  notifyOnApproval: true,
};

/** Mock, self-contained — not wired to any real account/auth backend. */
@Injectable({ providedIn: 'root' })
export class ManagerProfileDataProvider {
  private readonly _profile = signal<ManagerProfileData>(SEED_PROFILE);
  private readonly _settings = signal<ManagerSettings>(SEED_SETTINGS);
  /** Stand-in for the account's current password, purely to make the change-password form meaningfully validate something. */
  private currentPasswordMock = 'Password@123';

  readonly profile = this._profile.asReadonly();
  readonly settings = this._settings.asReadonly();

  updateProfile(payload: ManagerProfileUpdatePayload): void {
    this._profile.update((current) => ({ ...current, ...payload }));
  }

  updateSettings(payload: ManagerSettings): void {
    this._settings.set(payload);
  }

  /** Returns `true` on success, `false` if `currentPassword` doesn't match the mock stored password. */
  changePassword(currentPassword: string, newPassword: string): boolean {
    if (currentPassword !== this.currentPasswordMock) {
      return false;
    }

    this.currentPasswordMock = newPassword;
    return true;
  }
}
