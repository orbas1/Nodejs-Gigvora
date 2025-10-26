import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const modelsModuleSpecifier = '../../../tests/stubs/modelsIndexStub.js';

const {
  __setModelStubs,
  User,
  Gig,
  FreelancerTimelineEntry,
  NetworkingConnection,
  FreelancerDashboardOverview,
} = await import(modelsModuleSpecifier);

const { appCache } = await import('../../utils/cache.js');

const supportDeskServiceModuleUrl = new URL('../supportDeskService.js', import.meta.url);
const getFreelancerSupportDeskMock = jest.fn();

jest.unstable_mockModule(supportDeskServiceModuleUrl.pathname, () => ({
  default: { getFreelancerSupportDesk: getFreelancerSupportDeskMock },
  getFreelancerSupportDesk: getFreelancerSupportDeskMock,
}));

const { getUserQuickActions } = await import('../userQuickActionService.js');

describe('userQuickActionService', () => {
  let userStub;
  let gigStub;
  let timelineStub;
  let connectionStub;
  let overviewStub;

  beforeEach(() => {
    appCache.flushByPrefix?.('quickActions:user');

    userStub = { findByPk: jest.fn(async () => ({ id: 42, userType: 'freelancer' })) };
    gigStub = { count: jest.fn(async () => 0) };
    timelineStub = { findOne: jest.fn(async () => null) };
    connectionStub = { count: jest.fn(async () => 0) };
    overviewStub = { findOne: jest.fn(async () => ({ upcomingSchedule: [] })) };

    __setModelStubs({
      User: userStub,
      Gig: gigStub,
      FreelancerTimelineEntry: timelineStub,
      NetworkingConnection: connectionStub,
      FreelancerDashboardOverview: overviewStub,
    });

    User.findByPk = userStub.findByPk.bind(userStub);
    Gig.count = gigStub.count.bind(gigStub);
    FreelancerTimelineEntry.findOne = timelineStub.findOne.bind(timelineStub);
    NetworkingConnection.count = connectionStub.count.bind(connectionStub);
    FreelancerDashboardOverview.findOne = overviewStub.findOne.bind(overviewStub);

    getFreelancerSupportDeskMock.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
    appCache.flushByPrefix?.('quickActions:user');
  });

  it('returns personalised quick actions and caches the result', async () => {
    const now = Date.now();
    gigStub.count.mockResolvedValue(2);
    timelineStub.findOne.mockResolvedValue({ createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString() });
    connectionStub.count.mockResolvedValue(3);
    overviewStub.findOne.mockResolvedValue({
      upcomingSchedule: [
        { id: 'session-1', startsAt: new Date(now + 90 * 60 * 1000).toISOString() },
      ],
    });
    getFreelancerSupportDeskMock.mockResolvedValue({
      metrics: { openSupportCases: 1, awaitingReplyCases: 1 },
    });

    const payload = await getUserQuickActions(42);

    expect(payload.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'launch-gig', badge: '2 live' }),
        expect.objectContaining({ id: 'open-support', badge: '1 active' }),
      ]),
    );
    expect(payload.metrics).toMatchObject({
      publishedGigCount: 2,
      pendingConnections: 3,
      openSupportCases: 1,
      awaitingReplyCases: 1,
    });

    gigStub.count.mockClear();
    const cached = await getUserQuickActions(42);
    expect(cached.actions[0].id).toBe(payload.actions[0].id);
    expect(gigStub.count).not.toHaveBeenCalled();
  });

  it('falls back gracefully when support data cannot be fetched', async () => {
    const now = Date.now();
    overviewStub.findOne.mockResolvedValue({
      upcomingSchedule: [
        { id: 'session-1', startsAt: new Date(now + 45 * 60 * 1000).toISOString() },
      ],
    });
    getFreelancerSupportDeskMock.mockRejectedValue(new Error('boom'));

    const payload = await getUserQuickActions(42, { bypassCache: true });

    const supportAction = payload.actions.find((action) => action.id === 'open-support');
    expect(supportAction).toBeDefined();
    expect(payload.metrics.openSupportCases).toBe(0);
    expect(payload.metrics.awaitingReplyCases).toBe(0);
  });

  it('skips support hydration for non-concierge roles', async () => {
    userStub.findByPk.mockResolvedValue({ id: 99, userType: 'client' });
    gigStub.count.mockResolvedValue(1);

    const payload = await getUserQuickActions(99, { bypassCache: true });

    expect(getFreelancerSupportDeskMock).not.toHaveBeenCalled();
    expect(payload.actions.some((action) => action.id === 'open-support')).toBe(false);
    expect(payload.actions.some((action) => action.id === 'schedule-session')).toBe(false);
  });

  it('throws when the user does not exist', async () => {
    userStub.findByPk.mockResolvedValue(null);
    await expect(getUserQuickActions(404)).rejects.toThrow('User not found');
  });
});
