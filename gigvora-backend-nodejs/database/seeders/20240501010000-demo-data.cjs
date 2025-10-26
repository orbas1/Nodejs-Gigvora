'use strict';

const { QueryTypes, Op } = require('sequelize');

const baseUsers = [
  {
    firstName: 'Ava',
    lastName: 'Founder',
    email: 'ava@gigvora.com',
    password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
    address: '123 Innovation Way, Remote City',
    age: 32,
    userType: 'admin',
    googleId: 'demo-google-ava-founder',
  },
  {
    firstName: 'Leo',
    lastName: 'Freelancer',
    email: 'leo@gigvora.com',
    password: '$2b$10$n6MPrXwN6kPymBi/GsMBCecal.lOEWTWmr25RR80Gn3mtiq3IztUG',
    address: '456 Remote Ave, Digital Nomad',
    age: 27,
    userType: 'freelancer',
    linkedinId: 'demo-linkedin-leo-freelancer',
  },
  {
    firstName: 'Mia',
    lastName: 'Operations',
    email: 'mia@gigvora.com',
    password: '$2b$10$16DRKd2uYS0frdHpDq.5gOQWKmrW.OqYk8ytxzPm/w76dRvrxH6zi',
    address: '789 Strategy Blvd, Growth City',
    age: 35,
    userType: 'company',
    appleId: 'demo-apple-mia-operations',
  },
  {
    firstName: 'Noah',
    lastName: 'Agency',
    email: 'noah@gigvora.com',
    password: '$2b$10$2Fz95ZCARlX/2Pw1zQfztOC8XC7VW9wrXxlih/FYO1QPwI7EVP3p.',
    address: '25 Collaboration Square, Agency City',
    age: 38,
    userType: 'agency',
  },
  {
    firstName: 'Avery',
    lastName: 'Mentor',
    email: 'mentor@gigvora.com',
    password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
    address: '101 Coaching Lane, Lisbon',
    age: 41,
    userType: 'user',
  },
  {
    firstName: 'Riley',
    lastName: 'Recruiter',
    email: 'recruiter@gigvora.com',
    password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
    address: '88 Hiring Avenue, Austin',
    age: 36,
    userType: 'user',
  },
];

const profileSeeds = [
  {
    email: 'leo@gigvora.com',
    headline: 'Principal Full Stack Developer',
    bio: 'Specialises in high-growth marketplace platforms with a focus on reliability, observability, and coaching.',
    skills: 'Node.js, React, PostgreSQL, AWS, Terraform',
    experience: '7 years delivering venture-backed SaaS platforms with globally distributed teams.',
    education: 'BSc Computer Science, Remote Tech University',
  },
  {
    email: 'mia@gigvora.com',
    headline: 'Director of Operations',
    bio: 'Transforms customer feedback into product roadmaps and ensures compliance guardrails across client workspaces.',
    skills: 'Customer Success, Analytics, Process Automation',
    experience: '10 years scaling operations teams across SaaS scale-ups.',
    education: 'MBA, Strategic Operations',
  },
];

const companyProfileSeeds = [
  {
    email: 'mia@gigvora.com',
    companyName: 'Lumen Analytics',
    description: 'Growth advisory collective partnering with SaaS companies on lifecycle experiments.',
    website: 'https://lumen-analytics.example.com',
  },
];

const agencyProfileSeeds = [
  {
    email: 'noah@gigvora.com',
    agencyName: 'Alliance Studio',
    focusArea: 'Product, growth, and analytics pods for marketplace companies.',
    website: 'https://alliancestudio.example.com',
  },
];

const freelancerProfileSeeds = [
  {
    email: 'leo@gigvora.com',
    title: 'Fractional Staff Engineer',
    hourlyRate: 145.5,
    availability: '20 hrs/week · Remote within UTC±3',
  },
];

