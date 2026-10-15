import { PREMIUM_LEVEL } from '../constants';
import { Order } from '../models';

const LOYALTY_POINTS_RATIO = 0.01;
const MAX_TOTAL_DISCOUNT = 200;
const WEEKEND_DISCOUNT_MULTIPLIER = 1.05;
const SUNDAY = 0;
const SATURDAY = 6;

interface VolumeTier {
  threshold: number;
  rate: number;
  premiumOnly?: boolean;
}

interface LoyaltyTier {
  pointsThreshold: number;
  rate: number;
  maxDiscount: number;
}

/** Du palier le plus élevé au plus bas : le premier palier dépassé s'applique. */
const VOLUME_TIERS: VolumeTier[] = [
  { threshold: 1000, rate: 0.2, premiumOnly: true },
  { threshold: 500, rate: 0.15 },
  { threshold: 100, rate: 0.1 },
  { threshold: 50, rate: 0.05 },
];

const LOYALTY_TIERS: LoyaltyTier[] = [
  { pointsThreshold: 500, rate: 0.15, maxDiscount: 100 },
  { pointsThreshold: 100, rate: 0.1, maxDiscount: 50 },
];

export interface DiscountBreakdown {
  volumeDiscount: number;
  loyaltyDiscount: number;
  totalDiscount: number;
}

export function calculateLoyaltyPoints(orders: Order[]): Map<string, number> {
  const pointsByCustomer = new Map<string, number>();
  for (const order of orders) {
    // `|| 0` reproduit le legacy : un total NaN repart de zéro à la commande suivante
    const currentPoints = pointsByCustomer.get(order.customerId) || 0;
    pointsByCustomer.set(
      order.customerId,
      currentPoints + order.quantity * order.unitPrice * LOYALTY_POINTS_RATIO,
    );
  }
  return pointsByCustomer;
}

export function calculateVolumeDiscount(subtotal: number, customerLevel: string): number {
  const tier = VOLUME_TIERS.find(
    (candidate) =>
      subtotal > candidate.threshold && (!candidate.premiumOnly || customerLevel === PREMIUM_LEVEL),
  );
  return tier ? subtotal * tier.rate : 0;
}

export function calculateLoyaltyDiscount(loyaltyPoints: number): number {
  const tier = LOYALTY_TIERS.find((candidate) => loyaltyPoints > candidate.pointsThreshold);
  return tier ? Math.min(loyaltyPoints * tier.rate, tier.maxDiscount) : 0;
}

/** Une date absente est traitée comme un dimanche, comme dans le legacy. */
function isWeekend(date: string): boolean {
  const dayOfWeek = date ? new Date(date).getDay() : SUNDAY;
  return dayOfWeek === SUNDAY || dayOfWeek === SATURDAY;
}

export function applyWeekendBonus(volumeDiscount: number, firstOrderDate: string): number {
  return isWeekend(firstOrderDate) ? volumeDiscount * WEEKEND_DISCOUNT_MULTIPLIER : volumeDiscount;
}

/** Au-delà du plafond, les deux remises sont réduites proportionnellement. */
export function capDiscounts(volumeDiscount: number, loyaltyDiscount: number): DiscountBreakdown {
  const uncappedTotal = volumeDiscount + loyaltyDiscount;
  if (uncappedTotal > MAX_TOTAL_DISCOUNT) {
    const ratio = MAX_TOTAL_DISCOUNT / uncappedTotal;
    return {
      volumeDiscount: volumeDiscount * ratio,
      loyaltyDiscount: loyaltyDiscount * ratio,
      totalDiscount: MAX_TOTAL_DISCOUNT,
    };
  }
  return { volumeDiscount, loyaltyDiscount, totalDiscount: uncappedTotal };
}