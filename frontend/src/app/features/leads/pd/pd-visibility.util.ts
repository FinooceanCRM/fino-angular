import { ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';

/** One `field = value` requirement from a Form 39 conditional-logic rule. */
export interface PdCondition {
  field: string;
  value: string;
}

/**
 * Evaluates the conditions gating a PD field/section's visibility.
 *
 * A field/section is visible if ANY listed condition currently matches —
 * plain disjunction over the flat list, regardless of whether two
 * conditions name the same field or different ones. This mirrors the source
 * Form 39 export's own `conditional_logics.type` verbatim: every rule in the
 * entire ~275-field export that actually names a field uses `"type":"any"`
 * (Fluent Forms' "match ANY of these" mode) — the only two `"type":"all"`
 * occurrences in the whole file are unconfigured placeholders with an empty
 * field/value, never a real rule. An earlier version of this function AND'd
 * conditions that named different fields (e.g. requiring `LOAN_TYPE =
 * Personal Loan` *and* `Type_of_Customer = If Salaried` together), which was
 * never what the source form did — it silently made several sections
 * unreachable (e.g. the Business & Partner section for a direct
 * Business/Self-employed applicant, since the extra field it was AND'd with
 * is only ever set via a different, unrelated flow).
 */
export function pdConditionsMet(form: FormGroup, conditions: PdCondition[] | undefined): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.some((condition) => form.get(condition.field)?.value === condition.value);
}

/**
 * Keeps a `pdVisible()`-gated section component's OnPush view in sync with
 * the shared master form, even when the field that flips a condition (e.g.
 * `Type_of_Customer`) lives in a *different* section component than the one
 * whose template evaluates it. OnPush only re-checks a component when its
 * own template raises an event or an `@Input` reference changes — a sibling
 * component mutating a control's value on the shared `FormGroup` does
 * neither, so without this a conditional section only ever reflects the
 * form's state as of its own last render (typically the initial page load,
 * or a pre-filled edit). Call once from `ngOnInit()`.
 */
export function watchFormForVisibilityChanges(form: FormGroup, cdr: ChangeDetectorRef, destroyRef: DestroyRef): void {
  form.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => cdr.markForCheck());
}
