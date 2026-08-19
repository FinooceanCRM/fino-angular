import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface BucketNavLink {
  label: string;
  route: string;
}

/**
 * Status-bucket navigation strip shown at the top of a workflow-stage page
 * (e.g. a lead's New/Assigned/Approved buckets), so the user can move
 * between stages without going back through the sidebar. Config-driven —
 * pass the ordered list of stage links via `links`.
 */
@Component({
  selector: 'app-bucket-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bucket-nav" [attr.aria-label]="ariaLabel()">
      @for (link of links(); track link.route) {
        <a
          class="bucket-nav__link"
          [routerLink]="link.route"
          routerLinkActive="bucket-nav__link--active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          {{ link.label }}
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
export class BucketNavComponent {
  readonly links = input.required<BucketNavLink[]>();
  readonly ariaLabel = input('Workflow stage');
}
