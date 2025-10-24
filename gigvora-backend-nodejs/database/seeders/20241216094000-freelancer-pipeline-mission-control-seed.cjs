'use strict';

const { QueryTypes, Op } = require('sequelize');

const PIPELINE_STAGE_DEFINITIONS = [
  { key: 'lead_in', name: 'Lead In', winProbability: 10, statusCategory: 'open' },
  { key: 'discovery_scheduled', name: 'Discovery Scheduled', winProbability: 25, statusCategory: 'open' },
  { key: 'proposal_sent', name: 'Proposal Sent', winProbability: 45, statusCategory: 'open' },
  { key: 'negotiation', name: 'Negotiation', winProbability: 65, statusCategory: 'open' },
  { key: 'closed_won', name: 'Closed Won', winProbability: 100, statusCategory: 'won' },
  { key: 'closed_lost', name: 'Closed Lost', winProbability: 0, statusCategory: 'lost' },
];

const TEMPLATE_DEFINITIONS = [
  {
    name: 'Growth Ops Retainer Blueprint',
    description:
      'Structured retainer plan combining growth experiments, analytics, and executive reporting with weekly rituals.',
    caseStudies: [
      {
        title: 'Fintech ARR expansion',
        outcome: '42% lift in MRR after 2 quarters',
        link: 'https://cdn.gigvora.com/demo/case-studies/fintech-arr-expansion',
      },
    ],
    roiCalculator: {
      baselineMonthlyRevenue: 12000,
      projectedMonthlyRevenue: 18500,
      investment: 4800,
    },
    pricingModel: { type: 'retainer', amount: 4800, cadence: 'monthly', currency: 'USD' },
  },
  {
    name: 'Product Launch Accelerator',
    description:
      'Eight-week launch programme with positioning, creative production, go-to-market orchestration, and analytics handshake.',
    caseStudies: [
      {
        title: 'Consumer launch playbook',
        outcome: '250k signups in 60 days',
        link: 'https://cdn.gigvora.com/demo/case-studies/consumer-launch',
      },
    ],
    roiCalculator: {
      projectedNewUsers: 200000,
      lifetimeValue: 12,
      investment: 35000,
    },
    pricingModel: { type: 'project', amount: 35000, cadence: 'one_time', currency: 'USD' },
  },
];

const CAMPAIGN_DEFINITIONS = [
  {
    key: 'climate',
    name: 'Climate Innovation Outreach',
    description: 'Warm intros to climate analytics teams focused on sustainability dashboards and forecasting.',
    targetService: 'Climate analytics retainer',
    status: 'active',
    launchOffset: -21,
    endOffset: 30,
    metrics: { touches: 24, replies: 9, meetings: 4 },
  },
  {
    key: 'automation',
    name: 'Lifecycle Automation Sprint',
    description: 'Sequenced nurture play outreach targeting venture-backed SaaS marketing leaders.',
    targetService: 'Lifecycle automation program',
    status: 'active',
    launchOffset: -14,
    endOffset: 45,
    metrics: { touches: 18, replies: 7, meetings: 3 },
  },
];

