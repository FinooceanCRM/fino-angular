import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { ModalComponent } from '@shared/components/modal.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import { ManagedUser } from '../../data/models/user.model';

export interface UserViewModalData {
  user: ManagedUser;
}

/** Read-only profile dialog — the modal equivalent of the routed user-detail page. */
@Component({
  selector: 'app-user-view-modal',
  standalone: true,
  imports: [DatePipe, MatIconModule, ModalComponent, StatusPillComponent],
  templateUrl: './user-view-modal.component.html',
  styleUrl: './user-view-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserViewModalComponent {
  protected readonly data = inject<UserViewModalData>(MAT_DIALOG_DATA);

  protected readonly initials = computed(() => {
    const parts = this.data.user.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  });
}
