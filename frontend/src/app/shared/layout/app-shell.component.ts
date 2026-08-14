import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { BreadcrumbComponent } from '@shared/components/breadcrumb.component';

import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

/**
 * Main application shell: topbar always visible; sidebar + breadcrumb wrap the
 * router outlet once signed in. Unauthenticated routes (e.g. login) render in
 * the same centred content column without the sidebar, matching the previous
 * single-toolbar layout.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [MatSidenavModule, RouterOutlet, TopbarComponent, SidebarComponent, BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-topbar (menuToggle)="sidenavOpened.set(!sidenavOpened())" />

    @if (auth.isAuthenticated()) {
      <mat-sidenav-container class="shell-container">
        <mat-sidenav
          class="shell-sidenav"
          [mode]="isHandset() ? 'over' : 'side'"
          [opened]="sidenavOpened()"
        >
          <app-sidebar />
        </mat-sidenav>

        <mat-sidenav-content>
          <main class="content-inner">
            <app-breadcrumb />
            <router-outlet />
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else {
      <main class="content-inner guest-content">
        <router-outlet />
      </main>
    }
  `,
  styles: [
    `
      .shell-container {
        height: calc(100vh - 64px);
      }
      .shell-sidenav {
        width: 260px;
        border-right: 1px solid var(--mat-sys-outline-variant);
      }
      .content-inner {
        padding: 1.5rem;
        max-width: 1100px;
        margin: 0 auto;
      }
    `,
  ],
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);

  private readonly breakpointObserver = inject(BreakpointObserver);
  protected readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly sidenavOpened = signal(true);
}
