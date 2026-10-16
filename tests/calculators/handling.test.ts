import { calculateHandlingFee } from '../../src/calculators/handling';

describe('calculateHandlingFee', () => {
  it.each([
    [10, 0],
    [11, 2.5],
    [20, 2.5],
    [21, 5],
  ])('%p articles : %p', (itemCount, expected) => {
    expect(calculateHandlingFee(itemCount)).toBe(expected);
  });
});
