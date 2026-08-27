import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  Customer,
  CustomerDocument,
  CustomerDraft,
  CustomerInteraction,
  CustomerNote,
  CustomerStatus,
  DocumentType,
  DocumentTypeOption,
} from '@core/models/customer.model';
import { CustomerDocumentService } from '@core/services/customer-document.service';
import { CustomerService } from '@core/services/customer.service';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { EntityHeaderComponent } from '@shared/components/entity-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

import { CustomerDocumentPreviewDialogComponent } from '../document-preview-dialog/customer-document-preview-dialog.component';
import { CustomerFormDialogComponent, CustomerFormDialogData } from '../customer-form-dialog/customer-form-dialog.component';

const STATUS_LABEL: Record<CustomerStatus, string> = { active: 'Active', prospect: 'Prospect', inactive: 'Inactive' };
const STATUS_COLOUR: Record<CustomerStatus, string> = { active: 'success', prospect: 'primary', inactive: 'default' };

const DOC_STATUS_LABEL: Record<'pending' | 'verified' | 'rejected', string> = { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' };
const DOC_STATUS_COLOUR: Record<'pending' | 'verified' | 'rejected', string> = { pending: 'accent', verified: 'success', rejected: 'warn' };

/**
 * Customer Profile — contact info, linked leads, Notes, Documents (upload +
 * preview) and Activity History, all in one page. Backed by the real
 * `CustomerService`/`CustomerDocumentService` (Phase 3). Linked leads come
 * straight off the Customer response's `linked_leads` array (id/reference/
 * applicant_name only) — no separate Lead lookup needed.
 */
@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
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
  private readonly customerService = inject(CustomerService);
  private readonly documentService = inject(CustomerDocumentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly customerId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly customer = signal<Customer | null>(null);
  protected readonly loading = signal(true);
  protected readonly notes = signal<CustomerNote[]>([]);
  protected readonly interactions = signal<CustomerInteraction[]>([]);
  protected readonly documents = signal<CustomerDocument[]>([]);
  protected readonly documentTypes = signal<DocumentTypeOption[]>([]);

  protected readonly statusLabel = computed(() => STATUS_LABEL[this.customer()?.status ?? 'prospect']);
  protected readonly statusColour = computed(() => STATUS_COLOUR[this.customer()?.status ?? 'prospect']);

  protected readonly linkedLeads = computed(() => this.customer()?.linked_leads ?? []);

  protected readonly activity = computed<TimelineEntry[]>(() =>
    [...this.interactions()].reverse().map((entry) => ({
      icon: entry.icon,
      title: entry.title,
      subtitle: entry.subtitle,
      time: new Date(entry.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    })),
  );

  protected readonly noteText = signal('');
  protected readonly documentType = signal<DocumentType>('aadhaar');
  protected readonly dragging = signal(false);
  protected readonly uploading = signal(false);

  constructor() {
    this.loadCustomer();
    this.loadNotes();
    this.loadInteractions();
    this.loadDocuments();
  }

  private loadCustomer(): void {
    this.customerService.getById(this.customerId).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.loading.set(false);
      },
      error: () => {
        this.customer.set(null);
        this.loading.set(false);
      },
    });
  }

  private loadNotes(): void {
    this.customerService.notesFor(this.customerId).subscribe((notes) => this.notes.set(notes));
  }

  private loadInteractions(): void {
    this.customerService.interactionsFor(this.customerId).subscribe((entries) => this.interactions.set(entries));
  }

  private loadDocuments(): void {
    this.documentService.forCustomer(this.customerId).subscribe(({ items, types }) => {
      this.documents.set(items);
      this.documentTypes.set(types);
      if (types.length > 0 && !types.some((t) => t.value === this.documentType())) {
        this.documentType.set(types[0].value as DocumentType);
      }
    });
  }

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
        this.customerService.update(customer.id, draft).subscribe({
          next: (updated) => {
            this.customer.set(updated);
            this.snackBar.open('Customer updated.', 'Dismiss', { duration: 4000 });
          },
          error: () => this.snackBar.open('Could not update customer.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  protected addNote(): void {
    const text = this.noteText().trim();
    if (!text) {
      return;
    }
    this.customerService.addNote(this.customerId, text).subscribe(() => {
      this.noteText.set('');
      this.loadNotes();
      this.loadInteractions();
    });
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
    this.uploading.set(true);
    this.documentService.upload(this.customerId, file, this.documentType()).subscribe({
      next: () => {
        this.uploading.set(false);
        this.loadDocuments();
        this.loadInteractions();
        this.snackBar.open(`"${file.name}" uploaded.`, 'Dismiss', { duration: 4000 });
      },
      error: () => {
        this.uploading.set(false);
        this.snackBar.open('The document could not be uploaded.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  protected preview(documentId: number): void {
    const document = this.documents().find((doc) => doc.id === documentId);
    if (!document) {
      return;
    }
    this.dialog.open(CustomerDocumentPreviewDialogComponent, { data: { document } });
  }
}