const feedPosts = [
  {
    email: 'ava@gigvora.com',
    title: 'Release candidate 1.50 rolling out',
    summary: 'Runtime security enhancements and analytics exports now live for enterprise workspaces.',
    content:
      '[demo] Platform release candidate 1.50 ships runtime security enhancements, hardened runtime policies, and workspace analytics exports. Early adopters get the rollout notes in their inbox today.',
    visibility: 'public',
    type: 'update',
    link: 'https://updates.gigvora.test/releases/1-50',
    imageUrl: 'https://assets.gigvora.test/releases/1-50/cover.jpg',
    mediaAttachments: [
      {
        id: 'release-1-50',
        url: 'https://assets.gigvora.test/releases/1-50/dashboard.png',
        type: 'image',
        alt: 'Analytics dashboard preview for release 1.50',
      },
    ],
    authorHeadline: 'Co-founder & CEO · Gigvora',
  },
  {
    email: 'leo@gigvora.com',
    title: 'Automation onboarding template available',
    summary: 'Async playbooks ready for teams onboarding to workflow automation templates.',
    content:
      '[demo] Shipping an onboarding automation template — DM if you need async walkthroughs or want help mapping your workspace automations to the new playbooks.',
    visibility: 'public',
    type: 'project',
    link: 'https://workspace.gigvora.test/automation-template',
    mediaAttachments: [
      {
        id: 'automation-preview',
        url: 'https://assets.gigvora.test/templates/automation-preview.png',
        type: 'image',
        alt: 'Automation template cards and workflow preview',
      },
    ],
    authorHeadline: 'Fractional Staff Engineer · Gigvora Network',
  },
];

const feedShareSeeds = [
  {
    email: 'mentor@gigvora.com',
    postTitle: 'Release candidate 1.50 rolling out',
    audience: 'internal',
    channel: 'copy',
    message:
      'Circulating release candidate 1.50 across mentor pods so they can prep their teams for the new analytics export.',
  },
  {
    email: 'recruiter@gigvora.com',
    postTitle: 'Automation onboarding template available',
    audience: 'external',
    channel: 'email',
    message:
      'Flagging the automation onboarding template for talent partners — including in the weekly digest to spark referrals.',
  },
];

const jobSeeds = [
  {
    title: '[demo] Founding Product Operations Lead',
    description:
      'Partner with founders to orchestrate product rituals, analytics instrumentation, and compliance checklists.',
    location: 'Remote · North America',
    employmentType: 'Full-time',
  },
  {
    title: '[demo] Freelance Growth Analyst',
    description: 'Build dashboards, experiments, and monthly insights for marketplace operators.',
    location: 'Remote · Europe',
    employmentType: 'Contract',
  },
];

