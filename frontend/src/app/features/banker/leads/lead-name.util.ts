import { CatalogueOption } from '@core/models/lead.model';

/** The first token of a lead's applicant name, for the "First Name" column the Banker bucket tables use. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/** Looks up a loan-type catalogue label, falling back to the raw value if the catalogue hasn't loaded yet. */
export function loanTypeLabel(loanTypes: CatalogueOption[], value: string): string {
  return loanTypes.find((option) => option.value === value)?.label ?? value;
}
