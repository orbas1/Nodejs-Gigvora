import { formatRelativeTime } from './date.js';
import { resolveActorId } from './session.js';

export { resolveActorId } from './session.js';

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

export function sortThreads(threads = []) {
  return [...threads].sort((a, b) => {
    const aTime = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
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

function normaliseUserId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function summariseReceiptName(receipt) {
  if (!receipt) {
    return null;
  }
  if (receipt.user) {
    return formatName(receipt.user) ?? `User ${receipt.user.id}`;
  }
  if (receipt.participant && receipt.participant.userId) {
    return `User ${receipt.participant.userId}`;
  }
  if (receipt.userId) {
    return `User ${receipt.userId}`;
  }
  return null;
}

export function formatReadReceiptSummary(receipts = [], actorId) {
  if (!Array.isArray(receipts) || receipts.length === 0) {
    return null;
  }

  const actor = normaliseUserId(actorId);
  const deduped = new Map();

  receipts.forEach((receipt) => {
    const readerId = normaliseUserId(receipt?.userId ?? receipt?.participant?.userId);
    if (!readerId || (actor && readerId === actor)) {
      return;
    }
    const readAt = receipt?.readAt ? new Date(receipt.readAt).getTime() : NaN;
    if (!Number.isFinite(readAt)) {
      return;
    }
    const existing = deduped.get(readerId);
    if (!existing || readAt > existing.readAt) {
      deduped.set(readerId, {
        readAt,
        name: summariseReceiptName(receipt) ?? `User ${readerId}`,
      });
    }
  });

  if (deduped.size === 0) {
    return null;
  }

  const entries = Array.from(deduped.values()).sort((a, b) => b.readAt - a.readAt);
  const names = entries.map((entry) => entry.name);

  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names[0]}, ${names[1]}, and ${names.length - 2} more`;
}

export function formatTypingParticipants(participants = [], actorId) {
  if (!Array.isArray(participants) || participants.length === 0) {
    return null;
  }
  const actor = normaliseUserId(actorId);
  const names = participants
    .filter((participant) => {
      const userId = normaliseUserId(participant?.userId);
      if (!userId || (actor && userId === actor)) {
        return false;
      }
      const expiresAt = participant?.expiresAt ? new Date(participant.expiresAt).getTime() : Date.now();
      return Number.isFinite(expiresAt) && expiresAt > Date.now();
    })
    .map((participant) => participant.displayName || `User ${participant.userId}`);

  if (!names.length) {
    return null;
  }

  if (names.length === 1) {
    return `${names[0]} is typing…`;
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]} are typing…`;
  }
  return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing…`;
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

export default {
  resolveActorId,
  formatThreadParticipants,
  buildThreadTitle,
  sortThreads,
  isThreadUnread,
  describeLastActivity,
  sortMessages,
  isCallEvent,
  getCallMetadata,
  isCallActive,
  formatMessageSender,
  messageBelongsToUser,
  formatMessageTimestamp,
  formatReadReceiptSummary,
  formatTypingParticipants,
};
