import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

import { NotificationIconComponent } from './notification-icon.component';
import { UserMenuComponent } from './user-menu.component';

/** Top navigation bar: brand, sidebar toggle, lead search, notifications, account menu. */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    FormsModule,
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

  private readonly router = inject(Router);

  readonly menuToggle = output<void>();

  protected searchTerm = '';

  protected search(): void {
    const term = this.searchTerm.trim();
    if (!term) {
      return;
    }

    void this.router.navigate(['/leads'], { queryParams: { search: term } });
  }
}
