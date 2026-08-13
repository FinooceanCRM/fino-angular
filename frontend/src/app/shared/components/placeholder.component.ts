import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

/**
 * Neutral placeholder for permission-protected areas whose screens are
 * delivered in a later phase.
 */
@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="placeholder">
      <mat-card-title>Access granted</mat-card-title>
      <mat-card-content>
        <p>
          You have the required permissions for this area. The interface is
          delivered in a later phase.
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .placeholder {
        max-width: 32rem;
        margin: 3rem auto;
      }
    `,
  ],
})
export class PlaceholderComponent {}
