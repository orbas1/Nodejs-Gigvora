'use strict';

const { QueryTypes } = require('sequelize');

const FREELANCER_EMAIL = 'leo@gigvora.com';

const TIMELINE_POSTS = [
  {
    key: 'flowpilot-gtm',
    title: 'FlowPilot go-to-market recap',
    summary: 'Scaled the FlowPilot marketplace relaunch with live telemetry, launch operations, and go-to-market coaching.',
    content:
      'Partnered with FlowPilot to rebuild the marketplace core, orchestrate cross-discipline launch pods, and publish realtime telemetry for executive updates.',
    status: 'published',
    visibility: 'public',
    publishedAt: new Date('2024-02-22T10:00:00.000Z'),
    heroImageUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/hero.jpg',
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
  },
  {
    key: 'mentor-ama',
    title: 'Mentor alliance AMA series',
    summary: 'Launching the mentor alliance AMA sessions with venture-backed founders and operators.',
    content:
      'Codified the mentor alliance playbook, secured sponsor coverage, and scheduled rolling AMA sessions with venture mentors and founders.',
    status: 'scheduled',
    visibility: 'connections',
    scheduledAt: new Date('2024-03-05T16:00:00.000Z'),
    heroImageUrl: 'https://cdn.gigvora.test/portfolio/mentor/alliance-cover.jpg',
    tags: ['Mentorship', 'Community'],
    targetAudience: ['Mentors', 'Founders'],
    campaign: 'Mentor alliance',
    callToAction: {
      label: 'Reserve seat',
      url: 'https://cal.gigvora.test/leo/mentor-alliance',
      style: 'secondary',
    },
  },
];

const POST_METRICS = {
  'flowpilot-gtm': [
    {
      capturedAt: '2024-02-22',
      impressions: 1800,
      views: 1500,
      clicks: 82,
      comments: 9,
      reactions: 24,
      saves: 6,
      shares: 3,
      profileVisits: 18,
      leads: 2,
    },
    {
      capturedAt: '2024-02-23',
      impressions: 1400,
      views: 1200,
      clicks: 98,
      comments: 12,
      reactions: 30,
      saves: 10,
      shares: 5,
      profileVisits: 27,
      leads: 4,
    },
  ],
};

const TIMELINE_ENTRIES = [
  {
    key: 'flowpilot-rebuild',
    title: 'FlowPilot marketplace rebuild',
    entryType: 'milestone',
    status: 'completed',
    startAt: new Date('2023-11-01T00:00:00.000Z'),
    endAt: new Date('2024-02-20T00:00:00.000Z'),
    owner: 'Leo Freelancer',
    channel: 'Product leadership',
    location: 'Remote · Lisbon',
    tags: ['Product', 'Growth', 'Leadership'],
    metadata: {
      organization: 'FlowPilot Labs',
      achievements: [
        'Migrated three critical services to an event-driven architecture in 16 weeks.',
        'Cut checkout latency by 47% across EU cohorts and unlocked experimentation velocity.',
      ],
      metrics: [
        { label: 'Quarterly ARR influence', value: '$1.2M' },
        { label: 'Conversion lift', value: '27%' },
      ],
      media: {
        imageUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/hero.jpg',
        videoUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/showreel.mp4',
      },
      spotlight: true,
    },
    linkedPostKey: 'flowpilot-gtm',
  },
  {
    key: 'mentor-alliance',
    title: 'Mentor alliance AMA series',
    entryType: 'event',
    status: 'in_progress',
    startAt: new Date('2024-03-01T00:00:00.000Z'),
    endAt: null,
    owner: 'Leo Freelancer',
    channel: 'Community',
    location: 'Hybrid · Remote',
    tags: ['Mentorship', 'Community'],
    metadata: {
      organization: 'Atlas Mentorship Circle',
      achievements: ['Confirmed eight venture mentors for Q2', 'Secured sponsor coverage for the next cohort'],
      metrics: [{ label: 'Waitlist signups', value: 186 }],
      media: {
        link: 'https://community.gigvora.test/mentor-alliance',
      },
    },
    linkedPostKey: 'mentor-ama',
  },
];

