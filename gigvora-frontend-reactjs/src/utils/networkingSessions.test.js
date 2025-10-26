import { describe, expect, it } from 'vitest';
import {
  buildRecentConnections,
  extractCompanyIds,
  resolveActiveCompanyId,
  summariseSessions,
  summariseSpend,
  toDesignerDefaults,
} from './networkingSessions.js';

describe('toDesignerDefaults', () => {
  it('maps session fields safely', () => {
    const defaults = toDesignerDefaults({ id: 1, title: 'Session', rotationDurationSeconds: 90 });
    expect(defaults).toMatchObject({ id: 1, title: 'Session', rotationDurationSeconds: 90 });
  });

  it('returns empty object when session missing', () => {
    expect(toDesignerDefaults(null)).toEqual({});
  });
});

describe('summariseSessions', () => {
  it('produces aggregate metrics', () => {
    const summary = summariseSessions([
      {
        status: 'scheduled',
        joinLimit: 12,
        rotationDurationSeconds: 90,
        metrics: { averageSatisfaction: 4.5, registered: 10, waitlisted: 2, checkedIn: 8, completed: 7, noShows: 1, messagesSent: 15 },
        signups: [
          { followUpsScheduled: 2, connectionsSaved: 3 },
          { followUpsScheduled: 1, connectionsTracked: 1 },
        ],
      },
      {
        status: 'completed',
        endTime: '2024-05-01T10:00:00Z',
        joinLimit: 8,
        rotationDurationSeconds: 120,
        metrics: { averageSatisfaction: 4.0, registered: 8, waitlisted: 1, checkedIn: 6, completed: 6, noShows: 0, messagesSent: 5 },
        signups: [
          { followUpsScheduled: 3, connectionsSaved: 2 },
        ],
      },
    ]);

    expect(summary.total).toBe(2);
    expect(summary.upcoming).toBe(1);
    expect(summary.done).toBe(1);
    expect(summary.averageJoinLimit).toBe(10);
    expect(summary.averageRotation).toBe(105);
    expect(summary.averageSatisfaction).toBeCloseTo(4.25, 2);
    expect(summary.noShowRate).toBeCloseTo(2, 1);
    expect(summary.averageMessages).toBeCloseTo(10, 1);
    expect(summary.totalFollowUps).toBe(6);
    expect(summary.averageFollowUpsPerSession).toBeCloseTo(3, 1);
    expect(summary.averageFollowUpsPerAttendee).toBeCloseTo(2, 2);
    expect(summary.connectionsCaptured).toBe(6);
    expect(summary.averageConnectionsPerSession).toBeCloseTo(3, 1);
  });
});

describe('summariseSpend', () => {
  it('tracks paid and free sessions with spend metrics', () => {
    const summary = summariseSpend([
      {
        accessType: 'paid',
        priceCents: 1000,
        signups: [
          { status: 'checked_in' },
          { status: 'completed' },
          { status: 'removed' },
        ],
        monetization: { actualSpendCents: 500, targetSpendCents: 800 },
      },
      {
        accessType: 'open',
        priceCents: null,
        signups: [{ status: 'completed' }],
        monetization: { actualSpendCents: 100 },
      },
    ]);

    expect(summary.paidSessions).toBe(1);
    expect(summary.freeSessions).toBe(1);
    expect(summary.revenueCents).toBe(2000);
    expect(summary.purchases).toBe(2);
    expect(summary.actualSpendCents).toBe(600);
    expect(summary.targetSpendCents).toBe(800);
    expect(summary.averagePriceCents).toBe(1000);
  });
});

describe('buildRecentConnections', () => {
  it('flattens connections sorted by recency', () => {
    const connections = buildRecentConnections([
      {
        id: 1,
        title: 'First',
        companyId: 10,
        signups: [
          { id: 'a', status: 'checked_in', completedAt: '2024-05-02T10:00:00Z' },
          { id: 'b', status: 'registered' },
        ],
      },
      {
        id: 2,
        title: 'Second',
        companyId: 11,
        signups: [
          { id: 'c', status: 'completed', completedAt: '2024-05-03T10:00:00Z' },
        ],
      },
    ]);

    expect(connections).toHaveLength(2);
    expect(connections[0].sessionTitle).toBe('Second');
    expect(connections[0].completedAgo).toBeTruthy();
  });
});

describe('company id helpers', () => {
  it('extractCompanyIds returns unique numeric ids', () => {
    expect(extractCompanyIds([
      { companyId: '10' },
      { companyId: 10 },
      { companyId: 'abc' },
      {},
    ])).toEqual([10]);
  });

  it('resolveActiveCompanyId prefers requested id', () => {
    expect(resolveActiveCompanyId({ requestedId: '5', sessions: [] })).toBe(5);
    expect(resolveActiveCompanyId({ requestedId: undefined, sessions: [{ companyId: 7 }] })).toBe(7);
  });
});
