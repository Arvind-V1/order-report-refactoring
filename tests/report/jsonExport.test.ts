import { serializeJsonExport, toJsonExport } from '../../src/report/jsonExport';
import { buildReportFixture } from '../helpers/builders';

describe('toJsonExport', () => {
  it('reprend les champs historiques dans cet ordre', () => {
    const [entry] = toJsonExport([buildReportFixture()]);

    expect(Object.keys(entry)).toEqual(['customer_id', 'name', 'total', 'currency', 'loyalty_points']);
    expect(entry).toEqual({ customer_id: 'C001', name: 'Alice', total: 114, currency: 'EUR', loyalty_points: 1 });
  });
});

describe('serializeJsonExport', () => {
  it('indente sur 2 espaces', () => {
    expect(serializeJsonExport([{ customer_id: 'C001', name: 'A', total: 1, currency: 'EUR', loyalty_points: 0 }]))
      .toBe('[\n  {\n    "customer_id": "C001",\n    "name": "A",\n    "total": 1,\n    "currency": "EUR",\n    "loyalty_points": 0\n  }\n]');
  });

  it('sérialise une liste vide', () => {
    expect(serializeJsonExport([])).toBe('[]');
  });
});