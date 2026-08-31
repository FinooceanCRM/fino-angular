import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  QueryList,
  TemplateRef,
  computed,
  input,
  output,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';

import { EmptyStateComponent } from './empty-state.component';
import { LoadingComponent } from './loading.component';
import { PaginationComponent } from './pagination.component';
import { TableCellDirective } from './table-cell.directive';

export interface TableColumn<T> {
  key: string;
  label: string;
  formatter?: (row: T) => string;
  /**
   * Optional text alignment for both the header and data cell. Omitted
   * (default) keeps the existing left alignment every current table relies
   * on; `'right'` is for numeric/currency columns (counts, rates, amounts)
   * so figures line up on their ones place instead of ragging left.
   */
  align?: 'left' | 'right';
}

/**
 * Generic data table wrapping `mat-table` + the shared pagination bar, with
 * the loading and empty states used across every list view baked in. Row
 * actions can be projected via a `<ng-template #rowActions let-row>`, and a
 * column can be given a custom renderer via
 * `<ng-template appTableCell="columnKey" let-row>` (falls back to the plain
 * text formatter otherwise).
 */
@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    MatTableModule,
    NgTemplateOutlet,
    LoadingComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading />
    }

    @if (!loading() && rows().length === 0) {
      <app-empty-state [message]="emptyMessage()" icon="table_rows" />
    } @else if (rows().length > 0) {
      <div class="app-scroll-x">
        <table mat-table [dataSource]="rows()" class="app-table">
          @for (col of columns(); track col.key) {
            <ng-container [matColumnDef]="col.key">
              <th mat-header-cell *matHeaderCellDef [class.app-table__cell--right]="col.align === 'right'">
                {{ col.label }}
              </th>
              <td mat-cell *matCellDef="let row" [class.app-table__cell--right]="col.align === 'right'">
                @if (cellTemplateFor(col.key); as tpl) {
                  <ng-container *ngTemplateOutlet="tpl; context: { $implicit: row }" />
                } @else {
                  {{ cellValue(col, row) }}
                }
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
      </div>

      @if (length() > 0) {
        <app-pagination
          [length]="length()"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="pageSizeOptions()"
          [itemLabel]="itemLabel()"
          (pageChange)="pageChange.emit($event)"
        />
      }
    }
  `,
  styles: [
    `
      .app-table {
        width: 100%;
      }

      /* Right-aligned numeric/currency columns (opt-in via TableColumn.align)
         — keeps counts, rates and ₹ amounts lined up on their ones place
         instead of ragging left like prose columns. */
      .app-table__cell--right {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
})
export class TableComponent<T extends object> {
  readonly columns = input.required<TableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly loading = input(false);
  readonly emptyMessage = input('No records match the current filters.');
  readonly itemLabel = input('results');

  readonly length = input(0);
  readonly pageSize = input(15);
  readonly pageIndex = input(0);
  readonly pageSizeOptions = input<number[]>([10, 15, 25, 50]);

  readonly pageChange = output<PageEvent>();

  @ContentChild('rowActions', { read: TemplateRef })
  protected actionsTemplate?: TemplateRef<{ $implicit: T }>;

  @ContentChildren(TableCellDirective)
  protected cellTemplates?: QueryList<TableCellDirective>;

  protected readonly columnKeys = computed(() => [
    ...this.columns().map((c) => c.key),
    ...(this.actionsTemplate ? ['actions'] : []),
  ]);

  protected cellValue(col: TableColumn<T>, row: T): unknown {
    return col.formatter ? col.formatter(row) : (row as Record<string, unknown>)[col.key];
  }

  protected cellTemplateFor(column: string): TemplateRef<{ $implicit: unknown }> | null {
    return this.cellTemplates?.find((t) => t.column === column)?.template ?? null;
  }
}
