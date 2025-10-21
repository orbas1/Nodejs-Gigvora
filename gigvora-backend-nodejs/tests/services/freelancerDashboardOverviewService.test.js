import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { appCache } from '../../src/utils/cache.js';
import { ValidationError } from '../../src/utils/errors.js';

const fetchMock = jest.fn();

jest.unstable_mockModule('node-fetch', () => ({
  default: fetchMock,
}));

const modelMocks = {
  User: { findByPk: jest.fn() },
  Profile: {},
  FreelancerProfile: {},
  FreelancerDashboardOverview: { findOrCreate: jest.fn() },
};

Object.keys(global.__mockSequelizeModels).forEach((key) => delete global.__mockSequelizeModels[key]);
Object.assign(global.__mockSequelizeModels, modelMocks);

const {
  getFreelancerDashboardOverview,
  updateFreelancerDashboardOverview,
} = await import('../../src/services/freelancerDashboardOverviewService.js');

function resetMocks() {
  Object.values(modelMocks).forEach((entry) => {
    if (!entry) return;
    Object.values(entry).forEach((maybeFn) => {
      if (typeof maybeFn?.mockReset === 'function') {
        maybeFn.mockReset();
      }
    });
  });
  fetchMock.mockReset();
  appCache.store.clear();
}

function createOverviewRecord(overrides = {}) {
  const record = {
    headline: 'Lead Designer',
    summary: 'Building delightful experiences',
    avatarUrl: 'https://cdn.gigvora.test/avatar.png',
    followerCount: 320,
    followerGoal: 500,
    trustScore: 92,
    trustScoreChange: 3,
    rating: 4.8,
    ratingCount: 87,
    workstreams: [
      { id: 'ws-1', label: 'Proposal refresh', status: 'Due soon', tone: 'emerald' },
      { label: '', status: 'Due tomorrow' },
      null,
    ],
    relationshipHealth: {
      retentionScore: '88',
      retentionNotes: 'Great rapport',
      retentionStatus: 'Healthy',
      advocacyInProgress: '2',
      advocacyNotes: 'Client exploring case study',
    },
    upcomingSchedule: [
      { id: 'sched-1', label: 'Client kickoff', type: 'Call', tone: 'violet', startsAt: '2024-05-02T10:00:00.000Z' },
      { type: 'Review', startsAt: '2024-05-04T14:00:00.000Z' },
    ],
    weatherLocation: 'Berlin',
    weatherLatitude: '52.52',
    weatherLongitude: '13.405',
    weatherUnits: 'metric',
    weatherSnapshot: {
      provider: 'open-meteo',
      fetchedAt: '2024-05-01T10:00:00.000Z',
      temperatureCelsius: 18.456,
      weatherCode: 2,
      timezone: 'Europe/Berlin',
    },
    weatherLastCheckedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    metadata: { timezone: 'Europe/Berlin' },
    save: jest.fn().mockResolvedValue(),
    get({ plain }) {
      if (plain) {
        const { save, get: _get, ...data } = this;
        return JSON.parse(JSON.stringify(data));
      }
      return this;
    },
    ...overrides,
  };
  return record;
}

