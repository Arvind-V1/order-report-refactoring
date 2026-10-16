import { Order, Product, Promotion } from '../../src/models';
import { CustomerReport } from '../../src/report/customerReport';

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

export function buildReportFixture(overrides: Partial<CustomerReport> = {}): CustomerReport {
  return {
    customerId: 'C001',
    name: 'Alice',
    level: 'BASIC',
    zone: 'ZONE1',
    currency: 'EUR',
    subtotal: 100,
    totalDiscount: 5,
    volumeDiscount: 5,
    loyaltyDiscount: 0,
    morningBonus: 0,
    tax: 19,
    shipping: 0,
    weightKg: 3,
    handling: 0,
    itemCount: 1,
    total: 114,
    loyaltyPoints: 1,
    ...overrides,
  };
}