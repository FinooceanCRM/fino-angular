import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  DIGEST_FREQUENCY_LABEL,
  NotificationDigestFrequency,
  SETTINGS_NOTIFICATION_CATEGORY_LABEL,
} from '@core/models/settings.model';
import { SettingsService } from '@core/services/settings.service';

/** Notification settings — delivery channels, digest frequency and per-category routing. */
@Component({
  selector: 'app-super-admin-notification-settings',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './super-admin-notification-settings.component.html',
  styleUrl: './super-admin-notification-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminNotificationSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsService = inject(SettingsService);

  protected readonly loading = signal(true);
  protected readonly categories = Object.entries(SETTINGS_NOTIFICATION_CATEGORY_LABEL);
  protected readonly digestFrequencies = Object.entries(DIGEST_FREQUENCY_LABEL) as [NotificationDigestFrequency, string][];

  protected readonly form = this.fb.nonNullable.group({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    digest_frequency: 'real_time' as NotificationDigestFrequency,
    category_channels: this.fb.nonNullable.group({
      leads: true,
      users: true,
      banking: true,
      documents: true,
      commission: true,
      system: true,
    }),
  });

  ngOnInit(): void {
    this.settingsService.get().subscribe((settings) => {
      this.form.patchValue(settings.notifications);
      this.loading.set(false);
    });
  }

  protected save(): void {
    this.settingsService.updateNotifications(this.form.getRawValue()).subscribe(() => {
      this.snackBar.open('Notification settings saved.', 'Dismiss', { duration: 4000 });
    });
  }
}
