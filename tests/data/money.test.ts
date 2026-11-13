import { describe, expect, it } from 'vitest';
import { formatPkr, parsePkr, priceForInput } from '../../data/money';

describe('PKR money', () => {
  it.each([
    ['0', 0], ['0.29', 29], ['150', 15000], ['150.5', 15050], [' 250.75 ', 25075],
  ])('parses %s PKR as %i paisa', (input, expected) => {
    expect(parsePkr(input)).toBe(expected);
  });

  it.each(['', '-1', '1.001', 'abc', '1e3', '12,000', '90071992547409.92']) (
    'rejects invalid price text %s', input => {
      expect(() => parsePkr(input)).toThrow();
    },
  );

  it('uses the reference currency display and preserves fractional paisa', () => {
    expect(formatPkr(0)).toBe('Rs. 0');
    expect(formatPkr(25075)).toBe('Rs. 250.75');
    expect(formatPkr(125000)).toBe('Rs. 1,250');
  });

  it('round-trips prices through edit fields without precision loss', () => {
    for (const price of [0, 29, 15550, Number.MAX_SAFE_INTEGER]) {
      expect(parsePkr(priceForInput(price))).toBe(price);
    }
  });

  it.each([-1, 0.5, NaN, Infinity])('rejects invalid stored amount %s', value => {
    expect(() => formatPkr(value)).toThrow();
  });
});
