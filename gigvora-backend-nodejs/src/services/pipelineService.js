import { Op } from 'sequelize';
import {
  sequelize,
  PipelineBoard,
  PipelineStage,
  PipelineDeal,
  PipelineProposal,
  PipelineProposalTemplate,
  PipelineFollowUp,
  PipelineCampaign,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_PIPELINE_STAGES = [
  { name: 'Lead In', winProbability: 10, statusCategory: 'open' },
  { name: 'Discovery Scheduled', winProbability: 25, statusCategory: 'open' },
  { name: 'Proposal Sent', winProbability: 45, statusCategory: 'open' },
  { name: 'Negotiation', winProbability: 65, statusCategory: 'open' },
  { name: 'Closed Won', winProbability: 100, statusCategory: 'won' },
  { name: 'Closed Lost', winProbability: 0, statusCategory: 'lost' },
];

const DEFAULT_PROPOSAL_TEMPLATES = [
  {
    name: 'Brand Retainer Growth Plan',
    description: 'Strategy, design, and campaign optimisation retainer with quarterly growth targets.',
    caseStudies: [
      {
        title: 'Fintech SaaS conversion uplift',
        outcome: '42% lift in MRR within 6 months',
        link: 'https://example.com/case-studies/fintech-growth',
      },
    ],
    roiCalculator: {
      baselineMonthlyRevenue: 12000,
      projectedMonthlyRevenue: 18000,
      investment: 4800,
    },
    pricingModel: { type: 'retainer', amount: 4800, cadence: 'monthly' },
  },
  {
    name: 'Product Launch Accelerator',
    description: 'Eight-week sprint with positioning, creative, go-to-market orchestration, and analytics.',
    caseStudies: [
      {
        title: 'Consumer app launch',
        outcome: '250k signups in 60 days',
        link: 'https://example.com/case-studies/app-launch',
      },
    ],
    roiCalculator: {
      projectedNewUsers: 200000,
      lifetimeValue: 12,
      investment: 35000,
    },
    pricingModel: { type: 'project', amount: 35000, cadence: 'one_time' },
  },
  {
    name: 'Lifecycle Automation Expansion',
    description: 'CRM audit, nurture flows, experimentation roadmap, and reporting dashboards.',
    caseStudies: [
      {
        title: 'DTC lifecycle overhaul',
        outcome: '33% increase in repeat purchases',
        link: 'https://example.com/case-studies/dtc-lifecycle',
      },
    ],
    roiCalculator: {
      retainedCustomers: 1800,
      incrementalMarginPerCustomer: 85,
      investment: 6400,
    },
    pricingModel: { type: 'retainer', amount: 6400, cadence: 'monthly' },
  },
];

function normaliseOwnerId(ownerId) {
  const numeric = Number(ownerId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('ownerId must be a positive integer.');
  }
  return numeric;
}

function normaliseDealId(dealId) {
  const numeric = Number(dealId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('dealId must be a positive integer.');
  }
  return numeric;
}

function normaliseFollowUpId(followUpId) {
  const numeric = Number(followUpId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('followUpId must be a positive integer.');
  }
  return numeric;
}

function pickAllowedFields(payload, allowed) {
  return Object.entries(payload ?? {})
    .filter(([key, value]) => allowed.includes(key) && value !== undefined)
    .reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), {});
}

async function ensureBoard(ownerId, { transaction } = {}) {
  const existingBoard = await PipelineBoard.findOne({
    where: { ownerId, ownerType: 'freelancer' },
    transaction,
  });
  if (existingBoard) {
    return existingBoard;
  }

  return sequelize.transaction({ transaction }, async (trx) => {
    const board = await PipelineBoard.create(
      {
        ownerId,
        ownerType: 'freelancer',
        name: 'Freelancer relationship pipeline',
        grouping: 'industry',
      },
      { transaction: trx },
    );

    await PipelineStage.bulkCreate(
      DEFAULT_PIPELINE_STAGES.map((stage, index) => ({
        ...stage,
        position: index,
        boardId: board.id,
      })),
      { transaction: trx },
    );

    const existingTemplates = await PipelineProposalTemplate.count({
      where: { ownerId, ownerType: 'freelancer' },
      transaction: trx,
    });
    if (existingTemplates === 0) {
      await PipelineProposalTemplate.bulkCreate(
        DEFAULT_PROPOSAL_TEMPLATES.map((template) => ({
          ...template,
          ownerId,
          ownerType: 'freelancer',
        })),
        { transaction: trx },
      );
    }

    return board;
  });
}

