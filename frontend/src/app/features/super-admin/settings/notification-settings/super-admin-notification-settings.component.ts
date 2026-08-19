import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NOTIFICATION_CATEGORY_LABEL } from '../../data/models/notification.model';
import { DIGEST_FREQUENCY_LABEL, NotificationDigestFrequency } from '../../data/models/settings.model';
import { SettingsDataProvider } from '../../data/providers/settings-data.provider';

/** Notification settings — delivery channels, digest frequency and per-category routing. */
@Component({
  selector: 'app-super-admin-notification-settings',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, MatSlideToggleModule],
  templateUrl: './super-admin-notification-settings.component.html',
  styleUrl: './super-admin-notification-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminNotificationSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsData = inject(SettingsDataProvider);

  protected readonly categories = Object.entries(NOTIFICATION_CATEGORY_LABEL);
  protected readonly digestFrequencies = Object.entries(DIGEST_FREQUENCY_LABEL) as [NotificationDigestFrequency, string][];

  private readonly seed = this.settingsData.settings().notifications;

  protected readonly form = this.fb.nonNullable.group({
    email_enabled: this.seed.email_enabled,
    sms_enabled: this.seed.sms_enabled,
    push_enabled: this.seed.push_enabled,
    digest_frequency: this.seed.digest_frequency,
    category_channels: this.fb.nonNullable.group({ ...this.seed.category_channels }),
  });

  protected save(): void {
    this.settingsData.saveNotifications(this.form.getRawValue());
    this.snackBar.open('Notification settings saved.', 'Dismiss', { duration: 4000 });
  }
}
