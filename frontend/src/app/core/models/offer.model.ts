/** An offer as shown to visitors (popup + landing page). */
export interface PublicOffer {
  id: number;
  slug: string;
  name: string;
  type: string;
  type_label: string;
  badge_text: string | null;
  headline: string;
  description: string;
  benefits: string[];
  cta_text: string;
  /** Relative to the API base; use OfferService.imageUrl(). */
  image_url: string | null;
  valid_until: string | null;
}

export interface PopupConfig {
  enabled: boolean;
  /** The small "call me back" modal shown first to a new guest (no offer involved). */
  callback_enabled?: boolean;
  /** Seconds: first popup after the visit starts, second after the first is closed, then the gap between later ones. */
  first_delay_seconds?: number;
  second_delay_seconds?: number;
  repeat_gap_seconds?: number;
  /** Page patterns the popup may appear on ("/", "/services/*"); empty = every website page. */
  pages?: string[];
  offer?: PublicOffer | null;
}

export interface CallbackForm {
  name: string;
  phone: string;
  city: string;
  privacy_consent: boolean;
  website?: string;
  visitor_id?: string | null;
  elapsed_ms?: number;
}

export type OfferEventType = 'impression' | 'click' | 'landing_visit';

export interface OfferLeadForm {
  name: string;
  phone: string;
  email: string;
  city: string;
  interested_service?: string | null;
  message?: string | null;
  privacy_consent: boolean;
  marketing_consent: boolean;
  visitor_id: string | null;
  entry: 'popup' | 'landing';
  website: string;
  elapsed_ms: number;
}

// ── admin ──

export interface AdminOffer extends PublicOffer {
  is_active: boolean;
  show_popup: boolean;
  is_live: boolean;
  valid_from: string | null;
  sort_order: number;
  created_at: string | null;
  impressions?: number;
  clicks?: number;
  visits?: number;
  leads?: number;
}

export interface OfferInput {
  name: string;
  type: string;
  badge_text: string | null;
  headline: string;
  description: string;
  benefits: string[];
  cta_text: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  show_popup: boolean;
  sort_order: number;
}

export interface OfferSettings {
  popup_enabled: boolean;
  callback_enabled: boolean;
  first_delay_seconds: number;
  second_delay_seconds: number;
  repeat_gap_seconds: number;
  pages: string[];
  ranges: { first: [number, number]; second: [number, number]; repeat: [number, number] };
}

export interface OfferMeta {
  types: { value: string; label: string }[];
  services: { slug: string; name: string }[];
}

export interface OfferAnalytics {
  range: { from: string; to: string };
  totals: {
    impressions: number;
    unique_visitors_shown: number;
    clicks: number;
    landing_visits: number;
    leads: number;
    duplicates: number;
    callback_requests?: number;
    click_through_percent: number | null;
    conversion_percent: number | null;
    overall_percent: number | null;
  };
  best_offers: { id: number; name: string; is_active: boolean; impressions: number; clicks: number; visits: number; leads: number; conversion_percent: number | null }[];
  sources: { value: string; label: string; count: number }[];
  statuses: { value: string; label: string; count: number }[];
  leads_by_day: { date: string; count: number }[];
}
