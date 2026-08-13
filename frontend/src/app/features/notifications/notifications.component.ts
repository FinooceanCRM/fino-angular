import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AppNotification } from '@core/models/notification.model';
import { NotificationService } from '@core/services/notification.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatProgressBarModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Notifications"
      subtitle="Assignments, status changes and document uploads"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <mat-card class="card">
      <mat-card-content>
        <button mat-stroked-button (click)="markAllRead()">Mark all as read</button>

        @if (items().length === 0 && !loading()) {
          <p class="muted">You have no notifications yet.</p>
        } @else {
          <mat-list>
            @for (item of items(); track item.id) {
              <mat-list-item>
                <span matListItemTitle>
                  {{ item.title }} @if (!item.is_read) { <strong>·  new</strong> }
                </span>
                <span matListItemLine>
                  {{ item.body }} · {{ item.created_at | date: 'medium' }}
                </span>
                <span matListItemMeta>
                  @if (!item.is_read) {
                    <button mat-button (click)="markRead(item)">Mark read</button>
                  }
                </span>
              </mat-list-item>
            }
          </mat-list>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin-bottom: 1rem;
      }
      .muted {
        opacity: 0.7;
      }
    `,
  ],
})
export class NotificationsComponent implements OnInit {
  private readonly notifications = inject(NotificationService);

  readonly items = signal<AppNotification[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.notifications.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markRead(item: AppNotification): void {
    this.notifications.markRead(item.id).subscribe({ next: () => this.load() });
  }

  markAllRead(): void {
    this.notifications.markAllRead().subscribe({ next: () => this.load() });
  }
}
