import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UserRoleTableComponent } from '../user-role-table/user-role-table.component';

@Component({
  selector: 'app-super-admin-employees',
  standalone: true,
  imports: [UserRoleTableComponent],
  template: `
    <app-super-admin-user-role-table
      role="employee"
      roleLabel="Employee"
      title="Employees"
      subtitle="Manage Employee accounts across the platform."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminEmployeesComponent {}
