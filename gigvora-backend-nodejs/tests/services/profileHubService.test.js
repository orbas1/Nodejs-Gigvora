import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const profileServiceModule = new URL('../../src/services/profileService.js', import.meta.url);
const timelineServiceModule = new URL('../../src/services/freelancerTimelineService.js', import.meta.url);
const portfolioServiceModule = new URL('../../src/services/freelancerPortfolioService.js', import.meta.url);

const getProfileOverview = jest.fn();
const getFreelancerTimelineWorkspace = jest.fn();
const getPortfolio = jest.fn();

jest.unstable_mockModule(profileServiceModule.pathname, () => ({
  __esModule: true,
  default: { getProfileOverview },
  getProfileOverview,
  updateProfile: jest.fn(),
  updateProfileAvatar: jest.fn(),
}));

jest.unstable_mockModule(timelineServiceModule.pathname, () => ({
  __esModule: true,
  default: { getFreelancerTimelineWorkspace },
  getFreelancerTimelineWorkspace,
}));

jest.unstable_mockModule(portfolioServiceModule.pathname, () => ({
  __esModule: true,
  default: { getPortfolio },
  getPortfolio,
}));

function createFollowerRecord(plain) {
  return {
    status: plain.status,
    get(argument) {
      if (argument === 'follower') {
        return plain.follower;
      }
      if (argument && typeof argument === 'object' && argument.plain) {
        return plain;
      }
      return undefined;
    },
  };
}

function createConnectionRecord(plain) {
  return {
    status: plain.status,
    get(argument) {
      if (argument === 'requester') {
        return plain.requester;
      }
      if (argument === 'addressee') {
        return plain.addressee;
      }
      if (argument && typeof argument === 'object' && argument.plain) {
        return plain;
      }
      return undefined;
    },
  };
}

