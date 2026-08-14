import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  TemplateRef,
  computed,
  input,
  output,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';

import { EmptyStateComponent } from './empty-state.component';
import { LoadingComponent } from './loading.component';

export interface TableColumn<T> {
  key: string;
  label: string;
  formatter?: (row: T) => string;
}

/**
 * Generic data table wrapping `mat-table` + `mat-paginator`, with the loading
 * and empty states used across every list view baked in. Row actions can be
 * projected via a `<ng-template #rowActions let-row>` passed as content.
 */
@Component({
  selector: 'app-table',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, NgTemplateOutlet, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading />
    }

    @if (!loading() && rows().length === 0) {
      <app-empty-state [message]="emptyMessage()" icon="table_rows" />
    } @else if (rows().length > 0) {
      <table mat-table [dataSource]="rows()" class="app-table">
        @for (col of columns(); track col.key) {
          <ng-container [matColumnDef]="col.key">
            <th mat-header-cell *matHeaderCellDef>{{ col.label }}</th>
            <td mat-cell *matCellDef="let row">
              {{ col.formatter ? col.formatter(row) : row[col.key] }}
            </td>
          </ng-container>
        }

        @if (actionsTemplate) {
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <ng-container *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }" />
            </td>
          </ng-container>
        }

        <tr mat-header-row *matHeaderRowDef="columnKeys()"></tr>
        <tr mat-row *matRowDef="let row; columns: columnKeys()"></tr>
      </table>

      @if (length() > 0) {
        <mat-paginator
          [length]="length()"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="pageSizeOptions()"
          (page)="pageChange.emit($event)"
        />
      }
    }
  `,
  styles: [
    `
      .app-table {
        width: 100%;
      }
    `,
  ],
})
export class TableComponent<T extends Record<string, unknown>> {
  readonly columns = input.required<TableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly loading = input(false);
  readonly emptyMessage = input('No records match the current filters.');

  readonly length = input(0);
  readonly pageSize = input(15);
  readonly pageIndex = input(0);
  readonly pageSizeOptions = input<number[]>([10, 15, 25, 50]);

  readonly pageChange = output<PageEvent>();

  @ContentChild('rowActions', { read: TemplateRef })
  protected actionsTemplate?: TemplateRef<{ $implicit: T }>;

  protected readonly columnKeys = computed(() => [
    ...this.columns().map((c) => c.key),
    ...(this.actionsTemplate ? ['actions'] : []),
  ]);
}
