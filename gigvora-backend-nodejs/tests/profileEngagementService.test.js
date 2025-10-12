import { describe, beforeEach, it, expect } from '@jest/globals';
import './setupTestEnv.js';
import {
  Profile,
  ProfileAppreciation,
  ProfileFollower,
  ProfileEngagementJob,
  AnalyticsEvent,
} from '../src/models/index.js';
import {
  recalculateProfileEngagementNow,
  queueProfileEngagementRecalculation,
  processProfileEngagementQueue,
  shouldRefreshEngagementMetrics,
} from '../src/services/profileEngagementService.js';
import { createUser } from './helpers/factories.js';

async function bootstrapProfile() {
  const owner = await createUser({ userType: 'freelancer' });
  const profile = await Profile.create({
    userId: owner.id,
    headline: 'Automation Specialist',
    bio: 'Delivers production-grade engagement instrumentation.',
  });
  return { owner, profile };
}

describe('profileEngagementService', () => {
  let owner;
  let profile;

  beforeEach(async () => {
    ({ owner, profile } = await bootstrapProfile());
  });

  it('recalculates engagement metrics from appreciation and followers', async () => {
    const admirer = await createUser();
    const supporter = await createUser();

    await ProfileAppreciation.create({
      profileId: profile.id,
      actorId: admirer.id,
      appreciationType: 'like',
    });
    await ProfileAppreciation.create({
      profileId: profile.id,
      actorId: supporter.id,
      appreciationType: 'endorse',
    });
    await ProfileFollower.create({
      profileId: profile.id,
      followerId: admirer.id,
      status: 'active',
    });
    await ProfileFollower.create({
      profileId: profile.id,
      followerId: supporter.id,
      status: 'muted',
    });

    const metrics = await recalculateProfileEngagementNow(profile.id, {
      reason: 'unit_test_refresh',
    });

    expect(metrics.likesCount).toBe(2);
    expect(metrics.followersCount).toBe(1);
    expect(metrics.engagementRefreshedAt).toBeTruthy();

    const reloaded = await Profile.findByPk(profile.id);
    expect(Number(reloaded.likesCount)).toBe(2);
    expect(Number(reloaded.followersCount)).toBe(1);
    expect(reloaded.engagementRefreshedAt).toBeTruthy();
    expect(shouldRefreshEngagementMetrics(reloaded)).toBe(false);

    const events = await AnalyticsEvent.findAll({
      where: { entityType: 'profile', entityId: profile.id },
      order: [['id', 'ASC']],
    });
    const refreshEvent = events.find((event) => event.eventName === 'profile.engagement.metrics_refreshed');
    expect(refreshEvent).toBeTruthy();
    expect(refreshEvent.context.reason).toBe('unit_test_refresh');
    expect(refreshEvent.context.likes.next).toBe(2);
    expect(typeof refreshEvent.context.stage).toBe('string');
  });

  it('queues and processes engagement recalculation jobs', async () => {
    const follower = await createUser();
    await ProfileFollower.create({
      profileId: profile.id,
      followerId: follower.id,
      status: 'active',
    });

    await queueProfileEngagementRecalculation(profile.id, { reason: 'unit_test' });

    const pendingJob = await ProfileEngagementJob.findOne({ where: { profileId: profile.id, status: 'pending' } });
    expect(pendingJob).toBeTruthy();

    const processed = await processProfileEngagementQueue({ limit: 5, logger: { error: () => {} } });
    expect(processed).toBeGreaterThanOrEqual(1);

    const updatedProfile = await Profile.findByPk(profile.id);
    expect(Number(updatedProfile.followersCount)).toBe(1);
    expect(updatedProfile.engagementRefreshedAt).toBeTruthy();

    const completedJob = await ProfileEngagementJob.findByPk(pendingJob.id);
    expect(completedJob.status).toBe('completed');
    expect(completedJob.completedAt).toBeTruthy();
    expect(completedJob.lastError).toBeNull();

    const events = await AnalyticsEvent.findAll({
      where: { entityType: 'profile', entityId: profile.id },
    });
    const jobRefreshEvent = events.find((event) => event.eventName === 'profile.engagement.metrics_refreshed');
    expect(jobRefreshEvent).toBeTruthy();
    expect(jobRefreshEvent.context.reason).toBe('unit_test');
  });
});
