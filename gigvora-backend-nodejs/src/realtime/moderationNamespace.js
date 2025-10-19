import { listChannelsForActor } from './channelRegistry.js';
import {
  muteParticipant,
  removeMessage,
  describeChannelState,
} from '../services/communityChatService.js';
import {
  listModerationQueue,
  listModerationEvents,
  getModerationOverview,
  resolveModerationEvent,
} from '../services/communityModerationService.js';
import { ApplicationError, AuthorizationError } from '../utils/errors.js';
import moderationEvents, { MODERATION_EVENT_TYPES } from '../events/moderationEvents.js';

function hasModerationAccess(actor) {
  const roleSet = new Set((actor?.roles ?? []).map((role) => String(role).toLowerCase()));
  const permissionSet = new Set((actor?.permissions ?? []).map((permission) => String(permission).toLowerCase()));
  return (
    permissionSet.has('community:moderate') ||
    permissionSet.has('community:admin') ||
    roleSet.has('admin') ||
    roleSet.has('moderator') ||
    roleSet.has('community_manager')
  );
}

export function registerModerationNamespace(io, { logger }) {
  const namespace = io.of('/moderation');

  const forwarders = [
    [MODERATION_EVENT_TYPES.EVENT_CREATED, 'moderation:queue:event'],
    [MODERATION_EVENT_TYPES.EVENT_UPDATED, 'moderation:queue:event'],
  ];

  forwarders.forEach(([type, eventName]) => {
    moderationEvents.on(type, (payload) => {
      namespace.emit(eventName, payload);
    });
  });

  namespace.use((socket, next) => {
    const actor = socket.data?.actor;
    if (!actor?.id || !hasModerationAccess(actor)) {
      return next(new AuthorizationError('Moderator privileges are required to access this namespace.'));
    }
    const channels = listChannelsForActor({ roles: actor.roles, permissions: actor.permissions }).filter(
      (channel) => channel.privileged || channel.slug === 'global-lobby',
    );
    socket.data.moderation = {
      channels: new Map(channels.map((channel) => [channel.slug, channel])),
    };
    return next();
  });

  namespace.on('connection', (socket) => {
    const actor = socket.data?.actor;
    const moderationState = socket.data.moderation;
    const modLogger = logger?.child({ component: 'moderation-namespace', userId: actor?.id, socketId: socket.id });

    socket.on('moderation:channels', () => {
      socket.emit('moderation:channels:list', Array.from(moderationState.channels.values()));
    });

    socket.on('moderation:overview', async ({ days } = {}) => {
      try {
        const overview = await getModerationOverview({ days: Number.parseInt(days, 10) || 7 });
        socket.emit('moderation:overview:result', overview);
      } catch (error) {
        modLogger?.warn({ err: error }, 'Failed to fetch moderation overview');
        socket.emit('moderation:error', { message: error.message });
      }
    });

    socket.on('moderation:queue', async ({ page, pageSize, severities, channels, status, search } = {}) => {
      try {
        const queue = await listModerationQueue({ page, pageSize, severities, channels, status, search });
        socket.emit('moderation:queue:list', queue);
      } catch (error) {
        modLogger?.warn({ err: error }, 'Failed to fetch moderation queue');
        socket.emit('moderation:error', { message: error.message });
      }
    });

    socket.on('moderation:events', async ({ page, pageSize, status, actorId, channelSlug } = {}) => {
      try {
        const events = await listModerationEvents({ page, pageSize, status, actorId, channelSlug });
        socket.emit('moderation:events:list', events);
      } catch (error) {
        modLogger?.warn({ err: error }, 'Failed to fetch moderation events');
        socket.emit('moderation:error', { message: error.message });
      }
    });

    socket.on('moderation:events:resolve', async ({ eventId, status, notes }) => {
      try {
        if (!eventId) {
          throw new ApplicationError('eventId is required.');
        }
        const resolved = await resolveModerationEvent(eventId, {
          status,
          resolvedBy: actor.id,
          resolutionNotes: notes,
        });
        if (!resolved) {
          throw new ApplicationError('Event not found.');
        }
        socket.emit('moderation:events:resolved', resolved);
      } catch (error) {
        modLogger?.warn({ err: error, eventId }, 'Failed to resolve moderation event');
        socket.emit('moderation:error', { message: error.message });
      }
    });

    socket.on('moderation:channel:state', async ({ channel } = {}) => {
      try {
        if (!channel) {
          throw new ApplicationError('Channel is required.');
        }
        if (!moderationState.channels.has(channel)) {
          throw new AuthorizationError('You do not have permission to inspect this channel.');
        }
        const state = await describeChannelState(channel);
        socket.emit('moderation:channel:state:result', { channel, state });
      } catch (error) {
        modLogger?.warn({ err: error, channel }, 'Failed to fetch channel state');
        socket.emit('moderation:error', { channel, message: error.message });
      }
    });

    socket.on('moderation:mute', async ({ channel, userId, mutedUntil }) => {
      try {
        if (!channel || !moderationState.channels.has(channel)) {
          throw new AuthorizationError('You do not have permission to moderate this channel.');
        }
        const numericUserId = Number.parseInt(userId, 10);
        if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
          throw new ApplicationError('userId must be a valid integer.');
        }
        const result = await muteParticipant({
          channelSlug: channel,
          userId: numericUserId,
          mutedBy: actor.id,
          mutedUntil,
        });
        namespace.emit('moderation:mute:applied', {
          channel,
          userId: numericUserId,
          mutedUntil: result.mutedUntil,
          mutedBy: actor.id,
        });
      } catch (error) {
        modLogger?.warn({ err: error, channel, userId }, 'Failed to mute participant');
        socket.emit('moderation:error', { channel, message: error.message });
      }
    });

    socket.on('moderation:message:remove', async ({ channel, messageId, reason }) => {
      try {
        if (!channel || !moderationState.channels.has(channel)) {
          throw new AuthorizationError('You do not have permission to moderate this channel.');
        }
        const numericMessageId = Number.parseInt(messageId, 10);
        if (!Number.isInteger(numericMessageId) || numericMessageId <= 0) {
          throw new ApplicationError('messageId must be a valid integer.');
        }
        const message = await removeMessage({
          channelSlug: channel,
          messageId: numericMessageId,
          moderatorId: actor.id,
          reason,
        });
        namespace.emit('moderation:message:removed', {
          channel,
          messageId: message.id,
          removedBy: actor.id,
          reason: message.metadata?.moderation?.reason ?? reason,
        });
      } catch (error) {
        modLogger?.warn({ err: error, channel, messageId }, 'Failed to remove message');
        socket.emit('moderation:error', { channel, message: error.message });
      }
    });

    socket.on('disconnect', (reason) => {
      modLogger?.debug({ reason }, 'Moderation socket disconnected');
    });
  });

  return namespace;
}

export default registerModerationNamespace;
