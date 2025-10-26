import { beforeAll, describe, expect, it, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const mockSequelize = {
  transaction: async (handler) => handler(),
};

jest.unstable_mockModule('../../models/index.js', () => ({
  sequelize: mockSequelize,
  NetworkingSession: {},
  NetworkingSessionRotation: {},
  NetworkingSessionSignup: {},
  NetworkingBusinessCard: {},
  ProviderWorkspace: {},
  NETWORKING_SESSION_STATUSES: [],
  NETWORKING_SESSION_ACCESS_TYPES: [],
  NETWORKING_SESSION_VISIBILITIES: [],
  NETWORKING_SESSION_SIGNUP_STATUSES: ['registered', 'waitlisted', 'checked_in', 'completed', 'removed', 'no_show'],
  NETWORKING_SESSION_SIGNUP_SOURCES: ['self', 'host', 'referral'],
  NETWORKING_BUSINESS_CARD_STATUSES: ['active'],
  NETWORKING_ROTATION_STATUSES: ['scheduled', 'completed'],
}));

let serialiseSession;
let deriveSessionMetrics;
let summariseSessions;

beforeAll(async () => {
  const serviceModule = await import('../../services/networkingService.js');
  ({ serialiseSession, deriveSessionMetrics, summariseSessions } = serviceModule.__testing);
});

function createSignup(payload) {
  return {
    ...payload,
    toPublicObject() {
      return { ...payload };
    },
    get(key) {
      return payload[key];
    },
  };
}

describe('networkingService metrics', () => {
  it('derives per-session metrics with follow-up velocity and depth', () => {
    const session = {
      toPublicObject() {
        return {
          id: 91,
          companyId: 7,
          status: 'completed',
          startTime: '2024-03-01T09:00:00Z',
          endTime: '2024-03-01T10:00:00Z',
          rotationDurationSeconds: 180,
          joinLimit: 24,
          accessType: 'paid',
          priceCents: 2500,
        };
      },
      rotations: [],
      signups: [
        createSignup({
          id: 1,
          status: 'completed',
          participantName: 'Jordan Mentor',
          participantEmail: 'jordan@example.test',
          messagesSent: 5,
          profileSharedCount: 2,
          connectionsSaved: 4,
          followUpsScheduled: 2,
          satisfactionScore: 4.8,
          completedAt: '2024-03-01T10:00:00Z',
          updatedAt: '2024-03-01T13:30:00Z',
          metadata: { lastFollowUpAt: '2024-03-01T13:30:00Z' },
        }),
        createSignup({
          id: 2,
          status: 'checked_in',
          participantName: 'Kai Founder',
          participantEmail: 'kai@example.test',
          messagesSent: 3,
          profileSharedCount: 1,
          connectionsSaved: 2,
          followUpsScheduled: 1,
          satisfactionScore: 4.2,
          completedAt: '2024-03-01T09:30:00Z',
          updatedAt: '2024-03-01T11:30:00Z',
          metadata: { lastFollowUpAt: '2024-03-01T11:30:00Z' },
        }),
        createSignup({
          id: 3,
          status: 'registered',
          participantName: 'Eli Operator',
          participantEmail: 'eli@example.test',
          messagesSent: 1,
          profileSharedCount: 0,
          connectionsSaved: 1,
          followUpsScheduled: 1,
          updatedAt: '2024-03-01T15:00:00Z',
        }),
      ],
    };

    const serialised = serialiseSession(session);
    expect(serialised.metrics).toBeDefined();

    const metrics = deriveSessionMetrics(serialised.signups);
    expect(metrics).toMatchObject({
      totalSignups: 3,
      registered: 1,
      checkedIn: 1,
      completed: 1,
      messagesSent: 9,
      followUpsScheduled: 4,
      connectionsSaved: 7,
      satisfactionResponses: 2,
    });
    expect(metrics.averageSatisfaction).toBeCloseTo(4.5, 5);
    expect(metrics.connectionDepth).toBeCloseTo(2.33, 2);
    expect(metrics.checkInRate).toBeCloseTo(66.7, 1);
    expect(metrics.noShowRate).toBe(0);
    expect(metrics.followUpVelocityHours).toBeCloseTo(2.8, 1);
    expect(metrics.followUpCaptureRate).toBeCloseTo(4, 5);

    const summary = summariseSessions([serialised]);
    expect(summary.total).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.averageJoinLimit).toBe(24);
    expect(summary.averageRotation).toBe(180);
    expect(summary.totalFollowUps).toBe(4);
    expect(summary.connectionsCaptured).toBe(7);
    expect(summary.averageFollowUpsPerSession).toBe(4);
    expect(summary.averageFollowUpsPerAttendee).toBeCloseTo(1.33, 2);
    expect(summary.averageConnectionsPerSession).toBe(7);
    expect(summary.averageSatisfaction).toBeCloseTo(4.5, 5);
    expect(summary.averageMessages).toBeCloseTo(9, 5);
  });
});
