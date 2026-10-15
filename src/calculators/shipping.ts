import { DEFAULT_COST_PER_KG } from '../constants';
import { ShippingZone } from '../models';

const PAID_SHIPPING_BELOW_SUBTOTAL = 50;
const DEFAULT_BASE_COST = 5.0;
const HEAVY_PARCEL_THRESHOLD_KG = 10;
const MEDIUM_PARCEL_THRESHOLD_KG = 5;
const MEDIUM_PARCEL_COST_PER_KG = 0.3;
const REMOTE_ZONES = ['ZONE3', 'ZONE4'];
const REMOTE_ZONE_MULTIPLIER = 1.2;
const FREE_SHIPPING_MAX_WEIGHT_KG = 20;
const OVERWEIGHT_COST_PER_KG = 0.25;

type ShippingRate = Pick<ShippingZone, 'baseCost' | 'costPerKg'>;

const DEFAULT_RATE: ShippingRate = { baseCost: DEFAULT_BASE_COST, costPerKg: DEFAULT_COST_PER_KG };

function calculateWeightBasedCost(weightKg: number, rate: ShippingRate): number {
  if (weightKg > HEAVY_PARCEL_THRESHOLD_KG) {
    return rate.baseCost + (weightKg - HEAVY_PARCEL_THRESHOLD_KG) * rate.costPerKg;
  }
  if (weightKg > MEDIUM_PARCEL_THRESHOLD_KG) {
    return rate.baseCost + (weightKg - MEDIUM_PARCEL_THRESHOLD_KG) * MEDIUM_PARCEL_COST_PER_KG;
  }
  return rate.baseCost;
}

function calculatePaidShipping(weightKg: number, zoneName: string, rate: ShippingRate): number {
  const cost = calculateWeightBasedCost(weightKg, rate);
  return REMOTE_ZONES.includes(zoneName) ? cost * REMOTE_ZONE_MULTIPLIER : cost;
}

/** Livraison offerte au-delà du seuil, mais colis très lourds surtaxés. */
function calculateOverweightSurcharge(weightKg: number): number {
  return weightKg > FREE_SHIPPING_MAX_WEIGHT_KG
    ? (weightKg - FREE_SHIPPING_MAX_WEIGHT_KG) * OVERWEIGHT_COST_PER_KG
    : 0;
}

export function calculateShipping(
  subtotal: number,
  weightKg: number,
  zoneName: string,
  zone: ShippingRate | undefined,
): number {
  if (subtotal < PAID_SHIPPING_BELOW_SUBTOTAL) {
    return calculatePaidShipping(weightKg, zoneName, zone ?? DEFAULT_RATE);
  }
  return calculateOverweightSurcharge(weightKg);
}