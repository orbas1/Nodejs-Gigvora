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
  FreelancerProfile,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { getAdDashboardSnapshot } from './adService.js';

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const STALE_DEAL_THRESHOLD_DAYS = 21;
const FOLLOW_UP_LOOKAHEAD_DAYS = 14;
const ENTERPRISE_MAX_RECOMMENDATIONS = 6;

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

const PIPELINE_VIEW_DEFINITIONS = [
  {
    key: 'stage',
    label: 'Stage progression',
    description:
      'Kanban view of the funnel with stage-level totals, ideal for daily stand-ups and reviews.',
  },
  {
    key: 'industry',
    label: 'Industry segments',
    description:
      'Highlights which industries are driving the pipeline mix to inform targeting decisions.',
  },
  {
    key: 'retainer_size',
    label: 'Retainer tiers',
    description:
      'Segments deals by recurring value so teams can balance premium retainers and starter packages.',
  },
  {
    key: 'probability',
    label: 'Win probability bands',
    description:
      'Groups deals by forecast confidence to focus attention on commits, upside, and early opportunities.',
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

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function average(values, precision = 1) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(precision));
}

function median(values, precision = 1) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const result =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Number(result.toFixed(precision));
}

function safeDivide(numerator, denominator, precision = 3) {
  if (!denominator) return 0;
  return Number((numerator / denominator).toFixed(precision));
}

function daysBetween(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) {
    return null;
  }
  return (endDate.getTime() - startDate.getTime()) / MS_IN_DAY;
}

function dealDigest(deal) {
  return {
    id: deal.id,
    title: deal.title,
    clientName: deal.clientName,
    stage: deal.stage?.name ?? null,
    value: toNumber(deal.pipelineValue, 0),
    winProbability: toNumber(deal.winProbability ?? deal.stage?.winProbability ?? 0, 0),
    status: deal.status,
  };
}

function calculateSummaryMetrics(deals) {
  const summary = {
    totalDeals: deals.length,
    openDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    onHoldDeals: 0,
    pipelineValue: 0,
    weightedPipelineValue: 0,
    nextFollowUps: 0,
    wonPipelineValue: 0,
    lostPipelineValue: 0,
    openPipelineValue: 0,
  };

  const now = Date.now();
  const openDurations = [];
  const closedDurations = [];
  deals.forEach((deal) => {
    if (deal.status === 'won') summary.wonDeals += 1;
    if (deal.status === 'lost') summary.lostDeals += 1;
    if (deal.status === 'on_hold') summary.onHoldDeals += 1;
    if (deal.status === 'open' || deal.status === 'on_hold') summary.openDeals += 1;
    const value = toNumber(deal.pipelineValue, 0);
    summary.pipelineValue += value;
    const probability = Number(deal.winProbability ?? deal.stage?.winProbability ?? 0) || 0;
    summary.weightedPipelineValue += value * (probability / 100);

    if (deal.status === 'won') {
      summary.wonPipelineValue += value;
      const cycle = daysBetween(deal.createdAt, deal.closedAt ?? deal.updatedAt ?? null);
      if (cycle != null && Number.isFinite(cycle) && cycle >= 0) {
        closedDurations.push(cycle);
      }
    } else if (deal.status === 'lost') {
      summary.lostPipelineValue += value;
    } else if (deal.status === 'open' || deal.status === 'on_hold') {
      summary.openPipelineValue += value;
      const createdAt = parseDate(deal.createdAt);
      if (createdAt) {
        const duration = (now - createdAt.getTime()) / MS_IN_DAY;
        if (Number.isFinite(duration) && duration >= 0) {
          openDurations.push(duration);
        }
      }
    }

    const followUps = Array.isArray(deal.followUps) ? deal.followUps : [];
    const upcoming = followUps.some((followUp) => {
      if (!followUp.dueAt || followUp.status !== 'scheduled') return false;
      const dueTime = new Date(followUp.dueAt).getTime();
      return dueTime >= now && dueTime <= now + FOLLOW_UP_LOOKAHEAD_DAYS * MS_IN_DAY;
    });
    if (upcoming) summary.nextFollowUps += 1;
  });
  summary.averageDealSize = summary.totalDeals
    ? Number((summary.pipelineValue / summary.totalDeals).toFixed(2))
    : 0;
  const closedDeals = summary.wonDeals + summary.lostDeals;
  summary.winRate = closedDeals ? Number((summary.wonDeals / closedDeals).toFixed(3)) : 0;
  summary.lossRate = closedDeals ? Number((summary.lostDeals / closedDeals).toFixed(3)) : 0;
  summary.closedDealCycleAverageDays = average(closedDurations, 1);
  summary.closedDealCycleMedianDays = median(closedDurations, 1);
  summary.openDealAgeAverageDays = average(openDurations, 1);
  summary.openDealAgeMedianDays = median(openDurations, 1);
  summary.pipelineMomentum = summary.openDeals
    ? Number((summary.nextFollowUps / summary.openDeals).toFixed(3))
    : 0;
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
    totalValue: groupedDeals.reduce((sum, deal) => sum + toNumber(deal.pipelineValue, 0), 0),
    weightedValue: groupedDeals.reduce((sum, deal) => {
      const probability = toNumber(deal.winProbability ?? deal.stage?.winProbability ?? 0, 0);
      const value = toNumber(deal.pipelineValue, 0);
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
      totalValue: columnDeals.reduce((sum, deal) => sum + toNumber(deal.pipelineValue, 0), 0),
      weightedValue: columnDeals.reduce((sum, deal) => {
        const probability = toNumber(deal.winProbability ?? stage.winProbability ?? 0, 0);
        const value = toNumber(deal.pipelineValue, 0);
        return sum + value * (probability / 100);
      }, 0),
    };
  });
}

