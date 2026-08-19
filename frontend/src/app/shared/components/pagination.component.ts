import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';

/**
 * Numbered-page pagination bar ("Showing 1 to 8 of 24 users", page number
 * pills, page-size picker) matching the approved mockups. Emits the same
 * `PageEvent` shape as `mat-paginator` so it's a drop-in replacement inside
 * `app-table` and any other list view.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [MatIconModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagination">
      <span class="pagination__summary">
        Showing {{ rangeStart() }} to {{ rangeEnd() }} of {{ length() }} {{ itemLabel() }}
      </span>

      <div class="pagination__pages">
        <button
          type="button"
          class="pagination__nav"
          [disabled]="pageIndex() === 0"
          (click)="goTo(pageIndex() - 1)"
          aria-label="Previous page"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>

        @for (page of pages(); track $index) {
          @if (page === null) {
            <span class="pagination__ellipsis">…</span>
          } @else {
            <button
              type="button"
              class="pagination__page"
              [class.pagination__page--active]="page === pageIndex()"
              (click)="goTo(page)"
            >
              {{ page + 1 }}
            </button>
          }
        }

        <button
          type="button"
          class="pagination__nav"
          [disabled]="pageIndex() >= pageCount() - 1"
          (click)="goTo(pageIndex() + 1)"
          aria-label="Next page"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <mat-select
        class="pagination__size"
        [value]="pageSize()"
        (selectionChange)="changePageSize($event.value)"
      >
        @for (size of pageSizeOptions(); track size) {
          <mat-option [value]="size">{{ size }} / page</mat-option>
        }
      </mat-select>
    </div>
  `,
  styles: [
    `
      .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--app-space-3);
        padding-block: var(--app-space-3);
      }
      .pagination__summary {
        font-size: 0.85rem;
        color: var(--app-status-default-fg);
      }
      .pagination__pages {
        display: flex;
        align-items: center;
        gap: var(--app-space-1);
      }
      .pagination__nav,
      .pagination__page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 36px;
        padding: 0 var(--app-space-2);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: var(--app-radius-sm);
        background: var(--mat-sys-surface-container);
        color: var(--mat-sys-on-surface);
        font-size: 0.85rem;
        cursor: pointer;

        &:hover:not(:disabled) {
          background: var(--mat-sys-primary-container);
        }
        &:disabled {
          opacity: 0.4;
          cursor: default;
        }
      }
      .pagination__page--active {
        background: var(--mat-sys-primary);
        border-color: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
        font-weight: 600;
      }
      .pagination__ellipsis {
        padding: 0 var(--app-space-1);
        color: var(--app-status-default-fg);
      }
      .pagination__size {
        max-width: 120px;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class PaginationComponent {
  readonly length = input.required<number>();
  readonly pageSize = input(15);
  readonly pageIndex = input(0);
  readonly pageSizeOptions = input<number[]>([10, 15, 25, 50]);
  readonly itemLabel = input('results');

  readonly pageChange = output<PageEvent>();

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.length() / this.pageSize())));
  protected readonly rangeStart = computed(() =>
    this.length() === 0 ? 0 : this.pageIndex() * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.length(), (this.pageIndex() + 1) * this.pageSize()),
  );

  /** Page numbers to render, with `null` standing in for an ellipsis gap. */
  protected readonly pages = computed<(number | null)[]>(() => {
    const count = this.pageCount();
    const current = this.pageIndex();
    const result: (number | null)[] = [];

    const addPage = (page: number) => result.push(page);
    const addGap = () => {
      if (result[result.length - 1] !== null) {
        result.push(null);
      }
    };

    for (let page = 0; page < count; page++) {
      const isEdge = page === 0 || page === count - 1;
      const isNearCurrent = Math.abs(page - current) <= 1;
      if (isEdge || isNearCurrent) {
        addPage(page);
      } else {
        addGap();
      }
    }

    return result;
  });

  protected goTo(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.pageCount() || pageIndex === this.pageIndex()) {
      return;
    }
    this.pageChange.emit({ pageIndex, pageSize: this.pageSize(), length: this.length() });
  }

  protected changePageSize(pageSize: number): void {
    if (pageSize === this.pageSize()) {
      return;
    }
    this.pageChange.emit({ pageIndex: 0, pageSize, length: this.length() });
  }
}
