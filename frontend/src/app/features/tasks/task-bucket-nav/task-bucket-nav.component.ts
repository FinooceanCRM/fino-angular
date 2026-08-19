import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface BucketLink {
  label: string;
  route: string;
}

const BUCKETS: BucketLink[] = [
  { label: 'All', route: '/tasks' },
  { label: 'Calls', route: '/tasks/calls' },
  { label: 'Meetings', route: '/tasks/meetings' },
  { label: 'Reminders', route: '/tasks/reminders' },
  { label: 'Follow-ups', route: '/tasks/follow-ups' },
];

/** Bucket navigation strip shown at the top of every Tasks page. */
@Component({
  selector: 'app-task-bucket-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bucket-nav" aria-label="Task type">
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
export class TaskBucketNavComponent {
  protected readonly buckets = BUCKETS;
}
