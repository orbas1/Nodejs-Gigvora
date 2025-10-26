import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const modelsModuleSpecifier = '../../../tests/stubs/modelsIndexStub.js';

const {
  __setModelStubs,
  sequelize: modelSequelize,
  User,
  UserPresenceStatus,
  UserPresenceEvent,
  UserPresenceWindow,
  FocusSession,
  CalendarIntegration,
  CandidateCalendarEvent,
  CalendarSyncJob,
} = await import(modelsModuleSpecifier);

const calendarSyncServiceModuleUrl = new URL('../calendarSyncService.js', import.meta.url);
const triggerCalendarSyncMock = jest.fn();

jest.unstable_mockModule(calendarSyncServiceModuleUrl.pathname, () => ({
  triggerCalendarSync: triggerCalendarSyncMock,
}));

const {
  getPresenceSnapshot,
  updatePresenceStatus,
  startFocusSession,
  endFocusSession,
  scheduleAvailabilityWindow,
  refreshCalendarSync,
} = await import('../presenceService.js');

function createPresenceRecord(overrides = {}) {
  return {
    availability: 'available',
    message: null,
    online: true,
    focusUntil: null,
    lastSeenAt: null,
    calendarLastSyncedAt: null,
    supportedStates: ['available', 'away', 'focus'],
    metadata: null,
    activeFocusSessionId: null,
    save: jest.fn(),
    toPublicObject: jest.fn(() => ({
      userId: overrides.userId ?? 42,
      availability: overrides.availability ?? 'available',
      message: overrides.message ?? null,
      online: overrides.online ?? true,
      focusUntil: overrides.focusUntil ?? null,
      lastSeenAt: overrides.lastSeenAt ?? null,
      supportedStates: overrides.supportedStates ?? ['available', 'away', 'focus'],
      metadata: overrides.metadata ?? null,
    })),
    ...overrides,
  };
}

