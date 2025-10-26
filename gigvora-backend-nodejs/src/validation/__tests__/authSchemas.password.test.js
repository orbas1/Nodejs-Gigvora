import { describe, it, expect } from '@jest/globals';
import { performPasswordResetSchema } from '../schemas/authSchemas.js';

describe('authSchemas password validation', () => {
  const baseToken = 'f'.repeat(64);

  it('accepts a strong password', () => {
    expect(() =>
      performPasswordResetSchema.parse({
        token: baseToken,
        password: 'EliteStrength#2024',
      }),
    ).not.toThrow();
  });

  it('rejects passwords missing complexity requirements', () => {
    expect(() =>
      performPasswordResetSchema.parse({
        token: baseToken,
        password: 'short12!',
      }),
    ).toThrow(/12 characters/i);
  });

  it('rejects passwords containing common sequences', () => {
    expect(() =>
      performPasswordResetSchema.parse({
        token: baseToken,
        password: 'Password1234!',
      }),
    ).toThrow(/common words/i);
  });
});
