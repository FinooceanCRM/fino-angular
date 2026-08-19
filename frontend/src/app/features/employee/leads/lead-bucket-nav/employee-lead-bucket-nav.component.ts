import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface BucketLink {
  label: string;
  route: string;
}

const BUCKETS: BucketLink[] = [
  { label: 'All', route: '/employee/leads' },
  { label: 'New', route: '/employee/leads/new' },
  { label: 'Assigned', route: '/employee/leads/assigned' },
  { label: 'In Progress', route: '/employee/leads/in-progress' },
  { label: 'Documents Pending', route: '/employee/leads/documents-pending' },
  { label: 'Under Review', route: '/employee/leads/under-review' },
  { label: 'Approved', route: '/employee/leads/approved' },
  { label: 'Rejected', route: '/employee/leads/rejected' },
  { label: 'Disbursed', route: '/employee/leads/disbursed' },
  { label: 'Closed', route: '/employee/leads/closed' },
];

/** Status-bucket navigation strip shown at the top of every My Leads page, so the Employee can move between workflow stages. */
@Component({
  selector: 'app-employee-lead-bucket-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bucket-nav" aria-label="Lead status">
      @for (bucket of buckets; track bucket.route) {
        <a
          class="bucket-nav__link"
          [routerLink]="bucket.route"
          routerLinkActive="bucket-nav__link--active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          {{ bucket.label }}
        </a>
      }
    </nav>
  `,
  styles: [
    `
      .bucket-nav {
        display: flex;
        flex-wrap: wrap;
        gap: var(--app-space-2);
        margin-bottom: var(--app-space-4);
      }
      .bucket-nav__link {
        padding: 6px 14px;
        border-radius: var(--app-radius-pill);
        border: 1px solid var(--mat-sys-outline-variant);
        background: var(--mat-sys-surface-container);
        color: var(--app-status-default-fg);
        font-size: 0.8rem;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
      }
      .bucket-nav__link:hover {
        background: var(--mat-sys-surface-container-high);
      }
      .bucket-nav__link--active {
        background: var(--mat-sys-primary-container);
        border-color: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container, var(--mat-sys-primary));
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeLeadBucketNavComponent {
  protected readonly buckets = BUCKETS;
}
