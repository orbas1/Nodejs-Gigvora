import { describe, expect, it } from 'vitest';
import {
  sortThreads,
  formatReadReceiptSummary,
  formatTypingParticipants,
} from '../messaging.js';

describe('messaging utilities', () => {
  it('sortThreads orders threads by most recent activity', () => {
    const threads = [
      { id: 1, lastMessageAt: '2024-05-01T10:00:00Z' },
      { id: 2, lastMessageAt: '2024-06-01T10:00:00Z' },
      { id: 3, lastMessageAt: null },
    ];

    const sorted = sortThreads(threads);
    expect(sorted.map((thread) => thread.id)).toEqual([2, 1, 3]);
  });

  it('formatReadReceiptSummary returns null for empty receipts', () => {
    expect(formatReadReceiptSummary([], 5)).toBeNull();
  });

  it('formatReadReceiptSummary summarises readers excluding actor', () => {
    const receipts = [
      { userId: 1, readAt: '2024-05-01T10:00:00Z', user: { firstName: 'Alex', lastName: 'Rivera' } },
      { userId: 2, readAt: '2024-05-01T11:00:00Z', user: { firstName: 'Brooke' } },
      { userId: 5, readAt: '2024-05-01T12:00:00Z', user: { firstName: 'You' } },
    ];

    expect(formatReadReceiptSummary(receipts, 5)).toBe('Brooke and Alex Rivera');
  });

  it('formatReadReceiptSummary collapses large reader sets', () => {
    const receipts = [
      { userId: 7, readAt: '2024-05-01T10:00:00Z', user: { firstName: 'Sky' } },
      { userId: 8, readAt: '2024-05-01T11:00:00Z', user: { firstName: 'Kai' } },
      { userId: 9, readAt: '2024-05-01T12:00:00Z', user: { firstName: 'Maya' } },
      { userId: 10, readAt: '2024-05-01T13:00:00Z', user: { firstName: 'Jules' } },
    ];

    expect(formatReadReceiptSummary(receipts, 99)).toBe('Jules, Maya, and 2 more');
  });

  it('formatTypingParticipants excludes actor and expired entries', () => {
    const now = new Date();
    const entries = [
      { userId: 1, displayName: 'Morgan', expiresAt: new Date(now.getTime() + 1000).toISOString() },
      { userId: 2, displayName: 'Lee', expiresAt: new Date(now.getTime() - 1000).toISOString() },
      { userId: 3, displayName: 'Casey', expiresAt: null },
      { userId: 5, displayName: 'Actor', expiresAt: new Date(now.getTime() + 1000).toISOString() },
    ];

    expect(formatTypingParticipants(entries, 5)).toBe('Morgan and Casey are typing…');
  });
});
