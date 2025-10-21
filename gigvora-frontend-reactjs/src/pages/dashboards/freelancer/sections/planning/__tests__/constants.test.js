import { describe, expect, it } from 'vitest';
import {
  EVENT_STATUS_LOOKUP,
  EVENT_TYPE_LOOKUP,
  EVENT_TYPE_OPTIONS,
  createOptionLookup,
  getTypeIcon,
  resolveStatusMeta,
  resolveTypeMeta,
} from '../constants.js';

describe('planning constants helpers', () => {
  it('creates a lookup map while ignoring invalid entries', () => {
    const lookup = createOptionLookup([
      { value: 'valid', label: 'Valid' },
      null,
      { value: '', label: 'Empty' },
      { value: 'valid', label: 'Duplicate' },
    ]);

    expect(lookup).toBeInstanceOf(Map);
    expect(lookup.size).toBe(1);
    expect(lookup.get('valid')).toEqual({ value: 'valid', label: 'Valid' });
  });

  it('resolves type and status metadata with sensible fallbacks', () => {
    const defaultType = resolveTypeMeta('non-existent');
    const defaultStatus = resolveStatusMeta('random');

    expect(defaultType).toEqual(EVENT_TYPE_LOOKUP.get('other'));
    expect(defaultStatus).toEqual(EVENT_STATUS_LOOKUP.get('confirmed'));
  });

  it('exposes the correct icon for a given event type', () => {
    const knownType = EVENT_TYPE_OPTIONS[0];
    const icon = getTypeIcon(knownType.value);

    expect(icon).toBe(knownType.icon);
  });
});
