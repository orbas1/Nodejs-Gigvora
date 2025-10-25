import messagingEvents, { MESSAGING_EVENTS } from '../events/messagingEvents.js';
import {
  ensureThreadParticipant,
  listThreadParticipantUserIds,
} from '../services/messagingService.js';
import { ApplicationError, AuthorizationError } from '../utils/errors.js';

function resolveRoomName(threadId) {
  return `messaging:thread:${threadId}`;
}

function buildTypingKey(threadId, userId) {
  return `${threadId}:${userId}`;
}

export default function registerMessagingNamespace(io, { logger, runtimeConfig }) {
  const namespaceConfig = runtimeConfig?.realtime?.namespaces?.messaging ?? { enabled: true };
  if (namespaceConfig.enabled === false) {
    logger?.info?.('Messaging realtime namespace disabled by configuration.');
    return null;
  }

  const namespace = io.of('/messaging');
  const typingTimeoutMs = Math.max(Number(namespaceConfig.typingTimeoutMs) || 5_000, 1_000);
  const typingTimers = new Map();

  function scheduleTypingReset(threadId, userId) {
    const key = buildTypingKey(threadId, userId);
    if (typingTimers.has(key)) {
      clearTimeout(typingTimers.get(key));
    }
    const timer = setTimeout(() => {
      typingTimers.delete(key);
      namespace.to(resolveRoomName(threadId)).emit('messaging:typing', {
        threadId,
        userId,
        isTyping: false,
      });
    }, typingTimeoutMs);
    timer.unref?.();
    typingTimers.set(key, timer);
  }

  function clearTypingTimersForUser(userId) {
    for (const key of typingTimers.keys()) {
      if (key.endsWith(`:${userId}`)) {
        clearTimeout(typingTimers.get(key));
        typingTimers.delete(key);
      }
    }
  }

  namespace.use((socket, next) => {
    if (!socket.data?.actor?.id) {
      return next(new AuthorizationError('Authentication required for messaging.'));
    }
    return next();
  });

  namespace.on('connection', (socket) => {
    const actor = socket.data.actor;
    const messagingLogger = logger?.child({ component: 'messaging-namespace', userId: actor.id, socketId: socket.id });
    const joinedThreads = new Set();

    async function joinThread(threadId) {
      if (!Number.isInteger(threadId) || threadId <= 0) {
        throw new ApplicationError('threadId must be a positive integer.');
      }
      const participant = await ensureThreadParticipant(threadId, actor.id);
      await socket.join(resolveRoomName(threadId));
      joinedThreads.add(threadId);
      socket.emit('messaging:joined', { threadId, participant });
      return participant;
    }

    socket.on('messaging:join', async ({ threadId } = {}) => {
      try {
        await joinThread(Number(threadId));
      } catch (error) {
        messagingLogger?.warn({ err: error, threadId }, 'Failed to join messaging thread');
        socket.emit('messaging:error', { threadId, message: error.message });
      }
    });

    socket.on('messaging:leave', async ({ threadId } = {}) => {
      const normalizedId = Number(threadId);
      if (!joinedThreads.has(normalizedId)) {
        return;
      }
      joinedThreads.delete(normalizedId);
      await socket.leave(resolveRoomName(normalizedId));
      socket.emit('messaging:left', { threadId: normalizedId });
    });

    socket.on('messaging:typing', async ({ threadId, isTyping = true } = {}) => {
      const normalizedId = Number(threadId);
      if (!joinedThreads.has(normalizedId)) {
        return;
      }
      if (isTyping) {
        namespace.to(resolveRoomName(normalizedId)).emit('messaging:typing', {
          threadId: normalizedId,
          userId: actor.id,
          isTyping: true,
        });
        scheduleTypingReset(normalizedId, actor.id);
      } else {
        const key = buildTypingKey(normalizedId, actor.id);
        if (typingTimers.has(key)) {
          clearTimeout(typingTimers.get(key));
          typingTimers.delete(key);
        }
        namespace.to(resolveRoomName(normalizedId)).emit('messaging:typing', {
          threadId: normalizedId,
          userId: actor.id,
          isTyping: false,
        });
      }
    });

    socket.on('messaging:participants', async ({ threadId } = {}) => {
      const normalizedId = Number(threadId);
      if (!joinedThreads.has(normalizedId)) {
        socket.emit('messaging:error', { threadId: normalizedId, message: 'Join the thread before requesting participants.' });
        return;
      }
      try {
        const participantIds = await listThreadParticipantUserIds(normalizedId);
        socket.emit('messaging:participants', { threadId: normalizedId, participantIds });
      } catch (error) {
        messagingLogger?.warn({ err: error, threadId: normalizedId }, 'Failed to list thread participants');
        socket.emit('messaging:error', { threadId: normalizedId, message: error.message });
      }
    });

    socket.on('disconnect', () => {
      clearTypingTimersForUser(actor.id);
    });
  });

  messagingEvents.on(MESSAGING_EVENTS.MESSAGE_APPENDED, ({ threadId, message }) => {
    namespace.to(resolveRoomName(threadId)).emit('messaging:message', { threadId, message });
  });

  messagingEvents.on(MESSAGING_EVENTS.MESSAGES_PURGED, ({ threadId, deletedIds, cutoff }) => {
    namespace.to(resolveRoomName(threadId)).emit('messaging:messages:purged', {
      threadId,
      deletedIds,
      cutoff,
    });
  });

  return namespace;
}

