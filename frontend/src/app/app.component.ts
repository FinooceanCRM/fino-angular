import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavigationHistoryService } from '@core/services/navigation-history.service';

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
export class AppComponent {
  /** Created at start-up so the page history is recorded from the very first navigation. */
  protected readonly navigationHistory = inject(NavigationHistoryService);

  /**
   * Date and time fields open their calendar / clock when clicked anywhere, not only on the small icon.
   * Works for every such field in the app (website, customer area and staff screens). Browsers without
   * showPicker() keep their normal behaviour.
   */
  @HostListener('document:click', ['$event'])
  protected openPicker(event: MouseEvent): void {
    const el = event.target;
    if (!(el instanceof HTMLInputElement) || el.disabled || el.readOnly) return;
    if (!['date', 'datetime-local', 'time', 'month', 'week'].includes(el.type)) return;
    try {
      el.showPicker?.();
    } catch {
      /* not allowed right now (e.g. already open) - the native control still works */
    }
  }
}
