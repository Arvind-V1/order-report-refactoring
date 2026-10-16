import { calculateShipping } from '../../src/calculators/shipping';

const ZONE2 = { baseCost: 7.5, costPerKg: 0.6 };

describe('calculateShipping sous le seuil de livraison offerte', () => {
  it.each([
    [3, 5],
    [5, 5],
    [7, 5.6],
    [10, 6.5],
    [12, 6],
  ])('colis de %p kg (tarif par défaut) : %p', (weight, expected) => {
    expect(calculateShipping(49.99, weight, 'ZONE1', undefined)).toBeCloseTo(expected, 10);
  });

  it('utilise le tarif de la zone fournie', () => {
    expect(calculateShipping(10, 12, 'ZONE2', ZONE2)).toBeCloseTo(8.7, 10);
  });

  it('majore de 20 % les zones éloignées', () => {
    expect(calculateShipping(10, 3, 'ZONE3', undefined)).toBeCloseTo(6, 10);
    expect(calculateShipping(10, 3, 'ZONE4', undefined)).toBeCloseTo(6, 10);
  });
});

describe('calculateShipping à partir du seuil de livraison offerte', () => {
  it('est gratuit jusqu\'à 20 kg', () => {
    expect(calculateShipping(50, 20, 'ZONE1', undefined)).toBe(0);
  });

  it('surtaxe 0.25 par kg au-delà de 20 kg', () => {
    expect(calculateShipping(50, 30, 'ZONE1', undefined)).toBeCloseTo(2.5, 10);
  });
});