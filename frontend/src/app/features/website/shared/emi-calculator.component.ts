import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { formatInr, summariseEmi, yearlySchedule } from '@core/utils/emi';

/**
 * EMI calculator. The rate is entered by the user, never preset from a
 * lender, and the result is always labelled indicative.
 */
@Component({
  selector: 'app-emi-calculator',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calc" [class.calc--compact]="compact()">
      <div class="calc__inputs">
        <div class="fw-field">
          <label for="emi-amount">Loan amount</label>
          <input id="emi-amount" class="fw-input" type="number" inputmode="numeric" min="0" step="10000" [value]="amount()" (input)="amount.set(num($event))" />
          <input class="range" type="range" min="50000" max="50000000" step="50000" [value]="amount()" (input)="amount.set(num($event))" aria-label="Loan amount slider" />
        </div>
        <div class="fw-field">
          <label for="emi-rate">Interest rate (% per year)</label>
          <input id="emi-rate" class="fw-input" type="number" inputmode="decimal" min="0" max="40" step="0.1" [value]="rate()" (input)="rate.set(num($event))" />
          <span class="fw-hint">Enter the rate you expect. Actual rates are set by the lender.</span>
        </div>
        <div class="fw-field">
          <label for="emi-years">Tenure (years)</label>
          <input id="emi-years" class="fw-input" type="number" inputmode="numeric" min="1" max="30" step="1" [value]="years()" (input)="years.set(num($event))" />
          <input class="range" type="range" min="1" max="30" step="1" [value]="years()" (input)="years.set(num($event))" aria-label="Tenure slider" />
        </div>
        @if (invalid()) {
          <div class="fw-alert fw-alert--warn">Enter an amount above zero, a rate between 0 and 40, and a tenure of 1 to 30 years.</div>
        }
      </div>

      <div class="calc__result" aria-live="polite">
        <div class="calc__emi">
          <span class="fw-small fw-muted">Estimated EMI</span>
          <strong>{{ fmt(summary().emi) }}</strong>
          <span class="fw-small fw-muted">per month</span>
        </div>
        <div class="calc__split">
          <div class="donut" [style.background]="donut()" role="img" [attr.aria-label]="'Principal ' + summary().principalPercent.toFixed(0) + ' percent, interest ' + (100 - summary().principalPercent).toFixed(0) + ' percent'"></div>
          <ul>
            <li><i class="dot dot--p"></i>Principal <b>{{ fmt(amount()) }}</b></li>
            <li><i class="dot dot--i"></i>Total interest <b>{{ fmt(summary().totalInterest) }}</b></li>
            <li>Total payable <b>{{ fmt(summary().totalPayment) }}</b></li>
          </ul>
        </div>
        <p class="fw-small fw-muted">This is an indicative estimate using the standard EMI formula. Actual rates, charges and repayment terms depend on the lender and your profile.</p>
        @if (showSchedule()) {
          <button type="button" class="link" (click)="open.set(!open())">{{ open() ? 'Hide' : 'Show' }} yearly schedule</button>
          @if (open()) {
            <div class="table-wrap">
              <table>
                <thead><tr><th>Year</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead>
                <tbody>
                  @for (row of schedule(); track row.year) {
                    <tr><td>{{ row.year }}</td><td>{{ fmt(row.principalPaid) }}</td><td>{{ fmt(row.interestPaid) }}</td><td>{{ fmt(row.balance) }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
        @if (cta()) {
          <a class="fw-btn fw-btn--primary fw-btn--block" [routerLink]="inPortal ? '/account/apply' : '/apply'" [queryParams]="applyParams()">Apply for this loan</a>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .calc { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
      .calc--compact { gap: 18px; }
      .range { width: 100%; accent-color: var(--fw-blue); }
      .calc__result { background: var(--fw-blue-soft); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
      .calc__emi { display: flex; flex-direction: column; }
      .calc__emi strong { font-size: 2rem; color: var(--fw-navy); line-height: 1.2; }
      .calc__split { display: flex; gap: 18px; align-items: center; }
      .donut { width: 96px; height: 96px; border-radius: 50%; flex: none; position: relative; }
      .donut::after { content: ''; position: absolute; inset: 22px; background: var(--fw-blue-soft); border-radius: 50%; }
      ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 0.85rem; }
      li b { margin-left: 6px; }
      .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
      .dot--p { background: var(--fw-blue); }
      .dot--i { background: #f59e0b; }
      .link { background: none; border: 0; color: var(--fw-blue); font: 600 0.85rem Poppins, sans-serif; cursor: pointer; text-align: left; padding: 0; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; font-size: 0.8rem; background: #fff; border-radius: 8px; }
      th, td { padding: 8px 10px; text-align: right; border-bottom: 1px solid var(--fw-line); white-space: nowrap; }
      th:first-child, td:first-child { text-align: left; }
      @media (max-width: 760px) { .calc { grid-template-columns: 1fr; } }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class EmiCalculatorComponent {
  /** Inside the customer dashboard (/account) links stay in the dashboard instead of going to the public site. */
  protected readonly inPortal = inject(Router).url.startsWith('/account');
  readonly compact = input(false);
  readonly cta = input(false);
  readonly showSchedule = input(false);
  readonly product = input<string | null>(null);
  readonly initialAmount = input(1000000);

  protected readonly amount = linkedSignal(() => this.initialAmount());
  protected readonly rate = signal(10);
  protected readonly years = signal(5);
  protected readonly open = signal(false);

  protected readonly months = computed(() => Math.round(this.years()) * 12);
  protected readonly invalid = computed(
    () => !(this.amount() > 0) || !(this.rate() >= 0 && this.rate() <= 40) || !(this.years() >= 1 && this.years() <= 30),
  );
  protected readonly summary = computed(() =>
    this.invalid() ? summariseEmi(0, 0, 0) : summariseEmi(this.amount(), this.rate(), this.months()),
  );
  protected readonly schedule = computed(() =>
    this.invalid() ? [] : yearlySchedule(this.amount(), this.rate(), this.months()),
  );
  protected readonly donut = computed(() => {
    const p = this.summary().principalPercent;
    return `conic-gradient(var(--fw-blue) 0 ${p}%, #f59e0b ${p}% 100%)`;
  });
  protected readonly applyParams = computed(() => ({
    product: this.product() ?? undefined,
    amount: Math.round(this.amount()),
    years: Math.round(this.years()),
  }));

  protected num(event: Event): number {
    const value = Number((event.target as HTMLInputElement).value);
    return Number.isFinite(value) ? value : 0;
  }

  protected fmt(value: number): string {
    return formatInr(value);
  }
}
