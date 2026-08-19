import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { PageHeaderComponent } from '@shared/components/page-header.component';

import { SuperAdminGeneralSettingsComponent } from './general-settings/super-admin-general-settings.component';
import { SuperAdminMatchingEngineSettingsComponent } from './matching-engine-settings/super-admin-matching-engine-settings.component';
import { SuperAdminNotificationSettingsComponent } from './notification-settings/super-admin-notification-settings.component';
import { SuperAdminSecuritySettingsComponent } from './security-settings/super-admin-security-settings.component';

/**
 * Platform configuration — General, Matching Engine, Notifications and
 * Security. Backed by `SettingsDataProvider`: a "Save" mutates the shared
 * signal and records an audit entry, but nothing survives a hard reload
 * since there is no settings API yet.
 */
@Component({
  selector: 'app-super-admin-settings',
  standalone: true,
  imports: [
    MatCardModule,
    MatTabsModule,
    PageHeaderComponent,
    SuperAdminGeneralSettingsComponent,
    SuperAdminMatchingEngineSettingsComponent,
    SuperAdminNotificationSettingsComponent,
    SuperAdminSecuritySettingsComponent,
  ],
  templateUrl: './super-admin-settings.component.html',
  styleUrl: './super-admin-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminSettingsComponent {}