describe('presenceService', () => {
  let userStub;
  let presenceStatusStub;
  let presenceEventStub;
  let presenceWindowStub;
  let focusSessionStub;
  let calendarIntegrationStub;
  let candidateEventStub;
  let calendarSyncJobStub;
  let transaction;

  beforeEach(() => {
    transaction = { LOCK: { UPDATE: 'UPDATE' } };
    modelSequelize.transaction = jest.fn(async (handler) => handler(transaction));

    userStub = { findOne: jest.fn() };
    presenceStatusStub = { findOrCreate: jest.fn(), update: jest.fn() };
    presenceEventStub = { create: jest.fn(), bulkCreate: jest.fn(), findAll: jest.fn() };
    presenceWindowStub = { create: jest.fn() };
    focusSessionStub = { findOne: jest.fn(), create: jest.fn() };
    calendarIntegrationStub = { findAll: jest.fn() };
    candidateEventStub = { findAll: jest.fn() };
    calendarSyncJobStub = { findOne: jest.fn() };

    __setModelStubs({
      User: userStub,
      UserPresenceStatus: presenceStatusStub,
      UserPresenceEvent: presenceEventStub,
      UserPresenceWindow: presenceWindowStub,
      FocusSession: focusSessionStub,
      CalendarIntegration: calendarIntegrationStub,
      CandidateCalendarEvent: candidateEventStub,
      CalendarSyncJob: calendarSyncJobStub,
    });

    User.findOne = userStub.findOne.bind(userStub);
    UserPresenceStatus.findOrCreate = presenceStatusStub.findOrCreate.bind(presenceStatusStub);
    UserPresenceStatus.update = presenceStatusStub.update.bind(presenceStatusStub);
    UserPresenceEvent.create = presenceEventStub.create.bind(presenceEventStub);
    UserPresenceEvent.findAll = presenceEventStub.findAll.bind(presenceEventStub);
    UserPresenceEvent.bulkCreate = presenceEventStub.bulkCreate.bind(presenceEventStub);
    UserPresenceWindow.create = presenceWindowStub.create.bind(presenceWindowStub);
    FocusSession.findOne = focusSessionStub.findOne.bind(focusSessionStub);
    FocusSession.create = focusSessionStub.create.bind(focusSessionStub);
    CalendarIntegration.findAll = calendarIntegrationStub.findAll.bind(calendarIntegrationStub);
    CandidateCalendarEvent.findAll = candidateEventStub.findAll.bind(candidateEventStub);
    CalendarSyncJob.findOne = calendarSyncJobStub.findOne.bind(calendarSyncJobStub);

    triggerCalendarSyncMock.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('builds comprehensive presence snapshots with calendar and focus context', async () => {
    const presenceRecord = createPresenceRecord({
      userId: 42,
      availability: 'in_meeting',
      message: 'Hosting leadership sync',
      calendarLastSyncedAt: new Date('2024-05-18T10:05:00.000Z'),
      toPublicObject: jest.fn(() => ({
        userId: 42,
        availability: 'in_meeting',
        message: 'Hosting leadership sync',
        online: true,
        focusUntil: null,
        lastSeenAt: new Date('2024-05-18T11:55:00.000Z'),
        supportedStates: ['available', 'focus', 'in_meeting'],
      })),
    });

    userStub.findOne.mockResolvedValue({
      id: 42,
      firstName: 'Ava',
      lastName: 'Lee',
      email: 'ava@gigvora.com',
    });
    presenceStatusStub.findOrCreate.mockResolvedValue([presenceRecord, false]);
    calendarIntegrationStub.findAll.mockResolvedValue([
      { provider: 'google', status: 'connected', lastSyncedAt: '2024-05-18T11:00:00.000Z' },
      { provider: 'microsoft', status: 'disconnected', lastSyncedAt: null },
    ]);
    candidateEventStub.findAll.mockResolvedValue([
      { toPublicObject: () => ({ id: 'evt-1', title: 'Design review', startsAt: '2024-05-18T13:00:00.000Z' }) },
    ]);
    calendarSyncJobStub.findOne.mockResolvedValue({
      status: 'success',
      lastSyncedAt: '2024-05-18T11:30:00.000Z',
      nextSyncAt: '2024-05-18T14:00:00.000Z',
    });
    focusSessionStub.findOne.mockResolvedValue({
      toPublicObject: () => ({ id: 'focus-1', startedAt: '2024-05-18T11:45:00.000Z' }),
    });
    presenceEventStub.findAll.mockResolvedValue([
      { toPublicObject: () => ({ id: 'event-1', eventType: 'huddle' }) },
    ]);

    const result = await getPresenceSnapshot(42);

    expect(result.user).toEqual({ id: 42, name: 'Ava Lee', email: 'ava@gigvora.com' });
    expect(result.snapshot.availability).toBe('in_meeting');
    expect(result.snapshot.calendar.providers).toEqual(['google', 'microsoft']);
    expect(result.snapshot.calendar.connectedProviders).toEqual(['google']);
    expect(result.snapshot.calendar.upcoming).toEqual([
      expect.objectContaining({ id: 'evt-1', title: 'Design review' }),
    ]);
    expect(result.snapshot.activeFocusSession).toEqual({ id: 'focus-1', startedAt: '2024-05-18T11:45:00.000Z' });
    expect(result.snapshot.timeline).toEqual([expect.objectContaining({ id: 'event-1' })]);
    expect(presenceStatusStub.findOrCreate).toHaveBeenCalledWith({
      where: { userId: 42 },
      defaults: expect.objectContaining({ availability: 'available' }),
    });
  });

  it('updates presence status and records a status change event', async () => {
    const presenceRecord = createPresenceRecord({ userId: 101 });
    presenceStatusStub.findOrCreate.mockResolvedValue([presenceRecord, false]);

    const updated = await updatePresenceStatus(101, {
      availability: 'focus',
      message: 'Deep work block',
      focusUntil: '2024-05-18T15:30:00.000Z',
      metadata: { location: 'HQ North' },
    });

    expect(modelSequelize.transaction).toHaveBeenCalled();
    expect(presenceRecord.save).toHaveBeenCalled();
    expect(presenceRecord.availability).toBe('focus');
    expect(presenceRecord.message).toBe('Deep work block');
    expect(presenceRecord.focusUntil).toBeInstanceOf(Date);
    expect(updated).toEqual(presenceRecord.toPublicObject.mock.results[0].value);
    expect(presenceEventStub.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 101,
        eventType: 'status_change',
        metadata: { availability: 'focus' },
      }),
      expect.objectContaining({ transaction }),
    );
  });

  it('starts a focus session, updates availability, and emits tracking event', async () => {
    const presenceRecord = createPresenceRecord({ userId: 88 });
    presenceStatusStub.findOrCreate.mockResolvedValue([presenceRecord, false]);
    const session = {
      id: 55,
      toPublicObject: () => ({ id: 55, focusType: 'deep_work' }),
    };
    focusSessionStub.create.mockResolvedValue(session);

    const result = await startFocusSession(88, {
      durationMinutes: 50,
      note: 'Executive review prep',
      focusType: 'prep',
      autoMute: false,
    });

    expect(modelSequelize.transaction).toHaveBeenCalled();
    expect(focusSessionStub.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 88, durationMinutes: 50, focusType: 'prep' }),
      expect.objectContaining({ transaction }),
    );
    expect(presenceRecord.availability).toBe('focus');
    expect(presenceRecord.activeFocusSessionId).toBe(55);
    expect(result).toEqual({ id: 55, focusType: 'deep_work' });
    expect(presenceEventStub.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 88,
        eventType: 'focus_session',
        title: 'Focus session started',
      }),
      expect.objectContaining({ transaction }),
    );
  });

  it('ends an active focus session and restores availability', async () => {
    const presenceRecord = createPresenceRecord({ userId: 77, availability: 'focus' });
    presenceStatusStub.findOrCreate.mockResolvedValue([presenceRecord, false]);
    const session = {
      id: 912,
      startedAt: '2024-05-18T12:00:00.000Z',
      completed: false,
      durationMinutes: null,
      save: jest.fn(),
      toPublicObject: () => ({ id: 912, completed: true }),
    };
    focusSessionStub.findOne.mockResolvedValue(session);

    const result = await endFocusSession(77);

    expect(session.save).toHaveBeenCalled();
    expect(presenceRecord.availability).toBe('available');
    expect(presenceRecord.activeFocusSessionId).toBeNull();
    expect(result).toEqual({ id: 912, completed: true });
    expect(presenceEventStub.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 77,
        eventType: 'focus_session',
        title: 'Focus session completed',
      }),
      expect.objectContaining({ transaction }),
    );
  });

  it('creates an availability window and logs it on the timeline', async () => {
    const windowRecord = {
      toPublicObject: () => ({ id: 'window-1', timezone: 'UTC' }),
    };
    presenceWindowStub.create.mockResolvedValue(windowRecord);
    presenceEventStub.create.mockResolvedValue(undefined);

    const result = await scheduleAvailabilityWindow(55, {
      startAt: '2024-05-20T09:00:00.000Z',
      endAt: '2024-05-20T10:30:00.000Z',
      recurringRule: 'FREQ=WEEKLY;BYDAY=MO,WE',
      note: 'Mentor office hours',
      timezone: 'America/New_York',
    });

    expect(modelSequelize.transaction).toHaveBeenCalled();
    expect(presenceWindowStub.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 55,
        recurringRule: 'FREQ=WEEKLY;BYDAY=MO,WE',
        timezone: 'America/New_York',
      }),
      expect.objectContaining({ transaction }),
    );
    expect(result).toEqual({ id: 'window-1', timezone: 'UTC' });
    expect(presenceEventStub.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 55,
        eventType: 'availability_window',
        title: 'Availability window scheduled',
      }),
      expect.objectContaining({ transaction }),
    );
  });

  it('triggers calendar refreshes and appends calendar events', async () => {
    triggerCalendarSyncMock.mockResolvedValue({ id: 203, status: 'queued' });

    const result = await refreshCalendarSync(44, { actorId: 9 });

    expect(triggerCalendarSyncMock).toHaveBeenCalledWith(44, { actorId: 9 });
    expect(result).toEqual({ id: 203, status: 'queued' });
    expect(presenceEventStub.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 44,
        eventType: 'calendar_sync',
        metadata: { jobId: 203 },
      }),
      { transaction: undefined },
    );
  });
});
