import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { TelecallerFollowUpReminders } from '@core/models/telecaller.model';
import { ModalComponent } from '@shared/components/modal.component';

export type TelecallerReminderPopupData = TelecallerFollowUpReminders;

/**
 * Login-time reminder popup — shown once per dashboard load whenever the
 * Telecaller has an overdue or due-today follow-up, mirroring the legacy
 * WordPress "Follow-up Reminder" popup.
 */
@Component({
  selector: 'app-telecaller-reminder-popup',
  standalone: true,
  imports: [MatButtonModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal title="Follow-up reminder" [showActions]="true">
      @if (data.overdue > 0) {
        <p class="reminder-line reminder-line--overdue">
          <strong>{{ data.overdue }}</strong> follow-up{{ data.overdue === 1 ? '' : 's' }} overdue.
        </p>
      }
      @if (data.today > 0) {
        <p class="reminder-line reminder-line--today">
          <strong>{{ data.today }}</strong> follow-up{{ data.today === 1 ? '' : 's' }} due today.
        </p>
      }
      @if (data.upcoming > 0) {
        <p class="reminder-line">
          <strong>{{ data.upcoming }}</strong> upcoming follow-up{{ data.upcoming === 1 ? '' : 's' }}.
        </p>
      }

      <button modal-actions mat-button type="button" (click)="dialogRef.close()">Close</button>
      <button modal-actions mat-flat-button color="primary" type="button" (click)="viewFollowUps()">
        View follow-ups
      </button>
    </app-modal>
  `,
  styles: [
    `
      .reminder-line {
        margin: 0 0 var(--app-space-2);
      }
      .reminder-line--overdue {
        color: var(--mat-sys-error);
      }
      .reminder-line--today {
        color: var(--mat-sys-primary);
      }
    `,
  ],
})
export class TelecallerReminderPopupComponent {
  protected readonly data = inject<TelecallerReminderPopupData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<TelecallerReminderPopupComponent>);
  private readonly router = inject(Router);

  protected viewFollowUps(): void {
    this.dialogRef.close();
    this.router.navigateByUrl('/telecaller/follow-ups');
  }
}