const gigSeeds = [
  {
    slug: 'demo-launch-landing-page-optimisation',
    ownerEmail: 'leo@gigvora.com',
    title: '[demo] Launch landing page optimisation sprint',
    summary: 'Accelerate conversion performance with signal-backed hypotheses, structured experiments, and live telemetry.',
    description:
      'Partner with a fractional growth pod to audit analytics, prioritise hypotheses, and run disciplined experiments over a focused two-week sprint. Deliverables include prioritised backlog, high-fidelity experiment briefs, and a reporting toolkit for ongoing iteration.',
    category: 'growth',
    niche: 'Conversion rate optimisation',
    deliveryModel: 'Sprint engagement',
    outcomePromise: 'Lift launch funnel conversion by 12% with validated experiments and enable ongoing CRO rituals.',
    budgetLabel: 'USD 4,800',
    budgetAmount: 4800,
    budgetCurrency: 'USD',
    duration: '2 weeks',
    durationCategory: 'short_term',
    location: 'Remote (UK/EU overlap)',
    geoLocation: { lat: 51.509865, lng: -0.118092, city: 'London', country: 'GB' },
    heroAccent: 'emerald',
    heroTitle: 'Optimise your launch funnel in two weeks',
    heroSubtitle: 'Blend experiment design, research, and instrumentation without derailing your roadmap.',
    heroMediaUrl: 'https://assets.gigvora.test/marketplace/gigs/launch-optimisation.png',
    heroTheme: 'aurora',
    heroBadge: 'Conversion acceleration',
    sellingPoints: [
      'Prioritised backlog tied to revenue and activation metrics.',
      'Live telemetry dashboard with win-rate tracking and experiment QA.',
      'Enablement session to embed CRO rituals with your in-house team.',
    ],
    requirements: [
      'Access to analytics and experimentation platforms (GA4, Mixpanel, or equivalent).',
      'Product analytics contact to align on guardrails and shipping cadence.',
      'Availability for two async stand-ups and a mid-sprint checkpoint.',
    ],
    faqs: [
      'What if we have no prior experiments? → We bootstrap baselines, instrumentation, and prioritisation in week one.',
      'Can we extend beyond two weeks? → Yes, retainers are available with velocity-based pricing.',
    ],
    conversionCopy: {
      primaryCtaLabel: 'Pitch this sprint',
      secondaryCtaLabel: 'Download sample audit',
      successMessage: 'Thanks! We will confirm instrumentation access and share the discovery intake shortly.',
    },
    analyticsSettings: {
      eventNamespace: 'gig_demo_landing_optimisation',
      trackLeadCapture: true,
      attributionChannels: ['web', 'email'],
    },
    availabilityTimezone: 'Europe/London',
    availabilityLeadTimeDays: 3,
    targetMetric: 12,
    status: 'published',
    visibility: 'public',
    publishedAtDaysAgo: 4,
    aiSignals: { trustScore: 74, taxonomyConfidence: 0.66, remotePreference: 0.82 },
  },
  {
    slug: 'demo-marketplace-trust-safety-audit',
    ownerEmail: 'mia@gigvora.com',
    title: '[demo] Marketplace trust and safety audit',
    summary: 'Calibrate moderation queues, policy guardrails, and automation coverage for high-signal marketplaces.',
    description:
      'Full-stack audit across policies, enforcement workflows, and automation coverage. We benchmark queue latency, investigate false-positive trends, and deliver a prioritised roadmap with ROI modelling and sequencing guidance.',
    category: 'operations',
    niche: 'Trust & safety',
    deliveryModel: 'Assessment + roadmap',
    outcomePromise: 'Reduce moderation latency by 35% while sustaining compliance coverage across high-risk cohorts.',
    budgetLabel: 'USD 6,200',
    budgetAmount: 6200,
    budgetCurrency: 'USD',
    duration: '3 weeks',
    durationCategory: 'medium_term',
    location: 'Hybrid — London & Remote',
    geoLocation: { lat: 51.507351, lng: -0.127758, city: 'London', country: 'GB' },
    heroAccent: 'indigo',
    heroTitle: 'Strengthen trust and safety with actionable telemetry',
    heroSubtitle: 'Uncover blind spots across workflows, automations, and policy coverage in three weeks.',
    heroMediaUrl: 'https://assets.gigvora.test/marketplace/gigs/trust-safety-audit.png',
    heroTheme: 'midnight',
    heroBadge: 'Compliance readiness',
    sellingPoints: [
      'Quantified queue latency, reviewer utilisation, and automation coverage.',
      'Scenario-based tabletop exercising with policy recommendations.',
      'Roadmap sequenced by risk, effort, and stakeholder dependencies.',
    ],
    requirements: [
      'Export of anonymised moderation queue metrics for the trailing six weeks.',
      'Policy and enforcement documentation for review.',
      'Stakeholder workshop with policy, product, and operations leads.',
    ],
    faqs: [
      'Will we receive implementation support? → Yes, a 30-day follow-on support window is included.',
      'Do you review legal frameworks? → We partner with your counsel to align on jurisdictional requirements.',
    ],
    conversionCopy: {
      primaryCtaLabel: 'Request audit kick-off',
      secondaryCtaLabel: 'View sample roadmap',
    },
    analyticsSettings: {
      eventNamespace: 'gig_demo_trust_safety',
      trackLeadCapture: true,
      syncOpsDashboard: true,
    },
    availabilityTimezone: 'Europe/London',
    availabilityLeadTimeDays: 5,
    targetMetric: 35,
    status: 'published',
    visibility: 'public',
    publishedAtDaysAgo: 9,
    aiSignals: { trustScore: 78, taxonomyConfidence: 0.7, remotePreference: 0.54 },
  },
  {
    slug: 'demo-member-onboarding-automation',
    ownerEmail: 'noah@gigvora.com',
    title: '[demo] Member onboarding automation accelerator',
    summary: 'Automate onboarding comms, lifecycle nudges, and playbook distribution across your member funnel.',
    description:
      'Design and implement an automated onboarding journey spanning welcome, activation, and retention workflows. Includes CRM mapping, copy optimisation, experiment design, and enablement for your operations team.',
    category: 'operations',
    niche: 'Lifecycle automation',
    deliveryModel: 'Implementation sprint',
    outcomePromise: 'Activate 25% more members within 14 days by orchestrating personalised automations.',
    budgetLabel: 'USD 5,400',
    budgetAmount: 5400,
    budgetCurrency: 'USD',
    duration: '4 weeks',
    durationCategory: 'medium_term',
    location: 'Remote (North America focus)',
    heroAccent: 'purple',
    heroTitle: 'Automate onboarding without losing the human touch',
    heroSubtitle: 'Operational playbooks, CRM integration, and copy frameworks packaged in a four-week accelerator.',
    heroMediaUrl: 'https://assets.gigvora.test/marketplace/gigs/onboarding-automation.png',
    heroTheme: 'nebula',
    heroBadge: 'Lifecycle automation',
    sellingPoints: [
      'Segmented journey maps with KPI instrumentation and safeguard alerts.',
      'Copy optimisation and creative guidelines aligned to your brand voice.',
      'Enablement for ops teams, including handover docs and QA checklists.',
    ],
    requirements: [
      'Access to CRM/marketing automation tooling (HubSpot, Customer.io, Braze, etc.).',
      'Lifecycle performance data for the trailing 90 days.',
      'Point of contact for approvals and sign-off on creative assets.',
    ],
    faqs: [
      'Can we integrate with custom tooling? → Yes, we include technical scoping and light integration support.',
      'Is copywriting included? → Core flows and experimentation scaffolding are included; additional variants can be scoped.',
    ],
    conversionCopy: {
      primaryCtaLabel: 'Start automation accelerator',
      secondaryCtaLabel: 'Review sample journey map',
    },
    analyticsSettings: {
      eventNamespace: 'gig_demo_onboarding_automation',
      syncOpsDashboard: true,
      shareInsightsWithMentors: true,
    },
    availabilityTimezone: 'America/New_York',
    availabilityLeadTimeDays: 7,
    targetMetric: 25,
    status: 'published',
    visibility: 'public',
    publishedAtDaysAgo: 2,
    aiSignals: { trustScore: 72, taxonomyConfidence: 0.64, remotePreference: 0.77 },
  },
];

