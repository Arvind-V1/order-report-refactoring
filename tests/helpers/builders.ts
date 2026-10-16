import { Order, Product, Promotion } from '../../src/models';

export function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'O1',
    customerId: 'C001',
    productId: 'P1',
    quantity: 1,
    unitPrice: 10,
    date: '2025-01-15',
    promoCode: '',
    time: '14:30',
    ...overrides,
  };
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return { id: 'P1', name: 'Produit', category: 'Cat', price: 10, weight: 1, taxable: true, ...overrides };
}

export function buildPromotion(overrides: Partial<Promotion> = {}): Promotion {
  return { code: 'PROMO', type: 'PERCENTAGE', value: 10, active: true, ...overrides };
}