import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { CustomerFormDialogComponent, CustomerFormDialogData } from './customer-form-dialog/customer-form-dialog.component';
import { Customer, CustomerDataProvider, CustomerDraft, CustomerSegment, CustomerStatus } from './data/customer.provider';

const STATUS_LABEL: Record<CustomerStatus, string> = { active: 'Active', prospect: 'Prospect', inactive: 'Inactive' };
const STATUS_COLOUR: Record<CustomerStatus, string> = { active: 'success', prospect: 'primary', inactive: 'default' };

/**
 * Customer Management — customers linked to your leads. Backed entirely by
 * `CustomerDataProvider`'s mock state, following the same list + toolbar +
 * `app-table` + dialogs shape as the Manager module's Lead list.
 */
@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    RouterLink,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersComponent {
  protected readonly customerData = inject(CustomerDataProvider);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly search = signal('');
  protected readonly statusFilter = signal<'all' | CustomerStatus>('all');
  protected readonly segmentFilter = signal<'all' | CustomerSegment>('all');

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  protected readonly filteredCustomers = computed(() => {
    const search = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const segment = this.segmentFilter();

    return this.customerData.customers().filter((customer) => {
      const matchesSearch =
        !search ||
        customer.name.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        customer.phone.toLowerCase().includes(search);
      const matchesStatus = status === 'all' || customer.status === status;
      const matchesSegment = segment === 'all' || customer.segment === segment;
      return matchesSearch && matchesStatus && matchesSegment;
    });
  });

  protected readonly pagedCustomers = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredCustomers().slice(start, start + this.pageSize());
  });

  protected readonly columns: TableColumn<Customer>[] = [
    { key: 'name', label: 'Customer' },
    { key: 'contact', label: 'Contact' },
    { key: 'linked_leads', label: 'Linked leads' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Customer since' },
  ];

  protected initials(customer: Customer): string {
    const parts = customer.name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  protected statusLabel(customer: Customer): string {
    return STATUS_LABEL[customer.status];
  }

  protected statusColour(customer: Customer): string {
    return STATUS_COLOUR[customer.status];
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  protected addCustomer(): void {
    this.openForm({});
  }

  protected edit(customer: Customer): void {
    this.openForm({ customer });
  }

  private openForm(data: CustomerFormDialogData): void {
    this.dialog
      .open<CustomerFormDialogComponent, CustomerFormDialogData, CustomerDraft>(CustomerFormDialogComponent, { data })
      .afterClosed()
      .subscribe((draft) => {
        if (!draft) {
          return;
        }

        if (data.customer) {
          this.customerData.update(data.customer.id, draft);
          this.snackBar.open('Customer updated.', 'Dismiss', { duration: 4000 });
        } else {
          this.customerData.create(draft);
          this.snackBar.open(`"${draft.name}" added.`, 'Dismiss', { duration: 4000 });
        }
      });
  }
}
