import { z } from 'zod';
import {
  UserEvent,
  USER_EVENT_VISIBILITIES,
  USER_EVENT_FORMATS,
} from '../models/eventManagement.js';
import { listEventStreamsForActor } from './channelRegistry.js';
import { ApplicationError, AuthorizationError } from '../utils/errors.js';

const scheduleEventSchema = z.object({
  stream: z.string().min(1),
  title: z.string().min(5).max(180),
  description: z.string().max(2_000).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional(),
  timezone: z.string().min(2).max(80).default('UTC'),
  format: z.enum(USER_EVENT_FORMATS).default('virtual'),
  visibility: z.enum(USER_EVENT_VISIBILITIES).default('invite_only'),
  registrationUrl: z.string().url().optional(),
});

function resolveStreamRoom(stream) {
  return `events:${stream}`;
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
        const parsed = scheduleEventSchema.parse(payload);
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
          registrationUrl: parsed.registrationUrl ?? null,
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
          stream: payload.stream,
          message: error instanceof z.ZodError ? 'Invalid event payload.' : error.message,
          details: error instanceof z.ZodError ? error.flatten() : undefined,
        });
      }
    });

    socket.on('events:announce', ({ stream, message, metadata }) => {
      if (!stream) {
        return;
      }
      if (!eventsState.allowedStreams.has(stream)) {
        return;
      }
      namespace.to(resolveStreamRoom(stream)).emit('events:announcement', {
        stream,
        message: message ?? '',
        metadata: metadata ?? {},
        publishedAt: new Date().toISOString(),
        publishedBy: actor?.id,
      });
    });

    socket.on('disconnect', (reason) => {
      eventsLogger?.debug({ reason }, 'Events socket disconnected');
    });
  });

  return namespace;
}

export default registerEventsNamespace;