const DEAL_DEFINITIONS = [
  {
    slug: 'climate-analytics-retainer',
    title: 'Climate analytics retainer',
    clientName: 'Aurora Labs',
    stageKey: 'lead_in',
    pipelineValue: 9000,
    winProbability: 25,
    industry: 'Climate tech',
    retainerSize: 'midmarket',
    source: 'talent_partner',
    nextFollowUpInDays: 2,
    expectedCloseInDays: 21,
    lastContactInDays: -1,
    notes: 'Talent partner requested updated climate case study.',
    tags: ['climate', 'analytics', 'retainer'],
    campaignKey: 'climate',
  },
  {
    slug: 'creator-automation-sprint',
    title: 'Creator automation sprint',
    clientName: 'Northshore Collective',
    stageKey: 'lead_in',
    pipelineValue: 9000,
    winProbability: 20,
    industry: 'Creator economy',
    retainerSize: 'starter',
    source: 'community_referral',
    nextFollowUpInDays: 4,
    expectedCloseInDays: 25,
    lastContactInDays: -2,
    notes: 'Waiting on updated scope from marketing lead.',
    tags: ['automation', 'influencer'],
    campaignKey: 'automation',
  },
  {
    slug: 'product-marketing-revamp',
    title: 'Product marketing revamp',
    clientName: 'Helios Mobility',
    stageKey: 'proposal_sent',
    pipelineValue: 11000,
    winProbability: 35,
    industry: 'Mobility',
    retainerSize: 'midmarket',
    source: 'gig_submission',
    nextFollowUpInDays: 1,
    expectedCloseInDays: 18,
    lastContactInDays: -1,
    notes: 'Share Loom walkthrough with success metrics by Tuesday.',
    tags: ['product_marketing', 'mobility'],
    campaignKey: 'automation',
  },
  {
    slug: 'lifecycle-automation-program',
    title: 'Lifecycle automation program',
    clientName: 'Voyage Fintech',
    stageKey: 'proposal_sent',
    pipelineValue: 12000,
    winProbability: 45,
    industry: 'Fintech',
    retainerSize: 'growth',
    source: 'talent_partner',
    nextFollowUpInDays: 3,
    expectedCloseInDays: 28,
    lastContactInDays: -2,
    notes: 'Finance requested revised pricing tiers before procurement review.',
    tags: ['automation', 'fintech'],
    campaignKey: 'automation',
  },
  {
    slug: 'community-growth-accelerator',
    title: 'Community growth accelerator',
    clientName: 'Beacon Retail',
    stageKey: 'proposal_sent',
    pipelineValue: 9000,
    winProbability: 40,
    industry: 'Retail',
    retainerSize: 'starter',
    source: 'community_referral',
    nextFollowUpInDays: 5,
    expectedCloseInDays: 30,
    lastContactInDays: -3,
    notes: 'Send updated testimonial deck after upcoming livestream.',
    tags: ['community', 'growth'],
    campaignKey: 'climate',
  },
  {
    slug: 'brand-growth-partnership',
    title: 'Brand growth partnership',
    clientName: 'Polaris Ventures',
    stageKey: 'discovery_scheduled',
    pipelineValue: 14000,
    winProbability: 55,
    industry: 'Venture capital',
    retainerSize: 'enterprise',
    source: 'advisor_intro',
    nextFollowUpInDays: 0,
    expectedCloseInDays: 14,
    lastContactInDays: 0,
    notes: 'Panel wants deeper dive on analytics roadmap—prep slides.',
    tags: ['brand', 'analytics'],
    campaignKey: 'climate',
  },
  {
    slug: 'demand-gen-experiment-pod',
    title: 'Demand gen experiment pod',
    clientName: 'Atlas Systems',
    stageKey: 'discovery_scheduled',
    pipelineValue: 12000,
    winProbability: 55,
    industry: 'B2B SaaS',
    retainerSize: 'growth',
    source: 'referral',
    nextFollowUpInDays: 2,
    expectedCloseInDays: 16,
    lastContactInDays: 0,
    notes: 'Coach requests case study on account-based marketing uplift.',
    tags: ['demand_gen', 'experiments'],
    campaignKey: 'automation',
  },
  {
    slug: 'experience-redesign-sprint',
    title: 'Experience redesign sprint',
    clientName: 'Beacon Retail',
    stageKey: 'closed_won',
    pipelineValue: 24000,
    winProbability: 95,
    industry: 'Retail',
    retainerSize: 'enterprise',
    source: 'repeat_client',
    nextFollowUpInDays: -1,
    expectedCloseInDays: 3,
    lastContactInDays: 0,
    notes: 'Kickoff deck ready—confirm analytics owner before meeting.',
    tags: ['ux', 'analytics'],
    campaignKey: 'climate',
    status: 'won',
  },
];