const projectSeeds = [
  {
    title: '[demo] Workspace instrumentation rollout',
    description: 'Enable product squads with standardised dashboards and alerting across all environments.',
    status: 'in_progress',
  },
];

const launchpadSeeds = [
  {
    title: '[demo] Career accelerator — product cohort',
    description: 'Four-week intensive pairing mentors with talent on storytelling, demos, and networking.',
    track: 'product',
  },
];

const volunteeringSeeds = [
  {
    title: '[demo] Climate tech strategy sprint mentor',
    organization: 'Remote Impact Alliance',
    description: 'Guide fellows through discovery workshops and narrative development for climate tech ventures.',
  },
];

const groupSeeds = [
  {
    name: '[demo] Marketplace founders circle',
    description: 'Weekly async briefings for founders sharing acquisition, retention, and compliance playbooks.',
  },
];

const connectionSeeds = [
  {
    requesterEmail: 'leo@gigvora.com',
    addresseeEmail: 'noah@gigvora.com',
    status: 'accepted',
  },
];

const DAY = 24 * 60 * 60 * 1000;

function determineGigDurationCategory(duration) {
  if (!duration || typeof duration !== 'string') {
    return null;
  }
  const text = duration.toLowerCase();
  if (/week|sprint/.test(text)) {
    return 'short_term';
  }
  if (/month|quarter/.test(text)) {
    return 'medium_term';
  }
  if (/year|long/.test(text)) {
    return 'long_term';
  }
  return null;
}

