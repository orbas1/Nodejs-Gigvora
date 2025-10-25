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
  },
  {
    firstName: 'Leo',
    lastName: 'Freelancer',
    email: 'leo@gigvora.com',
    password: '$2b$10$n6MPrXwN6kPymBi/GsMBCecal.lOEWTWmr25RR80Gn3mtiq3IztUG',
    address: '456 Remote Ave, Digital Nomad',
    age: 27,
    userType: 'freelancer',
  },
  {
    firstName: 'Mia',
    lastName: 'Operations',
    email: 'mia@gigvora.com',
    password: '$2b$10$16DRKd2uYS0frdHpDq.5gOQWKmrW.OqYk8ytxzPm/w76dRvrxH6zi',
    address: '789 Strategy Blvd, Growth City',
    age: 35,
    userType: 'company',
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
    content:
      '[demo] Platform release candidate 1.50 ships runtime security enhancements and workspace analytics exports.',
    visibility: 'public',
  },
  {
    email: 'leo@gigvora.com',
    content: '[demo] Shipping an onboarding automation template — DM if you need async walkthroughs.',
    visibility: 'public',
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
    tagline: 'Ship experiment-ready landing pages with CRO analytics in 10 days.',
    description:
      'Two-week engagement pairing UX research with CRO experiments. Includes experiment backlog, QA playbooks, and reporting templates for repeatable execution.',
    category: 'growth',
    niche: 'conversion',
    budget: 'USD 4,800',
    budgetAmount: 4800,
    budgetCurrency: 'USD',
    duration: '2 weeks',
    workModel: 'Remote-first',
    engagementModel: 'Sprint',
    deliverySpeedLabel: 'Standard delivery — 10 days',
    deliverySpeedCategory: 'standard',
    deliveryLeadTimeDays: 10,
    identityVerified: true,
    escrowReady: true,
    ratingAverage: 4.8,
    ratingCount: 37,
    completedOrderCount: 58,
    trustSignals: ['Top performer', 'Conversion lab certified'],
    taxonomySlugs: ['growth-experiments', 'web-analytics', 'cro'],
    taxonomyLabels: ['Growth experiments', 'Web analytics', 'Conversion optimisation'],
    taxonomyTypes: ['capability', 'capability', 'discipline'],
    searchBoost: 18,
    savedCount: 42,
    status: 'published',
    visibility: 'public',
    packages: [
      {
        packageKey: 'basic',
        tier: 'basic',
        name: 'Launch essentials',
        description: 'Kickstart CRO improvements with an analytics audit and refreshed key pages.',
        priceAmount: 2800,
        priceCurrency: 'USD',
        deliveryDays: 7,
        revisionLimit: 1,
        highlights: ['Analytics audit', 'Backlog of 10 experiments', 'Hero copy refresh'],
        deliverables: ['CRO analytics audit deck', 'Prioritised experiment backlog', 'Hero + pricing page updates'],
        recommendedFor: 'Seed to Series A growth teams',
        isPopular: false,
        position: 0,
      },
      {
        packageKey: 'standard',
        tier: 'standard',
        name: 'Growth accelerator',
        description: 'Pair experimentation with onboarding upgrades and async enablement assets.',
        priceAmount: 4800,
        priceCurrency: 'USD',
        deliveryDays: 14,
        revisionLimit: 3,
        highlights: ['Personalised onboarding flows', 'Async enablement assets', 'Experiment analytics handover'],
        deliverables: [
          'Interactive onboarding funnel prototypes',
          'Enablement asset bundle (loom + templates)',
          'Experiment analytics report + implementation guide',
        ],
        recommendedFor: 'Scale-up product squads',
        isPopular: true,
        position: 1,
      },
      {
        packageKey: 'premium',
        tier: 'premium',
        name: 'Velocity retainer',
        description: 'High-touch experimentation pod covering analytics, copy, and async reporting.',
        priceAmount: 7200,
        priceCurrency: 'USD',
        deliveryDays: 21,
        revisionLimit: 4,
        highlights: ['Fractional experimentation lead', 'Async stakeholder reporting', 'QA + design polish'],
        deliverables: [
          'Weekly experimentation pod stand-ups',
          'Stakeholder-ready velocity and impact dashboard',
          'QA + design polish sprint with annotated recordings',
        ],
        recommendedFor: 'Growth teams running concurrent experiments',
        isPopular: false,
        position: 2,
      },
    ],
    addons: [
      {
        addOnKey: 'executive-report',
        name: 'Executive experiment report',
        description: 'Investor-ready deck summarising learnings, funnel impact, and next bets.',
        priceAmount: 650,
        priceCurrency: 'USD',
        isActive: true,
        position: 1,
      },
    ],
    customRequestEnabled: true,
    customRequestInstructions:
      'Outline your growth KPIs, current tooling, and decision cadence so we can shape a bespoke experimentation pod.',
    customRequests: [
      {
        requesterEmail: 'ava@gigvora.com',
        title: 'Custom growth analytics retainer',
        summary: 'Looking to extend experimentation to lifecycle emails with a monthly analytics cadence.',
        preferredPackageTier: 'premium',
        budgetAmount: 8500,
        budgetCurrency: 'USD',
        deliveryDays: 28,
        requirements: ['Monthly executive reporting', 'Lifecycle experiment backlog', 'Async Slack updates'],
        preferredStartDate: '2024-05-20',
        communicationChannel: 'gigvora_chat',
      },
    ],
  },
  {
    slug: 'demo-marketplace-trust-safety-audit',
    ownerEmail: 'noah@gigvora.com',
    title: '[demo] Marketplace trust and safety audit',
    tagline: 'Stabilise moderation, escalation, and compliance workflows in under a month.',
    description:
      'Assess community guidelines, moderation queues, and automation coverage with actionable roadmap. Includes executive debrief and roadmap workshop.',
    category: 'operations',
    niche: 'trust-and-safety',
    budget: 'USD 6,200',
    budgetAmount: 6200,
    budgetCurrency: 'USD',
    duration: '3 weeks',
    workModel: 'Hybrid',
    engagementModel: 'Program',
    deliverySpeedLabel: 'Accelerated delivery — 3 weeks',
    deliverySpeedCategory: 'express',
    deliveryLeadTimeDays: 5,
    identityVerified: true,
    escrowReady: true,
    ratingAverage: 4.9,
    ratingCount: 41,
    completedOrderCount: 73,
    trustSignals: ['Policy automation ready', 'Escalation specialists'],
    taxonomySlugs: ['trust-safety', 'compliance-audit', 'marketplace-ops'],
    taxonomyLabels: ['Trust & safety', 'Compliance audit', 'Marketplace operations'],
    taxonomyTypes: ['capability', 'service', 'persona'],
    searchBoost: 20,
    savedCount: 51,
    status: 'published',
    visibility: 'public',
    packages: [
      {
        packageKey: 'basic',
        tier: 'basic',
        name: 'Policy pulse check',
        description: 'Rapid diagnostic across guidelines, queues, and escalation coverage.',
        priceAmount: 3200,
        priceCurrency: 'USD',
        deliveryDays: 10,
        revisionLimit: 1,
        highlights: ['Policy + tooling audit', 'Queue throughput assessment', 'Risk register snapshot'],
        deliverables: [
          'Policy + tooling diagnostic summary',
          'Escalation throughput assessment',
          'Executive risk briefing (30 min)',
        ],
        recommendedFor: 'Marketplaces pre Series B+',
        isPopular: false,
        position: 0,
      },
      {
        packageKey: 'standard',
        tier: 'standard',
        name: 'Trust readiness assessment',
        description: 'Deep-dive across moderation queues, automation coverage, and SLAs.',
        priceAmount: 5200,
        priceCurrency: 'USD',
        deliveryDays: 14,
        revisionLimit: 2,
        highlights: ['Moderation workload analysis', 'Escalation workflow review', 'Executive playbook'],
        deliverables: [
          'Moderation workload report with heatmaps',
          'Escalation workflow redesign and training agenda',
          'Executive trust + safety playbook for next quarter',
        ],
        recommendedFor: 'Marketplaces scaling internationally',
        isPopular: true,
        position: 1,
      },
      {
        packageKey: 'premium',
        tier: 'premium',
        name: 'Automation rollout program',
        description: 'Codify automation priorities, policy updates, and training cadence with on-call enablement.',
        priceAmount: 7600,
        priceCurrency: 'USD',
        deliveryDays: 21,
        revisionLimit: 4,
        highlights: ['Automation blueprint', 'Escalation simulator', 'Policy enablement toolkit'],
        deliverables: [
          'Automation roadmap with phased ROI modelling',
          'Escalation simulator workshop and recordings',
          'Policy enablement toolkit with localisation guidelines',
        ],
        recommendedFor: 'Global marketplace operators',
        isPopular: false,
        position: 2,
      },
    ],
    addons: [
      {
        addOnKey: 'workshop',
        name: 'Executive workshop',
        description: 'Half-day alignment session with leadership on trust roadmap and KPIs.',
        priceAmount: 950,
        priceCurrency: 'USD',
        isActive: true,
        position: 1,
      },
      {
        addOnKey: 'playbooks',
        name: 'Playbook localisation pack',
        description: 'Translate and adapt moderation playbooks for three new markets.',
        priceAmount: 1200,
        priceCurrency: 'USD',
        isActive: true,
        position: 2,
      },
    ],
    customRequestEnabled: true,
    customRequestInstructions:
      'Share escalation volumes, tooling stack, and regulatory commitments to scope an automation + policy program.',
    customRequests: [
      {
        requesterEmail: 'leo@gigvora.com',
        title: 'Emerging market escalation coverage',
        summary: 'Need bilingual moderation pods and compliance checkpoints for LATAM expansion.',
        preferredPackageTier: 'standard',
        budgetAmount: 6800,
        budgetCurrency: 'USD',
        deliveryDays: 18,
        requirements: ['Bilingual moderators', 'Escalation SLA simulator', 'Board-ready compliance memo'],
        preferredStartDate: '2024-06-01',
        communicationChannel: 'gigvora_chat',
      },
    ],
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
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM feed_posts WHERE userId = :userId AND content = :content LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, content: post.content },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'feed_posts',
          [
            {
              userId,
              content: post.content,
              visibility: post.visibility,
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
        const ownerId = gig.ownerEmail ? userIds.get(gig.ownerEmail) ?? null : null;
        const packages = Array.isArray(gig.packages) ? gig.packages : [];
        const addons = Array.isArray(gig.addons) ? gig.addons : [];
        const customRequests = Array.isArray(gig.customRequests) ? gig.customRequests : [];
        const publishedAt = gig.status === 'published' ? gig.publishedAt ?? now : null;

        const gigRow = {
          slug: gig.slug,
          ownerId,
          title: gig.title,
          tagline: gig.tagline ?? null,
          description: gig.description,
          category: gig.category ?? null,
          niche: gig.niche ?? null,
          budget: gig.budget ?? null,
          budgetAmount: gig.budgetAmount ?? null,
          budgetCurrency: gig.budgetCurrency ?? null,
          duration: gig.duration ?? null,
          workModel: gig.workModel ?? null,
          engagementModel: gig.engagementModel ?? null,
          deliverySpeedLabel: gig.deliverySpeedLabel ?? null,
          deliverySpeedCategory: gig.deliverySpeedCategory ?? null,
          deliveryLeadTimeDays: gig.deliveryLeadTimeDays ?? null,
          identityVerified: gig.identityVerified ?? false,
          escrowReady: gig.escrowReady ?? false,
          ratingAverage: gig.ratingAverage ?? null,
          ratingCount: gig.ratingCount ?? 0,
          completedOrderCount: gig.completedOrderCount ?? 0,
          trustSignals: gig.trustSignals ?? [],
          taxonomySlugs: gig.taxonomySlugs ?? [],
          taxonomyLabels: gig.taxonomyLabels ?? [],
          taxonomyTypes: gig.taxonomyTypes ?? [],
          searchBoost: gig.searchBoost ?? 0,
          savedCount: gig.savedCount ?? 0,
          status: gig.status ?? 'draft',
          visibility: gig.visibility ?? 'private',
          customRequestEnabled: gig.customRequestEnabled ?? true,
          customRequestInstructions: gig.customRequestInstructions ?? null,
          publishedAt,
          createdAt: now,
          updatedAt: now,
        };

        const [existingGig] = await queryInterface.sequelize.query(
          'SELECT id FROM gigs WHERE slug = :slug OR title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: gigRow.slug, title: gigRow.title },
          },
        );

        let gigId = existingGig?.id ?? null;
        if (gigId) {
          const { createdAt, ...updates } = gigRow;
          await queryInterface.bulkUpdate('gigs', updates, { id: gigId }, { transaction });
        } else {
          await queryInterface.bulkInsert('gigs', [gigRow], { transaction });
          const [insertedGig] = await queryInterface.sequelize.query(
            'SELECT id FROM gigs WHERE slug = :slug LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { slug: gigRow.slug },
            },
          );
          gigId = insertedGig?.id ?? null;
        }

        if (!gigId) continue;

        await queryInterface.bulkDelete('gig_packages', { gigId }, { transaction });
        await queryInterface.bulkDelete('gig_add_ons', { gigId }, { transaction });
        await queryInterface.bulkDelete('gig_custom_requests', { gigId }, { transaction });

        if (packages.length) {
          const packageRows = packages.map((pkg, index) => {
            const deliverables = Array.isArray(pkg.deliverables)
              ? pkg.deliverables
              : typeof pkg.deliverables === 'string'
              ? pkg.deliverables
                  .split(/[\n,]+/)
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [];
            return {
              gigId,
              packageKey: pkg.packageKey,
              tier: pkg.tier ?? pkg.packageKey ?? ['basic', 'standard', 'premium'][index] ?? 'basic',
              name: pkg.name,
              description: pkg.description ?? null,
              priceAmount: pkg.priceAmount ?? 0,
              priceCurrency: pkg.priceCurrency ?? 'USD',
              deliveryDays: pkg.deliveryDays ?? null,
              revisionLimit: pkg.revisionLimit ?? null,
              highlights: Array.isArray(pkg.highlights)
                ? pkg.highlights
                : typeof pkg.highlights === 'string'
                ? pkg.highlights
                    .split(/[\n,]+/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [],
              deliverables,
              recommendedFor: pkg.recommendedFor ?? null,
              isPopular: pkg.isPopular ?? false,
              position: pkg.position ?? index,
              createdAt: now,
              updatedAt: now,
            };
          });
          await queryInterface.bulkInsert('gig_packages', packageRows, { transaction });
        }

        if (addons.length) {
          const addonRows = addons.map((addon, index) => {
            const keyBase = addon.addOnKey ?? addon.key ?? addon.name ?? `addon-${index + 1}`;
            const addOnKey = keyBase
              .toString()
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || `addon-${index + 1}`;
            return {
              gigId,
              addOnKey,
              name: addon.name,
              description: addon.description ?? null,
              priceAmount: addon.priceAmount ?? 0,
              priceCurrency: addon.priceCurrency ?? 'USD',
              deliveryDays: addon.deliveryDays ?? null,
              isPopular: addon.isPopular ?? false,
              isActive: addon.isActive ?? true,
              position: addon.position ?? index,
              metadata: addon.metadata ?? null,
              createdAt: now,
              updatedAt: now,
            };
          });
          await queryInterface.bulkInsert('gig_add_ons', addonRows, { transaction });
        }

        if (customRequests.length) {
          const requestRows = customRequests
            .map((request) => {
              const requesterId = request.requesterEmail ? userIds.get(request.requesterEmail) ?? null : null;
              if (!requesterId) {
                return null;
              }
              const requirements = Array.isArray(request.requirements)
                ? request.requirements
                : typeof request.requirements === 'string'
                ? request.requirements
                    .split(/[,\n\r]+/)
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                : [];
              const preferredStartDate = request.preferredStartDate
                ? new Date(request.preferredStartDate)
                : null;
              return {
                gigId,
                requesterId,
                packageTier: request.preferredPackageTier ?? request.packageTier ?? null,
                title: request.title,
                summary: request.summary ?? null,
                requirements,
                budgetAmount: request.budgetAmount ?? null,
                budgetCurrency: request.budgetCurrency ?? null,
                deliveryDays: request.deliveryDays ?? null,
                preferredStartDate:
                  preferredStartDate && !Number.isNaN(preferredStartDate.getTime())
                    ? preferredStartDate.toISOString().split('T')[0]
                    : null,
                communicationChannel: request.communicationChannel ?? 'gigvora_chat',
                status: request.status ?? 'pending',
                metadata: request.metadata ?? { seed: true },
                createdAt: now,
                updatedAt: now,
              };
            })
            .filter(Boolean);

          if (requestRows.length) {
            await queryInterface.bulkInsert('gig_custom_requests', requestRows, { transaction });
          }
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
        'feed_posts',
        { content: feedPosts.map((post) => post.content) },
        { transaction },
      );
      await queryInterface.bulkDelete('jobs', { title: jobSeeds.map((job) => job.title) }, { transaction });
      const gigSlugs = gigSeeds.map((gig) => gig.slug);
      const gigIdRows = await queryInterface.sequelize.query(
        'SELECT id FROM gigs WHERE slug IN (:slugs)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slugs: gigSlugs },
        },
      );
      const gigIds = gigIdRows.map((row) => row.id);
      if (gigIds.length) {
        await queryInterface.bulkDelete('gig_packages', { gigId: { [Op.in]: gigIds } }, { transaction });
        await queryInterface.bulkDelete('gig_add_ons', { gigId: { [Op.in]: gigIds } }, { transaction });
      }
      await queryInterface.bulkDelete('gigs', { slug: gigSlugs }, { transaction });
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
