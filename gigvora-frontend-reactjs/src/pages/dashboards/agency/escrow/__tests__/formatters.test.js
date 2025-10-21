import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber } from '../formatters.js';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats numeric values with currency code', () => {
      expect(formatCurrency(1234.56, 'USD')).toMatch(/\$1,234\.56/);
    });

    it('returns fallback for invalid numbers', () => {
      expect(formatCurrency(null, 'EUR', { fallback: 'N/A' })).toBe('N/A');
    });

    it('supports overriding minimum fraction digits', () => {
      expect(formatCurrency(99, 'JPY', { minimumFractionDigits: 0 })).toBe('¥99');
    });
  });

  describe('formatNumber', () => {
    it('renders numbers with provided decimals', () => {
      expect(formatNumber(42.1234, { decimals: 2 })).toBe('42.12');
    });

    it('returns fallback for missing values', () => {
      expect(formatNumber(undefined, { fallback: '--' })).toBe('--');
    });
  });
});
