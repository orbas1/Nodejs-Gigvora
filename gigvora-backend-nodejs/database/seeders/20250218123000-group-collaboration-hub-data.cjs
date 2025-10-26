'use strict';

const GUIDELINES = [
  'Lead with generosity—spotlight peers, amplify hiring calls, and surface helpful resources every week.',
  'Protect focus time by moving tactical questions into the discussion board threads tagged by topic.',
  'Keep event RSVPs current so facilitators can tailor breakouts and volunteer mentors can prepare.',
];

const TIMELINE_EVENTS = [
  {
    title: 'Launch week AMA with marketplace veterans',
    description: 'Mentors recapped onboarding rituals and retention experiments from the last cohort.',
    offsetDays: -21,
    category: 'milestone',
  },
  {
    title: 'First async pitch swap',
    description: 'Founders paired up to exchange Loom pitch reviews and shared positioning frameworks.',
    offsetDays: -7,
    category: 'programming',
  },
  {
    title: 'Growth experiments retrospective',
    description: 'Collective debrief on top-performing acquisition tests and the next sprint focus areas.',
    offsetDays: -2,
    category: 'insight',
  },
];

const EVENTS = [
  {
    title: 'Marketplace funnel lab',
    description: 'Live teardown of community-driven onboarding flows with collaborative worksheets.',
    offsetDays: 3,
    durationHours: 1.5,
    hostName: 'Amelia Park',
    hostTitle: 'Growth Mentor',
    registrationUrl: 'https://gigvora.com/events/funnel-lab',
  },
  {
    title: 'Moderator sync + office hours',
    description: 'Core moderators align on upcoming programming, spotlight threads, and new member welcomes.',
    offsetDays: 6,
    durationHours: 1,
    hostName: 'Noah Kim',
    hostTitle: 'Community Lead',
    registrationUrl: 'https://gigvora.com/events/mod-sync',
  },
  {
    title: 'Founder storytelling workshop',
    description: 'Narrative coach guides members through impact storytelling and investor update rituals.',
    offsetDays: 10,
    durationHours: 1.25,
    hostName: 'Lina Mehta',
    hostTitle: 'Narrative Coach',
    registrationUrl: 'https://gigvora.com/events/storytelling-lab',
  },
];

const RESOURCES = [
  {
    title: 'Activation scorecard template',
    summary: 'A Notion template that tracks onboarding tasks, win-back nudges, and retention signals.',
    url: 'https://gigvora-assets.com/resources/activation-scorecard.pdf',
    type: 'playbook',
    category: 'activation',
    collection: 'Growth foundations',
    author: 'Marketplace Guild',
    format: 'pdf',
    difficulty: 'intermediate',
    duration: '12 min read',
    previewImageUrl: 'https://gigvora-assets.com/previews/activation-scorecard.png',
    isFeatured: true,
    tags: ['activation', 'retention', 'reporting'],
  },
  {
    title: 'Moderator welcome cadence',
    summary: 'Step-by-step scripts and templates moderators use to greet, triage, and retain new founders.',
    url: 'https://gigvora-assets.com/resources/moderator-cadence.docx',
    type: 'guide',
    category: 'operations',
    collection: 'Community playbooks',
    author: 'Community Operations',
    format: 'document',
    difficulty: 'beginner',
    duration: '8 min read',
    previewImageUrl: 'https://gigvora-assets.com/previews/moderator-cadence.png',
    isFeatured: false,
    tags: ['moderation', 'workflow'],
  },
  {
    title: 'Marketplace KPI benchmarks Q1',
    summary: 'Aggregated metrics from active cohort founders to help calibrate weekly performance goals.',
    url: 'https://gigvora-assets.com/resources/marketplace-kpi-benchmarks.xlsx',
    type: 'analysis',
    category: 'analytics',
    collection: 'Data drops',
    author: 'Insights Team',
    format: 'spreadsheet',
    difficulty: 'advanced',
    duration: '15 min review',
    previewImageUrl: 'https://gigvora-assets.com/previews/kpi-benchmarks.png',
    isFeatured: true,
    tags: ['analytics', 'benchmarks'],
  },
  {
    title: 'Community launch checklist',
    summary: 'Operational checklist for new members outlining must-join threads, events, and resource hubs.',
    url: 'https://gigvora-assets.com/resources/community-launch-checklist.pdf',
    type: 'checklist',
    category: 'onboarding',
    collection: 'New member essentials',
    author: 'Community Team',
    format: 'pdf',
    difficulty: 'beginner',
    duration: '5 min read',
    previewImageUrl: 'https://gigvora-assets.com/previews/community-launch-checklist.png',
    isFeatured: false,
    tags: ['onboarding', 'community'],
  },
];

