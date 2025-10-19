import { createCallTokens } from '../services/agoraService.js';
import { listVoiceRoomsForActor } from './channelRegistry.js';
import { ApplicationError, AuthorizationError } from '../utils/errors.js';

function resolveRoomName(slug) {
  return `voice:${slug}`;
}

async function getOccupancy(namespace, roomName) {
  const sockets = await namespace.in(roomName).allSockets();
  return sockets.size;
}

export function registerVoiceNamespace(io, { logger, runtimeConfig }) {
  const voiceConfig = runtimeConfig?.realtime?.namespaces?.voice ?? {};
  if (voiceConfig.enabled === false) {
    logger?.info('Voice namespace disabled by configuration.');
    return null;
  }

  const namespace = io.of('/voice');

  namespace.use((socket, next) => {
    const actor = socket.data?.actor;
    if (!actor?.id) {
      return next(new AuthorizationError('Authentication required for voice sessions.'));
    }
    const allowedRooms = listVoiceRoomsForActor({ roles: actor.roles, permissions: actor.permissions });
    socket.data.voice = {
      allowedRooms: new Map(allowedRooms.map((room) => [room.slug, room])),
    };
    return next();
  });

  namespace.on('connection', (socket) => {
    const actor = socket.data?.actor;
    const voiceState = socket.data.voice;
    const voiceLogger = logger?.child({ component: 'voice-namespace', userId: actor?.id, socketId: socket.id });

    socket.on('voice:list', () => {
      const rooms = Array.from(voiceState.allowedRooms.values());
      socket.emit('voice:rooms', rooms);
    });

    socket.on('voice:join', async ({ room: roomSlug, role = 'publisher' } = {}) => {
      try {
        if (!roomSlug) {
          throw new ApplicationError('Room is required.');
        }
        const roomDefinition = voiceState.allowedRooms.get(roomSlug);
        if (!roomDefinition) {
          throw new AuthorizationError('You do not have access to this voice room.');
        }
        const roomName = resolveRoomName(roomSlug);
        const occupancy = await getOccupancy(namespace, roomName);
        const maxParticipants = Math.min(
          roomDefinition.maxParticipants ?? Infinity,
          voiceConfig.maxParticipants ?? roomDefinition.maxParticipants ?? Infinity,
        );
        if (Number.isFinite(maxParticipants) && occupancy >= maxParticipants) {
          throw new ApplicationError('This room is full. Please try again shortly.');
        }

        let tokens = null;
        try {
          tokens = createCallTokens({
            channelName: `gigvora-${roomSlug}`,
            identity: actor.id,
            role,
            expireSeconds: runtimeConfig?.realtime?.connection?.pingTimeoutMs
              ? Math.ceil(runtimeConfig.realtime.connection.pingTimeoutMs / 1000) * 30
              : undefined,
          });
        } catch (error) {
          voiceLogger?.warn({ err: error }, 'Failed to generate Agora call tokens.');
          throw new ApplicationError('Voice infrastructure is not fully configured. Contact support.');
        }

        await socket.join(roomName);
        namespace.to(roomName).emit('voice:participant-joined', {
          room: roomSlug,
          userId: actor.id,
          joinedAt: new Date().toISOString(),
        });

        socket.emit('voice:joined', {
          room: roomSlug,
          tokens,
          recordingRequired: roomDefinition.recordSessions ?? false,
        });
        voiceLogger?.info({ roomSlug }, 'Voice participant joined');
      } catch (error) {
        voiceLogger?.warn({ err: error, roomSlug }, 'Failed to join voice room');
        socket.emit('voice:error', {
          room: roomSlug,
          message: error.message || 'Unable to join voice room.',
        });
      }
    });

    socket.on('voice:leave', async ({ room: roomSlug } = {}) => {
      try {
        if (!roomSlug) {
          throw new ApplicationError('Room is required.');
        }
        const roomName = resolveRoomName(roomSlug);
        await socket.leave(roomName);
        namespace.to(roomName).emit('voice:participant-left', {
          room: roomSlug,
          userId: actor.id,
          leftAt: new Date().toISOString(),
        });
      } catch (error) {
        voiceLogger?.warn({ err: error, roomSlug }, 'Failed to leave voice room');
      }
    });

    socket.on('disconnect', (reason) => {
      voiceLogger?.debug({ reason }, 'Voice socket disconnected');
    });
  });

  return namespace;
}

export default registerVoiceNamespace;
