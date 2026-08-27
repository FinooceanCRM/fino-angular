import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { AffiliateProfile } from '@core/models/affiliate.model';
import { PaginationMeta } from '@core/models/lead.model';
import { SuperAdminAffiliateService } from '@core/services/super-admin-affiliate.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { AffiliateEditDialogComponent, AffiliateEditDialogResult } from './affiliate-edit-dialog.component';

/**
 * Affiliate Management (Phase 8) — view/suspend affiliates and set a
 * per-affiliate commission_rate override, backed by the real Phase 6
 * Super Admin endpoints. Mirrors UserRoleTableComponent's list-table shape,
 * but as its own component since affiliates aren't editable through the
 * generic `/users` CRUD (referral_code, commission_rate and status live on
 * the affiliates table, not on users).
 */
@Component({
  selector: 'app-super-admin-affiliates',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './super-admin-affiliates.component.html',
  styleUrl: './super-admin-affiliates.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminAffiliatesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly affiliatesApi = inject(SuperAdminAffiliateService);

  protected readonly rows = signal<AffiliateProfile[]>([]);
  protected readonly meta = signal<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  protected readonly loading = signal(false);

  private pendingRequest?: Subscription;

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    status: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(15);

  protected readonly columns: TableColumn<AffiliateProfile>[] = [
    { key: 'name', label: 'Name', formatter: (row) => row.user.name },
    { key: 'email', label: 'Email', formatter: (row) => row.user.email },
    { key: 'referral_code', label: 'Referral code' },
    { key: 'commission_rate', label: 'Commission rate' },
    { key: 'status', label: 'Status' },
  ];

  constructor() {
    effect(() => {
      const f = this.filterValues();
      const page = this.pageIndex();
      const size = this.pageSize();
      this.load(f, page, size);
    });
  }

  private load(f: ReturnType<typeof this.filterValues>, page: number, size: number): void {
    this.pendingRequest?.unsubscribe();
    this.loading.set(true);
    const search = (f.search ?? '').trim();

    this.pendingRequest = this.affiliatesApi
      .list({
        search: search || undefined,
        status: f.status || undefined,
        page: page + 1,
        per_page: size,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.meta.set(result.meta);
          this.loading.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.loading.set(false);
        },
      });
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  private reload(): void {
    this.load(this.filterValues(), this.pageIndex(), this.pageSize());
  }

  protected edit(row: AffiliateProfile): void {
    this.dialog
      .open<AffiliateEditDialogComponent, { affiliate: AffiliateProfile }, AffiliateEditDialogResult>(
        AffiliateEditDialogComponent,
        { data: { affiliate: row } },
      )
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.affiliatesApi.update(row.user.id, result).subscribe({
          next: () => {
            this.snackBar.open(`${row.user.name} was updated.`, 'Dismiss', { duration: 4000 });
            this.reload();
          },
          error: () => this.snackBar.open(`Could not update ${row.user.name}.`, 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
