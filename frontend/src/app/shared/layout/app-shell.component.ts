import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [
    MatIconModule,
    MatSidenavModule,
    RouterOutlet,
    TopbarComponent,
    SidebarComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);

  private readonly breakpointObserver = inject(BreakpointObserver);
  protected readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly sidenavOpened = signal(true);

  // Desktop-only icon rail toggle ("Collapse" in the approved mockups); the
  // handset overlay sidenav always shows full labels since it already opens
  // and closes on demand via the topbar menu button. Tablet-width viewports
  // (docked, not overlay, but narrower than a full desktop) start collapsed
  // to leave more room for content — still a plain toggle from there, not
  // continuously re-driven by resize, so it never fights a manual choice.
  protected readonly railCollapsed = signal(this.breakpointObserver.isMatched('(max-width: 1024px)'));
}
