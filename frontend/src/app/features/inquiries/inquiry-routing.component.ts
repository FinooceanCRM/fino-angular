import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { InquiryMeta, RoutingRule } from '@core/models/inquiry.model';
import { ApiService } from '@core/services/api.service';
import { InquiryService } from '@core/services/inquiry.service';
import { ErrorStateComponent } from '@shared/components/error-state.component';
import { LoadingComponent } from '@shared/components/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { BackButtonComponent } from '@shared/components/back-button.component';

interface Mgr { id: number; name: string; email: string; }

/**
 * Super Admin: which Managers may receive website inquiries per loan
 * department. Telecallers can only assign to the managers configured here
 * (when a department has none configured, any active manager is allowed).
 */
@Component({
  selector: 'app-inquiry-routing',
  standalone: true,
  imports: [BackButtonComponent, PageHeaderComponent, LoadingComponent, ErrorStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-back-button variant="material" class="back" fallback="/inquiries" />
    <app-page-header title="Inquiry routing rules" subtitle="Choose which managers receive website inquiries for each department." icon="alt_route" />

    @if (error()) {
      <app-error-state [message]="error()!" />
    } @else if (!ready()) {
      <app-loading />
    } @else {
      @if (message()) { <div class="note ok" role="status">{{ message() }}</div> }
      <div class="grid">
        @for (dep of departments(); track dep.value) {
          <section class="card">
            <h2>{{ dep.label }}</h2>
            <p class="muted">{{ selected(dep.value).length ? selected(dep.value).length + ' manager(s) configured' : 'No rule — any active manager may be chosen.' }}</p>
            @for (m of managers(); track m.id) {
              <label class="check"><input type="checkbox" [checked]="selected(dep.value).includes(m.id)" (change)="toggle(dep.value, m.id)" /> {{ m.name }} <span class="muted">{{ m.email }}</span></label>
            } @empty { <p class="muted">No active managers found.</p> }
            <button type="button" class="btn" [disabled]="saving() === dep.value" (click)="save(dep.value)">{{ saving() === dep.value ? 'Saving…' : 'Save' }}</button>
          </section>
        }
      </div>
    }
  `,
  styles: [
    `
      :host { display: block; }
      .back { display: inline-flex; align-items: center; gap: 4px; color: var(--tide-color-secondary-hover, #108a7f); text-decoration: none; margin-bottom: 8px; font-size: 0.9rem; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
      .card { background: var(--tide-color-surface, #fff); border: 1px solid var(--tide-color-border-subtle, #dfe7ea); border-radius: var(--app-radius-md, 10px); padding: 16px; display: grid; gap: 8px; align-content: start; }
      h2 { margin: 0; font-size: 1rem; color: var(--tide-color-primary, #0a2a43); }
      .muted { color: var(--app-status-default-fg, #667); font-size: 0.8rem; margin: 0; }
      .check { display: flex; gap: 8px; align-items: center; font-size: 0.9rem; }
      .note { padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; } .note.ok { background: #e8f7ee; color: #0f5b2c; }
      .btn { justify-self: start; height: 36px; padding: 0 16px; border-radius: 8px; border: 0; background: var(--tide-color-primary, #0a2a43); color: #fff; cursor: pointer; font-family: inherit; }
      .btn[disabled] { opacity: 0.5; }
    `,
  ],
})
export class InquiryRoutingComponent {
  private readonly api = inject(InquiryService);
  private readonly http = inject(ApiService);

  protected readonly departments = signal<InquiryMeta['departments']>([]);
  protected readonly managers = signal<Mgr[]>([]);
  protected readonly picked = signal<Record<string, number[]>>({});
  protected readonly ready = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  constructor() {
    this.api.meta().subscribe({
      next: (m) => { this.departments.set(m.departments); this.loadRest(); },
      error: (e: { message?: string }) => this.error.set(e?.message ?? 'We could not load routing rules.'),
    });
  }

  private loadRest(): void {
    this.http.getEnvelope<(Mgr & { is_active: boolean })[]>('users', { role: 'manager', per_page: 100 }).subscribe({
      next: (r) => {
        this.managers.set(r.data.filter((u) => u.is_active));
        this.api.routingRules().subscribe({
          next: (rules) => { this.applyRules(rules); this.ready.set(true); },
          error: (e: { message?: string }) => this.error.set(e?.message ?? 'We could not load routing rules.'),
        });
      },
      error: (e: { message?: string }) => this.error.set(e?.message ?? 'We could not load managers.'),
    });
  }

  private applyRules(rules: RoutingRule[]): void {
    const map: Record<string, number[]> = {};
    for (const r of rules) {
      if (r.manager) (map[r.department] ??= []).push(r.manager.id);
    }
    this.picked.set(map);
  }

  protected selected(dep: string): number[] {
    return this.picked()[dep] ?? [];
  }

  protected toggle(dep: string, id: number): void {
    this.picked.update((p) => {
      const cur = p[dep] ?? [];
      return { ...p, [dep]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });
  }

  protected save(dep: string): void {
    this.saving.set(dep);
    this.message.set(null);
    this.error.set(null);
    this.api.setRoutingRule(dep, this.selected(dep)).subscribe({
      next: (rules) => { this.applyRules(rules); this.saving.set(null); this.message.set('Routing saved.'); },
      error: (e: { message?: string }) => { this.saving.set(null); this.error.set(e?.message ?? 'We could not save routing.'); },
    });
  }
}