function calculateConversionRates(deals, summary = null) {
  const now = Date.now();
  const stats = {
    totalDeals: deals.length,
    closedDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    withProposals: 0,
    withSentProposals: 0,
    withAcceptedProposals: 0,
    inNegotiation: 0,
    withDiscoveryMomentum: 0,
    withActiveFollowUps: 0,
  };

  deals.forEach((deal) => {
    const proposals = Array.isArray(deal.proposals) ? deal.proposals : [];
    const followUps = Array.isArray(deal.followUps) ? deal.followUps : [];
    const stageName = `${deal.stage?.name ?? ''}`.toLowerCase();
    const probability = toNumber(deal.winProbability ?? deal.stage?.winProbability ?? 0, 0);

    if (deal.status === 'won') {
      stats.wonDeals += 1;
      stats.closedDeals += 1;
    } else if (deal.status === 'lost') {
      stats.lostDeals += 1;
      stats.closedDeals += 1;
    }

    if (proposals.length > 0) {
      stats.withProposals += 1;
    }
    if (
      proposals.some((proposal) => {
        const status = `${proposal.status ?? ''}`.toLowerCase();
        return status !== 'draft' && status !== 'archived';
      })
    ) {
      stats.withSentProposals += 1;
    }
    if (
      proposals.some((proposal) => {
        const status = `${proposal.status ?? ''}`.toLowerCase();
        return status === 'accepted' || Boolean(proposal.acceptedAt);
      })
    ) {
      stats.withAcceptedProposals += 1;
    }

    if (stageName.includes('negotiation') || probability >= 60) {
      stats.inNegotiation += 1;
    }
    if (stageName.includes('discovery') || probability >= 20) {
      stats.withDiscoveryMomentum += 1;
    }

    if (
      followUps.some((followUp) => {
        if (!followUp.dueAt || followUp.status !== 'scheduled') return false;
        const dueDate = parseDate(followUp.dueAt);
        return dueDate ? dueDate.getTime() >= now : false;
      })
    ) {
      stats.withActiveFollowUps += 1;
    }
  });

  const total = stats.totalDeals || 1;
  const sent = stats.withSentProposals || 0;

  return {
    winRate: summary?.winRate ?? safeDivide(stats.wonDeals, stats.closedDeals, 3),
    closeRate: safeDivide(stats.wonDeals, total, 3),
    lossRate: summary?.lossRate ?? safeDivide(stats.lostDeals, stats.closedDeals, 3),
    proposalCoverage: safeDivide(stats.withProposals, total, 3),
    proposalDeliveryRate: safeDivide(stats.withSentProposals, total, 3),
    proposalAcceptanceRate: sent ? safeDivide(stats.withAcceptedProposals, sent, 3) : 0,
    negotiationRate: safeDivide(stats.inNegotiation, total, 3),
    discoveryConversionRate: safeDivide(stats.withDiscoveryMomentum, total, 3),
    activeFollowUpRate: safeDivide(stats.withActiveFollowUps, total, 3),
  };
}

