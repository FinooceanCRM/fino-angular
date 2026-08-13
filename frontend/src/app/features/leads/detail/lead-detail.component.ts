import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { LeadDocument, DocumentTypeOption } from '@core/models/document.model';
import {
  CatalogueOption,
  LeadDetail,
  UserSummary,
} from '@core/models/lead.model';
import { DocumentService } from '@core/services/document.service';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTabsModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      [title]="detail()?.lead?.applicant_name ?? 'Lead'"
      [subtitle]="detail()?.lead?.reference ?? ''"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (error(); as message) {
      <mat-card class="notice"><mat-card-content>{{ message }}</mat-card-content></mat-card>
    }

    @if (detail(); as data) {
      <mat-card class="card">
        <mat-card-content class="summary">
          <div>
            <span class="label">Loan</span>
            <strong>
              {{ data.lead.loan_type }} ·
              {{ data.lead.loan_amount | currency: 'INR' : 'symbol-narrow' : '1.0-0' }}
            </strong>
          </div>
          <div><span class="label">Status</span><mat-chip [highlighted]="true">{{ data.lead.status_label }}</mat-chip></div>
          <div><span class="label">City</span><strong>{{ data.lead.city }}, {{ data.lead.state }}</strong></div>
          <div><span class="label">Connector</span><strong>{{ data.lead.connector?.name ?? '—' }}</strong></div>
          <div><span class="label">Employee</span><strong>{{ data.lead.assigned_employee?.name ?? '—' }}</strong></div>
          <div><span class="label">RM</span><strong>{{ data.lead.assigned_relationship_manager?.name ?? '—' }}</strong></div>
          <div><span class="label">Manager</span><strong>{{ data.lead.assigned_manager?.name ?? '—' }}</strong></div>
          <a mat-stroked-button [routerLink]="['/leads', data.lead.id, 'edit']">Edit</a>
        </mat-card-content>
      </mat-card>

      <mat-tab-group>
        <mat-tab label="Workflow">
          <div class="tab-body">
            <form [formGroup]="statusForm" class="inline" (ngSubmit)="changeStatus()">
              <mat-form-field appearance="outline">
                <mat-label>Change status</mat-label>
                <mat-select formControlName="status">
                  @for (status of statuses(); track status.value) {
                    <mat-option [value]="status.value">{{ status.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Remarks</mat-label>
                <input matInput formControlName="remarks" />
              </mat-form-field>
              <button mat-flat-button color="primary" type="submit">Update status</button>
            </form>

            @if (assignees().length > 0) {
              <form [formGroup]="assignForm" class="inline" (ngSubmit)="assign()">
                <mat-form-field appearance="outline">
                  <mat-label>Assign to</mat-label>
                  <mat-select formControlName="assignee_id">
                    @for (user of assignees(); track user.id) {
                      <mat-option [value]="user.id">{{ user.name }} ({{ user.role }})</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Remarks</mat-label>
                  <input matInput formControlName="remarks" />
                </mat-form-field>
                <button mat-flat-button color="primary" type="submit">Assign lead</button>
              </form>
            }

            <mat-list>
              @for (entry of data.status_history; track entry.id) {
                <mat-list-item>
                  <span matListItemTitle>
                    {{ entry.from_status ?? 'created' }} → {{ entry.to_status }}
                  </span>
                  <span matListItemLine>
                    {{ entry.changed_by ?? 'system' }} ·
                    {{ entry.created_at | date: 'medium' }} ·
                    {{ entry.remarks ?? '' }}
                  </span>
                </mat-list-item>
              }
            </mat-list>
          </div>
        </mat-tab>

        <mat-tab label="Bank matches">
          <div class="tab-body">
            <button mat-flat-button color="primary" (click)="runMatching()">
              Run matching engine
            </button>

            @if (data.matches.length === 0) {
              <p class="muted">No matches stored yet. Run the engine to evaluate banks.</p>
            } @else {
              <mat-list>
                @for (match of data.matches; track match.id) {
                  <mat-list-item>
                    <span matListItemTitle>
                      {{ match.bank_name }} — {{ match.product_name }} (score {{ match.match_score }})
                    </span>
                    <span matListItemLine>
                      Interest {{ match.interest_rate ?? '—' }}% · {{ match.reasons.join(' ') }}
                    </span>
                  </mat-list-item>
                }
              </mat-list>
            }
          </div>
        </mat-tab>

        <mat-tab label="Documents">
          <div class="tab-body">
            <form [formGroup]="documentForm" class="inline" (ngSubmit)="upload()">
              <mat-form-field appearance="outline">
                <mat-label>Document type</mat-label>
                <mat-select formControlName="document_type">
                  @for (type of documentTypes(); track type.value) {
                    <mat-option [value]="type.value">{{ type.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <input type="file" (change)="onFileSelected($event)" />
              <button mat-flat-button color="primary" type="submit" [disabled]="!selectedFile">
                Upload
              </button>
            </form>

            @if (documents().length === 0) {
              <p class="muted">No documents uploaded for this lead.</p>
            } @else {
              <mat-list>
                @for (document of documents(); track document.id) {
                  <mat-list-item>
                    <span matListItemTitle>
                      {{ document.document_type_label }} — {{ document.original_name }}
                    </span>
                    <span matListItemLine>
                      {{ document.size_bytes }} bytes ·
                      {{ document.created_at | date: 'medium' }}
                    </span>
                    <span matListItemMeta>
                      <button mat-button (click)="download(document)">Download</button>
                      <button mat-button color="warn" (click)="removeDocument(document)">
                        Delete
                      </button>
                    </span>
                  </mat-list-item>
                }
              </mat-list>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    }
  `,
  styles: [
    `
      .card {
        margin-bottom: 1rem;
      }
      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 1.25rem;
        align-items: center;
      }
      .label {
        display: block;
        font-size: 0.75rem;
        opacity: 0.7;
      }
      .tab-body {
        padding: 1rem 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .inline {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
      .muted {
        opacity: 0.7;
      }
    `,
  ],
})
export class LeadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly leads = inject(LeadService);
  private readonly documentsApi = inject(DocumentService);
  private readonly fb = inject(FormBuilder);

  readonly detail = signal<LeadDetail | null>(null);
  readonly statuses = signal<CatalogueOption[]>([]);
  readonly assignees = signal<UserSummary[]>([]);
  readonly documents = signal<LeadDocument[]>([]);
  readonly documentTypes = signal<DocumentTypeOption[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  selectedFile: File | null = null;

  readonly statusForm = this.fb.nonNullable.group({
    status: 'in_progress',
    remarks: '',
  });

  readonly assignForm = this.fb.nonNullable.group({
    assignee_id: [0],
    remarks: '',
  });

  readonly documentForm = this.fb.nonNullable.group({
    document_type: 'aadhaar',
  });

  private leadId = 0;

  ngOnInit(): void {
    this.leadId = Number(this.route.snapshot.paramMap.get('id'));
    this.reload();

    this.leads.metadata().subscribe({
      next: (metadata) => this.statuses.set(metadata.statuses),
      error: () => undefined,
    });

    this.leads.assignableUsers().subscribe({
      next: (users) => this.assignees.set(users),
      error: () => this.assignees.set([]),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.leads.detail(this.leadId).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.statusForm.patchValue({ status: detail.lead.status });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This lead is not available to you.');
        this.loading.set(false);
      },
    });

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

  changeStatus(): void {
    const { status, remarks } = this.statusForm.getRawValue();
    this.leads.changeStatus(this.leadId, status, remarks).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('The status could not be updated.'),
    });
  }

  assign(): void {
    const { assignee_id, remarks } = this.assignForm.getRawValue();
    if (!assignee_id) {
      return;
    }

    this.leads.assign(this.leadId, assignee_id, remarks).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('The lead could not be assigned.'),
    });
  }

  runMatching(): void {
    this.leads.runMatching(this.leadId).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('The matching engine could not run.'),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  upload(): void {
    if (!this.selectedFile) {
      return;
    }

    this.documentsApi
      .upload(
        this.leadId,
        this.selectedFile,
        this.documentForm.getRawValue().document_type,
      )
      .subscribe({
        next: () => {
          this.selectedFile = null;
          this.reload();
        },
        error: () => this.error.set('The document could not be uploaded.'),
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
      next: () => this.reload(),
      error: () => this.error.set('The document could not be deleted.'),
    });
  }
}
