import { describe, expect, it } from 'vitest';
import {
  TIMELINE_STATUSES,
  TIMELINE_VISIBILITIES,
  EVENT_TYPES,
  EVENT_STATUSES,
  formatDateForInput,
  formatDateForDisplay,
  parseListFromText,
  parseAttachments,
  attachmentsToText,
  timelineToForm,
  timelineFormToPayload,
  eventToForm,
  eventFormToPayload,
} from '../timelineUtils.js';

describe('timelineUtils', () => {
  it('exposes constant option lists', () => {
    expect(TIMELINE_STATUSES.map((item) => item.value)).toEqual(['draft', 'active', 'archived']);
    expect(TIMELINE_VISIBILITIES.map((item) => item.value)).toEqual(['internal', 'partners', 'public']);
    expect(EVENT_TYPES.map((item) => item.value)).toContain('milestone');
    expect(EVENT_STATUSES.map((item) => item.value)).toContain('planned');
  });

  it('formats dates for inputs and display safely', () => {
    const source = '2024-05-20T12:00:00.000Z';
    expect(formatDateForInput(source)).toBe('2024-05-20');
    expect(formatDateForDisplay(source)).toMatch(/May/);
    expect(formatDateForInput('invalid')).toBe('');
    expect(formatDateForDisplay('invalid')).toBeNull();
  });

  it('parses delimited lists and attachments reliably', () => {
    const list = parseListFromText('launch, beta, go-live\nmarketing');
    expect(list).toEqual(['launch', 'beta', 'go-live', 'marketing']);

    const attachments = parseAttachments('Deck | https://example.com/deck | Latest\nhttps://example.com/runbook');
    expect(attachments).toEqual([
      { label: 'Deck', url: 'https://example.com/deck', description: 'Latest' },
      { label: null, url: 'https://example.com/runbook', description: null },
    ]);

    expect(attachmentsToText(attachments)).toContain('Deck | https://example.com/deck | Latest');
    expect(parseAttachments(null)).toEqual([]);
    expect(attachmentsToText(null)).toBe('');
  });

  it('normalises timelines to and from form state', () => {
    const timeline = {
      id: 'tl-1',
      name: 'Launch',
      slug: 'launch',
      summary: 'Ship the release',
      description: 'context',
      timelineType: 'Product',
      status: 'active',
      visibility: 'internal',
      startDate: '2024-05-01T00:00:00.000Z',
      endDate: '2024-06-01T00:00:00.000Z',
      heroImageUrl: 'https://example.com/hero.png',
      thumbnailUrl: 'https://example.com/thumb.png',
      tags: ['launch', 'beta'],
      settings: {
        programOwner: 'Alex',
        programEmail: 'alex@example.com',
        coordinationChannel: '#launch',
        riskNotes: 'Watch dependencies',
      },
    };

    const form = timelineToForm(timeline);
    expect(form).toMatchObject({
      id: 'tl-1',
      name: 'Launch',
      startDate: '2024-05-01',
      tagsText: 'launch, beta',
      programOwner: 'Alex',
    });

    const payload = timelineFormToPayload({ ...form, tagsText: 'launch, beta, marketing' });
    expect(payload).toMatchObject({
      name: 'Launch',
      slug: 'launch',
      tags: ['launch', 'beta', 'marketing'],
      settings: {
        programOwner: 'Alex',
        programEmail: 'alex@example.com',
      },
    });
  });

  it('normalises events to and from form state', () => {
    const event = {
      id: 'evt-1',
      title: 'Kick-off',
      summary: 'Go time',
      description: 'Longer copy',
      eventType: 'milestone',
      status: 'planned',
      startDate: '2024-05-05T12:00:00.000Z',
      dueDate: '2024-05-06T12:00:00.000Z',
      endDate: '2024-05-07T12:00:00.000Z',
      ownerName: 'Jamie',
      ownerEmail: 'jamie@example.com',
      ownerId: 'user-1',
      location: 'HQ',
      ctaLabel: 'Join call',
      ctaUrl: 'https://meet.example.com',
      tags: ['kickoff'],
      attachments: [{ label: 'Agenda', url: 'https://example.com/agenda' }],
      orderIndex: 2,
    };

    const form = eventToForm(event);
    expect(form).toMatchObject({
      id: 'evt-1',
      startDate: '2024-05-05',
      tagsText: 'kickoff',
      attachmentsText: 'Agenda | https://example.com/agenda',
    });

    const payload = eventFormToPayload({ ...form, summary: ' Updated ', tagsText: 'kickoff, retro ' });
    expect(payload).toMatchObject({
      summary: 'Updated',
      tags: ['kickoff', 'retro'],
      attachments: [{ label: 'Agenda', url: 'https://example.com/agenda', description: null }],
    });
  });
});
