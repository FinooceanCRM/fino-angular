import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * A bare router outlet. The authenticated app shell (topbar/sidebar/
 * breadcrumb) is applied by a wrapping parent route in app.routes.ts, not
 * here — that lets fully public surfaces (e.g. /refer/:code) declare a
 * sibling top-level route with no shell chrome at all, rather than every
 * route being forced through AppShellComponent unconditionally.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class AppComponent {}
