import { describe, expect, it } from '@jest/globals';
import {
  createIcsCalendar,
  createIcsEvent,
  escapeIcsText,
  suggestIcsFilename,
} from '../utils/icsFormatter.js';

function normalizeNewlines(value) {
  return value.replace(/\r\n/g, '\n');
}

describe('icsFormatter', () => {
  it('escapes reserved characters in text', () => {
    expect(escapeIcsText('hello, world; next\\line')).toBe('hello\\, world\\; next\\\\line');
    expect(escapeIcsText('multi\nline')).toBe('multi\\nline');
  });

  it('builds an ICS event with reminders and metadata', () => {
    const event = createIcsEvent({
      uid: 'event-1@example.com',
      title: 'Investor sync',
      description: 'Discuss KPIs and next steps',
      location: 'Zoom',
      url: 'https://meet.example.com',
      startsAt: '2024-05-21T16:00:00Z',
      endsAt: '2024-05-21T16:45:00Z',
      categories: ['meeting', 'executive'],
      reminderMinutes: 30,
      metadata: {
        relatedEntityType: 'project',
        relatedEntityId: '4096',
        source: 'freelancer_dashboard',
      },
    });

    const lines = normalizeNewlines(event).split('\n');
    expect(lines).toContain('BEGIN:VEVENT');
    expect(lines).toContain('SUMMARY:Investor sync');
    expect(lines).toContain('LOCATION:Zoom');
    expect(lines).toContain('CATEGORIES:meeting,executive');
    expect(lines).toContain('X-GIGVORA-RELATED-TYPE:project');
    expect(lines).toContain('TRIGGER:-PT30M');
    expect(lines).toContain('END:VEVENT');
  });

  it('builds an all-day ICS event', () => {
    const event = createIcsEvent({
      uid: 'all-day-1',
      title: 'Launch Day',
      allDay: true,
      startsAt: '2024-06-01',
    });
    const normalized = normalizeNewlines(event);
    expect(normalized).toMatch(/DTSTART;VALUE=DATE:20240601/);
    expect(normalized).toMatch(/DTEND;VALUE=DATE:20240602/);
  });

  it('generates a full calendar document', () => {
    const event = createIcsEvent({
      uid: 'event-2',
      title: 'Deep Work',
      startsAt: '2024-05-21T09:00:00Z',
    });
    const calendar = createIcsCalendar({
      events: [event],
      name: 'Gigvora Schedule',
      description: 'Mentor and founder engagements',
    });
    const normalized = normalizeNewlines(calendar);
    expect(normalized.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(normalized.endsWith('END:VCALENDAR\n')).toBe(true);
    expect(normalized).toContain('X-WR-CALNAME:Gigvora Schedule');
    expect(normalized).toContain(normalizeNewlines(event));
  });

  it('suggests friendly filenames', () => {
    expect(suggestIcsFilename('Strategy Sync with Atlas Robotics', { id: 42 })).toBe(
      'strategy-sync-with-atlas-robotics-42.ics',
    );
    expect(suggestIcsFilename('  ')).toBe('gigvora-event.ics');
  });
});
