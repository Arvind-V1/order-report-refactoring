import { getCurrencyRate, roundToCents } from '../../src/calculators/money';

describe('roundToCents', () => {
  it('arrondit à 2 décimales', () => {
    expect(roundToCents(2.346)).toBe(2.35);
    expect(roundToCents(2.344)).toBe(2.34);
  });
});

describe('getCurrencyRate', () => {
  it.each([
    ['EUR', 1],
    ['USD', 1.1],
    ['GBP', 0.85],
    ['JPY', 1],
  ])('%s : taux %p', (currency, expected) => {
    expect(getCurrencyRate(currency)).toBe(expected);
  });

  it('ne reconnaît pas un code suivi de \\r (bug legacy préservé)', () => {
    expect(getCurrencyRate('USD\r')).toBe(1);
  });

  it('ne se laisse pas piéger par un nom de propriété d\'objet', () => {
    expect(getCurrencyRate('constructor')).toBe(1);
  });
});