function calculateVelocityMetrics(deals) {
  const now = Date.now();
  const openDurations = [];
  const closedDurations = [];
  const followUpLags = [];
  let overdueDeals = 0;
  let overduePipelineValue = 0;
  let openCount = 0;

  deals.forEach((deal) => {
    const createdAt = parseDate(deal.createdAt);
    const expectedCloseDate = parseDate(deal.expectedCloseDate);
    const lastContactAt = parseDate(deal.lastContactAt);
    const nextFollowUpAt = parseDate(deal.nextFollowUpAt);
    const status = deal.status ?? 'open';
    const isOpen = status === 'open' || status === 'on_hold';

    if (isOpen) {
      openCount += 1;
      if (createdAt) {
        const duration = (now - createdAt.getTime()) / MS_IN_DAY;
        if (Number.isFinite(duration) && duration >= 0) {
          openDurations.push(duration);
        }
      }
      if (expectedCloseDate && expectedCloseDate.getTime() < now) {
        overdueDeals += 1;
        overduePipelineValue += toNumber(deal.pipelineValue, 0);
      }
      if (lastContactAt && nextFollowUpAt) {
        const lag = (nextFollowUpAt.getTime() - lastContactAt.getTime()) / MS_IN_DAY;
        if (Number.isFinite(lag) && lag >= 0) {
          followUpLags.push(lag);
        }
      }
    } else if (status === 'won' || status === 'lost') {
      if (createdAt) {
        const closedAt = parseDate(deal.closedAt ?? deal.updatedAt ?? null);
        if (closedAt) {
          const duration = (closedAt.getTime() - createdAt.getTime()) / MS_IN_DAY;
          if (Number.isFinite(duration) && duration >= 0) {
            closedDurations.push(duration);
          }
        }
      }
    }
  });

  return {
    averageOpenDays: average(openDurations, 1),
    medianOpenDays: median(openDurations, 1),
    averageClosedDays: average(closedDurations, 1),
    medianClosedDays: median(closedDurations, 1),
    overdueDeals,
    overduePipelineValue: Number(overduePipelineValue.toFixed(2)),
    overdueRatio: safeDivide(overdueDeals, openCount || 0, 3),
    averageFollowUpLagDays: average(followUpLags, 1),
  };
}

function buildForecastScenarios(deals) {
  let totalPipeline = 0;
  let weightedPipeline = 0;
  let bestCase = 0;
  let baseCase = 0;
  let worstCase = 0;
  let commitPipeline = 0;
  let upsidePipeline = 0;

  deals.forEach((deal) => {
    const value = toNumber(deal.pipelineValue, 0);
    const probability = toNumber(deal.winProbability ?? deal.stage?.winProbability ?? 0, 0);
    const status = deal.status ?? 'open';

    totalPipeline += value;
    weightedPipeline += value * (probability / 100);

    if (status === 'won') {
      bestCase += value;
      baseCase += value;
      worstCase += value;
      commitPipeline += value;
      return;
    }

    if (status === 'lost') {
      return;
    }

    bestCase += value;
    if (probability >= 70) {
      commitPipeline += value;
      baseCase += value * 0.9;
    } else if (probability >= 40) {
      upsidePipeline += value;
      baseCase += value * 0.6;
    } else {
      baseCase += value * (Math.max(probability, 15) / 100);
    }
  });

  const coverageBaseline = commitPipeline || baseCase || 1;
  const coverageRatio = Number((totalPipeline / coverageBaseline).toFixed(2));
  const weightedConfidence = bestCase
    ? Number((weightedPipeline / bestCase).toFixed(2))
    : 0;

  return {
    totalPipeline: Number(totalPipeline.toFixed(2)),
    weightedPipeline: Number(weightedPipeline.toFixed(2)),
    bestCase: Number(bestCase.toFixed(2)),
    baseCase: Number(baseCase.toFixed(2)),
    worstCase: Number(worstCase.toFixed(2)),
    commitPipeline: Number(commitPipeline.toFixed(2)),
    upsidePipeline: Number(upsidePipeline.toFixed(2)),
    coverageRatio,
    weightedConfidence,
  };
}

function formatPercent(value, precision = 0) {
  if (value == null || !Number.isFinite(value)) {
    return '0%';
  }
  return `${(value * 100).toFixed(precision)}%`;
}

