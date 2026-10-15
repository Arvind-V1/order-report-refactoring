import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadReportData } from '../../src/io/dataLoader';

const HEADER_ONLY_FILES: Record<string, string> = {
  'customers.csv': 'id,name,level,shipping_zone,currency\n',
  'products.csv': 'id,name,category,price,weight,taxable\n',
  'shipping_zones.csv': 'zone,base,per_kg\n',
  'orders.csv': 'id,customer_id,product_id,qty,unit_price,date,promo_code,time\n',
};

function createDataDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'order-report-data-'));
  Object.entries(files).forEach(([name, content]) => fs.writeFileSync(path.join(dir, name), content));
  return dir;
}

describe('loadReportData', () => {
  it('traite un fichier promotions absent comme une liste vide', () => {
    const data = loadReportData(createDataDir(HEADER_ONLY_FILES));

    expect(data.promotions.size).toBe(0);
  });

  it('remonte une erreur si un fichier obligatoire est absent', () => {
    const { 'orders.csv': _omitted, ...withoutOrders } = HEADER_ONLY_FILES;

    expect(() => loadReportData(createDataDir(withoutOrders))).toThrow();
  });
});