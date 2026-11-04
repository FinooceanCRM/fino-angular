import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContactFabComponent } from '../../website/shared/contact-fab.component';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink, ContactFabComponent],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {}
