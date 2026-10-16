import {
  applyWeekendBonus,
  calculateLoyaltyDiscount,
  calculateLoyaltyPoints,
  calculateVolumeDiscount,
  capDiscounts,
} from '../../src/calculators/discounts';
import { Order } from '../../src/models';

function buildOrder(overrides: Partial<Order>): Order {
  return {
    id: 'O1',
    customerId: 'C001',
    productId: 'P001',
    quantity: 1,
    unitPrice: 10,
    date: '2025-01-15',
    promoCode: '',
    time: '12:00',
    ...overrides,
  };
}

describe('calculateVolumeDiscount', () => {
  it.each([
    [50, 0],
    [50.01, 50.01 * 0.05],
    [100, 5],
    [100.01, 100.01 * 0.1],
    [500, 50],
    [500.01, 500.01 * 0.15],
  ])('sous-total %p (BASIC) : remise %p', (subtotal, expected) => {
    expect(calculateVolumeDiscount(subtotal, 'BASIC')).toBeCloseTo(expected, 10);
  });

  it('ne donne le palier 20 % qu\'aux PREMIUM au-dessus de 1000', () => {
    expect(calculateVolumeDiscount(2000, 'PREMIUM')).toBeCloseTo(400);
    expect(calculateVolumeDiscount(2000, 'BASIC')).toBeCloseTo(300);
    expect(calculateVolumeDiscount(1000, 'PREMIUM')).toBeCloseTo(150);
  });

  it('retourne 0 pour un sous-total NaN', () => {
    expect(calculateVolumeDiscount(NaN, 'BASIC')).toBe(0);
  });
});

describe('calculateLoyaltyDiscount', () => {
  it.each([
    [100, 0],
    [200, 20],
    [400, 40],
    [500, 50],
    [600, 90],
    [1000, 100],
  ])('%p points : remise %p', (points, expected) => {
    expect(calculateLoyaltyDiscount(points)).toBeCloseTo(expected, 10);
  });
});

describe('calculateLoyaltyPoints', () => {
  it('cumule 1 % du montant des commandes par client', () => {
    const points = calculateLoyaltyPoints([
      buildOrder({ customerId: 'C001', quantity: 2, unitPrice: 50 }),
      buildOrder({ customerId: 'C001', quantity: 1, unitPrice: 100 }),
      buildOrder({ customerId: 'C002', quantity: 1, unitPrice: 10 }),
    ]);

    expect(points.get('C001')).toBeCloseTo(2);
    expect(points.get('C002')).toBeCloseTo(0.1);
  });

  it('repart de zéro après un total NaN (comportement legacy)', () => {
    const points = calculateLoyaltyPoints([
      buildOrder({ unitPrice: NaN }),
      buildOrder({ quantity: 1, unitPrice: 100 }),
    ]);

    expect(points.get('C001')).toBeCloseTo(1);
  });
});

describe('applyWeekendBonus', () => {
  it('majore la remise de 5 % le samedi et le dimanche', () => {
    expect(applyWeekendBonus(100, '2025-01-18')).toBeCloseTo(105);
    expect(applyWeekendBonus(100, '2025-01-19')).toBeCloseTo(105);
  });

  it('ne change rien en semaine', () => {
    expect(applyWeekendBonus(100, '2025-01-15')).toBe(100);
  });

  it('traite une date absente comme un dimanche (comportement legacy)', () => {
    expect(applyWeekendBonus(100, '')).toBeCloseTo(105);
  });

  it('ne change rien pour une date invalide', () => {
    expect(applyWeekendBonus(100, 'pas-une-date')).toBe(100);
  });
});

describe('capDiscounts', () => {
  it('laisse les remises inchangées sous le plafond', () => {
    expect(capDiscounts(100, 50)).toEqual({ volumeDiscount: 100, loyaltyDiscount: 50, totalDiscount: 150 });
  });

  it('laisse les remises inchangées pile au plafond', () => {
    expect(capDiscounts(150, 50).totalDiscount).toBe(200);
  });

  it('réduit proportionnellement les deux remises au-delà du plafond', () => {
    const capped = capDiscounts(150, 100);

    expect(capped.totalDiscount).toBe(200);
    expect(capped.volumeDiscount).toBeCloseTo(120);
    expect(capped.loyaltyDiscount).toBeCloseTo(80);
  });
});