describe('freelancerDashboardOverviewService', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('builds a dashboard overview with cached results and weather reuse', async () => {
    const overviewRecord = createOverviewRecord();
    const user = {
      id: 101,
      firstName: 'Riley',
      lastName: 'Stone',
      email: 'riley@example.com',
      userType: 'freelancer',
      Profile: {
        headline: 'Experience designer',
        missionStatement: 'Delivering joy in every interaction',
        followersCount: 280,
        trustScore: 88,
        timezone: 'Europe/Berlin',
      },
      FreelancerProfile: {
        title: 'Product Designer',
        location: 'Berlin',
        geoLocation: { timezone: 'Europe/Berlin' },
      },
      dashboardOverview: overviewRecord,
    };

    modelMocks.User.findByPk.mockResolvedValue(user);

    const first = await getFreelancerDashboardOverview(101);
    const second = await getFreelancerDashboardOverview('101');

    expect(modelMocks.User.findByPk).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();

    expect(first.profile).toMatchObject({
      id: 101,
      name: 'Riley Stone',
      headline: 'Lead Designer',
      summary: 'Building delightful experiences',
      followerCount: 320,
      followerGoal: 500,
      trustScore: 92,
      trustScoreChange: 3,
      rating: 4.8,
      ratingCount: 87,
      location: 'Berlin',
    });
    expect(first.workstreams).toHaveLength(2);
    expect(first.workstreams[1]).toMatchObject({ label: 'Workstream 2', tone: 'amber' });
    expect(first.upcomingSchedule[1]).toMatchObject({ label: 'Event 2', type: 'Review', tone: 'slate' });
    expect(first.weather).toMatchObject({
      provider: 'open-meteo',
      condition: 'Partly cloudy',
      temperature: 18.5,
      units: 'metric',
      locationName: 'Berlin',
    });
    expect(first.currentDate).toHaveProperty('iso');
    expect(first.currentDate).toHaveProperty('formatted');
    expect(first.metadata.generatedAt).toBeDefined();
    expect(second).toEqual(first);
  });

  it('rejects dashboard access for non-freelancer accounts', async () => {
    modelMocks.User.findByPk.mockResolvedValue({
      id: 44,
      userType: 'company',
    });

    await expect(getFreelancerDashboardOverview(44)).rejects.toThrow(ValidationError);
  });

  it('updates persisted overview values and refreshes the cache', async () => {
    const overviewRecord = createOverviewRecord({
      followerCount: 200,
      followerGoal: 250,
      trustScore: 80,
      trustScoreChange: 1,
      rating: 4.2,
      ratingCount: 40,
      weatherLocation: null,
      weatherLatitude: null,
      weatherLongitude: null,
      weatherSnapshot: null,
      weatherLastCheckedAt: null,
      metadata: {},
    });

    const profileSave = jest.fn().mockResolvedValue();

    const user = {
      id: 55,
      firstName: 'Jordan',
      lastName: 'Lee',
      email: 'jordan@example.com',
      userType: 'freelancer',
      Profile: {
        headline: 'Existing headline',
        missionStatement: 'Existing summary',
        followersCount: 200,
        trustScore: 80,
        timezone: 'America/New_York',
        save: profileSave,
      },
      FreelancerProfile: {
        title: 'Product Strategist',
        location: 'New York',
        geoLocation: { timezone: 'America/New_York' },
      },
      dashboardOverview: overviewRecord,
    };

    modelMocks.User.findByPk.mockResolvedValue(user);
    modelMocks.FreelancerDashboardOverview.findOrCreate.mockResolvedValue([overviewRecord, false]);

    const flushSpy = jest.spyOn(appCache, 'flushByPrefix');

    const result = await updateFreelancerDashboardOverview(55, {
      headline: 'Principal Designer',
      summary: 'Leading global product launches',
      avatarUrl: 'https://cdn.gigvora.test/new-avatar.png',
      followerCount: '410',
      followerGoal: 600,
      trustScore: '94',
      trustScoreChange: 5,
      rating: 4.9,
      ratingCount: '102',
      workstreams: [{ label: 'Launch prep', status: 'On track', tone: 'emerald' }],
      relationshipHealth: { retentionStatus: 'At risk' },
      upcomingSchedule: [{ label: 'Client sync', type: 'Call', tone: 'blue', startsAt: '2024-05-03T15:00:00.000Z' }],
      weather: { locationName: 'Lisbon', latitude: '', longitude: '', units: 'imperial' },
      timezone: 'Europe/Lisbon',
    });

    expect(modelMocks.User.findByPk).toHaveBeenCalledTimes(2);
    expect(modelMocks.FreelancerDashboardOverview.findOrCreate).toHaveBeenCalledWith({
      where: { freelancerId: 55 },
      defaults: { freelancerId: 55 },
    });
    expect(overviewRecord.save).toHaveBeenCalledTimes(1);
    expect(profileSave).toHaveBeenCalledTimes(1);
    expect(flushSpy).toHaveBeenCalledWith('dashboard:freelancer:overview:');

    expect(overviewRecord).toMatchObject({
      headline: 'Principal Designer',
      summary: 'Leading global product launches',
      avatarUrl: 'https://cdn.gigvora.test/new-avatar.png',
      followerCount: 410,
      followerGoal: 600,
      trustScore: 94,
      trustScoreChange: 5,
      rating: 4.9,
      ratingCount: 102,
      weatherLocation: 'Lisbon',
      weatherLatitude: null,
      weatherLongitude: null,
      weatherSnapshot: null,
      weatherLastCheckedAt: null,
      metadata: expect.objectContaining({ timezone: 'Europe/Lisbon' }),
    });

    expect(result.profile).toMatchObject({
      name: 'Jordan Lee',
      headline: 'Principal Designer',
      summary: 'Leading global product launches',
      followerCount: 410,
      followerGoal: 600,
      trustScore: 94,
      trustScoreChange: 5,
      rating: 4.9,
      ratingCount: 102,
      location: 'Lisbon',
    });
    expect(result.weather).toMatchObject({ locationName: 'Lisbon', provider: null });
  });
});
