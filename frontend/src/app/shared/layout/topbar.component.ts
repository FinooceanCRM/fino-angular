import { ChangeDetectionStrategy, Component, HostListener, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

import { SuperAdminSearchOverlayComponent } from '@features/super-admin/search/search-overlay/super-admin-search-overlay.component';

import { NotificationIconComponent } from './notification-icon.component';
import { UserMenuComponent } from './user-menu.component';

/** Top navigation bar: brand, sidebar toggle, global search, notifications, account menu. */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    NotificationIconComponent,
    UserMenuComponent,
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly appName = environment.appName;

  private readonly dialog = inject(MatDialog);

  readonly menuToggle = output<void>();

  @HostListener('document:keydown', ['$event'])
  protected onGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  protected openSearch(): void {
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
