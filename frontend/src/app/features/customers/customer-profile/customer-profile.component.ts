import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Lead, loanTypeLabel } from '@features/manager/leads/data/models/lead.model';
import { ManagerLeadDataProvider } from '@features/manager/leads/data/providers/lead-data.provider';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { EntityHeaderComponent } from '@shared/components/entity-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

import { CustomerDocumentPreviewDialogComponent } from '../document-preview-dialog/customer-document-preview-dialog.component';
import { CustomerFormDialogComponent, CustomerFormDialogData } from '../customer-form-dialog/customer-form-dialog.component';
import {
  CustomerDocumentDataProvider,
  DOCUMENT_TYPE_CATALOGUE,
  DocumentType,
  documentTypeLabel,
} from '../data/customer-document.provider';
import { CustomerDataProvider, CustomerDraft, CustomerStatus } from '../data/customer.provider';

const STATUS_LABEL: Record<CustomerStatus, string> = { active: 'Active', prospect: 'Prospect', inactive: 'Inactive' };
const STATUS_COLOUR: Record<CustomerStatus, string> = { active: 'success', prospect: 'primary', inactive: 'default' };

const DOC_STATUS_LABEL: Record<'pending' | 'verified' | 'rejected', string> = { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' };
const DOC_STATUS_COLOUR: Record<'pending' | 'verified' | 'rejected', string> = { pending: 'accent', verified: 'success', rejected: 'warn' };

/**
 * Customer Profile — contact info, linked leads, Notes, Documents (upload +
 * preview) and Activity History, all in one page. Supersedes the earlier
 * customer detail modal, which only had room for a summary.
 */
@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    EmptyStateComponent,
    EntityHeaderComponent,
    StatusPillComponent,
    TimelineComponent,
  ],
  templateUrl: './customer-profile.component.html',
  styleUrl: './customer-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly customerData = inject(CustomerDataProvider);
  private readonly documentData = inject(CustomerDocumentDataProvider);
  private readonly leadData = inject(ManagerLeadDataProvider);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly customerId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly loanTypeLabel = loanTypeLabel;
  protected readonly documentTypeLabel = documentTypeLabel;
  protected readonly documentTypes = DOCUMENT_TYPE_CATALOGUE;

  protected readonly customer = computed(() => this.customerData.getById(this.customerId));
  protected readonly statusLabel = computed(() => STATUS_LABEL[this.customer()?.status ?? 'prospect']);
  protected readonly statusColour = computed(() => STATUS_COLOUR[this.customer()?.status ?? 'prospect']);

  protected readonly linkedLeads = computed<Lead[]>(() => {
    const customer = this.customer();
    if (!customer) {
      return [];
    }
    return customer.linked_lead_ids
      .map((id) => this.leadData.getById(id))
      .filter((lead): lead is Lead => lead !== undefined);
  });

  protected readonly notes = computed(() => this.customerData.notesFor(this.customerId));

  protected readonly activity = computed<TimelineEntry[]>(() =>
    [...this.customerData.interactionsFor(this.customerId)].reverse().map((entry) => ({
      icon: entry.icon,
      title: entry.title,
      subtitle: entry.subtitle,
      time: new Date(entry.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    })),
  );

  protected readonly documents = computed(() => this.documentData.forCustomer(this.customerId));

  protected readonly noteText = signal('');
  protected readonly documentType = signal<DocumentType>('aadhaar');
  protected readonly dragging = signal(false);

  protected docStatusLabel(status: 'pending' | 'verified' | 'rejected'): string {
    return DOC_STATUS_LABEL[status];
  }

  protected docStatusColour(status: 'pending' | 'verified' | 'rejected'): string {
    return DOC_STATUS_COLOUR[status];
  }

  protected edit(): void {
    const customer = this.customer();
    if (!customer) {
      return;
    }

    const data: CustomerFormDialogData = { customer };
    this.dialog
      .open<CustomerFormDialogComponent, CustomerFormDialogData, CustomerDraft>(CustomerFormDialogComponent, { data })
      .afterClosed()
      .subscribe((draft) => {
        if (!draft) {
          return;
        }
        this.customerData.update(customer.id, draft);
        this.snackBar.open('Customer updated.', 'Dismiss', { duration: 4000 });
      });
  }

  protected addNote(): void {
    if (!this.noteText().trim()) {
      return;
    }
    this.customerData.addNote(this.customerId, this.noteText());
    this.noteText.set('');
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(): void {
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.uploadFile(file);
    }
    input.value = '';
  }

  private uploadFile(file: File): void {
    const type = this.documentType();
    const document = this.documentData.upload(this.customerId, type, file.name, file.size);
    this.customerData.logInteraction(this.customerId, {
      icon: 'description',
      title: 'Document uploaded',
      subtitle: `${documentTypeLabel(type)} — ${document.file_name}`,
    });
    this.snackBar.open(`"${file.name}" uploaded.`, 'Dismiss', { duration: 4000 });
  }

  protected preview(documentId: number): void {
    const document = this.documents().find((doc) => doc.id === documentId);
    if (!document) {
      return;
    }
    this.dialog.open(CustomerDocumentPreviewDialogComponent, { data: { document } });
  }
}
