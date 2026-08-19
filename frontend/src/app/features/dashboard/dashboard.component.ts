import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { roleNavItems } from '@shared/layout/nav-items';

/**
 * `/dashboard` is the default post-login landing route (see login.component.ts
 * and app.routes.ts). It has no content of its own — it immediately forwards
 * to the signed-in user's actual role dashboard, reusing the same
 * `roleNavItems` mapping the sidebar uses so the two never drift apart.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatProgressBarModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    const target = roleNavItems(this.auth)[0]?.link ?? '/unauthorized';
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
