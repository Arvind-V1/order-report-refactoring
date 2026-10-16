import { priceOrderLine } from '../../src/calculators/orderLine';
import { buildOrder, buildProduct, buildPromotion } from '../helpers/builders';

describe('priceOrderLine', () => {
  it('multiplie la quantité par le prix du produit, sans promo', () => {
    const line = priceOrderLine(buildOrder({ quantity: 2 }), buildProduct({ price: 15 }), undefined);

    expect(line.total).toBe(30);
    expect(line.morningBonus).toBe(0);
  });

  it('retombe sur le prix de la commande et un poids de 1 kg pour un produit inconnu', () => {
    const line = priceOrderLine(buildOrder({ quantity: 3, unitPrice: 8 }), undefined, undefined);

    expect(line.total).toBe(24);
    expect(line.weightKg).toBe(3);
  });

  it('calcule le poids avec celui du produit', () => {
    const line = priceOrderLine(buildOrder({ quantity: 4 }), buildProduct({ weight: 2.5 }), undefined);

    expect(line.weightKg).toBe(10);
  });

  it('remplace un poids nul par 1 kg (comportement legacy)', () => {
    const line = priceOrderLine(buildOrder({ quantity: 2 }), buildProduct({ weight: 0 }), undefined);

    expect(line.weightKg).toBe(2);
  });

  it('applique une promotion en pourcentage', () => {
    const promotion = buildPromotion({ type: 'PERCENTAGE', value: 10 });

    expect(priceOrderLine(buildOrder({ quantity: 2 }), buildProduct({ price: 50 }), promotion).total).toBeCloseTo(90);
  });

  it('déduit une promotion fixe par unité et non par ligne (bug legacy préservé)', () => {
    const promotion = buildPromotion({ type: 'FIXED', value: 2 });

    expect(priceOrderLine(buildOrder({ quantity: 3 }), buildProduct({ price: 10 }), promotion).total).toBe(24);
  });

  it('ignore une promotion inactive ou de type inconnu', () => {
    const product = buildProduct({ price: 10 });

    expect(priceOrderLine(buildOrder(), product, buildPromotion({ active: false })).total).toBe(10);
    expect(priceOrderLine(buildOrder(), product, buildPromotion({ type: 'BOGO' })).total).toBe(10);
  });

  it('accorde 3 % de remise supplémentaire avant 10 h', () => {
    const line = priceOrderLine(buildOrder({ time: '09:59' }), buildProduct({ price: 100 }), undefined);

    expect(line.morningBonus).toBeCloseTo(3);
    expect(line.total).toBeCloseTo(97);
  });

  it('n\'accorde pas le bonus matin à partir de 10 h', () => {
    expect(priceOrderLine(buildOrder({ time: '10:00' }), buildProduct(), undefined).morningBonus).toBe(0);
  });

  it('applique le bonus matin après la promotion', () => {
    const promotion = buildPromotion({ value: 50 });
    const line = priceOrderLine(buildOrder({ time: '08:00' }), buildProduct({ price: 100 }), promotion);

    expect(line.morningBonus).toBeCloseTo(1.5);
    expect(line.total).toBeCloseTo(48.5);
  });
});