import { CustomerTotals } from '../../src/aggregation/customerTotals';
import { Customer } from '../../src/models';
import { buildCustomerReport, CustomerReportInput } from '../../src/report/customerReport';
import { buildOrder, buildProduct } from '../helpers/builders';

const CUSTOMER: Customer = { id: 'C001', name: 'Alice', level: 'BASIC', shippingZone: 'ZONE1', currency: 'EUR' };

function buildTotals(overrides: Partial<CustomerTotals> = {}): CustomerTotals {
  return { subtotal: 100, weightKg: 3, morningBonus: 0, items: [buildOrder()], ...overrides };
}

function buildInput(overrides: Partial<CustomerReportInput> = {}): CustomerReportInput {
  return {
    customerId: 'C001',
    customer: CUSTOMER,
    totals: buildTotals(),
    rawLoyaltyPoints: 0,
    products: new Map([['P1', buildProduct()]]),
    shippingZones: new Map(),
    ...overrides,
  };
}

describe('buildCustomerReport', () => {
  it('calcule remise, taxe, port et total pour un client standard', () => {
    const report = buildCustomerReport(buildInput());

    expect(report.totalDiscount).toBeCloseTo(5);
    expect(report.tax).toBeCloseTo(19);
    expect(report.shipping).toBe(0);
    expect(report.total).toBeCloseTo(114);
  });

  it('applique les valeurs par défaut à un client inconnu', () => {
    const report = buildCustomerReport(buildInput({ customer: undefined }));

    expect(report).toMatchObject({ name: 'Unknown', level: 'BASIC', zone: 'ZONE1', currency: 'EUR' });
  });

  it('convertit le total et la taxe pour une devise reconnue', () => {
    const report = buildCustomerReport(buildInput({ customer: { ...CUSTOMER, currency: 'USD' } }));

    expect(report.tax).toBeCloseTo(20.9);
    expect(report.total).toBeCloseTo(125.4);
  });

  it('ne convertit pas une devise suivie de \\r (bug legacy préservé)', () => {
    const report = buildCustomerReport(buildInput({ customer: { ...CUSTOMER, currency: 'USD\r' } }));

    expect(report.total).toBeCloseTo(114);
  });

  it('arrondit les points de fidélité à l\'entier inférieur', () => {
    expect(buildCustomerReport(buildInput({ rawLoyaltyPoints: 12.9 })).loyaltyPoints).toBe(12);
  });

  it('ajoute des frais de gestion au-delà de 10 articles', () => {
    const items = Array.from({ length: 11 }, () => buildOrder());

    expect(buildCustomerReport(buildInput({ totals: buildTotals({ items }) })).handling).toBe(2.5);
  });
});