import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ConnectorNetworkMember } from '@core/models/connector.model';
import { ConnectorService } from '@core/services/connector.service';
import { PaginationMeta } from '@core/models/lead.model';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

/** Connectors this one directly invited — the connector's own referral network. */
@Component({
  selector: 'app-connector-network',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatProgressBarModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="My network" subtitle="Connectors who joined through your invite link" />

    @if (error(); as message) {
      <mat-card class="notice">
        <mat-card-content>{{ message }}</mat-card-content>
      </mat-card>
    }

    <mat-card class="table-card">
      <mat-card-content>
        <app-table
          [columns]="columns"
          [rows]="rows()"
          [loading]="loading()"
          [length]="meta().total"
          [pageIndex]="meta().current_page - 1"
          [pageSize]="meta().per_page"
          emptyMessage="No one has joined through your invite link yet."
          itemLabel="connectors"
          (pageChange)="onPage($event)"
        >
          <ng-template appTableCell="name" let-row>
            {{ row.user.name }}
          </ng-template>
          <ng-template appTableCell="email" let-row>
            {{ row.user.email }}
          </ng-template>
          <ng-template appTableCell="status" let-row>
            <app-status-pill [label]="row.status_label" [colour]="row.status_colour" />
          </ng-template>
          <ng-template appTableCell="joined_at" let-row>
            {{ row.joined_at | date: 'mediumDate' }}
          </ng-template>
        </app-table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .table-card,
      .notice {
        margin-top: var(--app-space-4);
        border-radius: var(--app-radius-md);
      }
    `,
  ],
})
export class ConnectorNetworkComponent implements OnInit {
  private readonly connectors = inject(ConnectorService);

  protected readonly columns: TableColumn<ConnectorNetworkMember>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'referral_code', label: 'Referral code' },
    { key: 'status', label: 'Status' },
    { key: 'joined_at', label: 'Joined' },
  ];

  protected readonly rows = signal<ConnectorNetworkMember[]>([]);
  protected readonly meta = signal<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load(0);
  }

  protected load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.connectors.network({ page: pageIndex + 1, per_page: this.meta().per_page }).subscribe({
      next: (result) => {
        this.rows.set(result.items);
        this.meta.set(result.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your network.');
        this.loading.set(false);
      },
    });
  }

  protected onPage(event: PageEvent): void {
    this.meta.update((current) => ({ ...current, per_page: event.pageSize }));
    this.load(event.pageIndex);
  }
}
