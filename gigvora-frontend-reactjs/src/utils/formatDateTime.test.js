import { describe, expect, it, vi } from 'vitest';
import * as formatDateModule from './formatDate.js';
import formatDateTime, { formatDateWithFallback } from './formatDateTime.js';

describe('formatDateTime', () => {
  it('returns formatted date and time', () => {
    const result = formatDateTime('2024-05-01T14:30:00Z', {
      locale: 'en-GB',
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    });
    expect(result).toBe('1 May 2024, 14:30');
  });

  it('returns an empty string for invalid input', () => {
    expect(formatDateTime('invalid')).toBe('');
  });
});

describe('formatDateWithFallback', () => {
  it('returns fallback when the formatted date is empty', () => {
    const spy = vi.spyOn(formatDateModule, 'default').mockReturnValue('');
    expect(formatDateWithFallback('invalid', 'N/A')).toBe('N/A');
    spy.mockRestore();
  });

  it('returns formatted date when available', () => {
    const spy = vi.spyOn(formatDateModule, 'default').mockReturnValue('1 May 2024');
    expect(formatDateWithFallback('2024-05-01')).toBe('1 May 2024');
    spy.mockRestore();
  });
});
