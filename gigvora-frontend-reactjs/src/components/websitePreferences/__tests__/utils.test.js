import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createLocalId, formatDateTime } from '../utils.js';

describe('website preferences utils', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

  beforeAll(() => {
    if (!originalDescriptor) {
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
  });

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'crypto', originalDescriptor);
    } else {
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
    vi.restoreAllMocks();
  });

  afterAll(() => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'crypto', originalDescriptor);
    } else {
      delete globalThis.crypto;
    }
  });

  it('uses crypto.randomUUID when available', () => {
    const randomUUID = vi.fn().mockReturnValue('uuid-from-crypto');
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID },
      configurable: true,
      writable: true,
    });

    const id = createLocalId('pref');

    expect(id).toBe('uuid-from-crypto');
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it('falls back to prefix-based id when randomUUID is unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const id = createLocalId('item');

    expect(id.startsWith('item_')).toBe(true);
    expect(id.length).toBeGreaterThan('item_'.length);
  });

  it('formats ISO date strings to medium date and short time', () => {
    const formatted = formatDateTime('2024-01-15T13:30:00.000Z');

    expect(formatted).toMatch(/15\s\w{3}\s2024/);
    expect(formatted).toMatch(/13:30|1:30/);
  });

  it('returns null for invalid inputs', () => {
    expect(formatDateTime('')).toBeNull();
    expect(formatDateTime('not-a-date')).toBeNull();
  });
});