const PORTFOLIO_ITEMS = [
  {
    slug: 'flowpilot-replatform',
    title: 'FlowPilot marketplace replatform',
    tagline: 'Scaled product velocity with resilient experimentation stack.',
    clientName: 'FlowPilot Labs',
    clientIndustry: 'Marketplace SaaS',
    role: 'Fractional Staff Engineer',
    summary:
      'Partnered with FlowPilot to rebuild the marketplace core, orchestrate launch pods, and ship a resilient experimentation stack.',
    problemStatement: 'Legacy monolith throttled experimentation and slowed revenue expansion.',
    approachSummary:
      'Led architecture, experimentation, and reliability pods; rolled out service templates and progressive delivery in 16 weeks.',
    outcomeSummary: 'Delivered 27% conversion lift, $1.2M ARR influence, and 47% latency reduction across core flows.',
    impactMetrics: [
      { label: 'ARR lift', value: '$1.2M', tone: 'positive' },
      { label: 'Checkout latency', value: '-47%', tone: 'positive' },
    ],
    tags: ['Product', 'Platform', 'Growth'],
    industries: ['SaaS', 'Marketplace'],
    services: ['Architecture leadership', 'Experimentation systems'],
    technologies: ['Node.js', 'React', 'PostgreSQL', 'Kafka'],
    heroImageUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/hero.jpg',
    heroVideoUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/cut.mp4',
    callToActionLabel: 'View delivery roadmap',
    callToActionUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/roadmap.pdf',
    repositoryUrl: 'https://github.com/gigvora-samples/flowpilot-replatform',
    liveUrl: 'https://flowpilot.example.com',
    visibility: 'public',
    status: 'published',
    isFeatured: true,
    featuredOrder: 0,
    startDate: new Date('2023-10-01T00:00:00.000Z'),
    endDate: new Date('2024-02-20T00:00:00.000Z'),
    publishedAt: new Date('2024-02-25T00:00:00.000Z'),
    lastSharedAt: new Date('2024-02-26T00:00:00.000Z'),
  },
  {
    slug: 'mentor-alliance-blueprint',
    title: 'Mentor alliance blueprint',
    tagline: 'Community & mentorship operating system for venture-backed founders.',
    clientName: 'Atlas Mentorship Circle',
    clientIndustry: 'Education & Mentorship',
    role: 'Product & Community Strategist',
    summary: 'Codified the mentor alliance programme with async AMAs, analytics, and sponsor-ready programming.',
    problemStatement: 'Mentor programme scaling without consistent experience or analytics.',
    approachSummary: 'Designed async experiences, built analytics loops, and packaged sponsor-ready operations.',
    outcomeSummary: 'Drove 186 waitlist signups and 93% satisfaction for the pilot cohort.',
    impactMetrics: [
      { label: 'Waitlist signups', value: 186, tone: 'positive' },
      { label: 'Mentor NPS', value: 93, tone: 'positive' },
    ],
    tags: ['Community', 'Mentorship'],
    industries: ['Education'],
    services: ['Programme design', 'Analytics enablement'],
    technologies: ['Notion', 'HubSpot', 'Segment'],
    heroImageUrl: 'https://cdn.gigvora.test/portfolio/mentor/alliance-cover.jpg',
    visibility: 'network',
    status: 'published',
    isFeatured: false,
    startDate: new Date('2023-09-01T00:00:00.000Z'),
    endDate: new Date('2024-03-01T00:00:00.000Z'),
    publishedAt: new Date('2024-02-28T00:00:00.000Z'),
  },
];

const PORTFOLIO_ASSETS = {
  'flowpilot-replatform': [
    {
      label: 'Launch architecture',
      description: 'Service topology used for the FlowPilot relaunch.',
      url: 'https://cdn.gigvora.test/portfolio/flowpilot/architecture.png',
      thumbnailUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/architecture-thumb.png',
      assetType: 'image',
      sortOrder: 0,
      isPrimary: true,
    },
    {
      label: 'Experiment dashboard',
      description: 'Executive dashboard tracking experiment velocity.',
      url: 'https://cdn.gigvora.test/portfolio/flowpilot/dashboard.png',
      assetType: 'image',
      sortOrder: 1,
    },
  ],
  'mentor-alliance-blueprint': [
    {
      label: 'Programme blueprint',
      description: 'Sponsor-ready mentor alliance playbook excerpt.',
      url: 'https://cdn.gigvora.test/portfolio/mentor/blueprint.pdf',
      assetType: 'document',
      sortOrder: 0,
      isPrimary: true,
    },
  ],
};

