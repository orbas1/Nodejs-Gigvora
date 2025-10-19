import {
  listChannelsForActor,
  canAccessChannel,
  resolveChannelFeatureFlags,
} from './channelRegistry.js';
import {
  joinCommunityChannel,
  leaveCommunityChannel,
  publishMessage,
  acknowledgeMessages,
} from '../services/communityChatService.js';
import { ApplicationError, AuthorizationError } from '../utils/errors.js';

function resolveRoomName(channelSlug) {
  return `community:${channelSlug}`;
}

function normaliseMessageType(messageType) {
  const allowed = new Set(['text', 'file', 'event']);
  if (!messageType) {
    return 'text';
  }
  const normalised = String(messageType).toLowerCase();
  return allowed.has(normalised) ? normalised : 'text';
}

function buildRateLimiter(limitPerMinute) {
  const windowMs = 60_000;
  const limit = Number.isFinite(limitPerMinute) && limitPerMinute > 0 ? limitPerMinute : 120;
  return {
    events: [],
    limit,
    accept() {
      const now = Date.now();
      this.events = this.events.filter((ts) => now - ts < windowMs);
      if (this.events.length >= this.limit) {
        return false;
      }
      this.events.push(now);
      return true;
    },
  };
}

export function registerCommunityNamespace(io, { logger, runtimeConfig }) {
  const communityConfig = runtimeConfig?.realtime?.namespaces?.community ?? {};
  const namespace = io.of('/community');

  namespace.use((socket, next) => {
    const actor = socket.data?.actor;
    if (!actor?.id) {
      return next(new AuthorizationError('Authentication required for community channels.'));
    }
    const channels = listChannelsForActor({ roles: actor.roles, permissions: actor.permissions });
    socket.data.community = {
      channels: new Map(channels.map((channel) => [channel.slug, channel])),
      features: new Map(channels.map((channel) => [channel.slug, resolveChannelFeatureFlags(channel.slug)])),
      rateLimiter: buildRateLimiter(communityConfig.rateLimitPerMinute ?? 120),
    };
    return next();
  });

  namespace.on('connection', (socket) => {
    const actor = socket.data?.actor;
    const communityState = socket.data.community;
    const communityLogger = logger?.child({ component: 'community-namespace', userId: actor?.id, socketId: socket.id });

    socket.on('community:channels', () => {
      socket.emit('community:channels:list', Array.from(communityState.channels.values()));
    });

    socket.on('community:join', async ({ channel } = {}) => {
      try {
        if (!channel) {
          throw new ApplicationError('Channel is required.');
        }
        if (
          !communityState.channels.has(channel) ||
          !canAccessChannel(channel, { roles: actor.roles, permissions: actor.permissions })
        ) {
          throw new AuthorizationError('You do not have permission to join this channel.');
        }
        const roomName = resolveRoomName(channel);
        await socket.join(roomName);
        const { messages } = await joinCommunityChannel({ channelSlug: channel, userId: actor.id });
        socket.emit('community:joined', {
          channel,
          messages,
          features: communityState.features.get(channel),
        });
        namespace.to(roomName).emit('community:presence', {
          channel,
          userId: actor.id,
          status: 'joined',
          timestamp: new Date().toISOString(),
        });
        communityLogger?.info({ channel }, 'Joined community channel');
      } catch (error) {
        communityLogger?.warn({ err: error, channel }, 'Failed to join community channel');
        socket.emit('community:error', { channel, message: error.message });
      }
    });

    socket.on('community:leave', async ({ channel } = {}) => {
      try {
        if (!channel) {
          throw new ApplicationError('Channel is required.');
        }
        await socket.leave(resolveRoomName(channel));
        await leaveCommunityChannel({ channelSlug: channel, userId: actor.id });
        namespace.to(resolveRoomName(channel)).emit('community:presence', {
          channel,
          userId: actor.id,
          status: 'left',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        communityLogger?.warn({ err: error, channel }, 'Failed to leave community channel');
      }
    });

    socket.on('community:message', async ({ channel, body, messageType, metadata }) => {
      try {
        if (!channel) {
          throw new ApplicationError('Channel is required.');
        }
        if (
          !communityState.channels.has(channel) ||
          !canAccessChannel(channel, { roles: actor.roles, permissions: actor.permissions })
        ) {
          throw new AuthorizationError('You do not have permission to post in this channel.');
        }
        if (!communityState.rateLimiter.accept()) {
          throw new ApplicationError('Message rate limit exceeded. Please slow down.');
        }
        const resolvedType = normaliseMessageType(messageType);
        const message = await publishMessage({
          channelSlug: channel,
          userId: actor.id,
          body,
          messageType: resolvedType,
          metadata,
        });
        namespace.to(resolveRoomName(channel)).emit('community:message', {
          channel,
          message: {
            ...message,
            sender: {
              id: actor.id,
              roles: actor.roles,
            },
          },
        });
      } catch (error) {
        communityLogger?.warn({ err: error, channel }, 'Failed to publish community message');
        socket.emit('community:error', { channel, message: error.message });
      }
    });

    socket.on('community:ack', async ({ channel } = {}) => {
      try {
        if (!channel) {
          throw new ApplicationError('Channel is required.');
        }
        await acknowledgeMessages({ channelSlug: channel, userId: actor.id });
      } catch (error) {
        communityLogger?.warn({ err: error, channel }, 'Failed to acknowledge messages');
      }
    });

    socket.on('community:typing', ({ channel, isTyping = true } = {}) => {
      if (!channel || !communityState.channels.has(channel)) {
        return;
      }
      namespace.to(resolveRoomName(channel)).emit('community:typing', {
        channel,
        userId: actor.id,
        isTyping,
      });
    });

    socket.on('disconnect', (reason) => {
      communityLogger?.debug({ reason }, 'Community socket disconnected');
    });
  });

  return namespace;
}

export default registerCommunityNamespace;
