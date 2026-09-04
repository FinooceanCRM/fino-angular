import { BucketNavLink } from '@shared/components/bucket-nav.component';

/**
 * Shared by every Banker lead-workflow page so the bucket strip is identical
 * everywhere. Matched Leads is the funnel's entry point (leads scored ≥10%
 * against the banker's own bank criteria, not yet assigned to them);
 * Directly assigned leads start in Assigned Leads and move to Priority Leads
 * after the banker's "Request Full Details" request is approved; My Submitted
 * Leads are leads the banker created themselves.
 */
export const BANKER_LEAD_BUCKETS: BucketNavLink[] = [
  { label: 'Matched Leads', route: '/banker/leads' },
  { label: 'Priority Leads', route: '/banker/leads/priority' },
  { label: 'Assigned Leads', route: '/banker/leads/assigned' },
  { label: 'My Submitted Leads', route: '/banker/leads/submitted' },
];
