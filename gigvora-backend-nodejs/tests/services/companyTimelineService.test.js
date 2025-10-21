import { describe, beforeEach, it, expect } from '@jest/globals';
import { ProviderWorkspace, User } from '../../src/models/index.js';
import {
  createTimelineEvent,
  createTimelinePost,
  recordTimelinePostMetrics,
  getTimelineManagementSnapshot,
} from '../../src/services/companyTimelineService.js';

describe('companyTimelineService', () => {
  let workspace;
  let owner;

  beforeEach(async () => {
    owner = await User.create({
      firstName: 'Timeline',
      lastName: 'Owner',
      email: `timeline-owner-${Date.now()}@example.com`,
      password: 'hashed-password',
      userType: 'company',
    });

    workspace = await ProviderWorkspace.create({
      ownerId: owner.id,
      name: 'Timeline Workspace',
      slug: `timeline-${Date.now()}`,
      type: 'company',
      timezone: 'UTC',
      defaultCurrency: 'USD',
    });
  });

  it('captures events, posts, and metrics for management snapshots', async () => {
    const event = await createTimelineEvent({
      workspaceId: workspace.id,
      actorId: owner.id,
      payload: {
        title: 'Launch beta program',
        description: 'Internal enablement for beta partners.',
        status: 'planned',
        category: 'launch',
        startDate: new Date('2024-05-01T00:00:00Z'),
        dueDate: new Date('2024-05-10T00:00:00Z'),
      },
    });

    expect(event.title).toBe('Launch beta program');

    const post = await createTimelinePost({
      workspaceId: workspace.id,
      actorId: owner.id,
      payload: {
        title: 'Beta waitlist open',
        summary: 'Bring your team to the new collaboration suite.',
        status: 'draft',
        visibility: 'workspace',
        tags: ['launch', 'beta'],
      },
    });

    expect(post.title).toBe('Beta waitlist open');

    await recordTimelinePostMetrics(post.id, {
      workspaceId: workspace.id,
      metrics: [
        {
          metricDate: '2024-05-02',
          impressions: 120,
          clicks: 24,
          reactions: 30,
          comments: 6,
          shares: 4,
          saves: 2,
        },
      ],
    });

    const snapshot = await getTimelineManagementSnapshot({ workspaceId: workspace.id, lookbackDays: 60 });

    expect(snapshot.events.items).toHaveLength(1);
    expect(snapshot.posts.items).toHaveLength(1);
    expect(snapshot.analytics.totals.impressions).toBe(120);
    expect(snapshot.analytics.totals.engagements).toBe(66);
    expect(snapshot.posts.tagFrequency).toMatchObject({ launch: 1, beta: 1 });
  });
});
