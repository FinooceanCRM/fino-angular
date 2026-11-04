/** Material icon for a loan type, given the API's `loan_type` value (e.g. `home`, `personal`) or label. */
export function loanTypeIcon(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('home')) return 'home';
  if (t.includes('business')) return 'business';
  if (t.includes('car')) return 'directions_car';
  if (t.includes('educ')) return 'school';
  if (t.includes('property') || t.includes('lap') || t.includes('mortgage')) return 'apartment';
  return 'paid';
}

/** Colour family used for an application's icon tile, so each loan type keeps the same colour everywhere. */
export function loanTypeTone(type: string): 'green' | 'blue' | 'purple' | 'orange' {
  const t = type.toLowerCase();
  if (t.includes('home') || t.includes('car') || t.includes('educ')) return 'blue';
  if (t.includes('business')) return 'purple';
  if (t.includes('property') || t.includes('lap')) return 'orange';
  return 'green';
}

/** Website product slug (e.g. `home-loan`) for an API `loan_type` value, to look up loan artwork. */
export function loanTypeSlug(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('property') || t.includes('lap') || t.includes('mortgage')) return 'loan-against-property';
  if (t.includes('home')) return 'home-loan';
  if (t.includes('business')) return 'business-loan';
  if (t.includes('car')) return 'car-loan';
  if (t.includes('educ')) return 'education-loan';
  return 'personal-loan';
}
