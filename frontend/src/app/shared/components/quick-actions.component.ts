import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

export interface QuickAction {
  label: string;
  route: string;
  icon: string;
}

/**
 * Row of shortcut buttons, reused across every role dashboard's quick
 * actions. Renders only `mat-card-actions` so it can drop into an existing
 * `mat-card` (e.g. alongside a welcome header) or stand alone inside one.
 */
@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card-actions class="quick-actions">
      @for (action of actions(); track action.label + action.route) {
        <a mat-stroked-button [routerLink]="action.route">
          <mat-icon>{{ action.icon }}</mat-icon>
          {{ action.label }}
        </a>
      }
    </mat-card-actions>
  `,
  styles: [
    `
      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
    `,
  ],
})
export class QuickActionsComponent {
  readonly actions = input<QuickAction[]>([]);
}
