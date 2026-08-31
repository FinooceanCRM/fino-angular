import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { StatusPageComponent } from './status-page.component';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink, StatusPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-status-page
      icon="lock"
      code="403"
      heading="Not authorised"
      message="You don't have permission to view this page. Contact your manager if you think this is a mistake."
    >
      <a
        status-page-action
        mat-flat-button
        color="primary"
        class="tide-cta-pill"
        routerLink="/dashboard"
      >
        <mat-icon>home</mat-icon>
        Back to dashboard
      </a>
    </app-status-page>
  `,
})
export class UnauthorizedComponent {}
