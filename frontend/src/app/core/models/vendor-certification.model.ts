/** Vendor Certification domain models — the Fino-native rebuild of the
 *  reference Customer Survey. */

export type VendorCertificationStatus = 'draft' | 'pending' | 'completed' | 'rejected';

export type CertImageType = 'vendor' | 'shop' | 'product';

export interface CertImage {
  id: number;
  image_type: CertImageType;
  original_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  /** Relative API path for the bearer-gated, owner-checked image stream.
   *  Fetch it as a blob (auth header attached) — never used as a raw <img src>. */
  path: string;
  created_at: string | null;
}

export interface CertificateMeta {
  org: string;
  department: string;
  officer: string;
  verification_code: string;
}

/** A Vendor Certification row (draft or submitted). Field names match the
 *  `vendor_certifications` columns 1:1 (which match the source survey). */
export interface VendorCertification {
  id: number;
  certificate_number: string | null;
  status: VendorCertificationStatus;
  status_label: string | null;
  status_colour: string | null;

  // Step 2 — personal
  full_name: string | null;
  guardian_name: string | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  age: number | null;
  dob: string | null;
  mobile: string | null;
  alt_mobile: string | null;
  email: string | null;
  aadhaar_number: string | null;
  occupation: string | null;
  education: string | null;
  category: string | null;
  social_category: string | null;

  // Step 2 — business
  shop_name: string | null;
  business_type: string | null;
  vendor_category: string | null;
  years_in_business: number | null;
  ownership: string | null;
  gst_number: string | null;
  license_number: string | null;
  daily_income: number | null;
  monthly_income: number | null;
  employees: number | null;
  seasonal_business: 'Yes' | 'No' | null;
  business_open_time: string | null;
  business_close_time: string | null;
  weekly_holiday: string | null;

  // Step 3 — location / GPS
  gps_latitude: number | null;
  gps_longitude: number | null;
  accuracy: number | null;
  gps_heading: number | null;
  gps_speed: number | null;
  gps_captured_at: string | null;
  location_verified: boolean;
  location_mode: 'gps' | 'manual' | null;

  // Step 3 — address
  house_no: string | null;
  building: string | null;
  street: string | null;
  area: string | null;
  village: string | null;
  address: string | null;
  landmark: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pin_code: string | null;
  country: string | null;

  // Step 5 — declarations
  declaration_truth: boolean;
  declaration_submit: boolean;

  remarks: string | null;
  submitted_at: string | null;
  created_at: string | null;
  updated_at: string | null;

  images: CertImage[];
  certificate?: CertificateMeta;
}

export interface CertImageProfile {
  label: string;
  folder: string;
  max_bytes: number;
  min_width: number;
  min_height: number;
  pref_width: number;
  pref_height: number;
  shape: 'portrait' | 'landscape';
  capture: 'user' | 'environment';
  required: boolean;
  max_files?: number;
}

export interface VendorCertificationMetadata {
  catalogues: {
    business_type: string[];
    vendor_category: string[];
    social_category: string[];
    education: string[];
    occupation: string[];
    ownership: string[];
    weekly_holiday: string[];
  };
  image_profiles: Record<CertImageType, CertImageProfile>;
  map: {
    provider: string;
    mapbox_token: string;
    default_lat: number;
    default_lng: number;
    default_zoom: number;
    good_accuracy: number;
  };
}

/** Reverse / forward geocode result — matches GeocodeController's shape. */
export interface GeocodeAddress {
  address: string;
  house_no: string;
  building: string;
  street: string;
  landmark: string;
  area: string;
  village: string;
  city: string;
  district: string;
  state: string;
  pin_code: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface GeocodeSuggestion {
  title: string;
  subtitle: string;
  display: string;
  lat: number;
  lng: number;
}

/** Payload written to the draft (a partial of the survey columns). */
export type VendorCertificationDraftPayload = Partial<
  Pick<
    VendorCertification,
    | 'full_name' | 'guardian_name' | 'gender' | 'age' | 'dob' | 'mobile' | 'alt_mobile'
    | 'email' | 'aadhaar_number' | 'occupation' | 'education' | 'category' | 'social_category'
    | 'shop_name' | 'business_type' | 'vendor_category' | 'years_in_business' | 'ownership'
    | 'gst_number' | 'license_number' | 'daily_income' | 'monthly_income' | 'employees'
    | 'seasonal_business' | 'business_open_time' | 'business_close_time' | 'weekly_holiday'
    | 'gps_latitude' | 'gps_longitude' | 'accuracy' | 'gps_heading' | 'gps_speed'
    | 'gps_captured_at' | 'location_verified' | 'location_mode'
    | 'house_no' | 'building' | 'street' | 'area' | 'village' | 'address' | 'landmark'
    | 'city' | 'district' | 'state' | 'pin_code' | 'country'
    | 'declaration_truth' | 'declaration_submit'
  >
>;
