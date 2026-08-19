import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AssignableUser, Lead, LeadAssignmentHistoryEntry } from '@core/models/lead.model';
import { LeadService } from '@core/services/lead.service';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { EntityHeaderComponent } from '@shared/components/entity-header.component';

const ROLE_LABEL: Record<string, string> = {
  relationship_manager: 'Relationship Manager',
  employee: 'Employee',
  manager: 'Manager',
  banker: 'Banker',
};

/** Lead Assignment — the reassignment workflow and assignment history for one lead. */
@Component({
  selector: 'app-manager-lead-assignment',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    EmptyStateComponent,
    EntityHeaderComponent,
  ],
  templateUrl: './manager-lead-assignment.component.html',
  styleUrl: './manager-lead-assignment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerLeadAssignmentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly leads = inject(LeadService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  private readonly leadId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly lead = signal<Lead | undefined>(undefined);
  protected readonly history = signal<LeadAssignmentHistoryEntry[]>([]);
  protected readonly assignableStaffRaw = signal<AssignableUser[]>([]);
  protected readonly loading = signal(false);

  protected readonly assignableStaff = computed(() =>
    this.assignableStaffRaw().map((person) => ({ ...person, role_label: ROLE_LABEL[person.role] ?? person.role })),
  );

  protected readonly currentAssignee = computed(() => {
    const current = this.lead();
    return current?.assigned_employee ?? current?.assigned_relationship_manager ?? null;
  });

  protected readonly form = this.fb.nonNullable.group({
    assigneeId: [0, [Validators.required, Validators.min(1)]],
    remarks: [''],
  });

  constructor() {
    this.leads.assignableUsers().subscribe({
      next: (users) => this.assignableStaffRaw.set(users),
      error: () => this.assignableStaffRaw.set([]),
    });

    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.leads.detail(this.leadId).subscribe({
      next: (detail) => {
        this.lead.set(detail.lead);
        this.history.set([...detail.assignment_history].reverse());
        this.loading.set(false);
      },
      error: () => {
        this.lead.set(undefined);
        this.loading.set(false);
      },
    });
  }

  protected reassign(): void {
    const { assigneeId, remarks } = this.form.getRawValue();
    const assignee = this.assignableStaffRaw().find((person) => person.id === assigneeId);
    if (!assignee) {
      return;
    }

    this.leads.assign(this.leadId, assignee.id, remarks || undefined).subscribe({
      next: () => {
        this.form.reset({ assigneeId: 0, remarks: '' });
        this.snackBar.open(`Reassigned to ${assignee.name}.`, 'Dismiss', { duration: 4000 });
        this.reload();
      },
      error: () => {
        this.snackBar.open('Could not reassign this lead.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
