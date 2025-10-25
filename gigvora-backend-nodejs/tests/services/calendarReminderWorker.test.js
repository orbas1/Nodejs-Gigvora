import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const CandidateCalendarEvent = {
  findAll: jest.fn(),
};

const queueNotificationMock = jest.fn();

jest.unstable_mockModule('../../src/models/index.js', () => ({
  CandidateCalendarEvent,
}));

jest.unstable_mockModule('../../src/services/notificationService.js', () => ({
  queueNotification: queueNotificationMock,
}));

const { CalendarReminderWorker } = await import('../../src/services/calendarReminderWorker.js');

function buildEventRecord({ id, userId, startsAt, reminderMinutes, metadata = {} }) {
  const data = { id, threadId: 1, userId, startsAt, reminderMinutes, metadata };
  const record = {
    ...data,
    toPublicObject: () => ({ ...data }),
    update: jest.fn(async (patch) => {
      Object.assign(data, patch);
      return record;
    }),
    get metadata() {
      return data.metadata;
    },
    set metadata(value) {
      data.metadata = value;
    },
  };
  return record;
}

describe('CalendarReminderWorker', () => {
  beforeEach(() => {
    CandidateCalendarEvent.findAll.mockReset();
    queueNotificationMock.mockReset();
  });

  it('dispatches reminders for due events and updates metadata', async () => {
    const now = new Date();
    const startsAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    const record = buildEventRecord({
      id: 1,
      userId: 99,
      startsAt,
      reminderMinutes: 10,
      metadata: {},
    });
    CandidateCalendarEvent.findAll.mockResolvedValue([record]);
    queueNotificationMock.mockResolvedValue({ id: 'notif-1' });

    const worker = new CalendarReminderWorker({ lookaheadMinutes: 30, batchSize: 5, logger: null });
    const summary = await worker.run();

    expect(queueNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 99, type: 'calendar_reminder' }),
    );
    expect(record.update).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ remindersSent: expect.arrayContaining([expect.any(String)]) }),
      }),
    );
    expect(record.metadata.remindersSent).toHaveLength(1);
    expect(summary.dispatched).toBe(1);
    expect(summary.events[0]).toMatchObject({ eventId: 1 });
  });

  it('skips events that are not yet due', async () => {
    const futureStart = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const record = buildEventRecord({
      id: 2,
      userId: 77,
      startsAt: futureStart,
      reminderMinutes: 30,
      metadata: {},
    });
    CandidateCalendarEvent.findAll.mockResolvedValue([record]);

    const worker = new CalendarReminderWorker({ lookaheadMinutes: 30, batchSize: 5, logger: null });
    const summary = await worker.run();

    expect(queueNotificationMock).not.toHaveBeenCalled();
    expect(summary.dispatched).toBe(0);
  });

  it('ignores events that already had the reminder dispatched', async () => {
    const now = new Date();
    const startsAtDate = new Date(now.getTime() + 3 * 60 * 1000);
    const reminderMinutes = 5;
    const reminderKey = `${startsAtDate.toISOString()}:${reminderMinutes}`;
    const record = buildEventRecord({
      id: 3,
      userId: 55,
      startsAt: startsAtDate.toISOString(),
      reminderMinutes,
      metadata: { remindersSent: [reminderKey] },
    });
    CandidateCalendarEvent.findAll.mockResolvedValue([record]);

    const worker = new CalendarReminderWorker({ lookaheadMinutes: 30, batchSize: 5, logger: null });
    const summary = await worker.run();

    expect(queueNotificationMock).not.toHaveBeenCalled();
    expect(record.update).not.toHaveBeenCalled();
    expect(summary.dispatched).toBe(0);
  });
});
