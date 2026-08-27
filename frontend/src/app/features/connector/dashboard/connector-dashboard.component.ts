import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { ConnectorDashboard } from '@core/models/connector.model';
import { ConnectorService } from '@core/services/connector.service';
import { LeadLinkCardComponent } from '@shared/components/lead-link-card.component';
import { NotificationsPanelComponent } from '@shared/components/notifications-panel.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

@Component({
  selector: 'app-connector-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatTooltipModule,
    LeadLinkCardComponent,
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
  private readonly snackBar = inject(MatSnackBar);

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

  protected copyLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Invite link copied to clipboard.', 'Dismiss', { duration: 3000 });
    });
  }
}
