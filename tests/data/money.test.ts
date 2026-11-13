import { describe, expect, it } from 'vitest';
import { formatPkr, parsePkr } from '../../data/money';

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

  it('formats paisa without dropping the currency or decimal places', () => {
    expect(formatPkr(0)).toBe('PKR 0.00');
    expect(formatPkr(25075)).toBe('PKR 250.75');
    expect(formatPkr(125000)).toBe('PKR 1,250.00');
  });

  it.each([-1, 0.5, NaN, Infinity])('rejects invalid stored amount %s', value => {
    expect(() => formatPkr(value)).toThrow();
  });
});
