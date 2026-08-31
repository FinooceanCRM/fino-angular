import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { BankerDashboard } from '@core/models/banker.model';
import { BankerService } from '@core/services/banker.service';
import { DashboardHeroComponent } from '@shared/components/dashboard-hero.component';
import { LeadLinkCardComponent } from '@shared/components/lead-link-card.component';
import { NotificationsPanelComponent } from '@shared/components/notifications-panel.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

/** Banker landing view: matched leads, criteria sets and pending access requests. */
@Component({
  selector: 'app-banker-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    DashboardHeroComponent,
    LeadLinkCardComponent,
    NotificationsPanelComponent,
    StatCardComponent,
    StatusPillComponent,
  ],
  templateUrl: './banker-dashboard.component.html',
  styleUrl: './banker-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerDashboardComponent implements OnInit {
  private readonly bankers = inject(BankerService);

  protected readonly data = signal<BankerDashboard | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.bankers.dashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the banker dashboard.');
        this.loading.set(false);
      },
    });
  }
}
