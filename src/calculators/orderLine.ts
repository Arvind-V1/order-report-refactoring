import { DEFAULT_PRODUCT_WEIGHT_KG } from '../constants';
import { Order, Product, Promotion } from '../models';

const PERCENTAGE_PROMOTION = 'PERCENTAGE';
const FIXED_PROMOTION = 'FIXED';
const PERCENT_DIVISOR = 100;
const MORNING_HOUR_LIMIT = 10;
const MORNING_BONUS_RATE = 0.03;

export interface PricedOrderLine {
  total: number;
  morningBonus: number;
  weightKg: number;
}

interface PromotionEffect {
  rate: number;
  fixedAmountPerUnit: number;
}

const NO_PROMOTION_EFFECT: PromotionEffect = { rate: 0, fixedAmountPerUnit: 0 };

function resolvePromotionEffect(promotion: Promotion | undefined): PromotionEffect {
  if (!promotion || !promotion.active) {
    return NO_PROMOTION_EFFECT;
  }
  if (promotion.type === PERCENTAGE_PROMOTION) {
    return { rate: promotion.value / PERCENT_DIVISOR, fixedAmountPerUnit: 0 };
  }
  if (promotion.type === FIXED_PROMOTION) {
    return { rate: 0, fixedAmountPerUnit: promotion.value };
  }
  return NO_PROMOTION_EFFECT;
}

function isMorningOrder(time: string): boolean {
  return parseInt(time.split(':')[0], 10) < MORNING_HOUR_LIMIT;
}

export function priceOrderLine(
  order: Order,
  product: Product | undefined,
  promotion: Promotion | undefined,
): PricedOrderLine {
  const unitPrice = product ? product.price : order.unitPrice;
  const { rate, fixedAmountPerUnit } = resolvePromotionEffect(promotion);

  const discountedTotal = order.quantity * unitPrice * (1 - rate) - fixedAmountPerUnit * order.quantity;
  const morningBonus = isMorningOrder(order.time) ? discountedTotal * MORNING_BONUS_RATE : 0;

  return {
    total: discountedTotal - morningBonus,
    morningBonus,
    weightKg: (product?.weight || DEFAULT_PRODUCT_WEIGHT_KG) * order.quantity,
  };
}