const FOLLOW_UP_DEFINITIONS = [
  {
    slug: 'loom-walkthrough',
    dealSlug: 'product-marketing-revamp',
    dueInDays: 1,
    channel: 'email',
    note: 'Send Loom walkthrough and ROI dashboard',
  },
  {
    slug: 'analytics-roadmap-slides',
    dealSlug: 'brand-growth-partnership',
    dueInDays: 0,
    channel: 'document',
    note: 'Upload analytics roadmap slides before panel',
  },
  {
    slug: 'pricing-tier-revision',
    dealSlug: 'lifecycle-automation-program',
    dueInDays: 3,
    channel: 'document',
    note: 'Share revised pricing tiers with finance and procurement.',
  },
  {
    slug: 'kickoff-readiness',
    dealSlug: 'experience-redesign-sprint',
    dueInDays: -1,
    channel: 'meeting',
    note: 'Confirm analytics owner and kickoff agenda.',
  },
];

const PROPOSAL_DEFINITIONS = [
  {
    slug: 'automation-proposal',
    dealSlug: 'lifecycle-automation-program',
    templateName: 'Growth Ops Retainer Blueprint',
    title: 'Lifecycle automation retainer proposal',
    summary:
      'Automation audit, nurture rebuild, experimentation backlog, and revenue reporting cadences across the first 90 days.',
    status: 'sent',
    sentInDays: -3,
  },
  {
    slug: 'experience-redesign-proposal',
    dealSlug: 'experience-redesign-sprint',
    templateName: 'Product Launch Accelerator',
    title: 'Experience redesign sprint proposal',
    summary: 'Six-week redesign sprint covering journey mapping, UX experimentation, and analytics instrumentation.',
    status: 'accepted',
    sentInDays: -7,
    acceptedInDays: -2,
  },
];

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function ensureStageDefinitions(queryInterface, transaction, boardId) {
  const now = new Date();
  const existingStages = await queryInterface.sequelize.query(
    'SELECT id, name, position FROM pipeline_stages WHERE boardId = :boardId',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { boardId },
    },
  );
  const existingByName = new Map(
    existingStages.map((stage) => [stage.name.toLowerCase(), { id: stage.id, position: stage.position }]),
  );

  const stageIds = {};
  for (const [index, definition] of PIPELINE_STAGE_DEFINITIONS.entries()) {
    const existing = existingByName.get(definition.name.toLowerCase());
    if (existing) {
      await queryInterface.bulkUpdate(
        'pipeline_stages',
        {
          position: index,
          winProbability: definition.winProbability,
          statusCategory: definition.statusCategory,
          updatedAt: now,
        },
        { id: existing.id },
        { transaction },
      );
      stageIds[definition.key] = existing.id;
      continue;
    }

    const [positionMatch] = existingStages.filter((stage) => stage.position === index);
    if (positionMatch) {
      await queryInterface.bulkUpdate(
        'pipeline_stages',
        {
          name: definition.name,
          position: index,
          winProbability: definition.winProbability,
          statusCategory: definition.statusCategory,
          updatedAt: now,
        },
        { id: positionMatch.id },
        { transaction },
      );
      stageIds[definition.key] = positionMatch.id;
      continue;
    }

    await queryInterface.bulkInsert(
      'pipeline_stages',
      [
        {
          boardId,
          name: definition.name,
          position: index,
          winProbability: definition.winProbability,
          statusCategory: definition.statusCategory,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { transaction },
    );

    const [inserted] = await queryInterface.sequelize.query(
      'SELECT id FROM pipeline_stages WHERE boardId = :boardId AND name = :name LIMIT 1',
      {
        type: QueryTypes.SELECT,
        transaction,
        replacements: { boardId, name: definition.name },
      },
    );
    if (inserted?.id) {
      stageIds[definition.key] = inserted.id;
    }
  }

  return stageIds;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const [freelancer] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { email: 'jonah.freelancer.demo@gigvora.com' },
        },
      );

      if (!freelancer?.id) {
        return;
      }

      const ownerId = freelancer.id;
      let [board] = await queryInterface.sequelize.query(
        'SELECT id FROM pipeline_boards WHERE ownerId = :ownerId AND ownerType = :ownerType LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { ownerId, ownerType: 'freelancer' },
        },
      );

      if (!board) {
        await queryInterface.bulkInsert(
          'pipeline_boards',
          [
            {
              ownerId,
              ownerType: 'freelancer',
              name: 'Freelancer relationship pipeline',
              grouping: 'industry',
              filters: { focus: 'retainer', seed: 'freelancer-mission-control' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        [board] = await queryInterface.sequelize.query(
          'SELECT id FROM pipeline_boards WHERE ownerId = :ownerId AND ownerType = :ownerType LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { ownerId, ownerType: 'freelancer' },
          },
        );
      }

      if (!board?.id) {
        return;
      }

      const boardId = board.id;
      const stageIds = await ensureStageDefinitions(queryInterface, transaction, boardId);

      const templateIds = new Map();
      for (const template of TEMPLATE_DEFINITIONS) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM pipeline_proposal_templates WHERE ownerId = :ownerId AND ownerType = :ownerType AND name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { ownerId, ownerType: 'freelancer', name: template.name },
          },
        );
        if (existing?.id) {
          templateIds.set(template.name, existing.id);
          continue;
        }

        await queryInterface.bulkInsert(
          'pipeline_proposal_templates',
          [
            {
              ownerId,
              ownerType: 'freelancer',
              name: template.name,
              description: template.description,
              caseStudies: template.caseStudies,
              roiCalculator: template.roiCalculator,
              pricingModel: template.pricingModel,
              isArchived: false,
              lastUsedAt: null,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM pipeline_proposal_templates WHERE ownerId = :ownerId AND ownerType = :ownerType AND name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { ownerId, ownerType: 'freelancer', name: template.name },
          },
        );
        if (inserted?.id) {
          templateIds.set(template.name, inserted.id);
        }
      }

      const campaignIds = new Map();
      for (const campaign of CAMPAIGN_DEFINITIONS) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM pipeline_campaigns WHERE ownerId = :ownerId AND ownerType = :ownerType AND name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { ownerId, ownerType: 'freelancer', name: campaign.name },
          },
        );
        if (existing?.id) {
          campaignIds.set(campaign.key, existing.id);
          continue;
        }

        await queryInterface.bulkInsert(
          'pipeline_campaigns',
          [
            {
              ownerId,
              ownerType: 'freelancer',
              name: campaign.name,
              description: campaign.description,
              targetService: campaign.targetService,
              status: campaign.status,
              playbook: { cadence: 'bi-weekly', seed: 'freelancer-mission-control' },
              metrics: campaign.metrics,
              launchDate: daysFromNow(campaign.launchOffset),
              endDate: daysFromNow(campaign.endOffset),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM pipeline_campaigns WHERE ownerId = :ownerId AND ownerType = :ownerType AND name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { ownerId, ownerType: 'freelancer', name: campaign.name },
          },
        );
        if (inserted?.id) {
          campaignIds.set(campaign.key, inserted.id);
        }
      }

      const dealIds = new Map();
      for (const deal of DEAL_DEFINITIONS) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM pipeline_deals WHERE ownerId = :ownerId AND ownerType = :ownerType AND title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { ownerId, ownerType: 'freelancer', title: deal.title },
          },
        );
        if (existing?.id) {
          dealIds.set(deal.slug, existing.id);
          continue;
        }

        const stageId = stageIds[deal.stageKey];
        if (!stageId) {
          continue;
        }

        await queryInterface.bulkInsert(
          'pipeline_deals',
          [
            {
              boardId,
              stageId,
              campaignId: campaignIds.get(deal.campaignKey) ?? null,
              ownerId,
              ownerType: 'freelancer',
              title: deal.title,
              clientName: deal.clientName,
              industry: deal.industry,
              retainerSize: deal.retainerSize,
              pipelineValue: deal.pipelineValue,
              winProbability: deal.winProbability,
              status: deal.status ?? 'open',
              source: deal.source,
              lastContactAt: daysFromNow(deal.lastContactInDays),
              nextFollowUpAt: daysFromNow(deal.nextFollowUpInDays),
              expectedCloseDate: daysFromNow(deal.expectedCloseInDays),
              notes: deal.notes,
              tags: deal.tags,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM pipeline_deals WHERE ownerId = :ownerId AND ownerType = :ownerType AND title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { ownerId, ownerType: 'freelancer', title: deal.title },
          },
        );
        if (inserted?.id) {
          dealIds.set(deal.slug, inserted.id);
        }
      }

      for (const followUp of FOLLOW_UP_DEFINITIONS) {
        const dealId = dealIds.get(followUp.dealSlug);
        if (!dealId) {
          continue;
        }

        const dueAt = daysFromNow(followUp.dueInDays);
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM pipeline_follow_ups WHERE dealId = :dealId AND ownerId = :ownerId AND note = :note LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { dealId, ownerId, note: followUp.note },
          },
        );
        if (existing?.id) {
          continue;
        }

        await queryInterface.bulkInsert(
          'pipeline_follow_ups',
          [
            {
              dealId,
              ownerId,
              ownerType: 'freelancer',
              dueAt,
              completedAt: null,
              channel: followUp.channel,
              note: followUp.note,
              status: 'scheduled',
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      for (const proposal of PROPOSAL_DEFINITIONS) {
        const dealId = dealIds.get(proposal.dealSlug);
        if (!dealId) {
          continue;
        }
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM pipeline_proposals WHERE dealId = :dealId AND title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { dealId, title: proposal.title },
          },
        );
        if (existing?.id) {
          continue;
        }

        const templateId = templateIds.get(proposal.templateName) ?? null;
        await queryInterface.bulkInsert(
          'pipeline_proposals',
          [
            {
              dealId,
              templateId,
              title: proposal.title,
              summary: proposal.summary ?? null,
              status: proposal.status,
              version: 'v1',
              pricing: {
                total: DEAL_DEFINITIONS.find((deal) => deal.slug === proposal.dealSlug)?.pipelineValue ?? null,
                currency: 'USD',
              },
              roiModel: null,
              caseStudies: null,
              sentAt: daysFromNow(proposal.sentInDays ?? 0),
              acceptedAt: proposal.acceptedInDays != null ? daysFromNow(proposal.acceptedInDays) : null,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [freelancer] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { email: 'jonah.freelancer.demo@gigvora.com' },
        },
      );

      if (!freelancer?.id) {
        return;
      }

      const ownerId = freelancer.id;
      const dealTitles = DEAL_DEFINITIONS.map((deal) => deal.title);
      const dealRows = await queryInterface.sequelize.query(
        'SELECT id FROM pipeline_deals WHERE ownerId = :ownerId AND ownerType = :ownerType AND title IN (:titles)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { ownerId, ownerType: 'freelancer', titles: dealTitles },
        },
      );

      const dealIds = (dealRows ?? []).map((row) => row.id);

      if (dealIds.length) {
        await queryInterface.bulkDelete(
          'pipeline_follow_ups',
          { dealId: { [Op.in]: dealIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pipeline_proposals',
          { dealId: { [Op.in]: dealIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pipeline_deals',
          { id: { [Op.in]: dealIds } },
          { transaction },
        );
      }

      await queryInterface.bulkDelete(
        'pipeline_campaigns',
        {
          ownerId,
          ownerType: 'freelancer',
          name: { [Op.in]: CAMPAIGN_DEFINITIONS.map((campaign) => campaign.name) },
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'pipeline_proposal_templates',
        {
          ownerId,
          ownerType: 'freelancer',
          name: { [Op.in]: TEMPLATE_DEFINITIONS.map((template) => template.name) },
        },
        { transaction },
      );
    });
  },
};
