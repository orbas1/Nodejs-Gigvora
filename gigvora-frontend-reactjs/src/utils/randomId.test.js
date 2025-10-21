import { describe, expect, it, vi } from 'vitest';
import randomId from './randomId.js';

describe('randomId', () => {
  it('uses crypto.randomUUID when available', () => {
    const uuidSpy = vi.fn(() => 'uuid-value');
    vi.stubGlobal('crypto', { randomUUID: uuidSpy });

    expect(randomId()).toBe('uuid-value');
    expect(uuidSpy).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('falls back to prefix-based id when crypto unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    const id = randomId('prefix');
    expect(id.startsWith('prefix-')).toBe(true);
    vi.unstubAllGlobals();
  });
});
