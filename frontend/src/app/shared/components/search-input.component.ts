import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * Reusable, debounced search field. Every search box in the app today is a
 * hand-rolled `mat-form-field` wired to an "Apply" button — this emits
 * `search` on its own, `debounceMs` after the user stops typing, so a list
 * page can wire it up without building its own debounce logic.
 */
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="search-input">
      <mat-icon matPrefix>search</mat-icon>
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        type="search"
        [placeholder]="placeholder()"
        [ngModel]="term()"
        (ngModelChange)="onInput($event)"
      />
      @if (term()) {
        <button matSuffix mat-icon-button type="button" aria-label="Clear search" (click)="clear()">
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  styles: [
    `
      .search-input {
        width: 100%;
      }
    `,
  ],
})
export class SearchInputComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly label = input('Search');
  readonly placeholder = input('');
  readonly initialValue = input('');
  readonly debounceMs = input(300);

  readonly search = output<string>();

  protected readonly term = signal(this.initialValue());

  private readonly input$ = new Subject<string>();

  constructor() {
    const subscription = this.input$
      .pipe(debounceTime(this.debounceMs()), distinctUntilChanged())
      .subscribe((value) => this.search.emit(value));

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected onInput(value: string): void {
    this.term.set(value);
    this.input$.next(value);
  }

  protected clear(): void {
    this.term.set('');
    this.input$.next('');
  }
}
