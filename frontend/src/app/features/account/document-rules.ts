/** Document types the customer may upload only as a PDF; every other type also accepts JPG and PNG. */
const PDF_ONLY_TYPES = ['income_proof', 'bank_statement', 'bank_proof'];

export const isPdfOnly = (type: string | null | undefined): boolean => !!type && PDF_ONLY_TYPES.includes(type);

/** Value for the file input's `accept` attribute. */
export const acceptFor = (type: string | null | undefined): string =>
  isPdfOnly(type) ? '.pdf,application/pdf' : '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

/** The customer-facing message for a file that is not allowed for this type, or null when it is fine. */
export function typeError(type: string | null | undefined, file: File): string | null {
  if (isPdfOnly(type) && file.type !== 'application/pdf') {
    return `“${file.name}” isn’t supported. Income proof, bank statements and bank passbooks must be uploaded as a PDF.`;
  }
  return null;
}
