import { aggregateOrdersByCustomer, sortByCustomerId } from '../../src/aggregation/customerTotals';
import { buildOrder, buildProduct, buildPromotion } from '../helpers/builders';

const PRODUCTS = new Map([['P1', buildProduct({ id: 'P1', price: 10, weight: 2 })]]);

describe('aggregateOrdersByCustomer', () => {
  it('retourne une map vide sans commande', () => {
    expect(aggregateOrdersByCustomer([], PRODUCTS, new Map()).size).toBe(0);
  });

  it('cumule sous-total, poids et lignes par client', () => {
    const orders = [
      buildOrder({ id: 'O1', customerId: 'C001', quantity: 1 }),
      buildOrder({ id: 'O2', customerId: 'C001', quantity: 2 }),
      buildOrder({ id: 'O3', customerId: 'C002', quantity: 5 }),
    ];

    const totals = aggregateOrdersByCustomer(orders, PRODUCTS, new Map());

    expect(totals.get('C001')).toMatchObject({ subtotal: 30, weightKg: 6, morningBonus: 0 });
    expect(totals.get('C001')?.items).toHaveLength(2);
    expect(totals.get('C002')).toMatchObject({ subtotal: 50, weightKg: 10 });
  });

  it('applique la promotion désignée par le code de la commande', () => {
    const promotions = new Map([['PROMO', buildPromotion({ code: 'PROMO', value: 50 })]]);
    const orders = [buildOrder({ promoCode: 'PROMO' }), buildOrder({ promoCode: 'INCONNU' })];

    const totals = aggregateOrdersByCustomer(orders, PRODUCTS, promotions);

    expect(totals.get('C001')?.subtotal).toBeCloseTo(15);
  });

  it('cumule le bonus matin du client', () => {
    const orders = [
      buildOrder({ time: '09:00' }),
      buildOrder({ time: '09:30' }),
      buildOrder({ time: '15:00' }),
    ];

    expect(aggregateOrdersByCustomer(orders, PRODUCTS, new Map()).get('C001')?.morningBonus).toBeCloseTo(0.6);
  });
});

describe('sortByCustomerId', () => {
  it('trie par identifiant client', () => {
    const totals = aggregateOrdersByCustomer(
      [
        buildOrder({ customerId: 'C010' }),
        buildOrder({ customerId: 'C002' }),
        buildOrder({ customerId: 'C001' }),
      ],
      PRODUCTS,
      new Map(),
    );

    expect(sortByCustomerId(totals).map(([id]) => id)).toEqual(['C001', 'C002', 'C010']);
  });
});
