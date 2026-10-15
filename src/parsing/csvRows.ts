const LINE_SEPARATOR = '\n';
const FIELD_SEPARATOR = ',';

/**
 * Découpe un contenu CSV en lignes de champs, en-tête et lignes vides exclus.
 * Le "\r" des fins de ligne CRLF reste volontairement collé au dernier champ,
 * comme dans le legacy (le rapport de référence en dépend).
 */
export function parseCsvRows(content: string): string[][] {
  return content
    .split(LINE_SEPARATOR)
    .filter((line) => line.trim() !== '')
    .slice(1)
    .map((line) => line.split(FIELD_SEPARATOR));
}