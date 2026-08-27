import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ModalComponent } from '@shared/components/modal.component';

import { Lead } from '@core/models/lead.model';
import { AssignedEmployee } from '@core/models/relationship-manager.model';
import { TaskActivityType, TaskDraft } from '@core/models/task.model';
import { AuthService } from '@core/services/auth.service';
import { LeadService } from '@core/services/lead.service';
import { RelationshipManagerService } from '@core/services/relationship-manager.service';

export interface ActivityFormDialogData {
  type: TaskActivityType;
}

interface AssigneeOption {
  id: number;
  name: string;
}

const TYPE_LABEL: Record<TaskActivityType, string> = {
  call: 'call',
  meeting: 'meeting',
  task: 'task',
  reminder: 'reminder',
};

/**
 * Schedule a new call / meeting / task / reminder against the real Tasks API
 * (Phase 4) — creates a row assigned to the chosen team member (defaulting
 * to the RM themself), optionally linked to one of the RM's own leads.
 */
@Component({
  selector: 'app-relationship-manager-activity-form-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, ModalComponent],
  templateUrl: './relationship-manager-activity-form-dialog.component.html',
  styleUrl: './relationship-manager-activity-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerActivityFormDialogComponent {
  protected readonly data = inject<ActivityFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<RelationshipManagerActivityFormDialogComponent, TaskDraft>);
  private readonly leadService = inject(LeadService);
  private readonly relationshipManagers = inject(RelationshipManagerService);
  private readonly rmId = inject(AuthService).user()?.id ?? null;

  protected readonly typeLabel = TYPE_LABEL[this.data.type];

  // GET leads is already row-scoped to what this RM may see.
  protected readonly myLeads = signal<Lead[]>([]);
  private readonly employees = signal<AssignedEmployee[]>([]);

  protected readonly assignableTo = computed<AssigneeOption[]>(() => [
    ...(this.rmId ? [{ id: this.rmId, name: 'Myself' }] : []),
    ...this.employees().map((employee) => ({ id: employee.id, name: employee.name })),
  ]);

  protected readonly title = signal('');
  protected readonly leadId = signal<number | null>(null);
  protected readonly assignedTo = signal<number | null>(this.rmId);
  protected readonly dueDate = signal('');
  protected readonly notes = signal('');

  protected readonly canSubmit = computed(() => this.title().trim().length > 0 && this.dueDate().length > 0);

  constructor() {
    this.leadService.list({ per_page: 100 }).subscribe({
      next: (page) => this.myLeads.set(page.items),
      error: () => this.myLeads.set([]),
    });

    this.relationshipManagers.employees().subscribe({
      next: (result) => this.employees.set(result.employees),
      error: () => this.employees.set([]),
    });
  }

  protected submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    const lead = this.leadId() !== null ? this.myLeads().find((candidate) => candidate.id === this.leadId()) : undefined;

    this.dialogRef.close({
      type: this.data.type,
      title: this.title().trim(),
      description: this.notes().trim() || null,
      lead_id: lead?.id ?? null,
      priority: 'medium',
      due_at: new Date(this.dueDate() + 'T10:00:00').toISOString(),
      assigned_to: this.assignedTo() ?? undefined,
    });
  }
}
