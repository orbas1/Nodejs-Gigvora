import { describe, expect, it } from '@jest/globals';
import { ValidationError } from '../../src/utils/errors.js';
import {
  coercePositiveInteger,
  requirePositiveInteger,
  resolvePositiveInteger,
} from '../../src/utils/identifiers.js';

describe('identifier utilities', () => {
  it('coerces positive integers when possible', () => {
    expect(coercePositiveInteger('12')).toBe(12);
    expect(coercePositiveInteger(5)).toBe(5);
    expect(coercePositiveInteger('')).toBeUndefined();
    expect(coercePositiveInteger('abc')).toBeUndefined();
    expect(coercePositiveInteger(-3)).toBeUndefined();
  });

  it('requires positive integers', () => {
    expect(requirePositiveInteger('freelancerId', 9)).toBe(9);
    expect(() => requirePositiveInteger('freelancerId', '0')).toThrow(ValidationError);
    expect(() => requirePositiveInteger('freelancerId', null)).toThrow(ValidationError);
  });

  it('resolves positive integers from a list of candidates', () => {
    expect(resolvePositiveInteger('freelancerId', undefined, '17', '21')).toBe(17);
    expect(resolvePositiveInteger('freelancerId', undefined, '', 4)).toBe(4);
    expect(() => resolvePositiveInteger('freelancerId', null, 'not-a-number')).toThrow(ValidationError);
  });
});
