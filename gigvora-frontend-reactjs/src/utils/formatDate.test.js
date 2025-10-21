import { describe, expect, it } from 'vitest';
import formatDate, { normaliseDate } from './formatDate.js';

describe('normaliseDate', () => {
  it('returns a Date instance for valid input', () => {
    const result = normaliseDate('2024-05-01T00:00:00Z');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2024-05-01T00:00:00.000Z');
  });

  it('returns null for invalid dates', () => {
    expect(normaliseDate('invalid date')).toBeNull();
  });
});

describe('formatDate', () => {
  it('formats dates using Intl', () => {
    const result = formatDate('2024-05-01T00:00:00Z', { locale: 'en-GB', dateStyle: 'long' });
    expect(result).toBe('1 May 2024');
  });

  it('returns an empty string for invalid input', () => {
    expect(formatDate('not a date')).toBe('');
  });
});