function parseGigBudgetAmount(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number.parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

async function ensureUsers(queryInterface, transaction) {
  const now = new Date();
  const emails = baseUsers.map((user) => user.email);
  const existingUsers = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { emails },
    },
  );
  const existingByEmail = new Map(existingUsers.map((row) => [row.email, row.id]));
  const toInsert = baseUsers
    .filter((user) => !existingByEmail.has(user.email))
    .map((user) => ({
      ...user,
      createdAt: now,
      updatedAt: now,
    }));

  if (toInsert.length) {
    await queryInterface.bulkInsert('users', toInsert, { transaction });
  }

  const allUsers = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { emails },
    },
  );

  return new Map(allUsers.map((row) => [row.email, row.id]));
}

async function insertProfiles(queryInterface, transaction, table, records, userIds, now) {
  if (!records.length) return;
  const rows = records
    .map((record) => {
      const userId = userIds.get(record.email);
      if (!userId) {
        return null;
      }
      const { email, ...rest } = record;
      return { ...rest, userId, createdAt: now, updatedAt: now };
    })
    .filter(Boolean);

  if (!rows.length) return;

  const userIdList = rows.map((row) => row.userId);
  const existing = await queryInterface.sequelize.query(
    `SELECT userId FROM ${table} WHERE userId IN (:userIds)`,
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { userIds: userIdList },
    },
  );
  const existingSet = new Set(existing.map((row) => row.userId));
  const toInsert = rows.filter((row) => !existingSet.has(row.userId));
  if (toInsert.length) {
    await queryInterface.bulkInsert(table, toInsert, { transaction });
  }
}

