import * as fs from 'fs';
import * as path from 'path';
import { ReportData } from '../models';
import {
  parseCustomers,
  parseOrders,
  parseProducts,
  parsePromotions,
  parseShippingZones,
} from '../parsing/parsers';

const CUSTOMERS_FILE = 'customers.csv';
const ORDERS_FILE = 'orders.csv';
const PRODUCTS_FILE = 'products.csv';
const SHIPPING_ZONES_FILE = 'shipping_zones.csv';
const PROMOTIONS_FILE = 'promotions.csv';

function readCsv(dataDir: string, fileName: string): string {
  return fs.readFileSync(path.join(dataDir, fileName), 'utf-8');
}

function isFileNotFound(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT';
}

/** Le fichier des promotions est facultatif : absent, on considère qu'il n'y a aucune promotion. */
function readOptionalCsv(dataDir: string, fileName: string): string {
  try {
    return readCsv(dataDir, fileName);
  } catch (error) {
    if (isFileNotFound(error)) {
      return '';
    }
    throw error;
  }
}

export function loadReportData(dataDir: string): ReportData {
  return {
    customers: parseCustomers(readCsv(dataDir, CUSTOMERS_FILE)),
    products: parseProducts(readCsv(dataDir, PRODUCTS_FILE)),
    shippingZones: parseShippingZones(readCsv(dataDir, SHIPPING_ZONES_FILE)),
    promotions: parsePromotions(readOptionalCsv(dataDir, PROMOTIONS_FILE)),
    orders: parseOrders(readCsv(dataDir, ORDERS_FILE)),
  };
}