describe('profileHubService.getProfileHub', () => {
  let __setModelStubs;
  let getProfileHub;

  beforeAll(async () => {
    const modelsModule = await import('../../src/models/index.js');
    __setModelStubs = modelsModule.__setModelStubs;
    ({ getProfileHub } = await import('../../src/services/profileHubService.js'));
  });

  beforeEach(() => {
    const nowIso = '2024-02-28T12:00:00.000Z';
    getProfileOverview.mockResolvedValue({
      profileId: 91,
      name: 'Leo Freelancer',
      headline: 'Fractional Staff Engineer',
      bio: 'Ships premium storytelling with measurable traction.',
      location: 'Lisbon, Portugal',
      profileVisibility: 'members',
      networkVisibility: 'connections',
      followersVisibility: 'connections',
      socialLinks: [
        { label: 'Portfolio', url: 'https://portfolio.gigvora.example/leo' },
      ],
      timezone: 'Europe/Lisbon',
    });

    getFreelancerTimelineWorkspace.mockResolvedValue({
      workspace: {
        id: 11,
        freelancerId: 17,
        timezone: 'Europe/Lisbon',
        defaultVisibility: 'public',
        autoShareToFeed: true,
        reviewBeforePublish: true,
        distributionChannels: ['Newsletter'],
        contentThemes: ['Product', 'Growth'],
        pinnedCampaigns: ['AI showcase'],
        cadenceGoal: 4,
        lastSyncedAt: nowIso,
      },
      timelineEntries: [
        {
          id: 31,
          freelancerId: 17,
          workspaceId: 11,
          title: 'FlowPilot marketplace rebuild',
          description: 'Re-architected marketplace core with event-driven workflows.',
          entryType: 'milestone',
          status: 'completed',
          startAt: '2023-11-01T00:00:00.000Z',
          endAt: '2024-02-20T00:00:00.000Z',
          linkedPostId: 71,
          owner: 'Leo Freelancer',
          channel: 'Product leadership',
          location: 'Remote · Lisbon',
          tags: ['Product', 'Growth', 'Leadership'],
          metadata: {
            organization: 'FlowPilot Labs',
            achievements: [
              'Migrated three critical services to an event-driven architecture.',
              'Cut checkout latency by 47% across EU cohorts.',
            ],
            metrics: [
              { label: 'ARR influence', value: '$1.2M' },
              { label: 'Conversion lift', value: '27%' },
            ],
            media: {
              imageUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/hero.jpg',
              videoUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/showreel.mp4',
            },
            spotlight: true,
          },
          linkedPost: {
            id: 71,
            title: 'FlowPilot go-to-market recap',
            status: 'published',
            visibility: 'public',
            scheduledAt: null,
            publishedAt: '2024-02-22T10:00:00.000Z',
          },
          createdAt: '2024-02-25T10:00:00.000Z',
          updatedAt: '2024-02-28T09:45:00.000Z',
        },
        {
          id: 32,
          freelancerId: 17,
          workspaceId: 11,
          title: 'Mentor alliance AMA series',
          description: 'Async AMAs with venture mentors and product founders.',
          entryType: 'event',
          status: 'in_progress',
          startAt: '2024-03-01T00:00:00.000Z',
          endAt: null,
          linkedPostId: 72,
          owner: 'Leo Freelancer',
          channel: 'Community',
          location: 'Hybrid · Remote',
          tags: ['Mentorship', 'Community'],
          metadata: {
            organization: 'Atlas Mentorship Circle',
            achievements: ['Confirmed eight venture mentors'],
            metrics: [{ label: 'Waitlist signups', value: 186 }],
            media: {
              link: 'https://community.gigvora.test/mentor-alliance',
            },
          },
          linkedPost: {
            id: 72,
            title: 'Mentor alliance AMA series',
            status: 'scheduled',
            visibility: 'connections',
            scheduledAt: '2024-03-05T16:00:00.000Z',
            publishedAt: null,
          },
          createdAt: '2024-02-28T10:00:00.000Z',
          updatedAt: '2024-02-28T10:00:00.000Z',
        },
      ],
      posts: [
        {
          id: 71,
          freelancerId: 17,
          workspaceId: 11,
          title: 'FlowPilot go-to-market recap',
          summary: 'Scaled the FlowPilot relaunch with telemetry and launch pods.',
          content: 'Detailed go-to-market play-by-play with architecture notes.',
          status: 'published',
          visibility: 'public',
          scheduledAt: null,
          publishedAt: '2024-02-22T10:00:00.000Z',
          timezone: 'Europe/Lisbon',
          heroImageUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/hero.jpg',
          allowComments: true,
          tags: ['Product', 'AI'],
          attachments: [
            {
              label: 'Launch deck',
              url: 'https://cdn.gigvora.test/portfolio/flowpilot/launch-deck.pdf',
              type: 'document',
            },
          ],
          targetAudience: ['Investors', 'Product leaders'],
          campaign: 'FlowPilot GTM',
          callToAction: {
            label: 'View launch deck',
            url: 'https://cdn.gigvora.test/portfolio/flowpilot/launch-deck.pdf',
            style: 'primary',
          },
          metrics: {
            totals: {
              impressions: 3200,
              views: 2700,
              clicks: 180,
              comments: 21,
              reactions: 54,
              saves: 16,
              shares: 8,
              profileVisits: 45,
              leads: 6,
            },
            trend: [
              {
                capturedAt: '2024-02-22',
                impressions: 1800,
                clicks: 82,
                reactions: 24,
                comments: 9,
                saves: 6,
                shares: 3,
              },
            ],
          },
          linkedEntries: [],
          createdAt: '2024-02-22T09:00:00.000Z',
          updatedAt: nowIso,
        },
        {
          id: 72,
          freelancerId: 17,
          workspaceId: 11,
          title: 'Mentor alliance AMA series',
          summary: 'Opening AMA programming with venture mentors.',
          content: 'Async AMA scheduling and sponsorship packaging.',
          status: 'scheduled',
          visibility: 'connections',
          scheduledAt: '2024-03-05T16:00:00.000Z',
          publishedAt: null,
          timezone: 'Europe/Lisbon',
          heroImageUrl: 'https://cdn.gigvora.test/portfolio/mentor/alliance-cover.jpg',
          allowComments: true,
          tags: ['Mentorship', 'Community'],
          attachments: [],
          targetAudience: ['Mentors', 'Founders'],
          campaign: 'Mentor alliance',
          callToAction: {
            label: 'Reserve seat',
            url: 'https://cal.gigvora.test/leo/mentor-alliance',
            style: 'secondary',
          },
          metrics: {
            totals: {
              impressions: 0,
              views: 0,
              clicks: 0,
              comments: 0,
              reactions: 0,
              saves: 0,
              shares: 0,
              profileVisits: 0,
              leads: 0,
            },
            trend: [],
          },
          linkedEntries: [],
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ],
      analytics: {
        totals: {
          posts: 2,
          drafts: 0,
          scheduled: 1,
          published: 1,
          archived: 0,
          impressions: 3200,
          views: 2700,
          clicks: 180,
          comments: 21,
          reactions: 54,
          saves: 16,
          shares: 8,
          profileVisits: 45,
          leads: 6,
          engagementRate: 0.18,
        },
        timelineSummary: {
          total: 2,
          planned: 0,
          inProgress: 1,
          completed: 1,
          blocked: 0,
          upcoming: 1,
        },
        trend: [],
        topPosts: [
          {
            id: 71,
            title: 'FlowPilot go-to-market recap',
            status: 'published',
            impressions: 3200,
            engagement: 180,
            publishedAt: '2024-02-22T10:00:00.000Z',
            tags: ['Product'],
          },
        ],
        topTags: [
          { tag: 'Product', count: 2 },
        ],
      },
    });

    getPortfolio.mockResolvedValue({
      items: [
        {
          id: 401,
          slug: 'flowpilot-replatform',
          title: 'FlowPilot marketplace replatform',
          summary: 'Rebuilt the FlowPilot marketplace with resilient experimentation stack.',
          impactMetrics: [
            { label: 'ARR lift', value: '$1.2M' },
            { label: 'Checkout latency', value: '-47%' },
          ],
          tags: ['Product', 'Platform', 'Growth'],
          heroImageUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/hero.jpg',
          heroVideoUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/cut.mp4',
          callToActionLabel: 'View delivery roadmap',
          callToActionUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/roadmap.pdf',
          visibility: 'public',
          status: 'published',
          isFeatured: true,
          startDate: '2023-10-01T00:00:00.000Z',
          endDate: '2024-02-20T00:00:00.000Z',
          publishedAt: '2024-02-25T00:00:00.000Z',
          updatedAt: nowIso,
          assets: [
            {
              id: 901,
              label: 'Launch architecture',
              url: 'https://cdn.gigvora.test/portfolio/flowpilot/architecture.png',
              assetType: 'image',
              sortOrder: 0,
            },
          ],
        },
        {
          id: 402,
          slug: 'mentor-alliance-blueprint',
          title: 'Mentor alliance blueprint',
          summary: 'Mentor alliance operating system for venture-backed founders.',
          impactMetrics: [
            { label: 'Waitlist signups', value: 186 },
            { label: 'Mentor NPS', value: 93 },
          ],
          tags: ['Community', 'Mentorship'],
          heroImageUrl: 'https://cdn.gigvora.test/portfolio/mentor/alliance-cover.jpg',
          visibility: 'network',
          status: 'published',
          isFeatured: false,
          startDate: '2023-09-01T00:00:00.000Z',
          endDate: '2024-03-01T00:00:00.000Z',
          publishedAt: '2024-02-28T00:00:00.000Z',
          updatedAt: nowIso,
          assets: [],
        },
      ],
      settings: {
        userId: 17,
        heroHeadline: 'Signature growth programmes',
        heroSubheadline: 'Stories, data, and testimonials powering premium engagements.',
        coverImageUrl: 'https://cdn.gigvora.test/portfolio/hero/cover.jpg',
        coverVideoUrl: 'https://cdn.gigvora.test/portfolio/hero/intro.mp4',
        brandAccentColor: '#4F46E5',
        defaultVisibility: 'public',
        allowPublicDownload: true,
        autoShareToFeed: true,
        showMetrics: true,
        showTestimonials: true,
        showContactButton: true,
        contactEmail: 'intro@leofreelancer.com',
        schedulingLink: 'https://cal.com/leo/gigvora',
        customDomain: 'https://portfolio.gigvora.example/leo',
        previewBasePath: '/portfolio/leo',
        lastPublishedAt: '2024-02-28T00:00:00.000Z',
        lastSyncedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      summary: {
        total: 2,
        published: 2,
        drafts: 0,
        archived: 0,
        featured: 1,
        assetCount: 1,
        networkVisible: 2,
        lastUpdatedAt: new Date(nowIso),
        previewBaseUrl: 'https://app.gigvora.test/portfolio/leo',
      },
    });

    __setModelStubs({
      ProfileFollower: {
        findAll: jest.fn().mockResolvedValue([
          createFollowerRecord({
            id: 601,
            profileId: 91,
            followerId: 44,
            status: 'active',
            notificationsEnabled: true,
            displayName: 'Jamie Lee',
            notes: 'Met at mentor summit',
            tags: ['Product'],
            followedAt: new Date('2024-02-10T00:00:00.000Z'),
            lastInteractedAt: new Date('2024-02-20T00:00:00.000Z'),
            follower: {
              id: 44,
              firstName: 'Jamie',
              lastName: 'Lee',
              email: 'jamie@example.com',
              userType: 'mentor',
              profile: {
                headline: 'Director of Operations · Atlas',
                location: 'London, UK',
                avatarSeed: 'jamie-lee',
                avatarUrl: null,
              },
            },
          }),
          createFollowerRecord({
            id: 602,
            profileId: 91,
            followerId: 45,
            status: 'muted',
            notificationsEnabled: false,
            displayName: 'Sam Rivera',
            notes: null,
            tags: [],
            followedAt: new Date('2024-02-01T00:00:00.000Z'),
            lastInteractedAt: new Date('2024-02-12T00:00:00.000Z'),
            follower: {
              id: 45,
              firstName: 'Sam',
              lastName: 'Rivera',
              email: 'sam@example.com',
              userType: 'recruiter',
              profile: {
                headline: 'Talent Partner · Elevate',
                location: 'Berlin, DE',
                avatarSeed: 'sam-rivera',
                avatarUrl: null,
              },
            },
          }),
        ]),
      },
      Connection: {
        findAll: jest.fn().mockResolvedValue([
          createConnectionRecord({
            id: 701,
            requesterId: 17,
            addresseeId: 88,
            status: 'accepted',
            favourite: true,
            visibility: 'connections',
            relationshipTag: 'Mentor',
            notes: 'Weekly sync',
            connectedAt: new Date('2023-09-15T00:00:00.000Z'),
            lastInteractedAt: new Date('2024-02-20T00:00:00.000Z'),
            requester: {
              id: 17,
              firstName: 'Leo',
              lastName: 'Freelancer',
              email: 'leo@gigvora.com',
              userType: 'freelancer',
              profile: {
                headline: 'Fractional Staff Engineer',
                location: 'Lisbon, Portugal',
                avatarSeed: 'leo-freelancer',
                avatarUrl: null,
              },
            },
            addressee: {
              id: 88,
              firstName: 'Avery',
              lastName: 'Mentor',
              email: 'mentor@gigvora.com',
              userType: 'user',
              profile: {
                headline: 'Leadership Coach',
                location: 'Lisbon, Portugal',
                avatarSeed: 'avery-mentor',
                avatarUrl: null,
              },
            },
          }),
          createConnectionRecord({
            id: 702,
            requesterId: 92,
            addresseeId: 17,
            status: 'pending',
            favourite: false,
            visibility: 'connections',
            relationshipTag: 'Operator',
            notes: 'Needs follow-up',
            connectedAt: new Date('2024-02-18T00:00:00.000Z'),
            lastInteractedAt: new Date('2024-02-25T00:00:00.000Z'),
            requester: {
              id: 92,
              firstName: 'Morgan',
              lastName: 'Chen',
              email: 'morgan@example.com',
              userType: 'company',
              profile: {
                headline: 'COO · Growthline',
                location: 'New York, USA',
                avatarSeed: 'morgan-chen',
                avatarUrl: null,
              },
            },
            addressee: {
              id: 17,
              firstName: 'Leo',
              lastName: 'Freelancer',
              email: 'leo@gigvora.com',
              userType: 'freelancer',
              profile: {
                headline: 'Fractional Staff Engineer',
                location: 'Lisbon, Portugal',
                avatarSeed: 'leo-freelancer',
                avatarUrl: null,
              },
            },
          }),
        ]),
      },
    });
  });

  it('combines timeline, portfolio, and network data into the profile hub snapshot', async () => {
    const result = await getProfileHub(17, { bypassCache: true });

    expect(result.profile.name).toBe('Leo Freelancer');
    expect(result.followers.total).toBe(2);
    expect(result.connections.total).toBe(1);
    expect(result.connections.pending).toHaveLength(1);

    expect(result.experienceTimeline.items).toHaveLength(2);
    const primaryEntry = result.experienceTimeline.items.find((item) => item.id === 'entry-31');
    expect(primaryEntry).toEqual(
      expect.objectContaining({
        role: 'FlowPilot marketplace rebuild',
        tags: expect.arrayContaining(['Product', 'Growth']),
        metrics: expect.arrayContaining([expect.objectContaining({ label: 'ARR influence' })]),
      }),
    );
    expect(result.experienceTimeline.spotlight).toEqual(
      expect.objectContaining({ label: 'FlowPilot marketplace rebuild' }),
    );

    expect(result.portfolioGallery.items).toHaveLength(2);
    expect(result.portfolioGallery.hero?.title).toBe('FlowPilot marketplace replatform');
    expect(result.portfolioGallery.categories).toEqual(expect.arrayContaining(['Product', 'Community']));

    expect(result.highlightReel.length).toBeGreaterThanOrEqual(2);
    expect(result.trustBadges.map((badge) => badge.id)).toEqual(
      expect.arrayContaining(['network-signal', 'spotlight-consistency']),
    );

    expect(result.workspace.metrics).toMatchObject({
      followers: 2,
      timelinePublished: 1,
      portfolioPublished: 2,
    });
    expect(result.workspace.highlights[0]).toMatch(/followers/);
    expect(result.workspace.timeline.analytics.totals.leads).toBe(6);

    expect(result.viewerPersona).toBe('investor');
    expect(result.mutualConnections[0]).toMatchObject({ name: 'Avery Mentor' });
    expect(result.documents).toMatchObject({ published: 2, drafts: 0 });
    expect(result.collaborations).toMatchObject({ active: 1, favourites: 1 });
  });
});
