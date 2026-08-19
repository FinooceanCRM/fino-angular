import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UserRoleTableComponent } from '../user-role-table/user-role-table.component';

@Component({
  selector: 'app-super-admin-bankers',
  standalone: true,
  imports: [UserRoleTableComponent],
  template: `
    <app-super-admin-user-role-table
      role="banker"
      roleLabel="Banker"
      title="Bankers"
      subtitle="Manage Banker accounts across the platform."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminBankersComponent {}
