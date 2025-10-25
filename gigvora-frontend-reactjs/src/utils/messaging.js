import { formatRelativeTime } from './date.js';
import { resolveActorId } from './session.js';

export { resolveActorId } from './session.js';

export function sortThreadsByActivity(threads = []) {
  return [...threads]
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
}

function formatName(user) {
  if (!user) {
    return null;
  }
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) {
    return parts.join(' ');
  }
  return user.email ?? null;
}

export function formatThreadParticipants(thread, actorId) {
  if (!thread || !Array.isArray(thread.participants) || thread.participants.length === 0) {
    return [];
  }
  const visible = thread.participants.filter((participant) =>
    actorId ? participant.userId !== actorId : true,
  );
  if (visible.length === 0) {
    return thread.participants.map((participant) => formatName(participant.user) ?? `User ${participant.userId}`);
  }
  return visible.map((participant) => formatName(participant.user) ?? `User ${participant.userId}`);
}

export function buildThreadTitle(thread, actorId) {
  if (!thread) {
    return 'Conversation';
  }
  if (thread.subject) {
    return thread.subject;
  }
  const names = formatThreadParticipants(thread, actorId);
  if (names.length > 0) {
    return names.join(', ');
  }
  return 'Conversation';
}

export function isThreadUnread(thread) {
  if (!thread) {
    return false;
  }
  if (typeof thread.unreadCount === 'number') {
    return thread.unreadCount > 0;
  }
  if (!thread.lastMessageAt) {
    return false;
  }
  const lastMessageAt = new Date(thread.lastMessageAt);
  if (Number.isNaN(lastMessageAt.getTime())) {
    return false;
  }
  const lastReadAt = thread.viewerState?.lastReadAt ? new Date(thread.viewerState.lastReadAt) : null;
  if (!lastReadAt || Number.isNaN(lastReadAt.getTime())) {
    return true;
  }
  return lastMessageAt > lastReadAt;
}

export function describeLastActivity(thread) {
  if (!thread?.lastMessageAt) {
    return 'No messages yet';
  }
  return formatRelativeTime(thread.lastMessageAt);
}

export function sortMessages(messages = []) {
  return [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export function isCallEvent(message) {
  return message?.messageType === 'event' && message?.metadata?.eventType === 'call';
}

export function getCallMetadata(message) {
  return isCallEvent(message) ? message.metadata?.call ?? null : null;
}

export function isCallActive(callMetadata) {
  if (!callMetadata) {
    return false;
  }
  if (!callMetadata.expiresAt) {
    return true;
  }
  const expiresAt = new Date(callMetadata.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return true;
  }
  return expiresAt.getTime() > Date.now();
}

export function formatMessageSender(message) {
  if (!message) {
    return 'System';
  }
  if (!message.sender) {
    return 'System';
  }
  return formatName(message.sender) ?? `User ${message.sender.id}`;
}

export function messageBelongsToUser(message, actorId) {
  if (!message || !actorId) {
    return false;
  }
  return Number(message.senderId) === Number(actorId);
}

export function formatMessageTimestamp(message) {
  if (!message?.createdAt) {
    return '';
  }
  return formatRelativeTime(message.createdAt);
}

export function deriveReadReceipts(message, receipts = [], { actorId } = {}) {
  if (!message) {
    return [];
  }
  const createdAt = message.createdAt ? new Date(message.createdAt).getTime() : null;
  return receipts
    .filter((receipt) => {
      if (!receipt || !receipt.userId) {
        return false;
      }
      if (actorId && Number(receipt.userId) === Number(actorId)) {
        return false;
      }
      const matchesMessage = receipt.lastReadMessageId && receipt.lastReadMessageId === message.id;
      if (matchesMessage) {
        return true;
      }
      if (!createdAt || !receipt.lastReadAt) {
        return false;
      }
      const seenAt = new Date(receipt.lastReadAt).getTime();
      return !Number.isNaN(seenAt) && seenAt >= createdAt;
    })
    .map((receipt) => ({
      userId: receipt.userId,
      name: receipt.name ?? `User ${receipt.userId}`,
      lastReadAt: receipt.lastReadAt ?? null,
    }));
}

export default {
  resolveActorId,
  sortThreadsByActivity,
  formatThreadParticipants,
  buildThreadTitle,
  isThreadUnread,
  describeLastActivity,
  sortMessages,
  isCallEvent,
  getCallMetadata,
  isCallActive,
  formatMessageSender,
  messageBelongsToUser,
  formatMessageTimestamp,
  deriveReadReceipts,
};
