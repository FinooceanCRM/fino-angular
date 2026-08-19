import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UserRoleTableComponent } from '../user-role-table/user-role-table.component';

@Component({
  selector: 'app-super-admin-connectors',
  standalone: true,
  imports: [UserRoleTableComponent],
  template: `
    <app-super-admin-user-role-table
      role="connector"
      roleLabel="Connector"
      title="Connectors"
      subtitle="Manage Connector accounts across the platform."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminConnectorsComponent {}
