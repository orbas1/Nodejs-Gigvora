import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(TEST_DIR, '..', '..');

const findEventMock = jest.fn();
const eventsFindAllMock = jest.fn();
const focusFindAllMock = jest.fn();
const settingsFindOneMock = jest.fn();
const findIntegrationsMock = jest.fn();

jest.unstable_mockModule(join(SRC_ROOT, 'models/index.js'), () => ({
  CandidateCalendarEvent: { findOne: findEventMock, findAll: eventsFindAllMock },
  FocusSession: { findAll: focusFindAllMock },
  UserCalendarSetting: { findOne: settingsFindOneMock },
  CalendarIntegration: { findAll: findIntegrationsMock },
}));

jest.unstable_mockModule(join(SRC_ROOT, 'models/constants/index.js'), () => ({
  CALENDAR_EVENT_TYPES: [],
  CALENDAR_EVENT_SOURCES: [],
  CALENDAR_EVENT_VISIBILITIES: [],
  CALENDAR_DEFAULT_VIEWS: [],
  FOCUS_SESSION_TYPES: [],
}));

jest.unstable_mockModule(join(SRC_ROOT, 'services/calendarIntegrationGateway.js'), () => ({
  fetchAvailabilityForIntegration: jest.fn(async ({ integration }) => integration.metadata?.busyWindows ?? []),
}));

let exportEventToICS;
let exportScheduleToICS;
let syncAvailability;

beforeEach(async () => {
  ({ exportEventToICS, exportScheduleToICS, syncAvailability } = await import('../calendarService.js'));
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

describe('calendarService.exportScheduleToICS', () => {
  it('exports schedule ICS with deduped availability', async () => {
    eventsFindAllMock.mockResolvedValue([
      {
        id: 200,
        title: 'Planning Session',
        startsAt: '2025-02-04T10:00:00.000Z',
        endsAt: '2025-02-04T11:00:00.000Z',
        recurrenceRule: null,
        recurrenceUntil: null,
        recurrenceCount: null,
        parentEventId: null,
        eventType: 'meeting',
      },
    ]);
    focusFindAllMock.mockResolvedValue([]);
    settingsFindOneMock.mockResolvedValue({ timezone: 'America/New_York' });
    findIntegrationsMock.mockResolvedValue([
      {
        provider: 'google',
        metadata: {
          busyWindows: [
            { provider: 'google', start: '2025-02-04T09:00:00.000Z', end: '2025-02-04T09:30:00.000Z' },
            { provider: 'google', start: '2025-02-04T09:00:00.000Z', end: '2025-02-04T09:30:00.000Z' },
          ],
        },
        update: jest.fn(),
      },
    ]);

    const result = await exportScheduleToICS(7, {
      from: '2025-02-01T00:00:00.000Z',
      to: '2025-02-07T00:00:00.000Z',
      includeAvailability: true,
      calendarName: 'Team Schedule',
    });

    expect(eventsFindAllMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 7 }) }),
    );
    expect(result.contentType).toBe('text/calendar');
    expect(result.body).toContain('BEGIN:VEVENT');
    expect(result.eventCount).toBe(1);
    expect(result.availabilityCount).toBe(1);
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

