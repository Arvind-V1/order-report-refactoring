import { calculateTax } from '../../src/calculators/tax';
import { Order, Product } from '../../src/models';

function buildProduct(overrides: Partial<Product>): Product {
  return { id: 'P1', name: 'Produit', category: 'Cat', price: 10, weight: 1, taxable: true, ...overrides };
}

function buildOrder(overrides: Partial<Order>): Order {
  return {
    id: 'O1',
    customerId: 'C001',
    productId: 'P1',
    quantity: 1,
    unitPrice: 10,
    date: '2025-01-15',
    promoCode: '',
    time: '12:00',
    ...overrides,
  };
}

function indexProducts(...products: Product[]): Map<string, Product> {
  return new Map(products.map((product) => [product.id, product]));
}

describe('calculateTax', () => {
  it('applique 20 % sur le montant remisé quand tout est taxable', () => {
    const products = indexProducts(buildProduct({ id: 'P1' }));

    expect(calculateTax(100, [buildOrder({})], products)).toBe(20);
  });

  it('arrondit au centime', () => {
    const products = indexProducts(buildProduct({ id: 'P1' }));

    expect(calculateTax(33.33, [buildOrder({})], products)).toBe(6.67);
  });

  it("ne taxe que les lignes taxables si un produit ne l'est pas", () => {
    const products = indexProducts(
      buildProduct({ id: 'P1', price: 10 }),
      buildProduct({ id: 'P2', price: 100, taxable: false }),
    );
    const items = [buildOrder({ productId: 'P1', quantity: 2 }), buildOrder({ productId: 'P2' })];

    expect(calculateTax(999, items, products)).toBe(4);
  });

  it('taxe le montant global si les produits sont inconnus', () => {
    expect(calculateTax(100, [buildOrder({ productId: 'P9' })], new Map())).toBe(20);
  });

  it('ignore les produits inconnus en mode ligne à ligne', () => {
    const products = indexProducts(buildProduct({ id: 'P2', taxable: false }));
    const items = [buildOrder({ productId: 'P2' }), buildOrder({ productId: 'P9' })];

    expect(calculateTax(100, items, products)).toBe(0);
  });

  it('retombe sur le prix de la commande quand le prix produit est 0', () => {
    const products = indexProducts(
      buildProduct({ id: 'P1', price: 0 }),
      buildProduct({ id: 'P2', taxable: false }),
    );
    const items = [
      buildOrder({ productId: 'P1', quantity: 1, unitPrice: 50 }),
      buildOrder({ productId: 'P2' }),
    ];

    expect(calculateTax(100, items, products)).toBe(10);
  });
});
