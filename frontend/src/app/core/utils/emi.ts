/**
 * Standard reducing-balance EMI:  EMI = P · r · (1 + r)^n / ((1 + r)^n − 1)
 *   P = principal, r = monthly rate (annual % / 12 / 100), n = months.
 * A 0 % rate degenerates to P / n. Invalid input returns 0 rather than NaN.
 */
export function calculateEmi(principal: number, annualRatePercent: number, months: number): number {
  if (!isFinite(principal) || !isFinite(annualRatePercent) || !isFinite(months)) return 0;
  if (principal <= 0 || months <= 0 || annualRatePercent < 0) return 0;

  const r = annualRatePercent / 12 / 100;
  if (r === 0) return principal / months;

  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

export interface EmiSummary {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  /** Share of the total payment that is principal, 0–100 (for the donut). */
  principalPercent: number;
}

export function summariseEmi(principal: number, annualRatePercent: number, months: number): EmiSummary {
  const emi = calculateEmi(principal, annualRatePercent, months);
  const totalPayment = emi * months;
  const totalInterest = Math.max(0, totalPayment - principal);

  return {
    emi,
    totalPayment,
    totalInterest,
    principalPercent: totalPayment > 0 ? (principal / totalPayment) * 100 : 100,
  };
}

export interface YearRow {
  year: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

/** Year-by-year amortisation for the calculator's schedule table. */
export function yearlySchedule(principal: number, annualRatePercent: number, months: number): YearRow[] {
  const emi = calculateEmi(principal, annualRatePercent, months);
  if (emi <= 0) return [];

  const r = annualRatePercent / 12 / 100;
  const rows: YearRow[] = [];
  let balance = principal;

  for (let year = 1; year <= Math.ceil(months / 12); year++) {
    let principalPaid = 0;
    let interestPaid = 0;
    const end = Math.min(year * 12, months);

    for (let m = (year - 1) * 12 + 1; m <= end; m++) {
      const interest = balance * r;
      const principalPart = Math.min(balance, emi - interest);
      interestPaid += interest;
      principalPaid += principalPart;
      balance = Math.max(0, balance - principalPart);
    }

    rows.push({ year, principalPaid, interestPaid, balance });
  }

  return rows;
}

export function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}
