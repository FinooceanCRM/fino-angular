import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card>
      <mat-card-title>Page not found</mat-card-title>
      <mat-card-content>
        <p>The page you requested does not exist.</p>
      </mat-card-content>
      <mat-card-actions>
        <a mat-flat-button routerLink="/dashboard">Back to dashboard</a>
      </mat-card-actions>
    </mat-card>
  `,
})
export class NotFoundComponent {}
