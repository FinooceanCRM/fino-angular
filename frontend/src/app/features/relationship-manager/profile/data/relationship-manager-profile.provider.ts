import { Injectable, signal } from '@angular/core';

export interface RelationshipManagerProfileData {
  name: string;
  email: string;
  rmCode: string;
  phone: string;
  dateOfJoining: string;
  designation: string;
  branch: string;
  region: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface RelationshipManagerProfileUpdatePayload {
  name: string;
  phone: string;
  designation: string;
  branch: string;
  region: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface RelationshipManagerSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  notifyOnLeadAssignment: boolean;
  notifyOnFollowUpDue: boolean;
}

// Field values match the approved RM Profile mockup exactly.
const SEED_PROFILE: RelationshipManagerProfileData = {
  name: 'Priya Nair',
  email: 'priya.nair@finoocean.com',
  rmCode: 'RM10245',
  phone: '+91 98765 43210',
  dateOfJoining: '2022-06-15',
  designation: 'Senior Relationship Manager',
  branch: 'Connaught Place Branch',
  region: 'North Region',
  addressLine1: '120, Financial District',
  addressLine2: 'Tower A, 5th Floor',
  city: 'New Delhi',
  state: 'Delhi',
  pincode: '110001',
};

const SEED_SETTINGS: RelationshipManagerSettings = {
  emailNotifications: true,
  smsNotifications: false,
  notifyOnLeadAssignment: true,
  notifyOnFollowUpDue: true,
};

/** Mock, self-contained — not wired to any real account/auth backend. */
@Injectable({ providedIn: 'root' })
export class RelationshipManagerProfileDataProvider {
  private readonly _profile = signal<RelationshipManagerProfileData>(SEED_PROFILE);
  private readonly _settings = signal<RelationshipManagerSettings>(SEED_SETTINGS);
  /** Stand-in for the account's current password, purely to make the change-password form meaningfully validate something. */
  private currentPasswordMock = 'Password@123';

  readonly profile = this._profile.asReadonly();
  readonly settings = this._settings.asReadonly();

  updateProfile(payload: RelationshipManagerProfileUpdatePayload): void {
    this._profile.update((current) => ({ ...current, ...payload }));
  }

  updateSettings(payload: RelationshipManagerSettings): void {
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
