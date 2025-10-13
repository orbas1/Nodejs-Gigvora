import { formatRelativeTime } from './date.js';
import { resolveActorId } from './session.js';

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

export default {
  resolveActorId,
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
};
