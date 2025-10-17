import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getFreelancerTimelineWorkspace,
  saveTimelineSettings,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  createTimelinePost,
  updateTimelinePost,
  deleteTimelinePost,
  publishTimelinePost,
  upsertTimelinePostMetrics,
} from '../src/services/freelancerTimelineService.js';
import {
  FreelancerTimelineWorkspace,
  FreelancerTimelineEntry,
  FreelancerTimelinePost,
  FreelancerTimelinePostMetric,
} from '../src/models/index.js';
import { createUser } from './helpers/factories.js';

describe('freelancerTimelineService', () => {
  let freelancer;

  beforeEach(async () => {
    await FreelancerTimelinePostMetric.destroy({ where: {} });
    await FreelancerTimelineEntry.destroy({ where: {} });
    await FreelancerTimelinePost.destroy({ where: {} });
    await FreelancerTimelineWorkspace.destroy({ where: {} });
    freelancer = await createUser({
      userType: 'freelancer',
      firstName: 'Taylor',
      lastName: 'Rivera',
      email: 'taylor.rivera@gigvora.test',
    });
  });

  it('manages the freelancer timeline workspace end-to-end', async () => {
    const initial = await getFreelancerTimelineWorkspace({ freelancerId: freelancer.id });
    expect(initial.workspace.freelancerId).toBe(freelancer.id);
    expect(initial.posts).toHaveLength(0);
    expect(initial.timelineEntries).toHaveLength(0);

    const settings = await saveTimelineSettings(freelancer.id, {
      timezone: 'America/New_York',
      defaultVisibility: 'connections',
      autoShareToFeed: true,
      reviewBeforePublish: false,
      distributionChannels: ['feed', 'newsletter'],
      contentThemes: ['product', 'growth'],
      cadenceGoal: 4,
    });

    expect(settings.timezone).toBe('America/New_York');
    expect(settings.autoShareToFeed).toBe(true);
    expect(settings.reviewBeforePublish).toBe(false);
    expect(settings.distributionChannels).toEqual(expect.arrayContaining(['feed', 'newsletter']));

    const post = await createTimelinePost(freelancer.id, {
      title: 'Weekly product update',
      summary: 'Highlights from the latest sprint.',
      content: 'Shipped onboarding improvements and activated referral campaign.',
      status: 'draft',
      visibility: 'connections',
      scheduledAt: new Date(),
      tags: ['product', 'release'],
      attachments: [{ label: 'Sprint deck', url: 'https://cdn.example.com/sprint.pdf' }],
      targetAudience: [{ label: 'Existing clients' }, 'prospects'],
      callToAction: { label: 'Book a call', url: 'https://example.com/intro' },
    });

    expect(post.id).toBeGreaterThan(0);
    expect(post.tags).toEqual(expect.arrayContaining(['product', 'release']));

    const scheduledAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const updatedPost = await updateTimelinePost(freelancer.id, post.id, {
      status: 'scheduled',
      scheduledAt,
      campaign: 'Launch campaign',
    });

    expect(updatedPost.status).toBe('scheduled');
    expect(new Date(updatedPost.scheduledAt).toISOString()).toBe(scheduledAt.toISOString());
    expect(updatedPost.campaign).toBe('Launch campaign');

    const published = await publishTimelinePost(freelancer.id, post.id, {
      publishedAt: new Date(),
      visibility: 'public',
    });

    expect(published.status).toBe('published');
    expect(published.visibility).toBe('public');

    const metric = await upsertTimelinePostMetrics(freelancer.id, post.id, {
      capturedAt: '2024-04-15',
      impressions: 1200,
      clicks: 80,
      comments: 12,
      reactions: 45,
      shares: 9,
      saves: 4,
      profileVisits: 30,
      leads: 3,
      conversionRate: 6.5,
    });

    expect(metric.impressions).toBe(1200);
    expect(metric.clicks).toBe(80);
    expect(metric.conversionRate).toBeCloseTo(6.5);

    const entry = await createTimelineEntry(freelancer.id, {
      title: 'Client showcase webinar',
      description: 'Live demo with key customers and partners.',
      entryType: 'event',
      status: 'planned',
      startAt: '2024-04-20T15:00:00Z',
      endAt: '2024-04-20T16:00:00Z',
      linkedPostId: post.id,
      channel: 'LinkedIn Live',
      tags: ['webinar', 'launch'],
    });

    expect(entry.linkedPostId).toBe(post.id);
    expect(entry.channel).toBe('LinkedIn Live');

    const updatedEntry = await updateTimelineEntry(freelancer.id, entry.id, {
      status: 'in_progress',
      owner: 'Taylor Rivera',
    });

    expect(updatedEntry.status).toBe('in_progress');
    expect(updatedEntry.owner).toBe('Taylor Rivera');

    const workspace = await getFreelancerTimelineWorkspace({ freelancerId: freelancer.id });
    expect(workspace.posts).toHaveLength(1);
    expect(workspace.timelineEntries).toHaveLength(1);
    expect(workspace.analytics.totals.published).toBe(1);
    expect(workspace.analytics.totals.impressions).toBeGreaterThanOrEqual(1200);
    expect(workspace.analytics.topTags.map((item) => item.tag)).toEqual(
      expect.arrayContaining(['product', 'release']),
    );

    await deleteTimelineEntry(freelancer.id, entry.id);
    await deleteTimelinePost(freelancer.id, post.id);

    const after = await getFreelancerTimelineWorkspace({ freelancerId: freelancer.id });
    expect(after.posts).toHaveLength(0);
    expect(after.timelineEntries).toHaveLength(0);
  });
});