const POSTS = [
  {
    slug: 'weekly-growth-thread',
    title: 'Weekly growth experiments thread',
    summary: 'Share the most insightful acquisition, activation, or retention experiments from this week.',
    content:
      'Kick off with the metric you targeted, the experiment you ran, and what you learned. Drop screenshots or dashboards in the replies so moderators can tag insights.',
    topicTags: ['growth', 'experiments', 'activation'],
    pinned: true,
    reactions: { total: 48, celebrate: 19, helpful: 29 },
    replies: 34,
  },
  {
    slug: 'fundraising-ask-thread',
    title: 'Fundraising warm introductions request',
    summary: 'Let the community know what kind of investor intros or strategic partners you are looking for.',
    content:
      'Include your deck link, target round size, ideal investor profile, and what traction metrics you can share. Moderators will curate spotlights each Friday.',
    topicTags: ['fundraising', 'network'],
    pinned: false,
    reactions: { total: 26, celebrate: 11, helpful: 15 },
    replies: 18,
  },
  {
    slug: 'product-feedback-circle',
    title: 'Product feedback circle',
    summary: 'Swap product feedback with fellow founders—drop Looms or Figma prototypes and list the top questions you have.',
    content:
      'Reply with the use-case you want feedback on, the target persona, and how you plan to measure adoption. Tag the post with #ux or #product-market-fit so the right mentors see it.',
    topicTags: ['product', 'feedback', 'ux'],
    pinned: false,
    reactions: { total: 31, insight: 20, helpful: 11 },
    replies: 27,
  },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const { Op, QueryTypes } = Sequelize;

    await queryInterface.sequelize.transaction(async (transaction) => {
      const groups = await queryInterface.sequelize.query(
        "SELECT id, slug, name FROM groups",
        { type: QueryTypes.SELECT, transaction },
      );

      if (!groups.length) {
        return;
      }

      const targetGroup =
        groups.find(
          (group) =>
            group.slug === 'demo-marketplace-founders-circle' ||
            group.name.toLowerCase().includes('marketplace founders circle'),
        ) ?? groups[0];

      if (!targetGroup) {
        return;
      }

      const [owner] = await queryInterface.sequelize.query(
        'SELECT id FROM users ORDER BY id LIMIT 1',
        { type: QueryTypes.SELECT, transaction },
      );

      const ownerId = owner?.id ?? null;
      const now = new Date();
      const hoursToMs = (hours) => Math.round(hours * 60 * 60 * 1000);
      const daysFromNow = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const guidelineRows = GUIDELINES.map((content, index) => ({
        groupId: targetGroup.id,
        content,
        displayOrder: index,
        isRequired: true,
        createdAt: now,
        updatedAt: now,
      }));

      if (guidelineRows.length) {
        await queryInterface.bulkInsert('group_guidelines', guidelineRows, { transaction });
      }

      const timelineRows = TIMELINE_EVENTS.map((event) => ({
        groupId: targetGroup.id,
        title: event.title,
        description: event.description,
        occursAt: daysFromNow(event.offsetDays),
        category: event.category,
        visibility: 'members',
        metadata: { seedKey: 'group-collaboration-hub' },
        createdAt: now,
        updatedAt: now,
      }));

      if (timelineRows.length) {
        await queryInterface.bulkInsert('group_timeline_events', timelineRows, { transaction });
      }

      const eventRows = EVENTS.map((event) => ({
        groupId: targetGroup.id,
        title: event.title,
        description: event.description,
        startAt: daysFromNow(event.offsetDays),
        endAt: new Date(daysFromNow(event.offsetDays).getTime() + hoursToMs(event.durationHours)),
        timezone: 'UTC',
        format: 'virtual',
        location: 'Virtual',
        hostName: event.hostName,
        hostTitle: event.hostTitle,
        registrationUrl: event.registrationUrl,
        isVirtual: true,
        status: 'scheduled',
        metadata: { seedKey: 'group-collaboration-hub' },
        createdById: ownerId,
        updatedById: ownerId,
        createdAt: now,
        updatedAt: now,
      }));

      if (eventRows.length) {
        await queryInterface.bulkInsert('group_events', eventRows, { transaction });
      }

      const resourceRows = RESOURCES.map((resource, index) => ({
        groupId: targetGroup.id,
        title: resource.title,
        summary: resource.summary,
        url: resource.url,
        type: resource.type,
        category: resource.category,
        collection: resource.collection,
        author: resource.author,
        format: resource.format,
        difficulty: resource.difficulty,
        duration: resource.duration,
        previewImageUrl: resource.previewImageUrl,
        isFeatured: resource.isFeatured,
        tags: resource.tags,
        metadata: { seedKey: 'group-collaboration-hub', order: index + 1 },
        status: 'published',
        viewCount: 0,
        downloadCount: resource.isFeatured ? 86 + index * 12 : 32 + index * 7,
        lastAccessedAt: now,
        publishedAt: daysFromNow(-index - 1),
        createdById: ownerId,
        updatedById: ownerId,
        createdAt: now,
        updatedAt: now,
      }));

      if (resourceRows.length) {
        await queryInterface.bulkInsert('group_resources', resourceRows, { transaction });
      }

      const postRows = POSTS.map((post, index) => ({
        groupId: targetGroup.id,
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        content: post.content,
        attachments: [],
        topicTags: post.topicTags,
        status: 'published',
        visibility: 'members',
        scheduledAt: null,
        publishedAt: daysFromNow(-(index + 2)),
        pinnedAt: post.pinned ? now : null,
        lastActivityAt: daysFromNow(-index),
        replyCount: post.replies,
        reactionSummary: post.reactions,
        resolutionState: 'open',
        createdById: ownerId,
        updatedById: ownerId,
        metadata: { seedKey: 'group-collaboration-hub' },
        createdAt: now,
        updatedAt: now,
      }));

      if (postRows.length) {
        await queryInterface.bulkInsert('group_posts', postRows, { transaction });
      }

      await queryInterface.bulkUpdate(
        'group_memberships',
        {
          preferences: {
            notifications: { digest: true, newThread: true, upcomingEvent: true },
          },
        },
        {
          groupId: targetGroup.id,
          status: { [Op.eq]: 'active' },
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.sequelize.transaction(async (transaction) => {
      const guidelineContents = GUIDELINES;
      await queryInterface.bulkDelete(
        'group_guidelines',
        { content: { [Op.in]: guidelineContents } },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'group_timeline_events',
        { metadata: { seedKey: 'group-collaboration-hub' } },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'group_events',
        { metadata: { seedKey: 'group-collaboration-hub' } },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'group_resources',
        { metadata: { seedKey: 'group-collaboration-hub' } },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'group_posts',
        { metadata: { seedKey: 'group-collaboration-hub' } },
        { transaction },
      );
    });
  },
};
