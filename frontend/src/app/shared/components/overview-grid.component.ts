import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

export interface OverviewGridSection {
  icon: string;
  title: string;
  description: string;
  link: string;
}

/**
 * Landing-page card grid — one tappable card per section, routing into a
 * sub-area of a module. Extracted from three near-identical implementations
 * (Super Admin's Users, Banking and Commissions landings), which differed
 * only in class-name prefix and section data; purely presentational, so any
 * host that supplies `{icon, title, description, link}[]` can adopt it.
 */
@Component({
  selector: 'app-overview-grid',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overview-grid">
      @for (section of sections(); track section.link) {
        <a class="overview-grid__card" [routerLink]="section.link">
          <mat-card>
            <mat-card-content class="overview-grid__content">
              <span class="overview-grid__icon">
                <mat-icon>{{ section.icon }}</mat-icon>
              </span>
              <h2 class="overview-grid__title">{{ section.title }}</h2>
              <p class="overview-grid__description">{{ section.description }}</p>
              <span class="overview-grid__link">
                Open
                <mat-icon>arrow_forward</mat-icon>
              </span>
            </mat-card-content>
          </mat-card>
        </a>
      }
    </div>
  `,
  styles: [
    `
      .overview-grid {
        display: grid;
        gap: var(--app-space-4);
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        margin-top: var(--app-space-4);
      }

      .overview-grid__card {
        display: block;
        text-decoration: none;
        color: inherit;

        mat-card {
          height: 100%;
          border-radius: var(--app-radius-md);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          border: 1px solid transparent;
        }

        &:hover mat-card {
          border-color: var(--mat-sys-primary);
          box-shadow: var(--app-shadow-sm);
        }
      }

      .overview-grid__content {
        display: flex;
        flex-direction: column;
        gap: var(--app-space-2);
      }

      .overview-grid__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-primary);
        margin-bottom: var(--app-space-2);
      }

      .overview-grid__title {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
      }

      .overview-grid__description {
        margin: 0;
        color: var(--app-status-default-fg);
        font-size: 0.88rem;
        flex: 1;
      }

      .overview-grid__link {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: var(--app-space-2);
        color: var(--mat-sys-primary);
        font-weight: 500;
        font-size: 0.85rem;

        mat-icon {
          font-size: 1rem;
          width: 1rem;
          height: 1rem;
        }
      }
    `,
  ],
})
export class OverviewGridComponent {
  readonly sections = input.required<OverviewGridSection[]>();
}
