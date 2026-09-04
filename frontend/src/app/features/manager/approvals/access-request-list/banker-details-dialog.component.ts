import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { UserSummary } from '@core/models/lead.model';
import { ModalComponent } from '@shared/components/modal.component';

export interface BankerDetailsDialogData {
  banker: UserSummary;
}

@Component({
  selector: 'app-banker-details-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, ModalComponent],
  templateUrl: './banker-details-dialog.component.html',
  styleUrl: './banker-details-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerDetailsDialogComponent {
  protected readonly data = inject<BankerDetailsDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<BankerDetailsDialogComponent>);

  protected readonly initials = computed(() => {
    const parts = this.data.banker.name.trim().split(/\s+/).filter(Boolean);
    return parts.length === 0 ? '?' : (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  protected roleLabel(): string {
    return this.data.banker.role.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }
}
