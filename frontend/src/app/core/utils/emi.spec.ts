import { calculateEmi, summariseEmi, yearlySchedule } from './emi';

describe('emi utils', () => {
  it('matches the standard formula (10L @ 10% for 5y ≈ 21,247)', () => {
    expect(Math.round(calculateEmi(1000000, 10, 60))).toBe(21247);
  });

  it('handles a zero interest rate', () => {
    expect(calculateEmi(12000, 0, 12)).toBe(1000);
  });

  it('returns 0 for invalid input instead of NaN', () => {
    expect(calculateEmi(0, 10, 12)).toBe(0);
    expect(calculateEmi(1000, 10, 0)).toBe(0);
    expect(calculateEmi(-1, 10, 12)).toBe(0);
    expect(calculateEmi(1000, -3, 12)).toBe(0);
    expect(calculateEmi(NaN, 10, 12)).toBe(0);
  });

  it('summarises principal vs interest', () => {
    const s = summariseEmi(1000000, 10, 60);
    expect(s.totalPayment).toBeCloseTo(s.emi * 60, 2);
    expect(s.totalInterest).toBeGreaterThan(0);
    expect(s.principalPercent).toBeGreaterThan(0);
    expect(s.principalPercent).toBeLessThan(100);
  });

  it('amortises to a zero balance', () => {
    const rows = yearlySchedule(500000, 9, 48);
    expect(rows.length).toBe(4);
    expect(rows[rows.length - 1].balance).toBeCloseTo(0, 0);
  });
});
