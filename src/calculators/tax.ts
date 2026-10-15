import { Order, Product } from '../models';
import { roundToCents } from './money';

const TAX_RATE = 0.2;

type ProductsById = Map<string, Product>;

function containsNonTaxableProduct(items: Order[], products: ProductsById): boolean {
  return items.some((item) => products.get(item.productId)?.taxable === false);
}

/** Les produits inconnus ne sont pas taxés ligne à ligne, comme dans le legacy. */
function sumTaxOnTaxableLines(items: Order[], products: ProductsById): number {
  return items.reduce((tax, item) => {
    const product = products.get(item.productId);
    if (!product || !product.taxable) {
      return tax;
    }
    const lineTotal = item.quantity * (product.price || item.unitPrice);
    return tax + lineTotal * TAX_RATE;
  }, 0);
}

export function calculateTax(taxableAmount: number, items: Order[], products: ProductsById): number {
  if (!containsNonTaxableProduct(items, products)) {
    return roundToCents(taxableAmount * TAX_RATE);
  }
  return roundToCents(sumTaxOnTaxableLines(items, products));
}