import { Op } from 'sequelize';
import {
  UserEvent,
  USER_EVENT_VISIBILITIES,
  USER_EVENT_FORMATS,
} from '../models/eventManagement.js';
import { listEventStreamsForActor } from './channelRegistry.js';
import { ApplicationError, AuthorizationError } from '../utils/errors.js';

function buildPayloadError(issues) {
  const error = new ApplicationError('Invalid event payload.');
  error.details = { issues };
  return error;
}

function normaliseString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseSchedulePayload(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    throw buildPayloadError([{ field: 'payload', message: 'Payload must be an object.' }]);
  }

  const issues = [];
  const stream = normaliseString(payload.stream);
  if (!stream) {
    issues.push({ field: 'stream', message: 'Stream is required.' });
  }

  const title = normaliseString(payload.title);
  if (title.length < 5 || title.length > 180) {
    issues.push({ field: 'title', message: 'Title must be between 5 and 180 characters.' });
  }

  const description = normaliseString(payload.description);
  if (description.length > 2_000) {
    issues.push({ field: 'description', message: 'Description must be 2,000 characters or fewer.' });
  }

  const startAtRaw = payload.startAt;
  const startAt = new Date(startAtRaw);
  if (!startAtRaw || Number.isNaN(startAt.getTime())) {
    issues.push({ field: 'startAt', message: 'startAt must be a valid date.' });
  } else if (startAt.getTime() < Date.now() - 60 * 60 * 1_000) {
    issues.push({ field: 'startAt', message: 'Events cannot start more than an hour in the past.' });
  }

  let endAt = null;
  if (payload.endAt) {
    const candidate = new Date(payload.endAt);
    if (Number.isNaN(candidate.getTime())) {
      issues.push({ field: 'endAt', message: 'endAt must be a valid date when provided.' });
    } else if (!Number.isNaN(startAt.getTime()) && candidate < startAt) {
      issues.push({ field: 'endAt', message: 'End time must be after the start time.' });
    } else {
      endAt = candidate;
    }
  }

  const timezone = (() => {
    const value = normaliseString(payload.timezone);
    if (!value) {
      return 'UTC';
    }
    if (value.length < 2 || value.length > 80) {
      issues.push({ field: 'timezone', message: 'Timezone must be between 2 and 80 characters.' });
    }
    return value.slice(0, 80);
  })();

  const format = USER_EVENT_FORMATS.includes(payload.format) ? payload.format : 'virtual';
  const visibility = USER_EVENT_VISIBILITIES.includes(payload.visibility) ? payload.visibility : 'invite_only';

  let registrationUrl = null;
  if (payload.registrationUrl) {
    try {
      registrationUrl = new URL(String(payload.registrationUrl)).toString();
    } catch (_error) {
      issues.push({ field: 'registrationUrl', message: 'registrationUrl must be a valid URL when provided.' });
    }
  }

  if (issues.length) {
    throw buildPayloadError(issues);
  }

  return {
    stream,
    title,
    description: description || null,
    startAt,
    endAt,
    timezone,
    format,
    visibility,
    registrationUrl,
  };
}

function parseAnnouncementPayload(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    throw buildPayloadError([{ field: 'payload', message: 'Payload must be an object.' }]);
  }
  const stream = normaliseString(payload.stream);
  if (!stream) {
    throw buildPayloadError([{ field: 'stream', message: 'Stream is required.' }]);
  }
  const message = normaliseString(payload.message).slice(0, 2_000);
  const metadata = sanitiseMetadata(payload.metadata);
  return { stream, message, metadata };
}

function resolveStreamRoom(stream) {
  return `events:${stream}`;
}

function sanitiseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  try {
    return JSON.parse(JSON.stringify(metadata));
  } catch (_error) {
    return {};
  }
}

