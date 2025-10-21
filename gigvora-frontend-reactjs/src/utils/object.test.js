import { describe, expect, it } from 'vitest';
import { cloneDeep, getNestedValue, setNestedValue } from './object.js';

describe('cloneDeep', () => {
  it('clones simple structures via JSON', () => {
    const source = { id: 1, nested: { value: 'test' } };
    const clone = cloneDeep(source);
    expect(clone).toEqual(source);
    expect(clone).not.toBe(source);
  });

  it('returns original value on failure', () => {
    const circular = {};
    circular.self = circular;
    expect(cloneDeep(circular)).toBe(circular);
  });
});

describe('getNestedValue', () => {
  it('traverses object paths', () => {
    const source = { profile: { name: 'Gigvora' } };
    expect(getNestedValue(source, ['profile', 'name'])).toBe('Gigvora');
  });

  it('falls back when path missing', () => {
    expect(getNestedValue({}, ['missing'], 'fallback')).toBe('fallback');
  });
});

describe('setNestedValue', () => {
  it('creates nested structure safely', () => {
    const result = setNestedValue({}, ['profile', 'name'], 'Gigvora');
    expect(result).toEqual({ profile: { name: 'Gigvora' } });
  });

  it('handles root assignment', () => {
    expect(setNestedValue(null, [], 'value')).toBe('value');
  });
});
