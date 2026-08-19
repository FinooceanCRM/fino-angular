/** The Super Admin module's Settings — General, Matching Engine, Notifications and Security. */

import { NotificationCategory } from './notification.model';

export interface CompanyInfo {
  company_name: string;
  support_email: string;
  support_phone: string;
  address: string;
  currency: string;
}

export interface BrandingSettings {
  primary_color: string;
  logo_url: string;
  favicon_url: string;
  tagline: string;
}

export interface EmailSettings {
  from_name: string;
  from_email: string;
  reply_to_email: string;
  footer_text: string;
}

export interface RegionalSettings {
  timezone: string;
  date_format: string;
  business_hours: string;
}

export interface PlatformOptions {
  default_page_size: number;
  maintenance_mode: boolean;
}

export interface GeneralSettings {
  company: CompanyInfo;
  branding: BrandingSettings;
  email: EmailSettings;
  regional: RegionalSettings;
  platform: PlatformOptions;
}

export interface LoanAmountLimit {
  loan_type: string;
  min_amount: number;
  max_amount: number;
}

export type CityTier = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface CityMapping {
  city: string;
  state: string;
  tier: CityTier;
  serviceable: boolean;
}

export interface MatchingEngineSettings {
  min_cibil_score: number;
  min_match_score: number;
  auto_run_on_create: boolean;
  enabled_loan_types: string[];
  loan_amount_limits: LoanAmountLimit[];
  city_mapping: CityMapping[];
}

export type NotificationDigestFrequency = 'real_time' | 'daily' | 'weekly';

export const DIGEST_FREQUENCY_LABEL: Record<NotificationDigestFrequency, string> = {
  real_time: 'Real-time',
  daily: 'Daily digest',
  weekly: 'Weekly digest',
};

export interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  digest_frequency: NotificationDigestFrequency;
  category_channels: Record<NotificationCategory, boolean>;
}

export interface SecuritySettings {
  session_timeout_minutes: number;
  min_password_length: number;
  require_special_character: boolean;
  require_number: boolean;
  two_factor_required: boolean;
  max_login_attempts: number;
  ip_allowlist_enabled: boolean;
  ip_allowlist: string;
}

export interface SettingsState {
  general: GeneralSettings;
  matching_engine: MatchingEngineSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}
