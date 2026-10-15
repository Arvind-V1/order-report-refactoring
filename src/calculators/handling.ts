const HANDLING_FEE = 2.5;
const LARGE_ORDER_ITEM_COUNT = 10;
const VERY_LARGE_ORDER_ITEM_COUNT = 20;
const VERY_LARGE_ORDER_FEE_MULTIPLIER = 2;

export function calculateHandlingFee(itemCount: number): number {
  if (itemCount > VERY_LARGE_ORDER_ITEM_COUNT) {
    return HANDLING_FEE * VERY_LARGE_ORDER_FEE_MULTIPLIER;
  }
  if (itemCount > LARGE_ORDER_ITEM_COUNT) {
    return HANDLING_FEE;
  }
  return 0;
}