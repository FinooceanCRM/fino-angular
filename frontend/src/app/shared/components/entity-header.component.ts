import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StatusPillComponent } from './status-pill.component';

/**
 * Header for an entity detail page: avatar initials, title, an id/reference
 * chip, an optional status pill, and a projected row of action buttons.
 * Mirrors the lead/user/profile detail header pattern from the approved
 * mockups so every detail page reads the same way.
 */
@Component({
  selector: 'app-entity-header',
  standalone: true,
  imports: [StatusPillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="entity-header">
      <span class="entity-header__avatar">{{ initials() }}</span>

      <div class="entity-header__text">
        <h1 class="entity-header__title">{{ title() }}</h1>
        <div class="entity-header__meta">
          @if (idLabel()) {
            <span class="entity-header__id">{{ idLabel() }}: {{ idValue() }}</span>
          }
          @if (statusLabel()) {
            <app-status-pill [label]="statusLabel()!" [colour]="statusColour() ?? 'default'" />
          }
        </div>
      </div>

      <div class="entity-header__actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      .entity-header {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--app-space-4);
        margin-bottom: var(--app-space-4);
      }
      .entity-header__avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-primary);
        font-size: 1.35rem;
        font-weight: 700;
      }
      .entity-header__text {
        flex: 1 1 220px;
        min-width: 0;
      }
      .entity-header__title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        line-height: 1.25;
      }
      .entity-header__meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--app-space-3);
        margin-top: var(--app-space-1);
      }
      .entity-header__id {
        color: var(--app-status-default-fg);
        font-size: 0.9rem;
      }
      .entity-header__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--app-space-2);
        flex-shrink: 0;
      }
    `,
  ],
})
export class EntityHeaderComponent {
  readonly title = input.required<string>();
  readonly idLabel = input<string | undefined>(undefined);
  readonly idValue = input<string | number | undefined>(undefined);
  readonly statusLabel = input<string | undefined>(undefined);
  readonly statusColour = input<string | undefined>(undefined);

  protected readonly initials = computed(() => {
    const parts = this.title().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  });
}
