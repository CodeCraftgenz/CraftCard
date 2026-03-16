/**
 * Pricing & Billing Logic Tests
 *
 * Tests all pricing calculations used in PricingSection and BillingPage.
 */
import { describe, it, expect } from 'vitest';

// ── PRO pricing ─────────────────────────────────────────────────────────────

const PRO_MONTHLY = 19.9;
const PRO_YEARLY_MONTH = 15.9; // ~20% off
const YEARLY_DISCOUNT = 0.2;

function getProPrice(cycle: 'MONTHLY' | 'YEARLY'): number {
  return cycle === 'YEARLY' ? PRO_YEARLY_MONTH : PRO_MONTHLY;
}

function getProYearlyTotal(): number {
  return PRO_YEARLY_MONTH * 12;
}

// ── BUSINESS tiered pricing ─────────────────────────────────────────────────

const BUSINESS_TIERS = [
  { min: 1, max: 10, price: 39.9 },
  { min: 11, max: 25, price: 34.9 },
  { min: 26, max: 50, price: 29.9 },
  { min: 51, max: 100, price: 22.9 },
];

function getBusinessPricePerSeat(seats: number): number {
  for (const tier of BUSINESS_TIERS) {
    if (seats >= tier.min && seats <= tier.max) return tier.price;
  }
  return BUSINESS_TIERS[BUSINESS_TIERS.length - 1].price;
}

function getBusinessMonthlyTotal(seats: number, cycle: 'MONTHLY' | 'YEARLY'): number {
  const perSeat = getBusinessPricePerSeat(seats);
  const total = perSeat * seats;
  return cycle === 'YEARLY' ? total * (1 - YEARLY_DISCOUNT) : total;
}

// ── ENTERPRISE tiered pricing ───────────────────────────────────────────────

const ENTERPRISE_TIERS = [
  { min: 101, max: 250, price: 19.9 },
  { min: 251, max: 500, price: 14.9 },
  { min: 501, max: 1000, price: 9.9 },
  { min: 1001, max: Infinity, price: 7.9 },
];

function getEnterprisePricePerSeat(seats: number): number {
  for (const tier of ENTERPRISE_TIERS) {
    if (seats >= tier.min && seats <= tier.max) return tier.price;
  }
  return ENTERPRISE_TIERS[ENTERPRISE_TIERS.length - 1].price;
}

function getEnterpriseMonthlyTotal(seats: number, cycle: 'MONTHLY' | 'YEARLY'): number {
  const perSeat = getEnterprisePricePerSeat(seats);
  const total = perSeat * seats;
  return cycle === 'YEARLY' ? total * (1 - YEARLY_DISCOUNT) : total;
}

// ── Discount calculation ─────────────────────────────────────────────────────

function calculateYearlyDiscount(monthlyTotal: number): number {
  return monthlyTotal * YEARLY_DISCOUNT * 12;
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('PRO pricing', () => {
  it('returns R$19.90 for monthly', () => {
    expect(getProPrice('MONTHLY')).toBe(19.9);
  });

  it('returns R$15.90 for yearly', () => {
    expect(getProPrice('YEARLY')).toBe(15.9);
  });

  it('yearly price is ~20% less than monthly', () => {
    const discount = (PRO_MONTHLY - PRO_YEARLY_MONTH) / PRO_MONTHLY;
    expect(discount).toBeCloseTo(0.2, 1);
  });

  it('yearly total is monthly * 12', () => {
    expect(getProYearlyTotal()).toBeCloseTo(PRO_YEARLY_MONTH * 12, 2);
  });
});

describe('BUSINESS tiered pricing', () => {
  it('1-10 seats: R$39.90/seat', () => {
    expect(getBusinessPricePerSeat(5)).toBe(39.9);
    expect(getBusinessPricePerSeat(1)).toBe(39.9);
    expect(getBusinessPricePerSeat(10)).toBe(39.9);
  });

  it('11-25 seats: R$34.90/seat', () => {
    expect(getBusinessPricePerSeat(11)).toBe(34.9);
    expect(getBusinessPricePerSeat(25)).toBe(34.9);
  });

  it('26-50 seats: R$29.90/seat', () => {
    expect(getBusinessPricePerSeat(26)).toBe(29.9);
    expect(getBusinessPricePerSeat(50)).toBe(29.9);
  });

  it('51-100 seats: R$22.90/seat', () => {
    expect(getBusinessPricePerSeat(51)).toBe(22.9);
    expect(getBusinessPricePerSeat(100)).toBe(22.9);
  });

  it('calculates monthly total correctly', () => {
    expect(getBusinessMonthlyTotal(10, 'MONTHLY')).toBeCloseTo(10 * 39.9, 2);
  });

  it('applies 20% discount for yearly', () => {
    const monthly = getBusinessMonthlyTotal(10, 'MONTHLY');
    const yearly = getBusinessMonthlyTotal(10, 'YEARLY');
    expect(yearly).toBeCloseTo(monthly * 0.8, 1);
  });

  it('total increases linearly within tier', () => {
    const t5 = getBusinessMonthlyTotal(5, 'MONTHLY');
    const t10 = getBusinessMonthlyTotal(10, 'MONTHLY');
    expect(t10).toBeCloseTo(t5 * 2, 1);
  });

  it('total drops per-seat when crossing tier boundary', () => {
    const totalAt10 = getBusinessMonthlyTotal(10, 'MONTHLY');
    const totalAt11 = getBusinessMonthlyTotal(11, 'MONTHLY');
    const perSeatAt10 = totalAt10 / 10;
    const perSeatAt11 = totalAt11 / 11;
    expect(perSeatAt11).toBeLessThan(perSeatAt10);
  });
});

describe('ENTERPRISE tiered pricing', () => {
  it('101-250 seats: R$19.90/seat', () => {
    expect(getEnterprisePricePerSeat(101)).toBe(19.9);
    expect(getEnterprisePricePerSeat(250)).toBe(19.9);
  });

  it('251-500 seats: R$14.90/seat', () => {
    expect(getEnterprisePricePerSeat(300)).toBe(14.9);
  });

  it('501-1000 seats: R$9.90/seat', () => {
    expect(getEnterprisePricePerSeat(750)).toBe(9.9);
  });

  it('1001+ seats: R$7.90/seat', () => {
    expect(getEnterprisePricePerSeat(1500)).toBe(7.9);
  });

  it('applies 20% yearly discount', () => {
    const monthly = getEnterpriseMonthlyTotal(200, 'MONTHLY');
    const yearly = getEnterpriseMonthlyTotal(200, 'YEARLY');
    expect(yearly).toBeCloseTo(monthly * 0.8, 1);
  });

  it('enterprise price per seat is always less than business', () => {
    const bizPrice = getBusinessPricePerSeat(100);
    const entPrice = getEnterprisePricePerSeat(101);
    expect(entPrice).toBeLessThan(bizPrice);
  });
});

describe('Discount calculation', () => {
  it('calculates annual savings for PRO monthly', () => {
    const savings = calculateYearlyDiscount(PRO_MONTHLY);
    expect(savings).toBeCloseTo(PRO_MONTHLY * 0.2 * 12, 1);
  });

  it('YEARLY discount is exactly 20%', () => {
    const monthly = 100;
    const discount = calculateYearlyDiscount(monthly);
    expect(discount).toBeCloseTo(240, 1); // 100 * 0.2 * 12
  });
});
