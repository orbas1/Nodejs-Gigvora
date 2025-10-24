import { describe, expect, it } from 'vitest';

import { getInitials } from '../profile.js';

describe('getInitials', () => {
  it('returns fallback when no sources provided', () => {
    expect(getInitials()).toBe('GV');
  });

  it('derives initials from full name', () => {
    expect(getInitials('Mae Jemison')).toBe('MJ');
  });

  it('uses email when name missing', () => {
    expect(getInitials('', 'crew.ops@example.com')).toBe('CO');
  });

  it('handles single word names', () => {
    expect(getInitials('Glossier')).toBe('G');
  });

  it('limits initials to two characters', () => {
    expect(getInitials('Ada Lovelace Byron')).toBe('AL');
  });

  it('falls back when segments missing', () => {
    expect(getInitials('   ', undefined, 'AB')).toBe('AB');
  });
});
