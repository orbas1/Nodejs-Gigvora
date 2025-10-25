import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Op } from 'sequelize';
import { NotFoundError, ValidationError } from '../../src/utils/errors.js';

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';

global.__mockSequelizeModels = global.__mockSequelizeModels || {};

const CandidateCalendarEvent = {
  findAll: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
};

const FocusSession = {
  findAll: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
};

const CalendarIntegration = {
  findAll: jest.fn(),
};

const UserCalendarSetting = {
  findOne: jest.fn(),
  findOrCreate: jest.fn(),
};

const CalendarAvailabilitySnapshot = {
  findAll: jest.fn(),
  create: jest.fn(),
};

const MODEL_CONSTANTS = {
  CALENDAR_EVENT_TYPES: [
    'job_interview',
    'project',
    'mentorship',
    'volunteering',
    'event',
    'wellbeing',
  ],
  CALENDAR_EVENT_SOURCES: ['manual', 'gigvora'],
  CALENDAR_EVENT_VISIBILITIES: ['private', 'shared', 'public'],
  CALENDAR_DEFAULT_VIEWS: ['agenda', 'week', 'month'],
  FOCUS_SESSION_TYPES: ['deep_work', 'networking', 'mentorship', 'wellbeing', 'application'],
  CALENDAR_EVENT_SYNC_STATUSES: ['pending', 'synced', 'failed'],
};

jest.unstable_mockModule('../../src/models/index.js', () => ({
  CalendarIntegration,
  CandidateCalendarEvent,
  FocusSession,
  UserCalendarSetting,
  CalendarAvailabilitySnapshot,
}));

jest.unstable_mockModule('../../src/models/constants/index.js', () => MODEL_CONSTANTS);

const providerRegistry = {
  getCalendarProvider: jest.fn(),
};

jest.unstable_mockModule('../../src/services/calendarProviderRegistry.js', () => providerRegistry);

const calendarService = await import('../../src/services/calendarService.js');

const {
  getOverview,
  createEvent,
  updateEvent,
  deleteEvent,
  listFocusSessions,
  createFocusSession,
  updateFocusSession,
  deleteFocusSession,
  getSettings,
  updateSettings,
  recordAvailabilitySnapshot,
  listAvailabilitySnapshots,
  syncEventWithProvider,
} = calendarService;

function buildEventRecord(initial = {}) {
  const data = { ...initial };
  const record = {
    update: jest.fn(async (patch) => {
      Object.assign(data, patch);
      if (patch.syncMetadata !== undefined) {
        record.syncMetadata = patch.syncMetadata;
      }
      if (patch.syncStatus !== undefined) {
        record.syncStatus = patch.syncStatus;
      }
      if (patch.syncedRevision !== undefined) {
        data.syncedRevision = patch.syncedRevision;
      }
      if (patch.lastSyncedAt !== undefined) {
        data.lastSyncedAt = patch.lastSyncedAt;
      }
      return record;
    }),
    reload: jest.fn(async () => record),
    toPublicObject: jest.fn(() => ({ ...data })),
    syncMetadata: data.syncMetadata ?? null,
    syncStatus: data.syncStatus ?? 'pending',
    externalProvider: data.externalProvider ?? null,
    source: data.source ?? 'manual',
    get syncedRevision() {
      return data.syncedRevision ?? null;
    },
    set syncedRevision(value) {
      data.syncedRevision = value;
    },
  };
  return record;
}

function resetMocks() {
  CandidateCalendarEvent.findAll.mockReset();
  CandidateCalendarEvent.create.mockReset();
  CandidateCalendarEvent.findOne.mockReset();
  FocusSession.findAll.mockReset();
  FocusSession.create.mockReset();
  FocusSession.findOne.mockReset();
  CalendarIntegration.findAll.mockReset();
  UserCalendarSetting.findOne.mockReset();
  UserCalendarSetting.findOrCreate.mockReset();
  CalendarAvailabilitySnapshot.findAll.mockReset();
  CalendarAvailabilitySnapshot.create.mockReset();
  providerRegistry.getCalendarProvider.mockReset();
}