export function registerEventsNamespace(io, { logger }) {
  const namespace = io.of('/events');

  namespace.use((socket, next) => {
    const actor = socket.data?.actor;
    if (!actor?.id) {
      return next(new AuthorizationError('Authentication required for event scheduling.'));
    }
    const streams = listEventStreamsForActor({ roles: actor.roles, permissions: actor.permissions });
    socket.data.events = {
      allowedStreams: new Map(streams.map((stream) => [stream.slug, stream])),
    };
    return next();
  });

  namespace.on('connection', (socket) => {
    const actor = socket.data?.actor;
    const eventsState = socket.data.events;
    const eventsLogger = logger?.child({ component: 'events-namespace', userId: actor?.id, socketId: socket.id });

    socket.on('events:list', () => {
      socket.emit('events:streams', Array.from(eventsState.allowedStreams.values()));
    });

    socket.on('events:subscribe', async ({ stream } = {}) => {
      try {
        if (!stream) {
          throw new ApplicationError('Stream is required.');
        }
        if (!eventsState.allowedStreams.has(stream)) {
          throw new AuthorizationError('You do not have access to this event stream.');
        }
        await socket.join(resolveStreamRoom(stream));
        socket.emit('events:subscribed', { stream });
      } catch (error) {
        eventsLogger?.warn({ err: error, stream }, 'Failed to subscribe to event stream');
        socket.emit('events:error', { stream, message: error.message });
      }
    });

    socket.on('events:unsubscribe', async ({ stream } = {}) => {
      try {
        if (!stream) {
          throw new ApplicationError('Stream is required.');
        }
        await socket.leave(resolveStreamRoom(stream));
        socket.emit('events:unsubscribed', { stream });
      } catch (error) {
        eventsLogger?.warn({ err: error, stream }, 'Failed to unsubscribe from event stream');
      }
    });

    socket.on('events:schedule', async (payload = {}) => {
      try {
        const actorId = actor?.id;
        if (!actorId) {
          throw new AuthorizationError('Authentication required.');
        }
        const parsed = parseSchedulePayload(payload);
        if (!eventsState.allowedStreams.has(parsed.stream)) {
          throw new AuthorizationError('You do not have permission to schedule events for this stream.');
        }

        const event = await UserEvent.create({
          ownerId: actorId,
          title: parsed.title,
          description: parsed.description ?? null,
          status: 'planned',
          format: parsed.format,
          visibility: parsed.visibility,
          startAt: parsed.startAt,
          endAt: parsed.endAt ?? null,
          timezone: parsed.timezone,
          registrationUrl: parsed.registrationUrl,
          metadata: {
            stream: parsed.stream,
            scheduledBy: actorId,
          },
        });

        const room = resolveStreamRoom(parsed.stream);
        namespace.to(room).emit('events:scheduled', {
          stream: parsed.stream,
          event: {
            id: event.id,
            title: event.title,
            startAt: event.startAt,
            endAt: event.endAt,
            timezone: event.timezone,
            visibility: event.visibility,
            format: event.format,
          },
        });

        socket.emit('events:scheduled:ack', {
          id: event.id,
          stream: parsed.stream,
        });
        eventsLogger?.info({ eventId: event.id, stream: parsed.stream }, 'Scheduled community event');
      } catch (error) {
        eventsLogger?.warn({ err: error }, 'Failed to schedule event');
        socket.emit('events:error', {
          stream: payload?.stream,
          message: error instanceof ApplicationError ? error.message : 'Failed to schedule event.',
          details: error.details,
        });
      }
    });

    socket.on('events:history', async ({ stream, limit = 10 } = {}) => {
      try {
        if (!stream) {
          throw new ApplicationError('Stream is required.');
        }
        if (!eventsState.allowedStreams.has(stream)) {
          throw new AuthorizationError('You do not have access to this event stream.');
        }
        const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 50);
        const upcomingEvents = await UserEvent.findAll({
          where: {
            status: { [Op.notIn]: ['cancelled', 'archived'] },
            startAt: { [Op.or]: [{ [Op.is]: null }, { [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) }] },
          },
          order: [
            ['startAt', 'ASC'],
            ['createdAt', 'DESC'],
          ],
          limit: safeLimit * 3,
        });

        const filtered = upcomingEvents
          .filter((event) => event.metadata?.stream === stream)
          .slice(0, safeLimit)
          .map((event) => ({
            id: event.id,
            title: event.title,
            startAt: event.startAt,
            endAt: event.endAt,
            timezone: event.timezone,
            visibility: event.visibility,
            format: event.format,
          }));

        socket.emit('events:history:list', { stream, events: filtered });
      } catch (error) {
        eventsLogger?.warn({ err: error, stream }, 'Failed to fetch event history');
        socket.emit('events:error', { stream, message: error.message });
      }
    });

    socket.on('events:announce', (rawPayload = {}) => {
      try {
        const { stream, message, metadata } = parseAnnouncementPayload(rawPayload);
        if (!eventsState.allowedStreams.has(stream)) {
          eventsLogger?.warn({ stream }, 'Actor attempted to announce to an unauthorised stream');
          return;
        }
        namespace.to(resolveStreamRoom(stream)).emit('events:announcement', {
          stream,
          message,
          metadata,
          publishedAt: new Date().toISOString(),
          publishedBy: actor?.id,
        });
      } catch (error) {
        eventsLogger?.warn({ err: error, payload: rawPayload }, 'Invalid announcement payload');
        socket.emit('events:error', {
          stream: rawPayload?.stream,
          message: error instanceof ApplicationError ? error.message : 'Invalid announcement payload.',
          details: error.details,
        });
      }
    });

    socket.on('disconnect', (reason) => {
      eventsLogger?.debug({ reason }, 'Events socket disconnected');
    });
  });

  return namespace;
}

export default registerEventsNamespace;
