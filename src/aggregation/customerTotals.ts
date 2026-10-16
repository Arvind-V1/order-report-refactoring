import { priceOrderLine } from '../calculators/orderLine';
import { Order, Product, Promotion } from '../models';

export interface CustomerTotals {
  subtotal: number;
  weightKg: number;
  morningBonus: number;
  items: Order[];
}

function createEmptyTotals(): CustomerTotals {
  return { subtotal: 0, weightKg: 0, morningBonus: 0, items: [] };
}

function findPromotion(order: Order, promotions: Map<string, Promotion>): Promotion | undefined {
  return order.promoCode ? promotions.get(order.promoCode) : undefined;
}

export function aggregateOrdersByCustomer(
  orders: Order[],
  products: Map<string, Product>,
  promotions: Map<string, Promotion>,
): Map<string, CustomerTotals> {
  const totalsByCustomer = new Map<string, CustomerTotals>();

  for (const order of orders) {
    let totals = totalsByCustomer.get(order.customerId);
    if (!totals) {
      totals = createEmptyTotals();
      totalsByCustomer.set(order.customerId, totals);
    }

    const line = priceOrderLine(order, products.get(order.productId), findPromotion(order, promotions));
    totals.subtotal += line.total;
    totals.weightKg += line.weightKg;
    totals.morningBonus += line.morningBonus;
    totals.items.push(order);
  }

  return totalsByCustomer;
}

export function sortByCustomerId(
  totalsByCustomer: Map<string, CustomerTotals>,
): Array<[string, CustomerTotals]> {
  return Array.from(totalsByCustomer.entries()).sort(([idA], [idB]) => (idA < idB ? -1 : idA > idB ? 1 : 0));
}
