import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Client-side validators for the Vendor Certification wizard. Every rule
 * mirrors the server (SubmitVendorCertificationRequest / App\Support\Verhoeff)
 * and the reference app's assets/js/app.js `Rules`.
 */

export const MOBILE_PATTERN = /^[6-9]\d{9}$/;
export const PIN_PATTERN = /^[1-9]\d{5}$/;
export const GST_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;
export const AADHAAR_PATTERN = /^[2-9]\d{11}$/;
export const NAME_PATTERN = /^[A-Za-zऀ-ॿ.\s'-]{2,150}$/;

/** Verhoeff checksum — direct port of App\Support\Verhoeff / app.js verhoeff(). */
export function verhoeff(numRaw: string): boolean {
  const num = String(numRaw).replace(/\D/g, '');
  if (!AADHAAR_PATTERN.test(num)) return false;

  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];
  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];
  const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

  let c = 0;
  num
    .split('')
    .reverse()
    .forEach((ch, i) => {
      c = d[c][p[i % 8][+ch]];
    });
  return inv[c] === 0;
}

const optional = (v: unknown): boolean => v === null || v === undefined || String(v).trim() === '';

export const aadhaarValidator: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  if (optional(c.value)) return null;
  return verhoeff(String(c.value)) ? null : { aadhaar: true };
};

export const mobileValidator: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  if (optional(c.value)) return null;
  return MOBILE_PATTERN.test(String(c.value).replace(/\D/g, '')) ? null : { mobile: true };
};

export const gstValidator: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  if (optional(c.value)) return null;
  return GST_PATTERN.test(String(c.value).toUpperCase().trim()) ? null : { gst: true };
};

export const pinValidator: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  if (optional(c.value)) return null;
  return PIN_PATTERN.test(String(c.value).replace(/\D/g, '')) ? null : { pin: true };
};

/** DOB must be a valid past date. */
export const pastDateValidator: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  if (optional(c.value)) return null;
  const d = new Date(c.value);
  return !isNaN(d.getTime()) && d <= new Date() ? null : { pastDate: true };
};

export function calculateAge(dob: Date, at: Date = new Date()): number {
  let age = at.getFullYear() - dob.getFullYear();
  const m = at.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < dob.getDate())) age -= 1;
  return age;
}
