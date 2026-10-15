import {
  DEFAULT_COST_PER_KG,
  DEFAULT_CURRENCY,
  DEFAULT_CUSTOMER_LEVEL,
  DEFAULT_ORDER_TIME,
  DEFAULT_PRODUCT_WEIGHT_KG,
  DEFAULT_SHIPPING_ZONE,
} from '../constants';
import { Customer, Order, Product, Promotion, ShippingZone } from '../models';
import { parseCsvRows } from './csvRows';

const TAXABLE_FLAG = 'true';
const INACTIVE_PROMOTION_FLAG = 'false';

type Row = string[];

function toCustomer([id, name, level, shippingZone, currency]: Row): Customer {
  return {
    id,
    name,
    level: level || DEFAULT_CUSTOMER_LEVEL,
    shippingZone: shippingZone || DEFAULT_SHIPPING_ZONE,
    currency: currency || DEFAULT_CURRENCY,
  };
}

function toProduct([id, name, category, price, weight, taxable]: Row): Product {
  return {
    id,
    name,
    category,
    price: parseFloat(price),
    weight: weight ? parseFloat(weight) : DEFAULT_PRODUCT_WEIGHT_KG,
    taxable: taxable === TAXABLE_FLAG,
  };
}

function toShippingZone([zone, baseCost, costPerKg]: Row): ShippingZone {
  return {
    zone,
    baseCost: parseFloat(baseCost),
    costPerKg: costPerKg ? parseFloat(costPerKg) : DEFAULT_COST_PER_KG,
  };
}

function toPromotion([code, type, value, active]: Row): Promotion {
  return {
    code,
    type,
    value: parseFloat(value),
    active: active !== INACTIVE_PROMOTION_FLAG,
  };
}

function toOrder([id, customerId, productId, quantity, unitPrice, date, promoCode, time]: Row): Order {
  return {
    id,
    customerId,
    productId,
    quantity: parseInt(quantity, 10),
    unitPrice: parseFloat(unitPrice),
    date,
    promoCode: promoCode || '',
    time: time || DEFAULT_ORDER_TIME,
  };
}

function indexBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T> {
  return new Map(items.map((item): [string, T] => [keyOf(item), item]));
}

export function parseCustomers(csv: string): Map<string, Customer> {
  return indexBy(parseCsvRows(csv).map(toCustomer), (customer) => customer.id);
}

export function parseProducts(csv: string): Map<string, Product> {
  return indexBy(parseCsvRows(csv).map(toProduct), (product) => product.id);
}

export function parseShippingZones(csv: string): Map<string, ShippingZone> {
  return indexBy(parseCsvRows(csv).map(toShippingZone), (zone) => zone.zone);
}

export function parsePromotions(csv: string): Map<string, Promotion> {
  return indexBy(parseCsvRows(csv).map(toPromotion), (promotion) => promotion.code);
}

export function parseOrders(csv: string): Order[] {
  return parseCsvRows(csv).map(toOrder);
}