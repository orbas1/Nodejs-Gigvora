import {
  classNames,
  formatNumber,
  formatDate,
  formatDateTime,
  resolveName,
  sanitizeCommaSeparated,
  parseWorkspaceId,
  toDateInputValue,
  toDateTimeInputValue,
  normalizeDateTimeLocal,
} from '../id-verification/utils.js';

describe('ID verification helpers', () => {
  it('joins truthy class names', () => {
    expect(classNames('a', false, 'b')).toBe('a b');
  });

  it('formats numbers defensively', () => {
    expect(formatNumber(1250)).toBe('1,250');
    expect(formatNumber(null)).toBe('0');
    expect(formatNumber('abc')).toBe('0');
  });

  it('formats dates for display', () => {
    expect(formatDate('2024-05-01T00:00:00Z')).toMatch(/2024/);
    expect(formatDate(undefined)).toBe('—');
    expect(formatDateTime('2024-05-01T14:30:00Z')).toMatch(/2:30/);
  });

  it('resolves friendly names', () => {
    expect(resolveName({ name: 'Taylor' })).toBe('Taylor');
    expect(resolveName({ firstName: 'Jordan', lastName: 'Lee' })).toBe('Jordan Lee');
    expect(resolveName({ email: 'ops@example.com' })).toBe('ops@example.com');
    expect(resolveName(null)).toBe('—');
  });

  it('sanitises comma separated lists', () => {
    expect(sanitizeCommaSeparated('a, b , ,c')).toBe('a,b,c');
    expect(sanitizeCommaSeparated('')).toBeUndefined();
  });

  it('parses workspace identifiers', () => {
    expect(parseWorkspaceId(42)).toBe(42);
    expect(parseWorkspaceId('15')).toBe(15);
    expect(parseWorkspaceId('abc')).toBeUndefined();
  });

  it('normalises date input values', () => {
    expect(toDateInputValue('2024-05-01T00:00:00Z')).toBe('2024-05-01');
    expect(toDateInputValue('bad')).toBe('');
    expect(toDateTimeInputValue('2024-05-01T11:45:00Z')).toMatch(/T11:45/);
  });

  it('normalises local timestamps', () => {
    const iso = normalizeDateTimeLocal('2024-05-01T11:45');
    expect(iso).toMatch(/2024-05-01T11:45/);
    expect(normalizeDateTimeLocal('bad-date')).toBeUndefined();
  });
});
