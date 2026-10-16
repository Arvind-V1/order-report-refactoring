import * as fs from 'fs';
import { loadReportData } from './io/dataLoader';
import { calculateHandlingFee } from './calculators/handling';
import { getCurrencyRate, roundToCents } from './calculators/money';
import { calculateShipping } from './calculators/shipping';
import { calculateTax } from './calculators/tax';
import { aggregateOrdersByCustomer, sortByCustomerId } from './aggregation/customerTotals';

import {
  applyWeekendBonus,
  calculateLoyaltyDiscount,
  calculateLoyaltyPoints,
  calculateVolumeDiscount,
  capDiscounts,
} from './calculators/discounts';

// Fonction principale qui fait TOUT
export function run(dataDir: string, jsonOutputPath: string): string {
    const { customers, products, shippingZones, promotions, orders } = loadReportData(dataDir);

    const loyaltyPoints = calculateLoyaltyPoints(orders);

    const customerTotals = aggregateOrdersByCustomer(orders, products, promotions);

    // Génération du rapport (mélange calculs + formatage + I/O)
    const outputLines: string[] = [];
    const jsonData: any[] = [];
    let grandTotal = 0.0;
    let totalTaxCollected = 0.0;

    // Tri par ID client (comportement à préserver)
    for (const [cid, totals] of sortByCustomerId(customerTotals)) {
        const cust = customers.get(cid);
        const name = cust?.name || 'Unknown';
        const level = cust?.level || 'BASIC';
        const zone = cust?.shippingZone || 'ZONE1'; 
        const currency = cust?.currency || 'EUR';

        const sub = totals.subtotal;

        const firstOrderDate = totals.items[0]?.date || '';

        const pts = loyaltyPoints.get(cid) || 0;

        const { volumeDiscount, loyaltyDiscount, totalDiscount } = capDiscounts(
            applyWeekendBonus(calculateVolumeDiscount(sub, level), firstOrderDate),
            calculateLoyaltyDiscount(pts),
        );
        const taxableAmount = sub - totalDiscount;
        const items = totals.items;
        const weight = totals.weightKg;
        const itemCount = items.length;

        const tax = calculateTax(taxableAmount, items, products);
        const ship = calculateShipping(sub, weight, zone, shippingZones.get(zone));
        const handling = calculateHandlingFee(itemCount);
        const currencyRate = getCurrencyRate(currency);

        const total = roundToCents((taxableAmount + tax + ship + handling) * currencyRate);
        grandTotal += total;
        totalTaxCollected += tax * currencyRate;

      
        outputLines.push(`Customer: ${name} (${cid})`);
        outputLines.push(`Level: ${level} | Zone: ${zone} | Currency: ${currency}`);
        outputLines.push(`Subtotal: ${sub.toFixed(2)}`);
        outputLines.push(`Discount: ${totalDiscount.toFixed(2)}`);
        outputLines.push(`  - Volume discount: ${volumeDiscount.toFixed(2)}`);
        outputLines.push(`  - Loyalty discount: ${loyaltyDiscount.toFixed(2)}`);
        if (totals.morningBonus > 0) {
            outputLines.push(`  - Morning bonus: ${totals.morningBonus.toFixed(2)}`);
        }
        outputLines.push(`Tax: ${(tax * currencyRate).toFixed(2)}`);
        outputLines.push(`Shipping (${zone}, ${weight.toFixed(1)}kg): ${ship.toFixed(2)}`);
        if (handling > 0) {
            outputLines.push(`Handling (${itemCount} items): ${handling.toFixed(2)}`);
        }
        outputLines.push(`Total: ${total.toFixed(2)} ${currency}`);
        outputLines.push(`Loyalty Points: ${Math.floor(pts)}`);
        outputLines.push('');

        // Export JSON en parallèle (side effect)
        jsonData.push({
            customer_id: cid,
            name: name,
            total: total,
            currency: currency,
            loyalty_points: Math.floor(pts)
        });
    }

    outputLines.push(`Grand Total: ${grandTotal.toFixed(2)} EUR`);
    outputLines.push(`Total Tax Collected: ${totalTaxCollected.toFixed(2)} EUR`);

    const result = outputLines.join('\n');

    // Side effects: print + file write
    console.log(result);

    // Export JSON surprise
    jsonOutputPath
    fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonData, null, 2));

    return result;
}

