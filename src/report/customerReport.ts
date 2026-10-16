import { CustomerTotals } from '../aggregation/customerTotals';
import {
  applyWeekendBonus,
  calculateLoyaltyDiscount,
  calculateVolumeDiscount,
  capDiscounts,
  DiscountBreakdown,
} from '../calculators/discounts';
import { calculateHandlingFee } from '../calculators/handling';
import { getCurrencyRate, roundToCents } from '../calculators/money';
import { calculateShipping } from '../calculators/shipping';
import { calculateTax } from '../calculators/tax';
import { DEFAULT_CURRENCY, DEFAULT_CUSTOMER_LEVEL, DEFAULT_SHIPPING_ZONE } from '../constants';
import { Customer, Product, ShippingZone } from '../models';

const UNKNOWN_CUSTOMER_NAME = 'Unknown';

export interface CustomerReport {
  customerId: string;
  name: string;
  level: string;
  zone: string;
  currency: string;
  subtotal: number;
  totalDiscount: number;
  volumeDiscount: number;
  loyaltyDiscount: number;
  morningBonus: number;
  /** Taxe déjà convertie dans la devise du client. */
  tax: number;
  shipping: number;
  weightKg: number;
  handling: number;
  itemCount: number;
  total: number;
  loyaltyPoints: number;
}

export interface CustomerReportInput {
  customerId: string;
  customer: Customer | undefined;
  totals: CustomerTotals;
  rawLoyaltyPoints: number;
  products: Map<string, Product>;
  shippingZones: Map<string, ShippingZone>;
}

interface CustomerProfile {
  name: string;
  level: string;
  zone: string;
  currency: string;
}

/** Un client absent du fichier des clients reçoit les valeurs par défaut. */
function resolveProfile(customer: Customer | undefined): CustomerProfile {
  return {
    name: customer?.name || UNKNOWN_CUSTOMER_NAME,
    level: customer?.level || DEFAULT_CUSTOMER_LEVEL,
    zone: customer?.shippingZone || DEFAULT_SHIPPING_ZONE,
    currency: customer?.currency || DEFAULT_CURRENCY,
  };
}

function calculateDiscounts(
  totals: CustomerTotals,
  level: string,
  rawLoyaltyPoints: number,
): DiscountBreakdown {
  const firstOrderDate = totals.items[0]?.date || '';
  const volumeDiscount = applyWeekendBonus(calculateVolumeDiscount(totals.subtotal, level), firstOrderDate);
  return capDiscounts(volumeDiscount, calculateLoyaltyDiscount(rawLoyaltyPoints));
}

export function buildCustomerReport(input: CustomerReportInput): CustomerReport {
  const { customerId, totals, products, shippingZones, rawLoyaltyPoints } = input;
  const { name, level, zone, currency } = resolveProfile(input.customer);

  const discounts = calculateDiscounts(totals, level, rawLoyaltyPoints);
  const taxableAmount = totals.subtotal - discounts.totalDiscount;
  const tax = calculateTax(taxableAmount, totals.items, products);
  const shipping = calculateShipping(totals.subtotal, totals.weightKg, zone, shippingZones.get(zone));
  const itemCount = totals.items.length;
  const handling = calculateHandlingFee(itemCount);
  const currencyRate = getCurrencyRate(currency);

  return {
    customerId,
    name,
    level,
    zone,
    currency,
    subtotal: totals.subtotal,
    totalDiscount: discounts.totalDiscount,
    volumeDiscount: discounts.volumeDiscount,
    loyaltyDiscount: discounts.loyaltyDiscount,
    morningBonus: totals.morningBonus,
    tax: tax * currencyRate,
    shipping,
    weightKg: totals.weightKg,
    handling,
    itemCount,
    total: roundToCents((taxableAmount + tax + shipping + handling) * currencyRate),
    loyaltyPoints: Math.floor(rawLoyaltyPoints),
  };
}
