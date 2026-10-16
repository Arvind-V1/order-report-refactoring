const CENTS_PER_UNIT = 100;
const NEUTRAL_RATE = 1.0;

const CURRENCY_RATES = new Map<string, number>([
  ['USD', 1.1],
  ['GBP', 0.85],
]);

export function roundToCents(amount: number): number {
  return Math.round(amount * CENTS_PER_UNIT) / CENTS_PER_UNIT;
}

/**
 * Comparaison stricte sur le code devise : "USD\r" (CRLF du CSV) n'est pas reconnu
 * et reste au taux neutre, comme dans le legacy.
 */
export function getCurrencyRate(currency: string): number {
  return CURRENCY_RATES.get(currency) ?? NEUTRAL_RATE;
}
