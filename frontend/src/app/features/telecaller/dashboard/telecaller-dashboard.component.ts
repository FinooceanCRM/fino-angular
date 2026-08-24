import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { TelecallerDashboard } from '@core/models/telecaller.model';
import { TelecallerService } from '@core/services/telecaller.service';
import { NotificationsPanelComponent } from '@shared/components/notifications-panel.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import { TelecallerReminderPopupComponent } from '../follow-ups/reminder-popup/telecaller-reminder-popup.component';

@Component({
  selector: 'app-telecaller-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
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
  templateUrl: './telecaller-dashboard.component.html',
  styleUrl: './telecaller-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerDashboardComponent implements OnInit {
  private readonly telecallers = inject(TelecallerService);
  private readonly dialog = inject(MatDialog);

  protected readonly data = signal<TelecallerDashboard | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.telecallers.dashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
        this.maybeShowReminderPopup(dashboard);
      },
      error: () => {
        this.error.set('Unable to load the telecaller dashboard.');
        this.loading.set(false);
      },
    });
  }

  /** Shows once per dashboard load whenever something is overdue or due today — mirrors the legacy reminder popup. */
  private maybeShowReminderPopup(dashboard: TelecallerDashboard): void {
    const { overdue, today } = dashboard.follow_up_reminders;
    if (overdue > 0 || today > 0) {
      this.dialog.open(TelecallerReminderPopupComponent, { data: dashboard.follow_up_reminders });
    }
  }
}
