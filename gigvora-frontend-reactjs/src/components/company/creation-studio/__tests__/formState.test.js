import { describe, expect, it } from 'vitest';

import {
  toInputDateTime,
  parseDateInput,
  parseNumberInput,
  normaliseTagsInput,
  buildInitialState,
  mergeItemToState,
  buildSettingsPayload,
} from '../formState.js';

describe('creation studio form state helpers', () => {
  it('normalises date values for inputs safely', () => {
    const iso = '2024-04-01T12:30:00.000Z';
    expect(toInputDateTime(iso)).toBe('2024-04-01T12:30');
    expect(toInputDateTime('invalid')).toBe('');

    const parsed = parseDateInput('2024-05-05T10:00');
    expect(parsed).toMatch(/^2024-05-05T10:00:00.000Z$/);
    expect(parseDateInput('not-a-date')).toBeUndefined();
  });

  it('parses numeric inputs respecting integer preference', () => {
    expect(parseNumberInput('12.345')).toBe(12.35);
    expect(parseNumberInput('40.2', { integer: true })).toBe(40);
    expect(parseNumberInput('')).toBeUndefined();
    expect(parseNumberInput('abc')).toBeUndefined();
  });

  it('derives tags from comma separated text', () => {
    expect(normaliseTagsInput('alpha, beta,  gamma')).toEqual(['alpha', 'beta', 'gamma']);
    expect(normaliseTagsInput('')).toEqual([]);
  });

  it('builds initial state with defaults per type', () => {
    const initial = buildInitialState('mentorship_offering');
    expect(initial.type).toBe('mentorship_offering');
    expect(initial.remoteEligible).toBe(true);
    expect(initial.settings.deliveryFormat).toBe('virtual');
  });

  it('merges an existing item into editable state', () => {
    const state = mergeItemToState(
      {
        id: 1,
        type: 'cv',
        title: 'Product CV',
        tags: ['portfolio', 'ux'],
        launchDate: '2024-05-05T09:00:00.000Z',
        settings: { portfolioLinks: ['https://example.com'], sessionLengthMinutes: 45 },
      },
      'job',
    );

    expect(state.type).toBe('cv');
    expect(state.title).toBe('Product CV');
    expect(state.tagsText).toBe('portfolio, ux');
    expect(state.launchDate).toBe('2024-05-05T09:00');
    expect(state.settings.portfolioLinks).toContain('https://example.com');
    expect(state.settings.sessionLengthMinutes).toBe('45');
  });

  it('builds payload for mentorship offering with numeric settings', () => {
    const payload = buildSettingsPayload('mentorship_offering', {
      settings: {
        deliveryFormat: 'hybrid',
        sessionLengthMinutes: '75',
        rate: '120.40',
        cadence: 'Weekly',
        mentorshipNotes: 'Bring case studies',
      },
    });

    expect(payload).toEqual({
      deliveryFormat: 'hybrid',
      sessionLengthMinutes: 75,
      rate: 120.4,
      cadence: 'Weekly',
      mentorshipNotes: 'Bring case studies',
    });
  });
});
