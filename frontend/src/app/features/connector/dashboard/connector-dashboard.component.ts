import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { ConnectorDashboard } from '@core/models/connector.model';
import { ConnectorService } from '@core/services/connector.service';
import { NotificationsPanelComponent } from '@shared/components/notifications-panel.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

@Component({
  selector: 'app-connector-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    NotificationsPanelComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusPillComponent,
  ],
  templateUrl: './connector-dashboard.component.html',
  styleUrl: './connector-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorDashboardComponent implements OnInit {
  private readonly connectors = inject(ConnectorService);

  protected readonly data = signal<ConnectorDashboard | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.connectors.dashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the connector dashboard.');
        this.loading.set(false);
      },
    });
  }
}
