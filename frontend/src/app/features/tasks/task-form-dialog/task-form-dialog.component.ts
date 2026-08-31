import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Lead } from '@core/models/lead.model';
import { TaskActivityType, TaskDraft, TaskPriority } from '@core/models/task.model';
import { LeadService } from '@core/services/lead.service';
import { ModalComponent } from '@shared/components/modal.component';

export interface TaskFormDialogData {
  type: TaskActivityType;
}

const TYPE_LABEL: Record<TaskActivityType, string> = { call: 'call', meeting: 'meeting', task: 'task', reminder: 'reminder' };

/** Create a new call / meeting / task / reminder, optionally linked to one of the signed-in Employee's own leads. */
@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, ModalComponent],
  template: `
    <app-modal [title]="dialogTitle" [showActions]="true">
      <mat-form-field appearance="outline" class="field">
        <mat-label>Title</mat-label>
        <input matInput [ngModel]="title()" (ngModelChange)="title.set($event)" placeholder="e.g. Call customer re: income proof" />
      </mat-form-field>

      <div class="field-row">
        <!-- Read-only: the task type comes from the bucket this dialog was launched
             from (see TaskFormDialogData), not a user choice — there's no real
             control for it to bind to, so it's shown as context, not a select. -->
        <mat-form-field appearance="outline" class="field">
          <mat-label>Task type</mat-label>
          <input matInput [value]="typeDisplayLabel" disabled />
        </mat-form-field>

        <mat-form-field appearance="outline" class="field">
          <mat-label>Related lead</mat-label>
          <mat-select [ngModel]="leadId()" (ngModelChange)="leadId.set($event)">
            <mat-option [value]="null">General (not linked to a lead)</mat-option>
            @for (lead of myLeads(); track lead.id) {
              <mat-option [value]="lead.id">{{ lead.reference }} — {{ lead.applicant_name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <div class="field-row">
        <mat-form-field appearance="outline" class="field">
          <mat-label>Due date</mat-label>
          <input matInput type="date" [ngModel]="dueDate()" (ngModelChange)="dueDate.set($event)" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="field">
          <mat-label>Due time</mat-label>
          <input matInput type="time" [ngModel]="dueTime()" (ngModelChange)="dueTime.set($event)" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Priority</mat-label>
        <mat-select [ngModel]="priority()" (ngModelChange)="priority.set($event)">
          <mat-option value="low">Low</mat-option>
          <mat-option value="medium">Medium</mat-option>
          <mat-option value="high">High</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Notes</mat-label>
        <textarea
          matInput
          rows="3"
          placeholder="What needs to happen on this task…"
          [ngModel]="description()"
          (ngModelChange)="description.set($event)"
        ></textarea>
      </mat-form-field>

      <button modal-actions mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button modal-actions mat-flat-button color="primary" type="button" class="tide-cta-pill" [disabled]="!canSubmit()" (click)="submit()">
        <mat-icon>check</mat-icon>
        Create {{ typeLabel }}
      </button>
    </app-modal>
  `,
  styles: [
    `
      .field {
        display: block;
        width: 100%;
      }
      .field-row {
        display: flex;
        gap: 1rem;
      }
      .field-row .field {
        flex: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormDialogComponent {
  protected readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<TaskFormDialogComponent, TaskDraft>);
  private readonly leadService = inject(LeadService);

  protected readonly typeLabel = TYPE_LABEL[this.data.type];
  protected readonly typeDisplayLabel = this.typeLabel.charAt(0).toUpperCase() + this.typeLabel.slice(1);
  protected readonly dialogTitle = `New ${this.typeLabel}`;

  // The API already row-scopes `GET leads` to what the signed-in actor may
  // see (own + team, per role — same hierarchy scoping every other module
  // uses), so no client-side "my leads" filter is needed here.
  protected readonly myLeads = signal<Lead[]>([]);

  protected readonly title = signal('');
  protected readonly description = signal('');
  protected readonly leadId = signal<number | null>(null);
  protected readonly priority = signal<TaskPriority>('medium');
  protected readonly dueDate = signal('');
  // Additive: previously the time-of-day was hardcoded to 10:00 at submit.
  // This is now a real, user-editable field, merged into the same `due_at`
  // ISO string at submit time — TaskDraft's shape (`due_at: string`) and the
  // create() call it feeds are unchanged.
  protected readonly dueTime = signal('10:00');

  protected readonly canSubmit = computed(() => this.title().trim().length > 0 && this.dueDate().length > 0);

  constructor() {
    this.leadService.list({ per_page: 100 }).subscribe({
      next: (page) => this.myLeads.set(page.items),
      error: () => this.myLeads.set([]),
    });
  }

  protected submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    const lead = this.leadId() !== null ? this.myLeads().find((candidate) => candidate.id === this.leadId()) : undefined;
    const time = this.dueTime() || '10:00';

    this.dialogRef.close({
      type: this.data.type,
      title: this.title().trim(),
      description: this.description().trim() || null,
      lead_id: lead?.id ?? null,
      priority: this.priority(),
      due_at: new Date(`${this.dueDate()}T${time}:00`).toISOString(),
    });
  }
}
