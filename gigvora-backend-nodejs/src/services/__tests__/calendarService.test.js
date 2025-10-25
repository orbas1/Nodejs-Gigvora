import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const findEventMock = jest.fn();
const findIntegrationsMock = jest.fn();

jest.unstable_mockModule('../models/index.js', () => ({
  CandidateCalendarEvent: { findOne: findEventMock },
  CalendarIntegration: { findAll: findIntegrationsMock },
}));

jest.unstable_mockModule('../services/calendarIntegrationGateway.js', () => ({
  fetchAvailabilityForIntegration: jest.fn(async ({ integration }) => integration.metadata?.busyWindows ?? []),
}));

let exportEventToICS;
let syncAvailability;

beforeEach(async () => {
  ({ exportEventToICS, syncAvailability } = await import('../calendarService.js'));
});

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('calendarService.exportEventToICS', () => {
  it('generates an ICS payload with recurrence information', async () => {
    findEventMock.mockResolvedValue({
      toPublicObject: () => ({
        id: 55,
        title: 'Weekly stand-up',
        startsAt: '2025-02-01T09:00:00.000Z',
        endsAt: '2025-02-01T09:30:00.000Z',
        recurrenceRule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO',
        recurrenceUntil: '2025-03-01T09:00:00.000Z',
        recurrenceCount: null,
        parentEventId: null,
      }),
    });

    const result = await exportEventToICS(1, 55);

    expect(result.contentType).toBe('text/calendar');
    expect(result.body).toContain('BEGIN:VEVENT');
    expect(result.body).toContain('SUMMARY:Weekly stand-up');
    expect(result.body).toContain('RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO');
  });
});

describe('calendarService.syncAvailability', () => {
  it('merges availability windows from integrations', async () => {
    findIntegrationsMock.mockResolvedValue([
      {
        provider: 'google',
        metadata: { busyWindows: [{ start: '2025-02-02T09:00:00Z', end: '2025-02-02T10:00:00Z' }] },
        update: jest.fn(),
      },
      {
        provider: 'ics',
        metadata: { busyWindows: [{ start: '2025-02-03T11:00:00Z', end: '2025-02-03T12:00:00Z' }] },
        update: jest.fn(),
      },
    ]);

    const availability = await syncAvailability(10, {
      start: '2025-02-01T00:00:00Z',
      end: '2025-02-10T00:00:00Z',
    });

    expect(availability).toHaveLength(2);
    expect(availability[0].start).toBe('2025-02-02T09:00:00.000Z');
    expect(availability[1].start).toBe('2025-02-03T11:00:00.000Z');
  });
});