describe('calendarService', () => {
  beforeEach(() => {
    resetMocks();
    jest.useRealTimers();
    CalendarAvailabilitySnapshot.findAll.mockResolvedValue([]);
    providerRegistry.getCalendarProvider.mockReturnValue(null);
  });

  describe('getOverview', () => {
    it('hydrates calendar state with normalized events, focus sessions, integrations, and stats', async () => {
      const now = new Date('2025-02-20T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      const eventRecords = [
        {
          toPublicObject: () => ({
            id: 1,
            title: 'Hiring manager interview',
            eventType: 'job_interview',
            startsAt: '2025-02-23T14:00:00.000Z',
            endsAt: '2025-02-23T15:00:00.000Z',
            location: 'Zoom',
          }),
        },
        {
          toPublicObject: () => ({
            id: 2,
            title: 'Mentorship sync',
            eventType: 'mentorship',
            startsAt: '2025-02-18T18:00:00.000Z',
            endsAt: '2025-02-18T18:45:00.000Z',
            location: 'Google Meet',
          }),
        },
        {
          toPublicObject: () => ({
            id: 3,
            title: 'Wellbeing reset block',
            eventType: 'wellbeing',
            startsAt: '2025-02-21T11:30:00.000Z',
            endsAt: '2025-02-21T12:00:00.000Z',
          }),
        },
      ];
      CandidateCalendarEvent.findAll.mockResolvedValue(eventRecords);

      FocusSession.findAll.mockResolvedValue([
        {
          toPublicObject: () => ({
            id: 'focus-1',
            focusType: 'deep_work',
            startedAt: '2025-02-19T20:30:00.000Z',
            endedAt: '2025-02-19T22:00:00.000Z',
            durationMinutes: 90,
            completed: true,
          }),
        },
      ]);

      CalendarIntegration.findAll.mockResolvedValue([
        {
          toPublicObject: () => ({
            id: 'integration-1',
            provider: 'google',
            status: 'connected',
            lastSyncedAt: '2025-02-20T10:00:00.000Z',
          }),
        },
      ]);

      UserCalendarSetting.findOne.mockResolvedValue({
        toPublicObject: () => ({
          timezone: 'Europe/London',
          weekStart: 1,
          workStartMinutes: 480,
          workEndMinutes: 1050,
          defaultView: 'week',
          defaultReminderMinutes: 15,
          autoFocusBlocks: true,
          shareAvailability: true,
          colorHex: '#1E3A8A',
        }),
      });

      CalendarAvailabilitySnapshot.findAll.mockResolvedValue([
        {
          toPublicObject: () => ({
            id: 501,
            provider: 'google',
            syncedAt: '2025-02-20T11:15:00.000Z',
            availability: { slots: [] },
          }),
        },
      ]);

      const overview = await getOverview(42, {
        from: '2025-02-01T00:00:00.000Z',
        to: '2025-03-01T00:00:00.000Z',
        limit: 25,
      });

      const [eventQuery] = CandidateCalendarEvent.findAll.mock.calls[0];
      expect(eventQuery.order).toEqual([['startsAt', 'ASC']]);
      expect(eventQuery.limit).toBe(25);
      expect(eventQuery.where.userId).toBe(42);
      const { startsAt } = eventQuery.where;
      expect(startsAt[Op.gte]).toEqual(new Date('2025-02-01T00:00:00.000Z'));
      expect(startsAt[Op.lte]).toEqual(new Date('2025-03-01T00:00:00.000Z'));

      expect(overview.events).toHaveLength(3);
      expect(overview.events[0].startsAt).toBe('2025-02-23T14:00:00.000Z');
      expect(overview.focusSessions).toHaveLength(1);
      expect(overview.integrations[0]).toEqual(
        expect.objectContaining({ provider: 'google', lastSyncedAt: '2025-02-20T10:00:00.000Z' }),
      );
      expect(overview.settings.defaultView).toBe('week');
      expect(overview.stats).toEqual(
        expect.objectContaining({
          totalEvents: 3,
          upcomingEvents: 2,
          nextEvent: expect.objectContaining({ id: 3 }),
        }),
      );
      expect(overview.availability.latest).toMatchObject({ provider: 'google' });
      expect(overview.availability.snapshots).toHaveLength(1);
    });
  });

  describe('createEvent', () => {
    it('validates required properties', async () => {
      await expect(createEvent(7, { eventType: 'project' })).rejects.toThrow(ValidationError);
      await expect(
        createEvent(7, { title: 'Call', eventType: 'invalid', startsAt: '2025-02-21T12:00:00.000Z' }),
      ).rejects.toThrow('eventType is invalid');
    });

    it('persists sanitized payloads and returns the public event', async () => {
      const record = buildEventRecord({
        id: 88,
        title: 'Kickoff',
        eventType: 'project',
        startsAt: '2025-02-21T12:00:00.000Z',
        endsAt: '2025-02-21T13:30:00.000Z',
        colorHex: '#3366FF',
        syncStatus: 'pending',
      });
      CandidateCalendarEvent.create.mockResolvedValue(record);

      const result = await createEvent(9, {
        title: '  Kickoff  ',
        eventType: 'project',
        startsAt: '2025-02-21T12:00:00.000Z',
        endsAt: '2025-02-21T13:30:00.000Z',
        location: 'HQ',
        description: 'Client kickoff',
        reminderMinutes: '20',
        visibility: 'shared',
        colorHex: '3366ff',
        metadata: { seedSource: 'test' },
      });

      expect(CandidateCalendarEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 9,
          title: 'Kickoff',
          eventType: 'project',
          reminderMinutes: 20,
          colorHex: '#3366FF',
          visibility: 'shared',
          syncStatus: 'synced',
        }),
      );
      expect(record.update).toHaveBeenCalledWith(
        expect.objectContaining({
          syncStatus: 'synced',
          syncMetadata: expect.objectContaining({ provider: 'internal' }),
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 88,
          title: 'Kickoff',
          eventType: 'project',
          colorHex: '#3366FF',
          syncStatus: 'synced',
        }),
      );
    });
  });

  describe('updateEvent', () => {
    it('throws when the requested event does not exist', async () => {
      CandidateCalendarEvent.findOne.mockResolvedValue(null);
      await expect(updateEvent(11, 99, { title: 'Missing' })).rejects.toThrow(NotFoundError);
    });

    it('merges updates and returns the refreshed event', async () => {
      const state = {
        id: 12,
        userId: 11,
        title: 'Client onboarding workshop',
        eventType: 'project',
        startsAt: '2025-02-25T16:30:00.000Z',
        endsAt: '2025-02-25T17:45:00.000Z',
        visibility: 'private',
        reminderMinutes: 30,
        colorHex: '#0EA5E9',
        syncStatus: 'synced',
        syncMetadata: { provider: 'internal' },
      };

      const record = buildEventRecord(state);

      CandidateCalendarEvent.findOne.mockResolvedValue(record);

      const result = await updateEvent(11, 12, {
        title: 'Client onboarding & tooling workshop',
        reminderMinutes: 45,
        visibility: 'shared',
        colorHex: '#0ea5e9',
      });

      expect(record.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Client onboarding & tooling workshop',
          reminderMinutes: 45,
          visibility: 'shared',
          colorHex: '#0EA5E9',
        }),
      );
      expect(record.reload).toHaveBeenCalledTimes(1);
      expect(result.visibility).toBe('shared');
      expect(result.reminderMinutes).toBe(45);
      expect(record.update).toHaveBeenCalledWith(
        expect.objectContaining({
          syncStatus: 'synced',
          syncMetadata: expect.objectContaining({ provider: 'internal' }),
        }),
      );
    });
  });

  describe('deleteEvent', () => {
    it('removes persisted events', async () => {
      const destroy = jest.fn();
      CandidateCalendarEvent.findOne.mockResolvedValue({ destroy });

      await deleteEvent(42, 77);

      expect(destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('availability snapshots', () => {
    it('records availability snapshots with normalized metadata', async () => {
      CalendarAvailabilitySnapshot.create.mockResolvedValue({
        toPublicObject: () => ({
          id: 301,
          userId: 5,
          provider: 'google',
          syncedAt: '2025-02-20T10:00:00.000Z',
          availability: { slots: [] },
          metadata: { seedSource: 'test', window: 'pm' },
        }),
      });

      const snapshot = await recordAvailabilitySnapshot(5, 'Google', {
        availability: { slots: [] },
        metadata: { window: 'pm' },
        syncedAt: '2025-02-20T10:00:00.000Z',
      });

      expect(CalendarAvailabilitySnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 5, provider: 'google' }),
      );
      expect(snapshot).toMatchObject({ provider: 'google', syncedAt: '2025-02-20T10:00:00.000Z' });
    });

    it('lists availability snapshots by provider', async () => {
      CalendarAvailabilitySnapshot.findAll.mockResolvedValue([
        { toPublicObject: () => ({ id: 401, provider: 'google', syncedAt: '2025-02-20T10:00:00.000Z' }) },
      ]);

      const snapshots = await listAvailabilitySnapshots(7, { provider: 'google', limit: 1 });

      expect(CalendarAvailabilitySnapshot.findAll).toHaveBeenCalledWith({
        where: { userId: 7, provider: 'google' },
        order: [['syncedAt', 'DESC']],
        limit: 1,
      });
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].provider).toBe('google');
    });
  });

  describe('syncEventWithProvider', () => {
    it('marks manual events as synced without provider integration', async () => {
      const record = buildEventRecord({ id: 55, syncStatus: 'pending', syncMetadata: null });

      const outcome = await syncEventWithProvider(record, { reason: 'created' });

      expect(record.update).toHaveBeenCalledWith(
        expect.objectContaining({ syncStatus: 'synced', syncMetadata: expect.objectContaining({ provider: 'internal' }) }),
      );
      expect(outcome.status).toBe('synced');
      expect(record.syncMetadata.provider).toBe('internal');
    });

    it('delegates to registered providers and stores response metadata', async () => {
      const syncEvent = jest.fn().mockResolvedValue({ metadata: { providerEventId: 'ext-1' } });
      providerRegistry.getCalendarProvider.mockReturnValue({ syncEvent });

      const record = buildEventRecord({
        id: 56,
        externalProvider: 'google',
        source: 'google',
        syncStatus: 'pending',
        syncedRevision: 2,
      });

      const outcome = await syncEventWithProvider(record, { reason: 'updated' });

      expect(syncEvent).toHaveBeenCalledWith(record, { reason: 'updated' });
      expect(record.update).toHaveBeenCalledWith(
        expect.objectContaining({
          syncStatus: 'synced',
          syncedRevision: 3,
          syncMetadata: expect.objectContaining({ providerEventId: 'ext-1', provider: 'google' }),
        }),
      );
      expect(outcome.metadata).toEqual(expect.objectContaining({ provider: 'google', providerEventId: 'ext-1' }));
    });
  });

  describe('focus sessions', () => {
    it('lists focus sessions using the same overview pipeline', async () => {
      FocusSession.findAll.mockResolvedValue([
        {
          toPublicObject: () => ({ id: 'focus-1', focusType: 'deep_work', startedAt: '2025-02-19T20:30:00.000Z' }),
        },
      ]);

      const sessions = await listFocusSessions(31, { limit: 10 });
      expect(FocusSession.findAll).toHaveBeenCalledWith({
        where: { userId: 31 },
        order: [['startedAt', 'DESC']],
        limit: 10,
      });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].startedAt).toBe('2025-02-19T20:30:00.000Z');
    });

    it('validates create payloads and returns sanitized focus sessions', async () => {
      FocusSession.create.mockResolvedValue({
        toPublicObject: () => ({ id: 'focus-2', focusType: 'networking', startedAt: '2025-02-20T17:00:00.000Z' }),
      });

      const session = await createFocusSession(44, {
        focusType: 'networking',
        startedAt: '2025-02-20T17:00:00.000Z',
        durationMinutes: 45,
        notes: 'Warm outreach batch',
      });

      expect(FocusSession.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 44, focusType: 'networking', durationMinutes: 45 }),
      );
      expect(session.id).toBe('focus-2');

      await expect(
        createFocusSession(44, { focusType: 'unknown', startedAt: '2025-02-20T17:00:00.000Z' }),
      ).rejects.toThrow(ValidationError);
    });

    it('updates and deletes focus sessions with ownership checks', async () => {
      const state = {
        id: 'focus-3',
        userId: 51,
        focusType: 'deep_work',
        startedAt: '2025-02-19T20:30:00.000Z',
        endedAt: '2025-02-19T22:00:00.000Z',
        durationMinutes: 90,
        completed: true,
      };

      const record = {
        update: jest.fn(async (patch) => {
          Object.assign(state, patch);
          return record;
        }),
        reload: jest.fn(async () => record),
        toPublicObject: jest.fn(() => ({ ...state })),
      };

      FocusSession.findOne.mockResolvedValueOnce(record);

      const updated = await updateFocusSession(51, 'focus-3', {
        focusType: 'mentorship',
        durationMinutes: 60,
        completed: false,
      });

      expect(record.update).toHaveBeenCalledWith(
        expect.objectContaining({ focusType: 'mentorship', durationMinutes: 60, completed: false }),
      );
      expect(updated.focusType).toBe('mentorship');

      FocusSession.findOne.mockResolvedValueOnce({ destroy: jest.fn() });
      await deleteFocusSession(51, 'focus-3');
      expect(FocusSession.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('calendar settings', () => {
    it('returns defaults when settings are missing', async () => {
      UserCalendarSetting.findOne.mockResolvedValue(null);
      const settings = await getSettings(99);
      expect(settings.timezone).toBe('UTC');
      expect(settings.weekStart).toBe(1);
      expect(settings.autoFocusBlocks).toBe(false);
    });

    it('creates or updates settings with normalized payloads', async () => {
      const state = {
        id: 10,
        userId: 77,
        timezone: 'UTC',
        weekStart: 1,
        workStartMinutes: 480,
        workEndMinutes: 1020,
        defaultView: 'agenda',
        defaultReminderMinutes: 30,
        autoFocusBlocks: false,
        shareAvailability: false,
        colorHex: null,
        metadata: null,
      };

      const record = {
        isNewRecord: false,
        update: jest.fn(async (patch) => {
          Object.assign(state, patch);
          return record;
        }),
        reload: jest.fn(async () => record),
        toPublicObject: jest.fn(() => ({ ...state })),
      };

      UserCalendarSetting.findOrCreate.mockResolvedValue([record]);

      const result = await updateSettings(77, {
        timezone: 'Europe/London',
        weekStart: 1,
        workStartMinutes: 7 * 60,
        workEndMinutes: 16 * 60,
        defaultView: 'week',
        defaultReminderMinutes: 20,
        autoFocusBlocks: true,
        shareAvailability: true,
        colorHex: '#1e40af',
      });

      expect(record.update).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: 'Europe/London',
          workStartMinutes: 420,
          workEndMinutes: 960,
          defaultView: 'week',
          defaultReminderMinutes: 20,
          colorHex: '#1E40AF',
        }),
      );
      expect(record.reload).toHaveBeenCalledTimes(1);
      expect(result.timezone).toBe('Europe/London');
      expect(result.colorHex).toBe('#1E40AF');
    });
  });
});
