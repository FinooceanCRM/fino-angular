import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reusable dialog shell for use as the content component passed to
 * `MatDialog.open(...)`. Provides a consistent header (title + close button)
 * and an optional actions row; the caller projects the body and actions.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>{{ title() }}</h2>
      <button mat-icon-button type="button" (click)="close()" aria-label="Close dialog">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <ng-content />
    </mat-dialog-content>

    @if (showActions()) {
      <mat-dialog-actions align="end">
        <ng-content select="[modal-actions]" />
      </mat-dialog-actions>
    }
  `,
  styles: [
    `
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .modal-header h2 {
        margin: 0;
      }
    `,
  ],
})
export class ModalComponent {
  readonly title = input('');
  readonly showActions = input(false);

  private readonly dialogRef = inject(MatDialogRef, { optional: true });

  protected close(): void {
    this.dialogRef?.close();
  }
}
