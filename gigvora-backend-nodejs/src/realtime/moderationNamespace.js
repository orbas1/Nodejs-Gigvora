import { listChannelsForActor } from './channelRegistry.js';
import {
  muteParticipant,
  removeMessage,
  describeChannelState,
} from '../services/communityChatService.js';
import { ApplicationError, AuthorizationError } from '../utils/errors.js';

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
