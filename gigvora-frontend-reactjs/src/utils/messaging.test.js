import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('./date.js', () => ({
  formatRelativeTime: vi.fn((value) => `relative:${value}`),
}));

vi.mock('./session.js', async () => {
  const actual = await vi.importActual('./session.js');
  return {
    ...actual,
    resolveActorId: vi.fn(() => 42),
  };
});

const { formatRelativeTime } = await import('./date.js');
const messaging = await import('./messaging.js');

const {
  buildThreadTitle,
  describeLastActivity,
  formatMessageSender,
  formatMessageTimestamp,
  formatThreadParticipants,
  getCallMetadata,
  isCallActive,
  isCallEvent,
  isThreadUnread,
  messageBelongsToUser,
  resolveActorId,
  sortMessages,
} = messaging;

const actorId = 10;

describe('formatThreadParticipants', () => {
  it('returns formatted participant names excluding actor', () => {
    const thread = {
      participants: [
        { userId: actorId, user: { firstName: 'Current', lastName: 'User' } },
        { userId: 2, user: { firstName: 'Jane', lastName: 'Doe' } },
        { userId: 3, user: { email: 'other@example.com' } },
      ],
    };
    expect(formatThreadParticipants(thread, actorId)).toEqual(['Jane Doe', 'other@example.com']);
  });

  it('falls back to labels when names missing', () => {
    const thread = {
      participants: [
        { userId: 5, user: null },
      ],
    };
    expect(formatThreadParticipants(thread)).toEqual(['User 5']);
  });
});

describe('buildThreadTitle', () => {
  it('prefers explicit subject', () => {
    const thread = { subject: 'Support Request' };
    expect(buildThreadTitle(thread, actorId)).toBe('Support Request');
  });

  it('builds title from participants when subject missing', () => {
    const thread = {
      participants: [
        { userId: 2, user: { firstName: 'Jane', lastName: 'Doe' } },
      ],
    };
    expect(buildThreadTitle(thread, actorId)).toBe('Jane Doe');
  });
});

describe('isThreadUnread', () => {
  it('uses unreadCount when provided', () => {
    expect(isThreadUnread({ unreadCount: 1 })).toBe(true);
  });

  it('compares last message and last read timestamps', () => {
    const thread = {
      lastMessageAt: '2024-05-01T10:00:00Z',
      viewerState: { lastReadAt: '2024-05-01T09:00:00Z' },
    };
    expect(isThreadUnread(thread)).toBe(true);
  });

  it('handles missing timestamps', () => {
    expect(isThreadUnread({})).toBe(false);
  });
});

describe('describeLastActivity', () => {
  it('returns relative time when available', () => {
    expect(describeLastActivity({ lastMessageAt: '2024-05-01T10:00:00Z' })).toBe(
      'relative:2024-05-01T10:00:00Z',
    );
  });

  it('provides fallback for empty threads', () => {
    expect(describeLastActivity({})).toBe('No messages yet');
  });
});

describe('message utilities', () => {
  it('sortMessages orders by creation time', () => {
    const sorted = sortMessages([
      { id: 2, createdAt: '2024-05-02T10:00:00Z' },
      { id: 1, createdAt: '2024-05-01T10:00:00Z' },
    ]);
    expect(sorted.map((m) => m.id)).toEqual([1, 2]);
  });

  it('detects call metadata', () => {
    const message = {
      messageType: 'event',
      metadata: { eventType: 'call', call: { expiresAt: '2099-01-01T00:00:00Z' } },
    };
    expect(isCallEvent(message)).toBe(true);
    expect(getCallMetadata(message)).toEqual({ expiresAt: '2099-01-01T00:00:00Z' });
    expect(isCallActive({ expiresAt: '2099-01-01T00:00:00Z' })).toBe(true);
  });

  it('handles system messages gracefully', () => {
    expect(formatMessageSender(null)).toBe('System');
    expect(messageBelongsToUser({ senderId: 5 }, 10)).toBe(false);
  });

  it('formats timestamps via relative time helper', () => {
    expect(formatMessageTimestamp({ createdAt: '2024-05-01T10:00:00Z' })).toBe(
      'relative:2024-05-01T10:00:00Z',
    );
  });
});

describe('resolveActorId passthrough', () => {
  beforeEach(() => {
    vi.mocked(resolveActorId).mockClear();
    formatRelativeTime.mockClear();
  });

  it('exposes mocked resolveActorId for consumers', () => {
    expect(resolveActorId()).toBe(42);
  });
});
