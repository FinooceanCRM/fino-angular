import { Injectable, inject, signal } from '@angular/core';

import { LOAN_TYPE_CATALOGUE } from '../models/lead.model';
import { NotificationCategory } from '../models/notification.model';
import { CityMapping, SettingsState } from '../models/settings.model';
import { AuditLogDataProvider } from './audit-log-data.provider';

const SEED_CITY_MAPPING: CityMapping[] = [
  { city: 'Mumbai', state: 'Maharashtra', tier: 'Tier 1', serviceable: true },
  { city: 'Delhi', state: 'Delhi', tier: 'Tier 1', serviceable: true },
  { city: 'Bengaluru', state: 'Karnataka', tier: 'Tier 1', serviceable: true },
  { city: 'Chennai', state: 'Tamil Nadu', tier: 'Tier 1', serviceable: true },
  { city: 'Hyderabad', state: 'Telangana', tier: 'Tier 1', serviceable: true },
  { city: 'Pune', state: 'Maharashtra', tier: 'Tier 1', serviceable: true },
  { city: 'Ahmedabad', state: 'Gujarat', tier: 'Tier 2', serviceable: true },
  { city: 'Jaipur', state: 'Rajasthan', tier: 'Tier 2', serviceable: false },
];

const LOAN_AMOUNT_SEED: Record<string, { min: number; max: number }> = {
  home: { min: 500000, max: 20000000 },
  personal: { min: 50000, max: 2500000 },
  business: { min: 200000, max: 15000000 },
  auto: { min: 100000, max: 5000000 },
  education: { min: 100000, max: 4000000 },
  loan_against_property: { min: 500000, max: 30000000 },
};

const ALL_NOTIFICATION_CATEGORIES_ENABLED: Record<NotificationCategory, boolean> = {
  leads: true,
  users: true,
  banking: true,
  documents: true,
  commission: true,
  system: true,
};

const SEED_SETTINGS: SettingsState = {
  general: {
    company: {
      company_name: 'FinoOcean',
      support_email: 'support@finoocean.com',
      support_phone: '+91 22 4000 5000',
      address: 'FinoOcean Towers, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
      currency: 'INR',
    },
    branding: {
      primary_color: '#0B5FFF',
      logo_url: 'https://assets.finoocean.com/brand/logo.svg',
      favicon_url: 'https://assets.finoocean.com/brand/favicon.png',
      tagline: 'Loans, matched right.',
    },
    email: {
      from_name: 'FinoOcean',
      from_email: 'no-reply@finoocean.com',
      reply_to_email: 'support@finoocean.com',
      footer_text: '© FinoOcean. This is an automated message — please do not reply directly.',
    },
    regional: {
      timezone: 'Asia/Kolkata',
      date_format: 'DD MMM YYYY',
      business_hours: '9:00 AM – 6:00 PM IST, Mon–Sat',
    },
    platform: {
      default_page_size: 15,
      maintenance_mode: false,
    },
  },
  matching_engine: {
    min_cibil_score: 650,
    min_match_score: 60,
    auto_run_on_create: true,
    enabled_loan_types: LOAN_TYPE_CATALOGUE.map((t) => t.value),
    loan_amount_limits: LOAN_TYPE_CATALOGUE.map((t) => ({
      loan_type: t.value,
      min_amount: LOAN_AMOUNT_SEED[t.value].min,
      max_amount: LOAN_AMOUNT_SEED[t.value].max,
    })),
    city_mapping: SEED_CITY_MAPPING,
  },
  notifications: {
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    digest_frequency: 'real_time',
    category_channels: { ...ALL_NOTIFICATION_CATEGORIES_ENABLED },
  },
  security: {
    session_timeout_minutes: 60,
    min_password_length: 8,
    require_special_character: true,
    require_number: true,
    two_factor_required: false,
    max_login_attempts: 5,
    ip_allowlist_enabled: false,
    ip_allowlist: '',
  },
};

/**
 * Centralized state for platform settings — General, Matching Engine,
 * Notifications and Security. A "Save" mutates this signal and records an
 * audit entry; nothing survives a hard reload since there is no settings
 * API yet.
 */
@Injectable({ providedIn: 'root' })
export class SettingsDataProvider {
  private readonly auditLog = inject(AuditLogDataProvider);

  private readonly _settings = signal<SettingsState>(SEED_SETTINGS);

  readonly settings = this._settings.asReadonly();

  saveGeneral(value: SettingsState['general']): void {
    this._settings.update((current) => ({ ...current, general: value }));
    this.log('General settings');
  }

  saveMatchingEngine(value: SettingsState['matching_engine']): void {
    this._settings.update((current) => ({ ...current, matching_engine: value }));
    this.log('Matching Engine settings');
  }

  saveNotifications(value: SettingsState['notifications']): void {
    this._settings.update((current) => ({ ...current, notifications: value }));
    this.log('Notification settings');
  }

  saveSecurity(value: SettingsState['security']): void {
    this._settings.update((current) => ({ ...current, security: value }));
    this.log('Security settings');
  }

  private log(entityLabel: string): void {
    this.auditLog.record({
      action: 'updated',
      entity_type: 'Settings',
      entity_label: entityLabel,
      description: `Updated ${entityLabel.toLowerCase()}.`,
      category: 'other',
    });
  }
}
