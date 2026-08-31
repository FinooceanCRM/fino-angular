import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { StatusPageComponent } from './status-page.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink, StatusPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-status-page
      icon="warning"
      code="404"
      heading="Page not found"
      message="The page you're looking for doesn't exist or may have been moved."
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
export class NotFoundComponent {}