async function insertIfMissing(queryInterface, transaction, table, uniqueWhereSql, buildRow) {
  const existing = await queryInterface.sequelize.query(uniqueWhereSql.query, {
    type: QueryTypes.SELECT,
    transaction,
    replacements: uniqueWhereSql.replacements,
  });

  if (existing.length) {
    return existing[0];
  }

  const row = buildRow();
  await queryInterface.bulkInsert(table, [row], { transaction });
  const [inserted] = await queryInterface.sequelize.query(uniqueWhereSql.query, {
    type: QueryTypes.SELECT,
    transaction,
    replacements: uniqueWhereSql.replacements,
  });
  return inserted?.[0] ?? null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const userIds = await ensureUsers(queryInterface, transaction);

      await insertProfiles(queryInterface, transaction, 'profiles', profileSeeds, userIds, now);
      await insertProfiles(queryInterface, transaction, 'company_profiles', companyProfileSeeds, userIds, now);
      await insertProfiles(queryInterface, transaction, 'agency_profiles', agencyProfileSeeds, userIds, now);
      await insertProfiles(queryInterface, transaction, 'freelancer_profiles', freelancerProfileSeeds, userIds, now);

      for (const post of feedPosts) {
        const userId = userIds.get(post.email);
        if (!userId) continue;
        const userSeed = baseUsers.find((seed) => seed.email === post.email) ?? {};
        const profileSeed = profileSeeds.find((seed) => seed.email === post.email);
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM feed_posts WHERE userId = :userId AND content = :content LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, content: post.content },
          },
        );
        if (existing?.id) continue;
        const authorName =
          post.authorName ||
          [userSeed.firstName, userSeed.lastName].filter(Boolean).join(' ').trim() ||
          userSeed.email ||
          'Gigvora member';
        const authorHeadline =
          post.authorHeadline || profileSeed?.headline || profileSeed?.bio || 'Marketplace community update';
        const authorAvatarSeed = post.authorAvatarSeed || userSeed.firstName || authorName;
        await queryInterface.bulkInsert(
          'feed_posts',
          [
            {
              userId,
              content: post.content,
              summary: post.summary ?? null,
              title: post.title ?? null,
              visibility: post.visibility ?? 'public',
              type: post.type ?? 'update',
              link: post.link ?? null,
              imageUrl: post.imageUrl ?? null,
              source: post.source ?? null,
              mediaAttachments: post.mediaAttachments ?? null,
              authorName,
              authorHeadline,
              authorAvatarSeed,
              publishedAt: now,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      for (const share of feedShareSeeds) {
        const userId = userIds.get(share.email);
        if (!userId) continue;
        const [post] = await queryInterface.sequelize.query(
          'SELECT id FROM feed_posts WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: share.postTitle },
          },
        );
        if (!post?.id) continue;
        const [existingShare] = await queryInterface.sequelize.query(
          'SELECT id FROM feed_shares WHERE postId = :postId AND userId = :userId AND channel = :channel LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { postId: post.id, userId, channel: share.channel },
          },
        );
        if (existingShare?.id) continue;
        await queryInterface.bulkInsert(
          'feed_shares',
          [
            {
              postId: post.id,
              userId,
              audience: share.audience,
              channel: share.channel,
              message: share.message,
              link: share.link ?? null,
              metadata: { ...(share.metadata ?? {}), seed: 'demo-feed-share' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      for (const job of jobSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM jobs WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: job.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert('jobs', [{ ...job, createdAt: now, updatedAt: now }], { transaction });
      }

      for (const gig of gigSeeds) {
        const ownerId = userIds.get(gig.ownerEmail);
        if (!ownerId) {
          throw new Error(`Missing required user ${gig.ownerEmail} for gig seed ${gig.slug}`);
        }

        const publishedAt = gig.publishedAtDaysAgo
          ? new Date(now.getTime() - gig.publishedAtDaysAgo * DAY)
          : now;

        const row = {
          ownerId,
          slug: gig.slug,
          title: gig.title,
          tagline: gig.tagline ?? null,
          summary: gig.summary ?? null,
          description: gig.description,
          category: gig.category ?? null,
          niche: gig.niche ?? null,
          deliveryModel: gig.deliveryModel ?? null,
          outcomePromise: gig.outcomePromise ?? null,
          budget: gig.budgetLabel ?? gig.budget ?? null,
          budgetCurrency: gig.budgetCurrency ?? null,
          budgetAmount:
            gig.budgetAmount != null ? Number(gig.budgetAmount) : parseGigBudgetAmount(gig.budgetLabel ?? gig.budget),
          duration: gig.duration ?? null,
          durationCategory: gig.durationCategory ?? determineGigDurationCategory(gig.duration),
          location: gig.location ?? null,
          geoLocation: gig.geoLocation ?? null,
          heroAccent: gig.heroAccent ?? null,
          heroTitle: gig.heroTitle ?? null,
          heroSubtitle: gig.heroSubtitle ?? null,
          heroMediaUrl: gig.heroMediaUrl ?? null,
          heroTheme: gig.heroTheme ?? null,
          heroBadge: gig.heroBadge ?? null,
          sellingPoints: gig.sellingPoints ?? [],
          requirements: gig.requirements ?? [],
          faqs: gig.faqs ?? [],
          conversionCopy: gig.conversionCopy ?? {},
          analyticsSettings: gig.analyticsSettings ?? {},
          availabilityTimezone: gig.availabilityTimezone ?? null,
          availabilityLeadTimeDays: gig.availabilityLeadTimeDays ?? 2,
          targetMetric: gig.targetMetric ?? null,
          status: gig.status ?? 'published',
          visibility: gig.visibility ?? 'public',
          publishedAt,
          aiSignals: gig.aiSignals ?? { trustScore: 68, taxonomyConfidence: 0.6, remotePreference: 0.52 },
          metadata: { ...(gig.metadata ?? {}), seed: 'demo-gigs-marketplace' },
          createdAt: now,
          updatedAt: now,
        };

        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM gigs WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: gig.slug },
          },
        );

        if (existing?.id) {
          const { createdAt, ...updatePayload } = row;
          updatePayload.updatedAt = now;
          await queryInterface.bulkUpdate('gigs', updatePayload, { id: existing.id }, { transaction });
        } else {
          await queryInterface.bulkInsert('gigs', [row], { transaction });
        }
      }

      for (const project of projectSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM projects WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: project.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert('projects', [{ ...project, createdAt: now, updatedAt: now }], { transaction });
      }

      for (const launchpad of launchpadSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM experience_launchpads WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: launchpad.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'experience_launchpads',
          [{ ...launchpad, createdAt: now, updatedAt: now }],
          { transaction },
        );
      }

      for (const volunteering of volunteeringSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM volunteering_roles WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: volunteering.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'volunteering_roles',
          [{ ...volunteering, createdAt: now, updatedAt: now }],
          { transaction },
        );
      }

      const groupIdByName = new Map();
      for (const group of groupSeeds) {
        const [groupRow] = await queryInterface.sequelize.query(
          'SELECT id FROM groups WHERE name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { name: group.name },
          },
        );
        if (groupRow?.id) {
          groupIdByName.set(group.name, groupRow.id);
          continue;
        }
        await queryInterface.bulkInsert('groups', [{ ...group, createdAt: now, updatedAt: now }], { transaction });
        const [insertedGroup] = await queryInterface.sequelize.query(
          'SELECT id FROM groups WHERE name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { name: group.name },
          },
        );
        if (insertedGroup?.id) {
          groupIdByName.set(group.name, insertedGroup.id);
        }
      }

      if (groupIdByName.size) {
        for (const group of groupSeeds) {
          const groupId = groupIdByName.get(group.name);
          if (!groupId) continue;
          for (const email of ['ava@gigvora.com', 'leo@gigvora.com']) {
            const userId = userIds.get(email);
            if (!userId) continue;
            const [membership] = await queryInterface.sequelize.query(
              'SELECT id FROM group_memberships WHERE groupId = :groupId AND userId = :userId LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { groupId, userId },
              },
            );
            if (membership?.id) continue;
            await queryInterface.bulkInsert(
              'group_memberships',
              [
                {
                  groupId,
                  userId,
                  role: email === 'ava@gigvora.com' ? 'owner' : 'member',
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );
          }
        }
      }

      for (const connection of connectionSeeds) {
        const requesterId = userIds.get(connection.requesterEmail);
        const addresseeId = userIds.get(connection.addresseeEmail);
        if (!requesterId || !addresseeId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM connections WHERE requesterId = :requesterId AND addresseeId = :addresseeId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { requesterId, addresseeId },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'connections',
          [
            {
              requesterId,
              addresseeId,
              status: connection.status,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const userEmails = baseUsers.map((user) => user.email);
      const users = await queryInterface.sequelize.query(
        'SELECT id, email FROM users WHERE email IN (:emails)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { emails: userEmails },
        },
      );
      const userIds = users.map((user) => user.id);

      if (userIds.length) {
        await queryInterface.bulkDelete(
          'connections',
          {
            requesterId: { [Op.in]: userIds },
            addresseeId: { [Op.in]: userIds },
          },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'group_memberships',
          { userId: { [Op.in]: userIds } },
          { transaction },
        );
        await queryInterface.bulkDelete('freelancer_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('agency_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('company_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('profiles', { userId: { [Op.in]: userIds } }, { transaction });
      }

      await queryInterface.bulkDelete(
        'feed_shares',
        { message: feedShareSeeds.map((share) => share.message) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'feed_posts',
        { content: feedPosts.map((post) => post.content) },
        { transaction },
      );
      await queryInterface.bulkDelete('jobs', { title: jobSeeds.map((job) => job.title) }, { transaction });
      await queryInterface.bulkDelete('gigs', { slug: gigSeeds.map((gig) => gig.slug) }, { transaction });
      await queryInterface.bulkDelete('projects', { title: projectSeeds.map((project) => project.title) }, { transaction });
      await queryInterface.bulkDelete(
        'experience_launchpads',
        { title: launchpadSeeds.map((launchpad) => launchpad.title) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'volunteering_roles',
        { title: volunteeringSeeds.map((volunteering) => volunteering.title) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'groups',
        { name: groupSeeds.map((group) => group.name) },
        { transaction },
      );
      await queryInterface.bulkDelete('users', { email: userEmails }, { transaction });
    });
  },
};
