import { formatReport } from '../../src/report/textFormatter';
import { buildReportFixture } from '../helpers/builders';

describe('formatReport', () => {
  it('formate un client sans bonus ni frais de gestion', () => {
    const expected = [
      'Customer: Alice (C001)',
      'Level: BASIC | Zone: ZONE1 | Currency: EUR',
      'Subtotal: 100.00',
      'Discount: 5.00',
      '  - Volume discount: 5.00',
      '  - Loyalty discount: 0.00',
      'Tax: 19.00',
      'Shipping (ZONE1, 3.0kg): 0.00',
      'Total: 114.00 EUR',
      'Loyalty Points: 1',
      '',
      'Grand Total: 114.00 EUR',
      'Total Tax Collected: 19.00 EUR',
    ].join('\n');

    expect(formatReport([buildReportFixture()])).toBe(expected);
  });

  it('affiche le bonus matin seulement s\'il est positif', () => {
    expect(formatReport([buildReportFixture({ morningBonus: 3.214 })])).toContain(
      '  - Loyalty discount: 0.00\n  - Morning bonus: 3.21\nTax: 19.00',
    );
    expect(formatReport([buildReportFixture()])).not.toContain('Morning bonus');
  });

  it('affiche les frais de gestion seulement s\'ils sont positifs', () => {
    const output = formatReport([buildReportFixture({ handling: 2.5, itemCount: 12 })]);

    expect(output).toContain('Shipping (ZONE1, 3.0kg): 0.00\nHandling (12 items): 2.50\nTotal:');
    expect(formatReport([buildReportFixture()])).not.toContain('Handling');
  });

  it('additionne les totaux et taxes de tous les clients', () => {
    const output = formatReport([
      buildReportFixture({ total: 100, tax: 10 }),
      buildReportFixture({ customerId: 'C002', total: 50.5, tax: 5.25 }),
    ]);

    expect(output).toContain('Grand Total: 150.50 EUR\nTotal Tax Collected: 15.25 EUR');
  });

  it('retourne seulement le récapitulatif sans client', () => {
    expect(formatReport([])).toBe('Grand Total: 0.00 EUR\nTotal Tax Collected: 0.00 EUR');
  });
}); 