import { CustomerReport } from './customerReport';

const SUMMARY_CURRENCY = 'EUR';

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function formatCustomerLines(report: CustomerReport): string[] {
  const lines = [
    `Customer: ${report.name} (${report.customerId})`,
    `Level: ${report.level} | Zone: ${report.zone} | Currency: ${report.currency}`,
    `Subtotal: ${formatAmount(report.subtotal)}`,
    `Discount: ${formatAmount(report.totalDiscount)}`,
    `  - Volume discount: ${formatAmount(report.volumeDiscount)}`,
    `  - Loyalty discount: ${formatAmount(report.loyaltyDiscount)}`,
  ];
  if (report.morningBonus > 0) {
    lines.push(`  - Morning bonus: ${formatAmount(report.morningBonus)}`);
  }
  lines.push(
    `Tax: ${formatAmount(report.tax)}`,
    `Shipping (${report.zone}, ${report.weightKg.toFixed(1)}kg): ${formatAmount(report.shipping)}`,
  );
  if (report.handling > 0) {
    lines.push(`Handling (${report.itemCount} items): ${formatAmount(report.handling)}`);
  }
  lines.push(
    `Total: ${formatAmount(report.total)} ${report.currency}`,
    `Loyalty Points: ${report.loyaltyPoints}`,
    '',
  );
  return lines;
}

function sum(values: number[]): number {
  return values.reduce((accumulated, value) => accumulated + value, 0);
}

function formatSummaryLines(reports: CustomerReport[]): string[] {
  const grandTotal = sum(reports.map((report) => report.total));
  const totalTaxCollected = sum(reports.map((report) => report.tax));
  return [
    `Grand Total: ${formatAmount(grandTotal)} ${SUMMARY_CURRENCY}`,
    `Total Tax Collected: ${formatAmount(totalTaxCollected)} ${SUMMARY_CURRENCY}`,
  ];
}

export function formatReport(reports: CustomerReport[]): string {
  return [...reports.flatMap(formatCustomerLines), ...formatSummaryLines(reports)].join('\n');
}