const PORTFOLIO_SETTINGS = {
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
  lastPublishedAt: new Date('2024-02-28T00:00:00.000Z'),
  lastSyncedAt: new Date(),
};

const FOLLOWER_PROFILES = [
  {
    email: 'mentor@gigvora.com',
    status: 'active',
    notificationsEnabled: true,
    displayName: 'Avery Mentor',
    notes: 'Coaches the mentor alliance AMA series and syndicates highlights to operators.',
    tags: ['Mentor', 'Community'],
    metadata: { origin: 'mentor_alliance', cohorts: ['Mentor alliance', 'Operator circles'] },
    followedAt: new Date('2023-11-12T00:00:00.000Z'),
    lastInteractedAt: new Date('2024-02-20T00:00:00.000Z'),
  },
  {
    email: 'recruiter@gigvora.com',
    status: 'muted',
    notificationsEnabled: false,
    displayName: 'Riley Recruiter',
    notes: 'Requests curated case studies once a month for enterprise talent briefs.',
    tags: ['Recruiter', 'Enterprise'],
    metadata: { origin: 'referral_programme', cadence: 'monthly_digest' },
    followedAt: new Date('2023-12-01T00:00:00.000Z'),
    lastInteractedAt: new Date('2024-02-12T00:00:00.000Z'),
  },
];

const NETWORK_CONNECTIONS = [
  {
    requesterEmail: FREELANCER_EMAIL,
    addresseeEmail: 'mentor@gigvora.com',
    status: 'accepted',
    favourite: true,
    visibility: 'connections',
    relationshipTag: 'Mentor',
    notes: 'Co-hosts mentor alliance AMAs and vouches intros to operators.',
    connectedAt: new Date('2023-09-15T00:00:00.000Z'),
    lastInteractedAt: new Date('2024-02-20T00:00:00.000Z'),
  },
  {
    requesterEmail: 'recruiter@gigvora.com',
    addresseeEmail: FREELANCER_EMAIL,
    status: 'pending',
    favourite: false,
    visibility: 'connections',
    relationshipTag: 'Recruiter',
    notes: 'Reviewing growth portfolio before extending retained search invite.',
    connectedAt: new Date('2024-02-24T00:00:00.000Z'),
    lastInteractedAt: new Date('2024-02-24T00:00:00.000Z'),
  },
];

function toJson(value) {
  if (value == null) {
    return null;
  }
  return JSON.stringify(value);
}

