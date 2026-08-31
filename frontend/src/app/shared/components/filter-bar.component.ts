import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type FilterFieldType = 'text' | 'select' | 'date' | 'number';

export interface FilterFieldOption {
  value: string;
  label: string;
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
  /** Required for type: 'select'. First option renders as the implicit "All" choice if it has value ''. */
  options?: FilterFieldOption[];
}

/**
 * Config-driven filter bar. Every list page in the app today hand-builds
 * its own filter `FormGroup` and markup (search + status + date range, in
 * varying combinations) — this renders the same field types from a plain
 * config array, so the markup is written once. Filtering is explicit
 * (an "Apply" button), matching the app's existing filter convention,
 * plus a "Clear" action.
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="filter-bar" [formGroup]="form" (ngSubmit)="submit()">
      @for (field of fields(); track field.key) {
        <mat-form-field appearance="outline" class="filter-bar__field">
          <mat-label>{{ field.label }}</mat-label>

          @switch (field.type) {
            @case ('select') {
              <mat-select [formControlName]="field.key">
                @for (option of field.options ?? []; track option.value) {
                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                }
              </mat-select>
            }
            @case ('date') {
              <input matInput type="date" [formControlName]="field.key" />
            }
            @case ('number') {
              <input matInput type="number" [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" />
            }
            @default {
              <input matInput [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" />
            }
          }
        </mat-form-field>
      }

      <div class="filter-bar__actions">
        <button mat-button type="button" (click)="clear()">
          <mat-icon>filter_alt_off</mat-icon>
          Clear
        </button>
        <button mat-flat-button color="primary" type="submit" class="tide-cta-pill">
          <mat-icon>filter_alt</mat-icon>
          Apply
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--app-space-3);
      }
      .filter-bar__field {
        flex: 1 1 200px;
        min-width: 160px;
      }
      .filter-bar__actions {
        display: flex;
        gap: var(--app-space-2);
        flex-shrink: 0;
      }
    `,
  ],
})
export class FilterBarComponent {
  private readonly fb = inject(FormBuilder);

  readonly fields = input.required<FilterFieldConfig[]>();

  /** Emits the raw filter values (keyed by field.key) whenever Apply is pressed. */
  readonly apply = output<Record<string, string>>();
  /** Emits an all-empty value set whenever Clear is pressed. */
  readonly cleared = output<Record<string, string>>();

  private readonly defaults = computed(() =>
    Object.fromEntries(this.fields().map((field) => [field.key, ''])),
  );

  protected readonly form = this.fb.nonNullable.group(this.defaults());

  protected submit(): void {
    this.apply.emit(this.form.getRawValue());
  }

  protected clear(): void {
    this.form.reset(this.defaults());
    this.cleared.emit(this.form.getRawValue());
  }
}
