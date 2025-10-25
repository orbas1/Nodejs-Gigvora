import { Op } from 'sequelize';
import { CandidateCalendarEvent } from '../models/index.js';
import { queueNotification } from './notificationService.js';

const DEFAULT_LOOKAHEAD_MINUTES = Math.max(
  Number.parseInt(process.env.CALENDAR_REMINDER_LOOKAHEAD_MINUTES ?? '120', 10) || 120,
  5,
);
const DEFAULT_BATCH_SIZE = Math.max(
  Number.parseInt(process.env.CALENDAR_REMINDER_BATCH_SIZE ?? '50', 10) || 50,
  1,
);

function ensureDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function extractMetadata(record) {
  if (record?.metadata && typeof record.metadata === 'object') {
    return { ...record.metadata };
  }
  return {};
}

export class CalendarReminderWorker {
  constructor({ lookaheadMinutes = DEFAULT_LOOKAHEAD_MINUTES, batchSize = DEFAULT_BATCH_SIZE, logger = console } = {}) {
    this.lookaheadMinutes = Math.max(Number(lookaheadMinutes) || DEFAULT_LOOKAHEAD_MINUTES, 5);
    this.batchSize = Math.max(Number(batchSize) || DEFAULT_BATCH_SIZE, 1);
    this.logger = logger ?? console;
  }

  computeWindow() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + this.lookaheadMinutes * 60 * 1000);
    return { now, windowEnd };
  }

  async fetchCandidateEvents(now, windowEnd) {
    const toleranceStart = new Date(now.getTime() - 10 * 60 * 1000);
    const toleranceEnd = new Date(windowEnd.getTime() + 10 * 60 * 1000);

    return CandidateCalendarEvent.findAll({
      where: {
        reminderMinutes: { [Op.not]: null },
        startsAt: { [Op.between]: [toleranceStart, toleranceEnd] },
      },
      limit: this.batchSize,
      order: [['startsAt', 'ASC']],
    });
  }

  resolveReminderDescriptor(event, now) {
    const startsAt = ensureDate(event.startsAt);
    if (!startsAt) {
      return null;
    }
    if (startsAt.getTime() < now.getTime()) {
      return null;
    }
    const reminderMinutes = Number.isFinite(Number(event.reminderMinutes))
      ? Number(event.reminderMinutes)
      : 0;
    const reminderTime = new Date(startsAt.getTime() - reminderMinutes * 60 * 1000);
    if (reminderTime.getTime() > now.getTime()) {
      // not yet due
      return null;
    }
    const reminderKey = `${startsAt.toISOString()}:${reminderMinutes}`;
    const metadata = extractMetadata(event);
    const remindersSent = Array.isArray(metadata.remindersSent) ? metadata.remindersSent : [];
    if (remindersSent.includes(reminderKey)) {
      return null;
    }
    return { reminderKey, reminderTime, startsAt, reminderMinutes };
  }

  buildNotificationPayload(event) {
    const title = event.title ?? 'Upcoming event';
    const bodyParts = [];
    if (event.location) {
      bodyParts.push(`Location: ${event.location}`);
    }
    if (event.videoConferenceLink) {
      bodyParts.push(`Conference: ${event.videoConferenceLink}`);
    }
    return {
      userId: event.userId,
      category: 'calendar',
      priority: 'high',
      type: 'calendar_reminder',
      title: `Calendar reminder: ${title}`,
      body: bodyParts.length ? bodyParts.join(' \u2022 ') : null,
      payload: {
        eventId: event.id,
        startsAt: event.startsAt,
        title,
        reminderMinutes: event.reminderMinutes,
      },
      expiresAt: ensureDate(event.endsAt) ?? ensureDate(event.startsAt),
    };
  }

  async dispatchReminder(record, descriptor) {
    const event = record.toPublicObject ? record.toPublicObject() : record;
    event.reminderMinutes = descriptor.reminderMinutes;
    const notificationPayload = this.buildNotificationPayload(event);
    await queueNotification(notificationPayload);

    const metadata = extractMetadata(record);
    const remindersSent = Array.isArray(metadata.remindersSent) ? [...metadata.remindersSent] : [];
    remindersSent.push(descriptor.reminderKey);
    metadata.remindersSent = remindersSent.slice(-10);
    metadata.lastReminderAt = new Date().toISOString();

    await record.update({ metadata });
    return {
      eventId: record.id,
      reminderKey: descriptor.reminderKey,
      startsAt: descriptor.startsAt.toISOString(),
      reminderTime: descriptor.reminderTime.toISOString(),
    };
  }

  async run() {
    const { now, windowEnd } = this.computeWindow();
    const candidates = await this.fetchCandidateEvents(now, windowEnd);
    const dispatched = [];

    for (const record of candidates) {
      const event = record.toPublicObject ? record.toPublicObject() : record;
      const descriptor = this.resolveReminderDescriptor(event, now);
      if (!descriptor) {
        continue;
      }
      if (!event.userId) {
        this.logger?.warn?.('Skipping calendar reminder due to missing userId', { eventId: record.id });
        continue;
      }
      try {
        const result = await this.dispatchReminder(record, descriptor);
        dispatched.push(result);
      } catch (error) {
        this.logger?.error?.('Failed to dispatch calendar reminder', {
          eventId: record.id,
          error: error?.message ?? error,
        });
      }
    }

    return {
      dispatched: dispatched.length,
      events: dispatched,
      window: { start: now.toISOString(), end: windowEnd.toISOString() },
    };
  }
}

export default CalendarReminderWorker;
