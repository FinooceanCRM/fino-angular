import { BucketNavLink } from '@shared/components/bucket-nav.component';

/**
 * Shared by every Banker lead-workflow page so the bucket strip is identical
 * everywhere. Matched Leads is the funnel's entry point (leads scored ≥10%
 * against the banker's own bank criteria, not yet assigned to them);
 * Priority Leads are leads a Manager assigned directly, still masked until
 * "Request Full Details" is approved; Assigned Leads are leads the banker
 * has full access to either way; My Submitted Leads are leads the banker
 * created themselves.
 */
export const BANKER_LEAD_BUCKETS: BucketNavLink[] = [
  { label: 'Matched Leads', route: '/banker/leads' },
  { label: 'Priority Leads', route: '/banker/leads/priority' },
  { label: 'Assigned Leads', route: '/banker/leads/assigned' },
  { label: 'My Submitted Leads', route: '/banker/leads/submitted' },
];
