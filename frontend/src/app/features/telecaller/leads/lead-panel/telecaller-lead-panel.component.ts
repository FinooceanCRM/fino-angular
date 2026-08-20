import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

import { NormalizedApiError } from '@core/interceptors/error.interceptor';
import { DocumentTypeOption, LeadDocument } from '@core/models/document.model';
import { Lead, CatalogueOption } from '@core/models/lead.model';
import { TelecallerFollowUp, TelecallerFollowUpType } from '@core/models/telecaller-follow-up.model';
import { DocumentService } from '@core/services/document.service';
import { LeadService } from '@core/services/lead.service';
import { TelecallerFollowUpService } from '@core/services/telecaller-follow-up.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';

/**
 * Telecaller-only actions for a lead: status change (own leads only, per
 * `LoanLeadPolicy::changeStatus`), documents, PD completion, and her
 * follow-up/notes log. Kept as a sibling panel next to the shared, role-
 * neutral `ManagerLeadDetailComponent` rather than folded into it, so that
 * component stays untouched for every other role.
 */
@Component({
  selector: 'app-telecaller-lead-panel',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
  ],
  templateUrl: './telecaller-lead-panel.component.html',
  styleUrl: './telecaller-lead-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerLeadPanelComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly leads = inject(LeadService);
  private readonly documentsApi = inject(DocumentService);
  private readonly followUpsApi = inject(TelecallerFollowUpService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly leadId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly lead = signal<Lead | undefined>(undefined);
  protected readonly statuses = signal<CatalogueOption[]>([]);
  protected readonly documents = signal<LeadDocument[]>([]);
  protected readonly documentTypes = signal<DocumentTypeOption[]>([]);
  protected readonly followUps = signal<TelecallerFollowUp[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly canChangeStatus = computed(() => this.lead()?.can_change_status ?? false);
  protected readonly canCompletePd = computed(() => !!this.lead() && this.lead()!.pd_completed_at === null);

  selectedFile: File | null = null;

  readonly statusForm = this.fb.nonNullable.group({
    status: 'in_progress',
    remarks: '',
  });

  readonly documentForm = this.fb.nonNullable.group({
    document_type: 'aadhaar',
    remarks: '',
  });

  readonly followUpForm = this.fb.nonNullable.group({
    type: 'call' as TelecallerFollowUpType,
    notes: '',
    next_follow_up_at: '',
  });

  ngOnInit(): void {
    this.reload();

    this.leads.metadata().subscribe({
      next: (metadata) => this.statuses.set(metadata.statuses),
      error: () => undefined,
    });
  }

  reload(): void {
    this.loading.set(true);
    this.leads.detail(this.leadId).subscribe({
      next: (detail) => {
        this.lead.set(detail.lead);
        this.statusForm.patchValue({ status: detail.lead.status });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This lead is not available to you.');
        this.loading.set(false);
      },
    });

    this.loadDocuments();
    this.loadFollowUps();
  }

  private loadDocuments(): void {
    this.documentsApi.listForLead(this.leadId).subscribe({
      next: (result) => {
        this.documents.set(result.items);
        if (result.types.length > 0) {
          this.documentTypes.set(result.types);
        }
      },
      error: () => undefined,
    });
  }

  private loadFollowUps(): void {
    this.followUpsApi.forLead(this.leadId).subscribe({
      next: (items) => this.followUps.set(items),
      error: () => this.followUps.set([]),
    });
  }

  changeStatus(): void {
    const { status, remarks } = this.statusForm.getRawValue();
    this.leads.changeStatus(this.leadId, status, remarks).subscribe({
      next: () => {
        this.reload();
        this.snackBar.open('Status updated.', 'Dismiss', { duration: 4000 });
      },
      error: (err: NormalizedApiError) =>
        this.error.set(err.message ?? 'The status could not be updated.'),
    });
  }

  completePd(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Mark PD complete',
          message: 'Confirm the pre-disbursement verification call for this lead has been completed?',
          confirmLabel: 'Mark complete',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.leads.completePd(this.leadId).subscribe({
          next: () => {
            this.reload();
            this.snackBar.open('PD marked complete.', 'Dismiss', { duration: 4000 });
          },
          error: (err: NormalizedApiError) =>
            this.error.set(err.message ?? 'The PD call could not be marked complete.'),
        });
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  upload(): void {
    if (!this.selectedFile || this.documentForm.invalid) {
      return;
    }

    const { document_type, remarks } = this.documentForm.getRawValue();

    this.documentsApi.upload(this.leadId, this.selectedFile, document_type, remarks).subscribe({
      next: () => {
        this.selectedFile = null;
        this.documentForm.patchValue({ remarks: '' });
        this.loadDocuments();
        this.snackBar.open('Document uploaded.', 'Dismiss', { duration: 4000 });
      },
      error: (err: NormalizedApiError) =>
        this.error.set(err.message ?? 'The document could not be uploaded.'),
    });
  }

  download(item: LeadDocument): void {
    this.documentsApi.download(item).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = item.original_name;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.error.set('The document could not be downloaded.'),
    });
  }

  removeDocument(item: LeadDocument): void {
    this.documentsApi.remove(item.id).subscribe({
      next: () => {
        this.loadDocuments();
        this.snackBar.open('Document removed.', 'Dismiss', { duration: 4000 });
      },
      error: () => this.error.set('The document could not be deleted.'),
    });
  }

  logFollowUp(): void {
    if (this.followUpForm.invalid) {
      return;
    }

    const { type, notes, next_follow_up_at } = this.followUpForm.getRawValue();

    this.followUpsApi
      .create(this.leadId, {
        type,
        notes: notes.trim() || null,
        next_follow_up_at: next_follow_up_at || null,
      })
      .subscribe({
        next: () => {
          this.followUpForm.reset({ type: 'call', notes: '', next_follow_up_at: '' });
          this.loadFollowUps();
          this.snackBar.open('Follow-up logged.', 'Dismiss', { duration: 4000 });
        },
        error: (err: NormalizedApiError) =>
          this.error.set(err.message ?? 'The follow-up could not be logged.'),
      });
  }

  completeFollowUp(item: TelecallerFollowUp): void {
    this.followUpsApi.complete(item.id).subscribe({
      next: () => this.loadFollowUps(),
      error: () => this.error.set('The follow-up could not be marked complete.'),
    });
  }

  rescheduleFollowUp(item: TelecallerFollowUp, nextDate: string): void {
    if (!nextDate) {
      return;
    }

    this.followUpsApi.reschedule(item.id, nextDate).subscribe({
      next: () => {
        this.loadFollowUps();
        this.snackBar.open('Follow-up rescheduled.', 'Dismiss', { duration: 4000 });
      },
      error: (err: NormalizedApiError) =>
        this.error.set(err.message ?? 'The follow-up could not be rescheduled.'),
    });
  }
}
