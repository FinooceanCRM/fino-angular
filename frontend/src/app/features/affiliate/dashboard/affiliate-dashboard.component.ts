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

import { AffiliateDashboard } from '@core/models/affiliate.model';
import { AffiliateService } from '@core/services/affiliate.service';
import { NotificationsPanelComponent } from '@shared/components/notifications-panel.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

@Component({
  selector: 'app-affiliate-dashboard',
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
    NotificationsPanelComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusPillComponent,
  ],
  templateUrl: './affiliate-dashboard.component.html',
  styleUrl: './affiliate-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AffiliateDashboardComponent implements OnInit {
  private readonly affiliates = inject(AffiliateService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly data = signal<AffiliateDashboard | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.affiliates.dashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the affiliate dashboard.');
        this.loading.set(false);
      },
    });
  }

  protected copyLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Referral link copied to clipboard.', 'Dismiss', { duration: 3000 });
    });
  }
}