function sanitizeDeal(dealInstance) {
  if (!dealInstance) return null;
  const base = dealInstance.toPublicObject();
  const stage = dealInstance.get?.('stage') ?? dealInstance.stage;
  const campaign = dealInstance.get?.('campaign') ?? dealInstance.campaign;
  const proposals = dealInstance.get?.('proposals') ?? dealInstance.proposals;
  const followUps = dealInstance.get?.('followUps') ?? dealInstance.followUps;
  return {
    ...base,
    stage: stage?.toPublicObject?.() ?? stage ?? null,
    campaign: campaign?.toPublicObject?.() ?? campaign ?? null,
    proposals: Array.isArray(proposals)
      ? proposals.map((proposal) => {
          const plain = proposal.toPublicObject();
          const template = proposal.get?.('template') ?? proposal.template;
          return {
            ...plain,
            template: template?.toPublicObject?.() ?? template ?? null,
          };
        })
      : [],
    followUps: Array.isArray(followUps)
      ? followUps.map((followUp) => followUp.toPublicObject())
      : [],
  };
}

function resolveStatusFromStage(stage, fallbackStatus = 'open') {
  if (!stage) return fallbackStatus;
  if (stage.statusCategory === 'won') return 'won';
  if (stage.statusCategory === 'lost') return 'lost';
  return fallbackStatus;
}

function sanitizeFollowUp(followUpInstance) {
  if (!followUpInstance) return null;
  return followUpInstance.toPublicObject();
}

function sanitizeProposal(proposalInstance) {
  if (!proposalInstance) return null;
  const base = proposalInstance.toPublicObject();
  const template = proposalInstance.get?.('template') ?? proposalInstance.template;
  const deal = proposalInstance.get?.('deal') ?? proposalInstance.deal;
  return {
    ...base,
    template: template?.toPublicObject?.() ?? template ?? null,
    deal: deal
      ? {
          id: deal.id,
          title: deal.title,
          clientName: deal.clientName,
          status: deal.status,
        }
      : null,
  };
}

function sanitizeCampaign(campaignInstance) {
  if (!campaignInstance) return null;
  return campaignInstance.toPublicObject();
}

function sanitizeStage(stageInstance) {
  if (!stageInstance) return null;
  return stageInstance.toPublicObject();
}

function calculateSummaryMetrics(deals) {
  const summary = {
    totalDeals: deals.length,
    openDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    pipelineValue: 0,
    weightedPipelineValue: 0,
    nextFollowUps: 0,
  };

  const now = Date.now();
  deals.forEach((deal) => {
    if (deal.status === 'won') summary.wonDeals += 1;
    if (deal.status === 'lost') summary.lostDeals += 1;
    if (deal.status === 'open' || deal.status === 'on_hold') summary.openDeals += 1;
    const value = Number(deal.pipelineValue ?? 0) || 0;
    summary.pipelineValue += value;
    const probability = Number(deal.winProbability ?? deal.stage?.winProbability ?? 0) || 0;
    summary.weightedPipelineValue += value * (probability / 100);

    const followUps = Array.isArray(deal.followUps) ? deal.followUps : [];
    const upcoming = followUps.some((followUp) => {
      if (!followUp.dueAt || followUp.status !== 'scheduled') return false;
      const dueTime = new Date(followUp.dueAt).getTime();
      return dueTime >= now && dueTime <= now + 1000 * 60 * 60 * 24 * 14;
    });
    if (upcoming) summary.nextFollowUps += 1;
  });
  return summary;
}

