import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

/** Standardises the `mat-card` + `margin-bottom` pattern repeated across every feature page. */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="app-card">
      @if (title() || subtitle()) {
        <mat-card-header>
          @if (title()) {
            <mat-card-title>{{ title() }}</mat-card-title>
          }
          @if (subtitle()) {
            <mat-card-subtitle>{{ subtitle() }}</mat-card-subtitle>
          }
        </mat-card-header>
      }

      <mat-card-content>
        <ng-content />
      </mat-card-content>

      @if (showActions()) {
        <mat-card-actions align="end">
          <ng-content select="[card-actions]" />
        </mat-card-actions>
      }
    </mat-card>
  `,
  styles: [
    `
      .app-card {
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class CardComponent {
  readonly title = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
  readonly showActions = input(false);
}
