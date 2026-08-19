import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SuperAdminSearchOverlayComponent } from '../search-overlay/super-admin-search-overlay.component';

/** Bell-icon-style trigger for the global search overlay. Also listens for Ctrl/Cmd+K. */
@Component({
  selector: 'app-super-admin-search-trigger',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      type="button"
      matTooltip="Search (Ctrl+K)"
      aria-label="Search leads, users, employees, connectors and bankers"
      (click)="open()"
    >
      <mat-icon>search</mat-icon>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminSearchTriggerComponent {
  private readonly dialog = inject(MatDialog);

  @HostListener('document:keydown', ['$event'])
  protected onGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.open();
    }
  }

  protected open(): void {
    if (this.dialog.openDialogs.length > 0) {
      return;
    }

    this.dialog.open(SuperAdminSearchOverlayComponent, {
      width: '640px',
      maxWidth: '92vw',
      position: { top: '96px' },
      panelClass: 'search-overlay-panel',
      autoFocus: false,
    });
  }
}
