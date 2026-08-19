import { Directive, Input, TemplateRef } from '@angular/core';

/**
 * Marks a `<ng-template>` as the custom cell renderer for a given column key
 * in `app-table`, e.g. `<ng-template appTableCell="status" let-row>…</ng-template>`.
 * Columns without a matching template fall back to their plain text formatter.
 */
@Directive({
  selector: 'ng-template[appTableCell]',
  standalone: true,
})
export class TableCellDirective {
  @Input('appTableCell') column = '';

  constructor(public readonly template: TemplateRef<{ $implicit: unknown }>) {}
}
