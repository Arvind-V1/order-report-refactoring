import { CustomerReport } from './customerReport';

const JSON_INDENTATION = 2;

export interface JsonExportEntry {
  customer_id: string;
  name: string;
  total: number;
  currency: string;
  loyalty_points: number;
}

export function toJsonExport(reports: CustomerReport[]): JsonExportEntry[] {
  return reports.map((report) => ({
    customer_id: report.customerId,
    name: report.name,
    total: report.total,
    currency: report.currency,
    loyalty_points: report.loyaltyPoints,
  }));
}

export function serializeJsonExport(entries: JsonExportEntry[]): string {
  return JSON.stringify(entries, null, JSON_INDENTATION);
}
