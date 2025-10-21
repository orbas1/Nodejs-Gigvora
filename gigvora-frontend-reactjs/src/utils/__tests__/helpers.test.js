import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import hasExplorerAccess, {
  getExplorerAllowedMemberships,
  isExplorerEligibleMembership,
} from '../accessControl.js';
import {
  ADMIN_ACCESS_ALIASES,
  deriveAdminAccess,
  normalizeToLowercaseArray,
} from '../adminAccess.js';
import classNames from '../classNames.js';
import {
  ContentModerationError,
  moderateFeedComposerPayload,
  sanitiseExternalLink,
} from '../contentModeration.js';
import {
  formatRelativeTime,
  formatAbsolute,
  describeTimeSince,
  formatDateLabel,
} from '../date.js';
import { buildExplorerSearchUrl } from '../explorer.js';

describe('access control utilities', () => {
  it('exposes allowed memberships and recognises membership objects', () => {
    expect(getExplorerAllowedMemberships()).toContain('freelancer');
    expect(isExplorerEligibleMembership({ type: 'Freelancer' })).toBe(true);
  });

  it('grants access when eligible membership is present', () => {
    expect(hasExplorerAccess({ memberships: [{ type: 'Mentor' }] })).toBe(true);
  });

  it('grants access from permissions or feature flags', () => {
    expect(hasExplorerAccess({ featureFlags: { explorerAccess: true } })).toBe(true);
    expect(hasExplorerAccess({ permissions: ['explorer:access'] })).toBe(true);
  });
});

describe('admin access utilities', () => {
  it('normalises array-like structures', () => {
    expect(normalizeToLowercaseArray(new Set(['Admin']))).toEqual(['admin']);
  });

  it('derives admin access when aliases or permissions are present', () => {
    const session = {
      memberships: ['member'],
      permissions: { 'admin:full': true },
      user: { role: 'Administrator' },
    };
    const result = deriveAdminAccess(session);
    expect(result.hasAdminAccess).toBe(true);
    expect(result.hasAdminSeat).toBe(true);
    expect(ADMIN_ACCESS_ALIASES.has('admin')).toBe(true);
  });
});

describe('classNames helper', () => {
  it('flattens nested values and ignores falsy entries', () => {
    expect(
      classNames('base', ['btn', ['primary', null]], { disabled: false, active: true }, new Set(['rounded'])),
    ).toBe('base btn primary active rounded');
  });
});

describe('content moderation', () => {
  it('throws with banned terminology and provides actionable reasons', () => {
    expect(() =>
      moderateFeedComposerPayload({
        content: 'This contains porn content',
      }),
    ).toThrow(ContentModerationError);
  });

  it('sanitises suspicious links', () => {
    expect(sanitiseExternalLink('grabify.link/track')).toBeNull();
    expect(sanitiseExternalLink('example.com')).toBe('https://example.com/');
  });

  it('normalises attachments and honours rule overrides safely', () => {
    const repeated = 'insight '.repeat(450);

    expect(() =>
      moderateFeedComposerPayload({
        content: repeated,
      }),
    ).toThrow(ContentModerationError);

    const payload = moderateFeedComposerPayload(
      {
        content: repeated,
        summary: 'Sharing our latest programme update with the community.',
        link: 'gigvora.com',
        attachments: [
          { url: 'example.com/media.png', type: 'IMAGE', alt: 'Team update graphic' },
          { url: 'https://example.com/media.png' },
          { url: 'http://grabify.link/track', type: 'video' },
        ],
      },
      { maxCharacters: 4000, minUniqueWordRatio: 0.01 },
    );

    expect(payload.link).toBe('https://gigvora.com/');
    expect(payload.attachments).toHaveLength(1);
    expect(payload.attachments[0]).toMatchObject({
      url: 'https://example.com/media.png',
      type: 'image',
      alt: 'Team update graphic',
    });
    expect(payload.rules.maxCharacters).toBe(4000);
    expect(payload.rules.minUniqueWordRatio).toBeCloseTo(0.01);
    expect(payload.signals.every((signal) => signal.severity !== 'high')).toBe(true);
  });

  it('rejects blocked tracking domains even when obfuscated', () => {
    expect(() =>
      moderateFeedComposerPayload({
        content: 'Stay safe and avoid this tracker: grabify.link right now',
      }),
    ).toThrow(ContentModerationError);
  });
});

describe('date utilities', () => {
  const fixedNow = new Date('2024-01-01T00:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('formats relative time with sensible precision', () => {
    expect(formatRelativeTime(new Date('2024-01-01T00:05:00Z'))).toBe('in 5 minutes');
  });

  it('formats absolute dates and combined labels', () => {
    const timestamp = new Date('2023-12-31T23:00:00Z');
    expect(formatAbsolute(timestamp)).toMatch(/31 Dec 2023/);
    expect(describeTimeSince(timestamp)).toMatch(/ago/);
    expect(formatDateLabel(null)).toBe('—');
  });

  it('supports custom locales, zones, and deterministic references', () => {
    expect(formatRelativeTime('2023-12-31T23:59:30Z', { now: fixedNow, numeric: 'always' })).toBe('30 seconds ago');

    const label = formatDateLabel('2024-01-01T10:00:00Z', {
      includeTime: true,
      locale: 'en-GB',
      timeZone: 'UTC',
    });
    expect(label).toMatch(/1 Jan 2024/);
    expect(label).toMatch(/10:00/);

    const description = describeTimeSince('2024-01-01T00:10:00Z', {
      now: fixedNow,
      locale: 'en',
      numeric: 'always',
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'UTC',
    });

    expect(description).toContain('in 10 minutes');
    expect(description).toMatch(/1\/1\/24/);
  });
});

describe('explorer helpers', () => {
  it('builds consistent URLs with sanitised inputs', () => {
    const url = buildExplorerSearchUrl(
      {
        category: '  gigs ',
        query: ' designers ',
        sort: 'latest',
        page: '2',
        filters: { remote: true, tags: ['ui', '  '] },
        mapViewport: { lat: 10 },
      },
      { basePath: 'explorer' },
    );

    const [path, search] = url.split('?');
    expect(path).toBe('/explorer');

    const params = new URLSearchParams(search);
    expect(params.get('category')).toBe('gigs');
    expect(params.get('q')).toBe('designers');
    expect(params.get('sort')).toBe('latest');
    expect(params.get('page')).toBe('2');
    expect(JSON.parse(params.get('filters'))).toEqual({ remote: true, tags: ['ui'] });
    expect(JSON.parse(params.get('viewport'))).toEqual({ lat: 10 });
  });
});
