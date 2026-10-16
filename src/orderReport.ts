import { aggregateOrdersByCustomer, sortByCustomerId } from './aggregation/customerTotals';
import { calculateLoyaltyPoints } from './calculators/discounts';
import { ReportData } from './models';
import { buildCustomerReport } from './report/customerReport';
import { JsonExportEntry, toJsonExport } from './report/jsonExport';
import { formatReport } from './report/textFormatter';

export interface GeneratedReport {
  text: string;
  json: JsonExportEntry[];
}

export function generateReport(data: ReportData): GeneratedReport {
  const loyaltyPoints = calculateLoyaltyPoints(data.orders);
  const customerTotals = aggregateOrdersByCustomer(data.orders, data.products, data.promotions);

  const reports = sortByCustomerId(customerTotals).map(([customerId, totals]) =>
    buildCustomerReport({
      customerId,
      totals,
      customer: data.customers.get(customerId),
      rawLoyaltyPoints: loyaltyPoints.get(customerId) || 0,
      products: data.products,
      shippingZones: data.shippingZones,
    }),
  );

  return { text: formatReport(reports), json: toJsonExport(reports) };
}