function formatNumber(value, precision = 0) {
  if (value == null || !Number.isFinite(value)) {
    return '0';
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

function calculateTrend(current, previous) {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : 1;
  }
  return (currentValue - previousValue) / previousValue;
}

function calculateDealFlow(deals, { now = Date.now(), lookbackDays = 30 } = {}) {
  const lookbackWindowMs = lookbackDays * MS_IN_DAY;
  const periodEnd = now;
  const periodStart = periodEnd - lookbackWindowMs;
  const previousStart = periodStart - lookbackWindowMs;

  const createBucket = () => ({
    count: 0,
    value: 0,
    previousCount: 0,
    previousValue: 0,
    trend: 0,
    valueTrend: 0,
  });

  const flow = {
    lookbackDays,
    periodStart: new Date(periodStart).toISOString(),
    periodEnd: new Date(periodEnd).toISOString(),
    newDeals: createBucket(),
    wins: createBucket(),
    losses: createBucket(),
    momentumIndex: 0,
    previousMomentumIndex: 0,
    momentumTrend: 0,
    netNewPipelineValue: 0,
    productivityPace: 0,
  };

  deals.forEach((deal) => {
    const value = toNumber(deal.pipelineValue, 0);
    const createdAt = parseDate(deal.createdAt);
    const closedAt = parseDate(deal.closedAt ?? deal.updatedAt ?? null);

    if (createdAt) {
      const createdTime = createdAt.getTime();
      if (createdTime >= periodStart && createdTime <= periodEnd) {
        flow.newDeals.count += 1;
        flow.newDeals.value += value;
      } else if (createdTime >= previousStart && createdTime < periodStart) {
        flow.newDeals.previousCount += 1;
        flow.newDeals.previousValue += value;
      }
    }

    const status = deal.status ?? deal.stage?.statusCategory ?? null;
    if (closedAt && (status === 'won' || status === 'lost')) {
      const closedTime = closedAt.getTime();
      const bucket = status === 'won' ? flow.wins : flow.losses;
      if (closedTime >= periodStart && closedTime <= periodEnd) {
        bucket.count += 1;
        bucket.value += value;
      } else if (closedTime >= previousStart && closedTime < periodStart) {
        bucket.previousCount += 1;
        bucket.previousValue += value;
      }
    }
  });

  ['newDeals', 'wins', 'losses'].forEach((bucketName) => {
    const bucket = flow[bucketName];
    bucket.value = Number(bucket.value.toFixed(2));
    bucket.previousValue = Number(bucket.previousValue.toFixed(2));
    bucket.trend = Number(calculateTrend(bucket.count, bucket.previousCount).toFixed(3));
    bucket.valueTrend = Number(calculateTrend(bucket.value, bucket.previousValue).toFixed(3));
  });

  flow.netNewPipelineValue = Number(
    (flow.newDeals.value - flow.wins.value - flow.losses.value).toFixed(2),
  );
  flow.productivityPace = Number(
    ((flow.wins.value + flow.newDeals.value) / Math.max(lookbackDays, 1)).toFixed(2),
  );
  flow.momentumIndex = Number(
    ((flow.wins.count + flow.newDeals.count) / Math.max(lookbackDays, 1)).toFixed(3),
  );
  flow.previousMomentumIndex = Number(
    ((flow.wins.previousCount + flow.newDeals.previousCount) / Math.max(lookbackDays, 1)).toFixed(3),
  );
  flow.momentumTrend = Number(
    calculateTrend(flow.momentumIndex, flow.previousMomentumIndex).toFixed(3),
  );

  return flow;
}

function scorePipelineHealth({
  summary = {},
  conversionRates = {},
  velocity = {},
  forecast = {},
  risk = {},
  dealFlow = {},
}) {
  let score = 80;
  const drivers = [];

  const winRate = conversionRates.winRate ?? summary.winRate ?? 0;
  if (winRate >= 0.55) {
    score += 8;
    drivers.push({
      metric: 'winRate',
      impact: 'positive',
      weight: 8,
      detail: `Win rate ${formatPercent(winRate, 0)} is outperforming enterprise benchmarks.`,
    });
  } else if (winRate >= 0.4) {
    score += 3;
    drivers.push({
      metric: 'winRate',
      impact: 'positive',
      weight: 3,
      detail: `Win rate ${formatPercent(winRate, 0)} keeps conversions healthy.`,
    });
  } else if (winRate >= 0.3) {
    score -= 4;
    drivers.push({
      metric: 'winRate',
      impact: 'negative',
      weight: -4,
      detail: `Win rate ${formatPercent(winRate, 0)} trails the recommended range.`,
    });
  } else {
    score -= 12;
    drivers.push({
      metric: 'winRate',
      impact: 'negative',
      weight: -12,
      detail: `Win rate ${formatPercent(winRate, 0)} is critically low.`,
    });
  }

  const followUpRate = conversionRates.activeFollowUpRate ?? 0;
  if (followUpRate >= 0.7) {
    score += 5;
    drivers.push({
      metric: 'activeFollowUpRate',
      impact: 'positive',
      weight: 5,
      detail: `Active follow-up coverage at ${formatPercent(followUpRate, 0)} supports predictable velocity.`,
    });
  } else if (followUpRate < 0.4) {
    score -= 6;
    drivers.push({
      metric: 'activeFollowUpRate',
      impact: 'negative',
      weight: -6,
      detail: `Only ${formatPercent(followUpRate, 0)} of deals have upcoming follow-ups scheduled.`,
    });
  }

  const pipelineMomentum = summary.pipelineMomentum ?? 0;
  if (pipelineMomentum >= 0.7) {
    score += 5;
    drivers.push({
      metric: 'pipelineMomentum',
      impact: 'positive',
      weight: 5,
      detail: `Pipeline momentum ${formatPercent(pipelineMomentum, 0)} indicates disciplined next steps.`,
    });
  } else if (pipelineMomentum < 0.5) {
    score -= 5;
    drivers.push({
      metric: 'pipelineMomentum',
      impact: 'negative',
      weight: -5,
      detail: `Pipeline momentum ${formatPercent(pipelineMomentum, 0)} signals many deals lack near-term actions.`,
    });
  }

  const averageOpenDays = velocity.averageOpenDays ?? null;
  if (averageOpenDays != null) {
    if (averageOpenDays <= 45) {
      score += 3;
      drivers.push({
        metric: 'averageOpenDays',
        impact: 'positive',
        weight: 3,
        detail: `Open deals average ${formatNumber(averageOpenDays, 1)} days, keeping cycle times sharp.`,
      });
    } else if (averageOpenDays > 60) {
      score -= 7;
      drivers.push({
        metric: 'averageOpenDays',
        impact: 'negative',
        weight: -7,
        detail: `Open deals aging ${formatNumber(averageOpenDays, 1)} days slow down cash conversion.`,
      });
    }
  }

  const overdueRatio = velocity.overdueRatio ?? 0;
  if (overdueRatio > 0.2) {
    score -= 4;
    drivers.push({
      metric: 'overdueRatio',
      impact: 'negative',
      weight: -4,
      detail: `${formatPercent(overdueRatio, 0)} of open deals are past their expected close date.`,
    });
  }

  const coverage = forecast.coverageRatio ?? 0;
  if (coverage >= 3) {
    score += 4;
    drivers.push({
      metric: 'coverageRatio',
      impact: 'positive',
      weight: 4,
      detail: `Pipeline coverage at ${formatNumber(coverage, 2)}× provides strong runway for the commit target.`,
    });
  } else if (coverage < 2) {
    score -= 3;
    drivers.push({
      metric: 'coverageRatio',
      impact: 'negative',
      weight: -3,
      detail: `Pipeline coverage ${formatNumber(coverage, 2)}× is below the 3× best-practice threshold.`,
    });
  }

  const stalledDealCount = risk.stalledDealCount ?? 0;
  if (stalledDealCount > 0) {
    const penalty = Math.min(10, stalledDealCount * 3);
    score -= penalty;
    drivers.push({
      metric: 'stalledDealCount',
      impact: 'negative',
      weight: -penalty,
      detail: `${formatNumber(stalledDealCount, 0)} deals are stalled without recent contact.`,
    });
  }

  const newDealTrend = dealFlow.newDeals?.trend ?? 0;
  if (newDealTrend > 0) {
    score += 4;
    drivers.push({
      metric: 'newDealTrend',
      impact: 'positive',
      weight: 4,
      detail: 'New pipeline creation is accelerating versus the prior window.',
    });
  } else if (newDealTrend < 0) {
    score -= 4;
    drivers.push({
      metric: 'newDealTrend',
      impact: 'negative',
      weight: -4,
      detail: 'New deal creation slowed compared to the previous period.',
    });
  }

  const winsTrend = dealFlow.wins?.trend ?? 0;
  if (winsTrend > 0) {
    score += 3;
    drivers.push({
      metric: 'winsTrend',
      impact: 'positive',
      weight: 3,
      detail: 'Closed-won velocity improved over the prior window.',
    });
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = normalizedScore >= 80 ? 'strong' : normalizedScore >= 60 ? 'steady' : 'at_risk';
  const summaryText = `Pipeline health is ${status.replace('_', ' ')} at ${normalizedScore}/100 with ${formatPercent(
    winRate,
    0,
  )} win rate.`;

  return {
    score: normalizedScore,
    status,
    summary: summaryText,
    drivers,
  };
}

function buildExperienceUx({
  summary = {},
  conversionRates = {},
  velocity = {},
  forecast = {},
  risk = {},
  dealFlow = {},
  recommendations = [],
  health = {},
}) {
  const winRate = conversionRates.winRate ?? summary.winRate ?? 0;
  const followUpRate = conversionRates.activeFollowUpRate ?? 0;
  const coverage = forecast.coverageRatio ?? 0;

  const spotlights = [
    {
      title: 'Win rate',
      value: formatPercent(winRate, 0),
      metric: 'winRate',
      sentiment: winRate >= 0.5 ? 'positive' : winRate >= 0.35 ? 'neutral' : 'negative',
      detail: 'Closed-won ratio across closed deals in the pipeline.',
    },
    {
      title: 'Active follow-ups',
      value: formatPercent(followUpRate, 0),
      metric: 'activeFollowUpRate',
      sentiment: followUpRate >= 0.6 ? 'positive' : followUpRate >= 0.4 ? 'neutral' : 'negative',
      detail: 'Share of open deals with a scheduled touchpoint within the next two weeks.',
    },
    {
      title: `New pipeline (${dealFlow.lookbackDays ?? 30}d)`,
      value: `$${formatNumber(dealFlow.newDeals?.value ?? 0, 0)}`,
      metric: 'newDealsValue',
      sentiment: (dealFlow.newDeals?.trend ?? 0) >= 0 ? 'neutral' : 'negative',
      detail: 'Gross pipeline value created within the latest rolling window.',
      trend: formatPercent(Math.max(-1, Math.min(1, dealFlow.newDeals?.valueTrend ?? 0)), 0),
    },
    {
      title: 'Coverage ratio',
      value: `${formatNumber(coverage, 2)}×`,
      metric: 'coverageRatio',
      sentiment: coverage >= 3 ? 'positive' : coverage >= 2 ? 'neutral' : 'negative',
      detail: 'Total pipeline compared to the commit baseline.',
    },
  ].filter(Boolean);

  const topRecommendation = recommendations[0] ?? null;
  const momentum = summary.pipelineMomentum ?? 0;
  const winsValue = formatNumber(dealFlow.wins?.value ?? 0, 0);
  const winsCount = dealFlow.wins?.count ?? 0;
  const lookbackLabel = dealFlow.lookbackDays ?? 30;

  const narrativeParts = [
    health?.summary,
    `Won $${winsValue} across ${winsCount} deal${winsCount === 1 ? '' : 's'} in the last ${lookbackLabel}-day window.`,
    `Pipeline momentum is ${formatPercent(momentum, 0)} with $${formatNumber(
      risk.stalledPipelineValue ?? 0,
      0,
    )} stalled.`,
    topRecommendation
      ? `Focus: ${topRecommendation.title} — ${topRecommendation.description}`
      : null,
  ].filter(Boolean);

  const tone = health?.status === 'strong' ? 'celebratory' : health?.status === 'steady' ? 'encouraging' : 'coaching';

  return {
    healthStatus: health?.status ?? 'steady',
    healthScore: health?.score ?? 70,
    summary: health?.summary ?? 'Pipeline performance summary unavailable.',
    narrative: narrativeParts.join(' '),
    tone,
    persona: 'freelancer_enterprise',
    lookbackDays: lookbackLabel,
    momentumIndex: dealFlow.momentumIndex ?? 0,
    spotlights: spotlights.slice(0, 4),
    nextBestActions: recommendations.slice(0, 3).map((item) => ({
      title: item.title,
      description: item.description,
      priority: item.priority,
      metric: item.metric,
    })),
  };
}

function identifyPipelineRisks(deals) {
  const now = Date.now();
  const staleThreshold = STALE_DEAL_THRESHOLD_DAYS * MS_IN_DAY;

  const stalledDeals = [];
  const overdueFollowUps = [];
  const missingNextSteps = [];

  deals.forEach((deal) => {
    const status = deal.status ?? 'open';
    if (status !== 'open' && status !== 'on_hold') {
      return;
    }

    const lastContactAt = parseDate(deal.lastContactAt);
    if (!lastContactAt || now - lastContactAt.getTime() > staleThreshold) {
      stalledDeals.push({
        ...dealDigest(deal),
        lastContactAt: lastContactAt?.toISOString() ?? null,
      });
    }

    const followUps = Array.isArray(deal.followUps) ? deal.followUps : [];
    const overdue = followUps.find((followUp) => {
      if (!followUp.dueAt) return false;
      if (['completed', 'cancelled'].includes(followUp.status)) return false;
      const dueAt = parseDate(followUp.dueAt);
      return dueAt ? dueAt.getTime() < now : false;
    });
    if (overdue) {
      overdueFollowUps.push({ ...dealDigest(deal), dueAt: overdue.dueAt });
    }

    const hasScheduledFollowUp = followUps.some(
      (followUp) => followUp.status === 'scheduled' && parseDate(followUp.dueAt),
    );
    if (!deal.nextFollowUpAt && !hasScheduledFollowUp) {
      missingNextSteps.push(dealDigest(deal));
    }
  });

  const stalledValue = stalledDeals.reduce((sum, deal) => sum + toNumber(deal.value, 0), 0);
  const overdueValue = overdueFollowUps.reduce((sum, deal) => sum + toNumber(deal.value, 0), 0);

  return {
    stalledDealCount: stalledDeals.length,
    stalledDeals: stalledDeals.slice(0, 5),
    stalledPipelineValue: Number(stalledValue.toFixed(2)),
    overdueFollowUpCount: overdueFollowUps.length,
    overdueFollowUps: overdueFollowUps.slice(0, 5),
    overduePipelineValue: Number(overdueValue.toFixed(2)),
    missingNextStepCount: missingNextSteps.length,
    missingNextSteps: missingNextSteps.slice(0, 5),
  };
}

function buildEnterpriseRecommendations({ summary, conversionRates, velocity, forecast, risk }) {
  const recommendations = [];

  if ((conversionRates?.proposalCoverage ?? 0) < 0.6) {
    recommendations.push({
      title: 'Increase proposal coverage',
      description: `Only ${formatPercent(conversionRates?.proposalCoverage ?? 0)} of active deals have draft proposals. Standard enterprise teams target 65%+. Leverage templates or automation to cover more deals.`,
      priority: 'medium',
      metric: 'proposalCoverage',
    });
  }

  if ((conversionRates?.winRate ?? 0) < 0.3 && (conversionRates?.negotiationRate ?? 0) < 0.4) {
    recommendations.push({
      title: 'Strengthen late-stage conversion',
      description: `Win rate is ${formatPercent(conversionRates?.winRate ?? 0, 0)} with only ${formatPercent(conversionRates?.negotiationRate ?? 0, 0)} of deals reaching negotiation. Introduce executive sponsor reviews before proposal delivery.`,
      priority: 'high',
      metric: 'winRate',
    });
  }

  if ((velocity?.averageOpenDays ?? 0) > 45) {
    recommendations.push({
      title: 'Shorten deal cycle times',
      description: `Average open deal age is ${formatNumber(velocity?.averageOpenDays ?? 0, 1)} days. Introduce stage exit SLAs and weekly pipeline scrums to keep momentum.`,
      priority: 'high',
      metric: 'averageOpenDays',
    });
  }

  if ((risk?.stalledDealCount ?? 0) > 0) {
    recommendations.push({
      title: 'Re-engage stalled accounts',
      description: `${formatNumber(risk?.stalledPipelineValue ?? 0, 0)} in pipeline value is stalled past ${STALE_DEAL_THRESHOLD_DAYS} days without contact. Trigger an outreach sprint with executive messaging.`,
      priority: 'high',
      metric: 'stalledPipelineValue',
    });
  }

  if ((conversionRates?.activeFollowUpRate ?? 0) < 0.5) {
    recommendations.push({
      title: 'Automate follow-up cadences',
      description: `Only ${formatPercent(conversionRates?.activeFollowUpRate ?? 0)} of deals have an upcoming follow-up scheduled. Deploy sequenced reminders and shared cadences for coverage.`,
      priority: 'medium',
      metric: 'activeFollowUpRate',
    });
  }

  if ((forecast?.coverageRatio ?? 0) < 2) {
    recommendations.push({
      title: 'Expand early-stage pipeline',
      description: `Pipeline coverage is ${formatNumber(forecast?.coverageRatio ?? 0, 2)}× of commit. Layer top-of-funnel campaigns or partnerships to reach a 3× coverage benchmark.`,
      priority: 'medium',
      metric: 'coverageRatio',
    });
  }

  if ((summary?.pipelineMomentum ?? 0) < 0.6) {
    recommendations.push({
      title: 'Reinforce manager coaching rhythm',
      description: `Only ${formatPercent(summary?.pipelineMomentum ?? 0)} of open deals have next actions within two weeks. Use deal review scorecards and shared notes to boost accountability.`,
      priority: 'medium',
      metric: 'pipelineMomentum',
    });
  }

  return recommendations.slice(0, ENTERPRISE_MAX_RECOMMENDATIONS);
}

function buildEnterpriseInsights({ deals, summary }) {
  const conversionRates = calculateConversionRates(deals, summary);
  const velocity = calculateVelocityMetrics(deals);
  const forecast = buildForecastScenarios(deals);
  const risk = identifyPipelineRisks(deals);
  const dealFlow = calculateDealFlow(deals);
  const recommendations = buildEnterpriseRecommendations({
    summary,
    conversionRates,
    velocity,
    forecast,
    risk,
  });
  const health = scorePipelineHealth({
    summary,
    conversionRates,
    velocity,
    forecast,
    risk,
    dealFlow,
  });
  const experience = buildExperienceUx({
    summary,
    conversionRates,
    velocity,
    forecast,
    risk,
    dealFlow,
    recommendations,
    health,
  });

  return {
    conversionRates,
    velocity,
    forecast,
    risk,
    dealFlow,
    health,
    experience,
    recommendations,
  };
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

  const freelancerProfile = await FreelancerProfile.findOne({
    where: { userId: normalizedOwnerId },
    attributes: ['id', 'title', 'availability'],
  });

  const summary = calculateSummaryMetrics(context.deals);
  const enterprise = buildEnterpriseInsights({ deals: context.deals, summary });
  const viewOptions = PIPELINE_VIEW_DEFINITIONS.map((definition) => definition.key);
  const viewDefinitions = PIPELINE_VIEW_DEFINITIONS;
  const activeView = viewOptions.includes(view) ? view : 'stage';

  const grouping = activeView === 'stage' ? buildKanbanView(context.stages, context.deals) : groupDealsBy(context.deals, activeView);

  const keywordHints = new Set(
    [
      ...context.stages.map((stage) => stage.name),
      ...context.deals.flatMap((deal) => {
        const tags = Array.isArray(deal.tags) ? deal.tags : [];
        return [deal.industry, deal.status, ...tags];
      }),
      ...context.campaigns.map((campaign) => campaign.targetService),
      ...context.templates.map((template) => template.name),
      freelancerProfile?.title,
      freelancerProfile?.availability,
    ]
      .flat()
      .filter(Boolean)
      .map((value) => `${value}`.trim())
      .filter(Boolean),
  );

  const opportunityTargets = [];
  if (freelancerProfile?.id) {
    opportunityTargets.push({ targetType: 'freelance', ids: [freelancerProfile.id] });
  }

  const ads = await getAdDashboardSnapshot({
    surfaces: ['pipeline_dashboard', 'freelancer_dashboard'],
    context: {
      keywordHints: Array.from(keywordHints),
      opportunityTargets,
    },
  });

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
    viewDefinitions,
    ads,
    enterprise,
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

export const __internals = {
  calculateSummaryMetrics,
  calculateConversionRates,
  calculateVelocityMetrics,
  buildForecastScenarios,
  identifyPipelineRisks,
  buildEnterpriseRecommendations,
  buildEnterpriseInsights,
  calculateDealFlow,
  scorePipelineHealth,
  buildExperienceUx,
  calculateTrend,
  groupDealsBy,
  buildKanbanView,
};
