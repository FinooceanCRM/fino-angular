import { EligibilityBand } from '@core/models/website.model';
import { InquiryStatus } from '@core/models/inquiry.model';

/** Maps an inquiry's processing state onto the CRM status-pill palette. */
export function inquiryColour(status: InquiryStatus): string {
  switch (status) {
    case 'new':
      return 'primary';
    case 'contacted':
    case 'follow_up':
      return 'accent';
    case 'interested':
    case 'converted':
    case 'assigned':
      return 'success';
    case 'not_reachable':
      return 'warn';
    default:
      return 'default';
  }
}

export function bandColour(band: EligibilityBand | null): string {
  switch (band) {
    case 'likely':
      return 'success';
    case 'possible':
      return 'accent';
    case 'needs_review':
      return 'warn';
    default:
      return 'default';
  }
}

export const BAND_LABELS: Record<EligibilityBand, string> = {
  likely: 'Likely',
  possible: 'Possible',
  needs_review: 'Needs review',
};

/** `datetime-local` input value → ISO string the API accepts (local time → UTC). */
export function localToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