async function resolveFreelancerContext(queryInterface, transaction) {
  const [user] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email: FREELANCER_EMAIL },
    },
  );
  if (!user) {
    return null;
  }
  const userId = user.id;
  const [profile] = await queryInterface.sequelize.query(
    'SELECT id FROM profiles WHERE userId = :userId LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { userId },
    },
  );
  if (!profile) {
    return null;
  }
  return { userId, profileId: profile.id };
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const context = await resolveFreelancerContext(queryInterface, transaction);
      if (!context) {
        return;
      }
      const { userId, profileId } = context;
      const now = new Date();

      const relatedEmails = new Set([FREELANCER_EMAIL]);
      FOLLOWER_PROFILES.forEach((follower) => relatedEmails.add(follower.email));
      NETWORK_CONNECTIONS.forEach((connection) => {
        relatedEmails.add(connection.requesterEmail);
        relatedEmails.add(connection.addresseeEmail);
      });

      const relatedUsers = relatedEmails.size
        ? await queryInterface.sequelize.query(
            'SELECT id, email FROM users WHERE email IN (:emails)',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { emails: Array.from(relatedEmails) },
            },
          )
        : [];
      const userIdByEmail = new Map(relatedUsers.map((row) => [row.email, row.id]));
      userIdByEmail.set(FREELANCER_EMAIL, userId);

      let workspaceId;
      const [existingWorkspace] = await queryInterface.sequelize.query(
        'SELECT id FROM freelancer_timeline_workspaces WHERE freelancerId = :userId LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId },
        },
      );
      if (existingWorkspace) {
        workspaceId = existingWorkspace.id;
        await queryInterface.bulkUpdate(
          'freelancer_timeline_workspaces',
          {
            contentThemes: toJson(['Product', 'Growth', 'Leadership']),
            pinnedCampaigns: toJson(['AI showcase', 'Marketplace modernisation']),
            cadenceGoal: 4,
            lastSyncedAt: now,
            updatedAt: now,
          },
          { id: workspaceId },
          { transaction },
        );
      } else {
        const inserted = await queryInterface.bulkInsert(
          'freelancer_timeline_workspaces',
          [
            {
              freelancerId: userId,
              timezone: 'Europe/Lisbon',
              defaultVisibility: 'public',
              autoShareToFeed: true,
              reviewBeforePublish: true,
              distributionChannels: toJson(['Newsletter', 'Mentor circle']),
              contentThemes: toJson(['Product', 'Growth', 'Leadership']),
              pinnedCampaigns: toJson(['AI showcase', 'Marketplace modernisation']),
              cadenceGoal: 4,
              lastSyncedAt: now,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction, returning: ['id'] },
        );
        workspaceId = Array.isArray(inserted) ? inserted[0]?.id ?? inserted[0] : inserted;
        if (!workspaceId) {
          const [workspace] = await queryInterface.sequelize.query(
            'SELECT id FROM freelancer_timeline_workspaces WHERE freelancerId = :userId LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { userId },
            },
          );
          workspaceId = workspace?.id;
        }
      }

      const timelinePostIds = new Map();
      for (const post of TIMELINE_POSTS) {
        const replacements = { userId, title: post.title };
        const [existingPost] = await queryInterface.sequelize.query(
          'SELECT id FROM freelancer_timeline_posts WHERE freelancerId = :userId AND title = :title LIMIT 1',
          { type: QueryTypes.SELECT, transaction, replacements },
        );
        const payload = {
          freelancerId: userId,
          workspaceId,
          title: post.title,
          summary: post.summary,
          content: post.content,
          status: post.status,
          visibility: post.visibility,
          scheduledAt: post.scheduledAt ?? null,
          publishedAt: post.publishedAt ?? null,
          timezone: 'Europe/Lisbon',
          heroImageUrl: post.heroImageUrl ?? null,
          allowComments: true,
          tags: toJson(post.tags ?? []),
          attachments: toJson(post.attachments ?? []),
          targetAudience: toJson(post.targetAudience ?? []),
          campaign: post.campaign ?? null,
          callToAction: toJson(post.callToAction ?? null),
          metricsSnapshot: toJson({}),
          lastEditedById: null,
          updatedAt: now,
        };
        let postId;
        if (existingPost) {
          postId = existingPost.id;
          await queryInterface.bulkUpdate(
            'freelancer_timeline_posts',
            { ...payload },
            { id: postId },
            { transaction },
          );
        } else {
          const insertedPost = await queryInterface.bulkInsert(
            'freelancer_timeline_posts',
            [{ ...payload, createdAt: now }],
            { transaction, returning: ['id'] },
          );
          postId = Array.isArray(insertedPost) ? insertedPost[0]?.id ?? insertedPost[0] : insertedPost;
          if (!postId) {
            const [lookup] = await queryInterface.sequelize.query(
              'SELECT id FROM freelancer_timeline_posts WHERE freelancerId = :userId AND title = :title LIMIT 1',
              { type: QueryTypes.SELECT, transaction, replacements },
            );
            postId = lookup?.id;
          }
        }
        if (!postId) {
          continue;
        }
        timelinePostIds.set(post.key, postId);
        await queryInterface.bulkDelete(
          'freelancer_timeline_post_metrics',
          { postId, freelancerId: userId },
          { transaction },
        );
        const metricsRows = (POST_METRICS[post.key] ?? []).map((metric) => ({
          postId,
          freelancerId: userId,
          capturedAt: metric.capturedAt,
          impressions: metric.impressions ?? 0,
          views: metric.views ?? metric.impressions ?? 0,
          clicks: metric.clicks ?? 0,
          comments: metric.comments ?? 0,
          reactions: metric.reactions ?? 0,
          saves: metric.saves ?? 0,
          shares: metric.shares ?? 0,
          profileVisits: metric.profileVisits ?? 0,
          leads: metric.leads ?? 0,
          conversionRate: metric.conversionRate ?? null,
          metadata: toJson(metric.metadata ?? null),
          createdAt: now,
          updatedAt: now,
        }));
        if (metricsRows.length) {
          await queryInterface.bulkInsert('freelancer_timeline_post_metrics', metricsRows, { transaction });
        }
      }

      for (const entry of TIMELINE_ENTRIES) {
        const linkedPostId = entry.linkedPostKey ? timelinePostIds.get(entry.linkedPostKey) ?? null : null;
        await queryInterface.bulkDelete(
          'freelancer_timeline_entries',
          { freelancerId: userId, title: entry.title },
          { transaction },
        );
        await queryInterface.bulkInsert(
          'freelancer_timeline_entries',
          [
            {
              freelancerId: userId,
              workspaceId,
              title: entry.title,
              description: entry.metadata?.description ?? null,
              entryType: entry.entryType,
              status: entry.status,
              startAt: entry.startAt ?? null,
              endAt: entry.endAt ?? null,
              linkedPostId,
              owner: entry.owner ?? null,
              channel: entry.channel ?? null,
              location: entry.location ?? null,
              tags: toJson(entry.tags ?? []),
              metadata: toJson(entry.metadata ?? null),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingSettings] = await queryInterface.sequelize.query(
        'SELECT userId FROM freelancer_portfolio_settings WHERE userId = :userId LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { userId } },
      );
      const settingsPayload = {
        userId,
        profileId,
        heroHeadline: PORTFOLIO_SETTINGS.heroHeadline,
        heroSubheadline: PORTFOLIO_SETTINGS.heroSubheadline,
        coverImageUrl: PORTFOLIO_SETTINGS.coverImageUrl,
        coverVideoUrl: PORTFOLIO_SETTINGS.coverVideoUrl,
        brandAccentColor: PORTFOLIO_SETTINGS.brandAccentColor,
        defaultVisibility: PORTFOLIO_SETTINGS.defaultVisibility,
        allowPublicDownload: PORTFOLIO_SETTINGS.allowPublicDownload,
        autoShareToFeed: PORTFOLIO_SETTINGS.autoShareToFeed,
        showMetrics: PORTFOLIO_SETTINGS.showMetrics,
        showTestimonials: PORTFOLIO_SETTINGS.showTestimonials,
        showContactButton: PORTFOLIO_SETTINGS.showContactButton,
        contactEmail: PORTFOLIO_SETTINGS.contactEmail,
        schedulingLink: PORTFOLIO_SETTINGS.schedulingLink,
        customDomain: PORTFOLIO_SETTINGS.customDomain,
        previewBasePath: PORTFOLIO_SETTINGS.previewBasePath,
        lastPublishedAt: PORTFOLIO_SETTINGS.lastPublishedAt,
        lastSyncedAt: PORTFOLIO_SETTINGS.lastSyncedAt,
        updatedAt: now,
      };
      if (existingSettings) {
        await queryInterface.bulkUpdate(
          'freelancer_portfolio_settings',
          settingsPayload,
          { userId },
          { transaction },
        );
      } else {
        await queryInterface.bulkInsert(
          'freelancer_portfolio_settings',
          [{ ...settingsPayload, createdAt: now }],
          { transaction },
        );
      }

      for (const item of PORTFOLIO_ITEMS) {
        await queryInterface.bulkDelete(
          'freelancer_portfolio_items',
          { slug: item.slug },
          { transaction },
        );
        const insertedItem = await queryInterface.bulkInsert(
          'freelancer_portfolio_items',
          [
            {
              userId,
              profileId,
              slug: item.slug,
              title: item.title,
              tagline: item.tagline ?? null,
              clientName: item.clientName ?? null,
              clientIndustry: item.clientIndustry ?? null,
              role: item.role ?? null,
              summary: item.summary ?? null,
              problemStatement: item.problemStatement ?? null,
              approachSummary: item.approachSummary ?? null,
              outcomeSummary: item.outcomeSummary ?? null,
              impactMetrics: toJson(item.impactMetrics ?? []),
              tags: toJson(item.tags ?? []),
              industries: toJson(item.industries ?? []),
              services: toJson(item.services ?? []),
              technologies: toJson(item.technologies ?? []),
              heroImageUrl: item.heroImageUrl ?? null,
              heroVideoUrl: item.heroVideoUrl ?? null,
              callToActionLabel: item.callToActionLabel ?? null,
              callToActionUrl: item.callToActionUrl ?? null,
              repositoryUrl: item.repositoryUrl ?? null,
              liveUrl: item.liveUrl ?? null,
              visibility: item.visibility,
              status: item.status,
              isFeatured: item.isFeatured ?? false,
              featuredOrder: item.featuredOrder ?? null,
              startDate: item.startDate ?? null,
              endDate: item.endDate ?? null,
              publishedAt: item.publishedAt ?? null,
              archivedAt: item.archivedAt ?? null,
              lastSharedAt: item.lastSharedAt ?? null,
              lastReviewedAt: item.lastReviewedAt ?? null,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction, returning: ['id'] },
        );
        let portfolioItemId = Array.isArray(insertedItem) ? insertedItem[0]?.id ?? insertedItem[0] : insertedItem;
        if (!portfolioItemId) {
          const [lookup] = await queryInterface.sequelize.query(
            'SELECT id FROM freelancer_portfolio_items WHERE slug = :slug LIMIT 1',
            { type: QueryTypes.SELECT, transaction, replacements: { slug: item.slug } },
          );
          portfolioItemId = lookup?.id;
        }
        if (!portfolioItemId) {
          continue;
        }
        await queryInterface.bulkDelete(
          'freelancer_portfolio_assets',
          { portfolioItemId },
          { transaction },
        );
        const assets = (PORTFOLIO_ASSETS[item.slug] ?? []).map((asset, index) => ({
          portfolioItemId,
          label: asset.label,
          description: asset.description ?? null,
          url: asset.url,
          thumbnailUrl: asset.thumbnailUrl ?? null,
          assetType: asset.assetType ?? 'image',
          sortOrder: asset.sortOrder ?? index,
          isPrimary: asset.isPrimary ?? index === 0,
          metadata: toJson(asset.metadata ?? null),
          createdAt: now,
          updatedAt: now,
        }));
        if (assets.length) {
          await queryInterface.bulkInsert('freelancer_portfolio_assets', assets, { transaction });
        }
      }

      if (FOLLOWER_PROFILES.length) {
        const followerRows = FOLLOWER_PROFILES.map((follower) => {
          const followerId = userIdByEmail.get(follower.email);
          if (!followerId) {
            return null;
          }
          return {
            profileId,
            followerId,
            status: follower.status ?? 'active',
            notificationsEnabled: follower.notificationsEnabled !== false,
            displayName: follower.displayName ?? null,
            notes: follower.notes ?? null,
            tags: toJson(follower.tags ?? []),
            metadata: toJson(follower.metadata ?? null),
            followedAt: follower.followedAt ?? now,
            lastInteractedAt: follower.lastInteractedAt ?? follower.followedAt ?? now,
            createdAt: now,
            updatedAt: now,
          };
        }).filter(Boolean);

        if (followerRows.length) {
          const followerIds = followerRows.map((row) => row.followerId);
          await queryInterface.bulkDelete(
            'profile_followers',
            { profileId, followerId: followerIds },
            { transaction },
          );
          await queryInterface.bulkInsert('profile_followers', followerRows, { transaction });

          const followerAggregates = await queryInterface.sequelize.query(
            `SELECT COUNT(*)::int AS total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)::int AS active
             FROM profile_followers WHERE profileId = :profileId`,
            { type: QueryTypes.SELECT, transaction, replacements: { profileId } },
          );
          const followerTotals = followerAggregates[0] ?? {};
          await queryInterface.bulkUpdate(
            'profiles',
            {
              followersCount: followerTotals.total ?? followerRows.length,
              engagementRefreshedAt: now,
            },
            { id: profileId },
            { transaction },
          );
        }
      }

      if (NETWORK_CONNECTIONS.length) {
        const connectionRows = [];
        for (const connection of NETWORK_CONNECTIONS) {
          const requesterId = userIdByEmail.get(connection.requesterEmail);
          const addresseeId = userIdByEmail.get(connection.addresseeEmail);
          if (!requesterId || !addresseeId) {
            continue;
          }

          await queryInterface.bulkDelete(
            'connections',
            { requesterId, addresseeId },
            { transaction },
          );

          connectionRows.push({
            requesterId,
            addresseeId,
            status: connection.status ?? 'pending',
            relationshipTag: connection.relationshipTag ?? null,
            notes: connection.notes ?? null,
            favourite: connection.favourite ?? false,
            visibility: connection.visibility ?? 'connections',
            connectedAt: connection.connectedAt ?? now,
            lastInteractedAt: connection.lastInteractedAt ?? connection.connectedAt ?? now,
            createdAt: now,
            updatedAt: now,
          });
        }

        if (connectionRows.length) {
          await queryInterface.bulkInsert('connections', connectionRows, { transaction });
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const context = await resolveFreelancerContext(queryInterface, transaction);
      if (!context) {
        return;
      }
      const { userId, profileId } = context;
      const postTitles = TIMELINE_POSTS.map((post) => post.title);
      const entryTitles = TIMELINE_ENTRIES.map((entry) => entry.title);
      const slugs = PORTFOLIO_ITEMS.map((item) => item.slug);

      const postIds = await queryInterface.sequelize.query(
        'SELECT id FROM freelancer_timeline_posts WHERE freelancerId = :userId AND title IN (:titles)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId, titles: postTitles },
        },
      );
      const postIdList = postIds.map((row) => row.id);
      if (postIdList.length) {
        await queryInterface.bulkDelete(
          'freelancer_timeline_post_metrics',
          { postId: postIdList },
          { transaction },
        );
      }

      await queryInterface.bulkDelete(
        'freelancer_timeline_entries',
        { freelancerId: userId, title: entryTitles },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'freelancer_timeline_posts',
        { freelancerId: userId, title: postTitles },
        { transaction },
      );

      const portfolioIds = await queryInterface.sequelize.query(
        'SELECT id FROM freelancer_portfolio_items WHERE slug IN (:slugs)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slugs },
        },
      );
      const portfolioIdList = portfolioIds.map((row) => row.id);
      if (portfolioIdList.length) {
        await queryInterface.bulkDelete(
          'freelancer_portfolio_assets',
          { portfolioItemId: portfolioIdList },
          { transaction },
        );
      }

      await queryInterface.bulkDelete(
        'freelancer_portfolio_items',
        { slug: slugs },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'freelancer_portfolio_settings',
        {
          heroHeadline: null,
          heroSubheadline: null,
          coverImageUrl: null,
          coverVideoUrl: null,
          brandAccentColor: null,
          allowPublicDownload: false,
          autoShareToFeed: true,
          showMetrics: true,
          showTestimonials: true,
          showContactButton: true,
          contactEmail: null,
          schedulingLink: null,
          customDomain: null,
          previewBasePath: null,
        },
        { userId, contactEmail: PORTFOLIO_SETTINGS.contactEmail },
        { transaction },
      );

      if (FOLLOWER_PROFILES.length) {
        const followerEmails = FOLLOWER_PROFILES.map((follower) => follower.email);
        const followerUsers = followerEmails.length
          ? await queryInterface.sequelize.query(
              'SELECT id FROM users WHERE email IN (:emails)',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { emails: followerEmails },
              },
            )
          : [];
        const followerIds = followerUsers.map((row) => row.id);
        if (followerIds.length) {
          await queryInterface.bulkDelete(
            'profile_followers',
            { profileId, followerId: followerIds },
            { transaction },
          );

          const followerAggregates = await queryInterface.sequelize.query(
            `SELECT COUNT(*)::int AS total FROM profile_followers WHERE profileId = :profileId`,
            { type: QueryTypes.SELECT, transaction, replacements: { profileId } },
          );
          const followerTotals = followerAggregates[0] ?? {};
          await queryInterface.bulkUpdate(
            'profiles',
            {
              followersCount: followerTotals.total ?? 0,
              engagementRefreshedAt: new Date(),
            },
            { id: profileId },
            { transaction },
          );
        }
      }

      if (NETWORK_CONNECTIONS.length) {
        for (const connection of NETWORK_CONNECTIONS) {
          const requester = await queryInterface.sequelize.query(
            'SELECT id FROM users WHERE email = :email LIMIT 1',
            { type: QueryTypes.SELECT, transaction, replacements: { email: connection.requesterEmail } },
          );
          const addressee = await queryInterface.sequelize.query(
            'SELECT id FROM users WHERE email = :email LIMIT 1',
            { type: QueryTypes.SELECT, transaction, replacements: { email: connection.addresseeEmail } },
          );
          const requesterId = requester[0]?.id;
          const addresseeId = addressee[0]?.id;
          if (!requesterId || !addresseeId) {
            continue;
          }

          await queryInterface.bulkDelete(
            'connections',
            { requesterId, addresseeId },
            { transaction },
          );
        }
      }
    });
  },
};
