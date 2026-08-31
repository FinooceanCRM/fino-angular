import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { UserRoleTableComponent } from '../user-role-table/user-role-table.component';
import { UserRoleTabsComponent } from '../user-role-tabs/user-role-tabs.component';

@Component({
  selector: 'app-super-admin-employees',
  standalone: true,
  imports: [UserRoleTabsComponent, UserRoleTableComponent, MatButtonModule, MatIconModule],
  template: `
    <app-user-role-tabs>
      <button
        page-header-actions
        mat-flat-button
        color="primary"
        type="button"
        class="tide-cta-pill"
        (click)="table.openCreate()"
      >
        <mat-icon>add</mat-icon>
        Add Employee
      </button>
    </app-user-role-tabs>
    <app-super-admin-user-role-table
      #table
      role="employee"
      roleLabel="Employee"
      title="Employees"
      subtitle="Manage Employee accounts across the platform."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminEmployeesComponent {}