function groupDealsBy(deals, key) {
  const groups = new Map();
  deals.forEach((deal) => {
    let groupKey = 'Uncategorized';
    switch (key) {
      case 'industry':
        groupKey = deal.industry || 'Unspecified industry';
        break;
      case 'retainer_size':
        groupKey = deal.retainerSize || 'No retainer tier';
        break;
      case 'probability':
        {
          const probability = Number(deal.winProbability ?? deal.stage?.winProbability ?? 0);
          if (probability >= 70) groupKey = 'High likelihood (70%+)';
          else if (probability >= 40) groupKey = 'Medium likelihood (40-69%)';
          else groupKey = 'Early stage (<40%)';
        }
        break;
      default:
        groupKey = deal.stage?.name || 'Pipeline';
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(deal);
  });

  return Array.from(groups.entries()).map(([groupName, groupedDeals]) => ({
    name: groupName,
    totalValue: groupedDeals.reduce((sum, deal) => sum + (Number(deal.pipelineValue) || 0), 0),
    weightedValue: groupedDeals.reduce((sum, deal) => {
      const probability = Number(deal.winProbability ?? deal.stage?.winProbability ?? 0) || 0;
      const value = Number(deal.pipelineValue) || 0;
      return sum + value * (probability / 100);
    }, 0),
    deals: groupedDeals,
  }));
}

function buildKanbanView(stages, deals) {
  return stages.map((stage) => {
    const columnDeals = deals.filter((deal) => deal.stageId === stage.id);
    return {
      ...stage,
      deals: columnDeals,
      totalValue: columnDeals.reduce((sum, deal) => sum + (Number(deal.pipelineValue) || 0), 0),
      weightedValue: columnDeals.reduce((sum, deal) => {
        const probability = Number(deal.winProbability ?? stage.winProbability ?? 0) || 0;
        const value = Number(deal.pipelineValue) || 0;
        return sum + value * (probability / 100);
      }, 0),
    };
  });
}

async function loadBoardContext(ownerId) {
  const board = await PipelineBoard.findOne({
    where: { ownerId, ownerType: 'freelancer' },
    include: [
      { model: PipelineStage, as: 'stages', separate: true, order: [['position', 'ASC']] },
    ],
  });

  if (!board) {
    return null;
  }

  const stages = Array.isArray(board.stages) ? board.stages.map((stage) => sanitizeStage(stage)) : [];

  const deals = await PipelineDeal.findAll({
    where: { boardId: board.id },
    include: [
      { model: PipelineStage, as: 'stage' },
      { model: PipelineCampaign, as: 'campaign' },
      {
        model: PipelineProposal,
        as: 'proposals',
        include: [{ model: PipelineProposalTemplate, as: 'template' }],
      },
      { model: PipelineFollowUp, as: 'followUps' },
    ],
    order: [
      ['status', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
  });

  const sanitizedDeals = deals.map((deal) => sanitizeDeal(deal));

  const campaigns = await PipelineCampaign.findAll({
    where: { ownerId, ownerType: 'freelancer' },
    order: [
      ['status', 'ASC'],
      ['launchDate', 'DESC'],
    ],
  });

  const proposals = await PipelineProposal.findAll({
    include: [
      {
        model: PipelineDeal,
        as: 'deal',
        where: { ownerId, ownerType: 'freelancer' },
        attributes: ['id', 'title', 'clientName'],
      },
      { model: PipelineProposalTemplate, as: 'template' },
    ],
    order: [['updatedAt', 'DESC']],
  });

  const followUps = await PipelineFollowUp.findAll({
    where: { ownerId, ownerType: 'freelancer' },
    include: [{ model: PipelineDeal, as: 'deal', attributes: ['id', 'title', 'clientName', 'status'] }],
    order: [['dueAt', 'ASC']],
    limit: 50,
  });

  const templates = await PipelineProposalTemplate.findAll({
    where: { ownerId, ownerType: 'freelancer', isArchived: false },
    order: [['name', 'ASC']],
  });

  return {
    board: board.toPublicObject(),
    stages,
    deals: sanitizedDeals,
    campaigns: campaigns.map((campaign) => sanitizeCampaign(campaign)),
    proposals: proposals.map((proposal) => sanitizeProposal(proposal)),
    followUps: followUps.map((followUp) => {
      const plain = followUp.toPublicObject();
      const deal = followUp.get?.('deal') ?? followUp.deal;
      return {
        ...plain,
        deal: deal ? { id: deal.id, title: deal.title, clientName: deal.clientName, status: deal.status } : null,
      };
    }),
    templates: templates.map((template) => template.toPublicObject()),
  };
}

export async function getFreelancerPipelineDashboard(ownerId, { view = 'stage' } = {}) {
  const normalizedOwnerId = normaliseOwnerId(ownerId);
  await ensureBoard(normalizedOwnerId);

  const context = await loadBoardContext(normalizedOwnerId);
  if (!context) {
    throw new NotFoundError('Pipeline board could not be initialised.');
  }

  const summary = calculateSummaryMetrics(context.deals);
  const viewOptions = ['stage', 'industry', 'retainer_size', 'probability'];
  const activeView = viewOptions.includes(view) ? view : 'stage';

  const grouping = activeView === 'stage' ? buildKanbanView(context.stages, context.deals) : groupDealsBy(context.deals, activeView);

  return {
    board: context.board,
    stages: context.stages,
    summary,
    grouping: {
      type: activeView,
      columns: grouping,
    },
    deals: context.deals,
    campaigns: context.campaigns,
    proposals: context.proposals,
    followUps: context.followUps,
    templates: context.templates,
    viewOptions,
  };
}

export async function createPipelineDeal(ownerId, payload = {}) {
  const normalizedOwnerId = normaliseOwnerId(ownerId);
  const requiredFields = ['title', 'clientName'];
  requiredFields.forEach((field) => {
    if (!payload[field] || `${payload[field]}`.trim() === '') {
      throw new ValidationError(`${field} is required to create a pipeline deal.`);
    }
  });

  const board = await ensureBoard(normalizedOwnerId);
  const stageId = payload.stageId ? Number(payload.stageId) : null;

  return sequelize.transaction(async (transaction) => {
    let stage = null;
    if (stageId) {
      stage = await PipelineStage.findOne({
        where: { id: stageId, boardId: board.id },
        transaction,
      });
      if (!stage) {
        throw new ValidationError('The provided stage does not exist on the freelancer pipeline.');
      }
    } else {
      stage = await PipelineStage.findOne({
        where: { boardId: board.id },
        order: [['position', 'ASC']],
        transaction,
      });
    }
    if (!stage) {
      throw new ValidationError('Pipeline stages are not configured for this freelancer.');
    }

    const deal = await PipelineDeal.create(
      {
        boardId: board.id,
        stageId: stage.id,
        ownerId: normalizedOwnerId,
        ownerType: 'freelancer',
        campaignId: payload.campaignId ?? null,
        title: payload.title,
        clientName: payload.clientName,
        industry: payload.industry ?? null,
        retainerSize: payload.retainerSize ?? null,
        pipelineValue: payload.pipelineValue ?? 0,
        winProbability: payload.winProbability ?? stage.winProbability ?? 0,
        status: resolveStatusFromStage(stage, payload.status ?? 'open'),
        source: payload.source ?? null,
        lastContactAt: payload.lastContactAt ?? null,
        nextFollowUpAt: payload.nextFollowUpAt ?? null,
        expectedCloseDate: payload.expectedCloseDate ?? null,
        notes: payload.notes ?? null,
        tags: payload.tags ?? null,
      },
      { transaction },
    );

    return sanitizeDeal(
      await PipelineDeal.findByPk(deal.id, {
        include: [
          { model: PipelineStage, as: 'stage' },
          { model: PipelineCampaign, as: 'campaign' },
          {
            model: PipelineProposal,
            as: 'proposals',
            include: [{ model: PipelineProposalTemplate, as: 'template' }],
          },
          { model: PipelineFollowUp, as: 'followUps' },
        ],
        transaction,
      }),
    );
  });
}

export async function updatePipelineDeal(ownerId, dealId, payload = {}) {
  const normalizedOwnerId = normaliseOwnerId(ownerId);
  const normalizedDealId = normaliseDealId(dealId);

  return sequelize.transaction(async (transaction) => {
    const deal = await PipelineDeal.findOne({
      where: { id: normalizedDealId, ownerId: normalizedOwnerId, ownerType: 'freelancer' },
      transaction,
    });
    if (!deal) {
      throw new NotFoundError('The requested pipeline deal could not be found.');
    }

    const update = pickAllowedFields(payload, [
      'title',
      'clientName',
      'industry',
      'retainerSize',
      'pipelineValue',
      'winProbability',
      'status',
      'source',
      'lastContactAt',
      'nextFollowUpAt',
      'expectedCloseDate',
      'notes',
      'tags',
      'campaignId',
      'stageId',
    ]);

    let stage = null;
    if (update.stageId) {
      stage = await PipelineStage.findOne({
        where: { id: update.stageId, boardId: deal.boardId },
        transaction,
      });
      if (!stage) {
        throw new ValidationError('The selected stage is not valid for this pipeline.');
      }
      if (!update.status) {
        update.status = resolveStatusFromStage(stage, deal.status);
      }
    }

    if (!update.stageId && !update.status && deal.stageId) {
      stage = await PipelineStage.findOne({ where: { id: deal.stageId }, transaction });
    }

    if (update.campaignId) {
      const campaign = await PipelineCampaign.findOne({
        where: { id: update.campaignId, ownerId: normalizedOwnerId, ownerType: 'freelancer' },
        transaction,
      });
      if (!campaign) {
        throw new ValidationError('The selected campaign is not owned by this freelancer.');
      }
    }

    const nextUpdate = { ...update };
    if (nextUpdate.status && !['open', 'on_hold', 'won', 'lost'].includes(nextUpdate.status)) {
      throw new ValidationError('Invalid deal status provided.');
    }
    if (!nextUpdate.winProbability && stage) {
      nextUpdate.winProbability = stage.winProbability;
    }

    await deal.update(nextUpdate, { transaction });

    return sanitizeDeal(
      await PipelineDeal.findByPk(deal.id, {
        include: [
          { model: PipelineStage, as: 'stage' },
          { model: PipelineCampaign, as: 'campaign' },
          {
            model: PipelineProposal,
            as: 'proposals',
            include: [{ model: PipelineProposalTemplate, as: 'template' }],
          },
          { model: PipelineFollowUp, as: 'followUps' },
        ],
        transaction,
      }),
    );
  });
}

export async function createPipelineProposal(ownerId, payload = {}) {
  const normalizedOwnerId = normaliseOwnerId(ownerId);
  const normalizedDealId = normaliseDealId(payload.dealId);

  return sequelize.transaction(async (transaction) => {
    const deal = await PipelineDeal.findOne({
      where: { id: normalizedDealId, ownerId: normalizedOwnerId, ownerType: 'freelancer' },
      transaction,
    });
    if (!deal) {
      throw new ValidationError('Cannot create a proposal for a deal outside your pipeline.');
    }

    let template = null;
    if (payload.templateId) {
      template = await PipelineProposalTemplate.findOne({
        where: { id: payload.templateId, ownerId: normalizedOwnerId, ownerType: 'freelancer' },
        transaction,
      });
      if (!template) {
        throw new ValidationError('The selected template is not available.');
      }
      await template.update({ lastUsedAt: new Date() }, { transaction });
    }

    const proposal = await PipelineProposal.create(
      {
        dealId: deal.id,
        templateId: template?.id ?? null,
        title: payload.title || `${deal.title} proposal`,
        summary: payload.summary ?? template?.description ?? null,
        status: payload.status ?? 'draft',
        version: payload.version ?? 'v1',
        pricing: payload.pricing ?? template?.pricingModel ?? null,
        roiModel: payload.roiModel ?? template?.roiCalculator ?? null,
        caseStudies: payload.caseStudies ?? template?.caseStudies ?? null,
        sentAt: payload.sentAt ?? null,
        acceptedAt: payload.acceptedAt ?? null,
      },
      { transaction },
    );

    return sanitizeProposal(
      await PipelineProposal.findByPk(proposal.id, {
        include: [{ model: PipelineProposalTemplate, as: 'template' }],
        transaction,
      }),
    );
  });
}

export async function createPipelineFollowUp(ownerId, payload = {}) {
  const normalizedOwnerId = normaliseOwnerId(ownerId);
  const normalizedDealId = normaliseDealId(payload.dealId);
  if (!payload.dueAt) {
    throw new ValidationError('dueAt is required to schedule a follow-up.');
  }

  return sequelize.transaction(async (transaction) => {
    const deal = await PipelineDeal.findOne({
      where: { id: normalizedDealId, ownerId: normalizedOwnerId, ownerType: 'freelancer' },
      transaction,
    });
    if (!deal) {
      throw new ValidationError('Cannot attach a follow-up to a deal outside your pipeline.');
    }

    const followUp = await PipelineFollowUp.create(
      {
        dealId: deal.id,
        ownerId: normalizedOwnerId,
        ownerType: 'freelancer',
        dueAt: payload.dueAt,
        completedAt: payload.completedAt ?? null,
        channel: payload.channel ?? null,
        note: payload.note ?? null,
        status: payload.status ?? 'scheduled',
      },
      { transaction },
    );

    await deal.update({ nextFollowUpAt: payload.status === 'completed' ? null : payload.dueAt }, { transaction });

    return sanitizeFollowUp(followUp);
  });
}

export async function updatePipelineFollowUp(ownerId, followUpId, payload = {}) {
  const normalizedOwnerId = normaliseOwnerId(ownerId);
  const normalizedFollowUpId = normaliseFollowUpId(followUpId);

  return sequelize.transaction(async (transaction) => {
    const followUp = await PipelineFollowUp.findOne({
      where: { id: normalizedFollowUpId, ownerId: normalizedOwnerId, ownerType: 'freelancer' },
      transaction,
    });
    if (!followUp) {
      throw new NotFoundError('Follow-up not found.');
    }

    const update = pickAllowedFields(payload, ['dueAt', 'completedAt', 'channel', 'note', 'status']);

    await followUp.update(update, { transaction });

    if (update.dueAt || update.status || update.completedAt) {
      const deal = await PipelineDeal.findByPk(followUp.dealId, { transaction });
      if (deal) {
        const nextPendingFollowUp = await PipelineFollowUp.findOne({
          where: {
            dealId: followUp.dealId,
            ownerId: normalizedOwnerId,
            ownerType: 'freelancer',
            status: 'scheduled',
            dueAt: { [Op.gte]: new Date() },
          },
          order: [['dueAt', 'ASC']],
          transaction,
        });
        await deal.update({ nextFollowUpAt: nextPendingFollowUp?.dueAt ?? null }, { transaction });
      }
    }

    return sanitizeFollowUp(followUp);
  });
}

export async function createPipelineCampaign(ownerId, payload = {}) {
  const normalizedOwnerId = normaliseOwnerId(ownerId);
  if (!payload.name || `${payload.name}`.trim() === '') {
    throw new ValidationError('Campaign name is required.');
  }

  const campaign = await PipelineCampaign.create({
    ownerId: normalizedOwnerId,
    ownerType: 'freelancer',
    name: payload.name,
    description: payload.description ?? null,
    targetService: payload.targetService ?? null,
    status: payload.status ?? 'draft',
    playbook: payload.playbook ?? null,
    metrics: payload.metrics ?? null,
    launchDate: payload.launchDate ?? null,
    endDate: payload.endDate ?? null,
  });

  return sanitizeCampaign(campaign);
}

export default {
  getFreelancerPipelineDashboard,
  createPipelineDeal,
  updatePipelineDeal,
  createPipelineProposal,
  createPipelineFollowUp,
  updatePipelineFollowUp,
  createPipelineCampaign,
};
