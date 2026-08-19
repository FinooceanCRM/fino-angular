import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

import { roleNavItems, workspaceNavItems } from './nav-items';

/** Primary navigation: role-specific links, then the shared loan workspace. */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  /** Icon-only rail mode, driven by the shell's desktop "Collapse" toggle. */
  readonly collapsed = input(false);

  protected readonly workspaceItems = computed(() => workspaceNavItems(this.auth));
  protected readonly roleItems = computed(() => roleNavItems(this.auth));
}
