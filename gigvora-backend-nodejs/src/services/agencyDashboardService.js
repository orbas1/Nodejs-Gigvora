import { Op } from 'sequelize';
import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderWorkspaceInvite,
  ProviderContactNote,
  Project,
  AutoAssignQueueEntry,
  ProjectAssignmentEvent,
  EscrowTransaction,
  AgencyProfile,
  Profile,
  Gig,
  Job,
  User,
  ExecutiveIntelligenceMetric,
  ExecutiveScenarioPlan,
  ExecutiveScenarioBreakdown,
  GovernanceRiskRegister,
  GovernanceAuditExport,
  LeadershipRitual,
  LeadershipOkr,
  LeadershipDecision,
  LeadershipBriefingPack,
  LeadershipStrategicBet,
  InnovationInitiative,
  InnovationFundingEvent,
  CollaborationSpace,
  ComplianceDocument,
  ComplianceObligation,
  ComplianceReminder,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { NotFoundError } from '../utils/errors.js';

const ACTIVE_MEMBER_STATUSES = ['active'];
const PROJECT_STATUS_BUCKETS = {
  active: ['active', 'in_progress', 'delivery', 'executing'],
  planning: ['draft', 'planning', 'scoping', 'proposal'],
  atRisk: ['delayed', 'blocked', 'on_hold', 'at_risk'],
  completed: ['completed', 'closed', 'archived'],
};

function sanitizeWorkspaceRecord(workspace) {
  if (!workspace) return null;
  const plain = workspace.get({ plain: true });
  return {
    id: plain.id,
    ownerId: plain.ownerId,
    name: plain.name,
    slug: plain.slug,
    type: plain.type,
    timezone: plain.timezone,
    defaultCurrency: plain.defaultCurrency,
    intakeEmail: plain.intakeEmail,
    isActive: plain.isActive,
    settings: plain.settings ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function toPlain(instance) {
  if (!instance) return null;
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  return instance.get ? instance.get({ plain: true }) : instance;
}

function normaliseNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function sumNumbers(values) {
  return values.reduce((total, value) => total + normaliseNumber(value, 0), 0);
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return sumNumbers(values) / values.length;
}

function bucketiseProjectStatus(status) {
  if (!status) return 'unspecified';
  const normalised = String(status).toLowerCase();
  for (const [bucket, statuses] of Object.entries(PROJECT_STATUS_BUCKETS)) {
    if (statuses.includes(normalised)) {
      return bucket;
    }
  }
  return normalised;
}

function formatMember(member, profileMap) {
  const plain = toPlain(member);
  const userProfile = profileMap.get(plain.userId) ?? null;
  const user = member.member ? member.member.get({ plain: true }) : null;

  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    userId: plain.userId,
    role: plain.role,
    status: plain.status,
    invitedById: plain.invitedById,
    joinedAt: plain.joinedAt,
    lastActiveAt: plain.lastActiveAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    user: user
      ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }
      : null,
    availability: userProfile
      ? {
          status: userProfile.availabilityStatus ?? 'limited',
          availableHoursPerWeek: normaliseNumber(userProfile.availableHoursPerWeek, null),
        }
      : { status: 'unknown', availableHoursPerWeek: null },
  };
}

function buildMembersSummary(members, invites) {
  const totalMembers = members.length;
  const activeMembers = members.filter((member) => ACTIVE_MEMBER_STATUSES.includes(member.status)).length;
  const benchMembers = members.filter((member) => member.availability.status === 'available').length;
  const capacitySamples = members
    .map((member) => member.availability.availableHoursPerWeek)
    .filter((hours) => Number.isFinite(hours) && hours > 0);

  const utilisationDenominator = activeMembers || members.length || 1;
  const engagedMembers = members.filter((member) => ['limited', 'unavailable', 'on_leave'].includes(member.availability.status))
    .length;

  return {
    total: totalMembers,
    active: activeMembers,
    bench: benchMembers,
    pendingInvites: invites.filter((invite) => invite.status === 'pending').length,
    utilizationRate: utilisationDenominator ? Math.round((engagedMembers / utilisationDenominator) * 1000) / 10 : 0,
    averageWeeklyCapacity: capacitySamples.length
      ? Math.round((average(capacitySamples) + Number.EPSILON) * 10) / 10
      : 0,
  };
}

function aggregateProjects(projects) {
  const statusCounts = {};
  const bucketCounts = { active: 0, planning: 0, atRisk: 0, completed: 0 };
  const budgets = [];
  let autoAssignEnabled = 0;
  let autoAssignQueueSize = 0;

  projects.forEach((project) => {
    const normalisedStatus = bucketiseProjectStatus(project.status);
    statusCounts[normalisedStatus] = (statusCounts[normalisedStatus] ?? 0) + 1;

    if (bucketCounts[normalisedStatus] !== undefined) {
      bucketCounts[normalisedStatus] += 1;
    }

    if (project.budgetAmount != null) {
      budgets.push(normaliseNumber(project.budgetAmount));
    }

    if (project.autoAssignEnabled) {
      autoAssignEnabled += 1;
      autoAssignQueueSize += normaliseNumber(project.autoAssignLastQueueSize);
    }
  });

  const totalBudget = sumNumbers(budgets);

  return {
    total: projects.length,
    buckets: bucketCounts,
    statuses: statusCounts,
    totalBudget,
    averageBudget: budgets.length ? totalBudget / budgets.length : 0,
    autoAssignEnabled,
    autoAssignQueueSize,
  };
}

function aggregateQueueEntries(entries, freelancerMap) {
  const statusCounts = {};
  const groupedByFreelancer = new Map();

  entries.forEach((entry) => {
    statusCounts[entry.status] = (statusCounts[entry.status] ?? 0) + 1;
    if (!groupedByFreelancer.has(entry.freelancerId)) {
      groupedByFreelancer.set(entry.freelancerId, []);
    }
    groupedByFreelancer.get(entry.freelancerId).push(entry);
  });

  const ranked = Array.from(groupedByFreelancer.entries())
    .map(([freelancerId, items]) => {
      const topScore = Math.max(...items.map((item) => normaliseNumber(item.score)));
      const pendingCount = items.filter((item) => item.status === 'pending').length;
      const acceptedCount = items.filter((item) => item.status === 'accepted').length;
      const freelancer = freelancerMap.get(freelancerId) ?? null;
      return {
        freelancerId,
        pendingCount,
        acceptedCount,
        topScore,
        freelancer: freelancer
          ? {
              id: freelancer.id,
              firstName: freelancer.firstName,
              lastName: freelancer.lastName,
              email: freelancer.email,
            }
          : null,
      };
    })
    .sort((a, b) => b.topScore - a.topScore)
    .slice(0, 5);

  return {
    statuses: statusCounts,
    topCandidates: ranked,
  };
}

function aggregateFinancials(transactions) {
  let inEscrow = 0;
  let released = 0;
  let outstanding = 0;
  let latestCurrency = 'USD';

  transactions.forEach((transaction) => {
    latestCurrency = transaction.currencyCode ?? latestCurrency;
    const amount = normaliseNumber(transaction.amount);
    switch (transaction.status) {
      case 'released':
        released += amount;
        break;
      case 'refunded':
      case 'cancelled':
        break;
      default:
        if (transaction.status === 'in_escrow' || transaction.status === 'funded') {
          inEscrow += amount;
        }
        if (transaction.status !== 'released') {
          outstanding += amount;
        }
        break;
    }
  });

  return {
    inEscrow,
    released,
    outstanding,
    currency: latestCurrency,
  };
}

function slugifyKey(value) {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function mapExecutiveMetric(metric) {
  const plain = toPlain(metric) ?? {};
  const metadata = typeof plain.metadata === 'object' && plain.metadata !== null ? plain.metadata : {};
  const metricKey = metadata.metricKey ?? slugifyKey(plain.name ?? plain.id ?? 'metric');

  return {
    id: plain.id,
    metricKey,
    name: plain.name,
    category: plain.category,
    description: plain.description,
    value: normaliseNumber(plain.value, 0),
    unit: plain.unit ?? 'count',
    changeValue: plain.changeValue == null ? null : normaliseNumber(plain.changeValue, 0),
    changeUnit: plain.changeUnit ?? plain.unit ?? 'count',
    trend: plain.trend ?? 'steady',
    comparisonPeriod: plain.comparisonPeriod ?? null,
    reportedAt: plain.reportedAt ?? null,
    metadata,
  };
}

function buildAnalyticsWarRoom(metrics = []) {
  const scorecards = metrics.map((metric) => mapExecutiveMetric(metric));
  const summaryKeys = [
    'revenue_run_rate',
    'gross_margin',
    'utilization_rate',
    'pipeline_velocity',
    'client_satisfaction',
    'policy_adherence',
  ];
  const metricsByKey = new Map(scorecards.map((item) => [item.metricKey, item]));
  const grouped = scorecards.reduce((accumulator, metric) => {
    const key = metric.category ?? 'other';
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(metric);
    return accumulator;
  }, {});

  const summary = {
    revenueRunRate: metricsByKey.get('revenue_run_rate') ?? null,
    grossMargin: metricsByKey.get('gross_margin') ?? null,
    utilization: metricsByKey.get('utilization_rate') ?? null,
    pipelineVelocity: metricsByKey.get('pipeline_velocity') ?? null,
    clientSatisfaction: metricsByKey.get('client_satisfaction') ?? null,
    policyAdherence: metricsByKey.get('policy_adherence') ?? null,
  };

  return {
    summary,
    scorecards,
    grouped,
    availableKeys: summaryKeys.filter((key) => metricsByKey.has(key)),
  };
}

function buildScenarioExplorer(plans = [], breakdowns = []) {
  const planItems = plans.map((plan) => toPlain(plan));
  const scenarioById = new Map(planItems.map((plan) => [plan.id, plan.scenarioType]));
  const scenarios = {};

  planItems.forEach((plan) => {
    scenarios[plan.scenarioType ?? `scenario_${plan.id}`] = {
      id: plan.id,
      label: plan.label,
      timeframeStart: plan.timeframeStart,
      timeframeEnd: plan.timeframeEnd,
      metrics: {
        revenue: normaliseNumber(plan.revenue, 0),
        grossMargin: normaliseNumber(plan.grossMargin, 0),
        utilization: normaliseNumber(plan.utilization, 0),
        pipelineVelocity: normaliseNumber(plan.pipelineVelocity, 0),
        clientSatisfaction: normaliseNumber(plan.clientSatisfaction, 0),
        netRetention: plan.netRetention == null ? null : normaliseNumber(plan.netRetention, 0),
      },
      notes: plan.notes ?? null,
      assumptions: plan.assumptions ?? null,
    };
  });

  const buckets = {
    clients: [],
    serviceLines: [],
    squads: [],
    individuals: [],
  };

  breakdowns.forEach((entry) => {
    const plain = toPlain(entry);
    const scenarioType = scenarioById.get(plain.scenarioId) ?? 'base';
    const bucketKey =
      plain.dimensionType === 'service_line'
        ? 'serviceLines'
        : `${plain.dimensionType ?? 'other'}${plain.dimensionType && plain.dimensionType.endsWith('s') ? '' : 's'}`;

    if (!buckets[bucketKey]) {
      buckets[bucketKey] = [];
    }

    buckets[bucketKey].push({
      scenarioType,
      dimensionKey: plain.dimensionKey,
      label: plain.dimensionLabel,
      metrics: {
        revenue: normaliseNumber(plain.revenue, 0),
        grossMargin: normaliseNumber(plain.grossMargin, 0),
        utilization: normaliseNumber(plain.utilization, 0),
        pipelineVelocity: normaliseNumber(plain.pipelineVelocity, 0),
        clientSatisfaction: normaliseNumber(plain.clientSatisfaction, 0),
      },
      owner: plain.owner ?? null,
      highlight: plain.highlight ?? null,
    });
  });

  return {
    scenarios,
    breakdowns: buckets,
  };
}

function buildGovernanceDesk(documents = [], obligations = [], reminders = [], risks = [], audits = []) {
  const policyItems = documents.map((document) => toPlain(document));
  const policyById = new Map(policyItems.map((policy) => [policy.id, policy]));

  const obligationItems = obligations.map((obligation) => {
    const plain = toPlain(obligation);
    const policy = policyById.get(plain.documentId) ?? null;
    return {
      id: plain.id,
      documentId: plain.documentId,
      clauseReference: plain.clauseReference,
      description: plain.description,
      status: plain.status,
      dueAt: plain.dueAt,
      priority: plain.priority ?? null,
      metadata: plain.metadata ?? null,
      document: policy
        ? {
            id: policy.id,
            title: policy.title,
            status: policy.status,
            documentType: policy.documentType,
            expiryDate: policy.expiryDate,
          }
        : null,
    };
  });

  const reminderItems = reminders.map((reminder) => {
    const plain = toPlain(reminder);
    const policy = policyById.get(plain.documentId) ?? null;
    return {
      id: plain.id,
      documentId: plain.documentId,
      reminderType: plain.reminderType,
      status: plain.status,
      sendAt: plain.sendAt,
      payload: plain.payload ?? null,
      metadata: plain.metadata ?? null,
      document: policy ? { id: policy.id, title: policy.title, documentType: policy.documentType } : null,
    };
  });

  const policySummaries = policyItems.map((policy) => {
    const relatedObligations = obligationItems.filter((obligation) => obligation.documentId === policy.id);
    return {
      id: policy.id,
      title: policy.title,
      documentType: policy.documentType,
      status: policy.status,
      effectiveDate: policy.effectiveDate,
      expiryDate: policy.expiryDate,
      renewalTerms: policy.renewalTerms,
      counterpartyName: policy.counterpartyName,
      tags: Array.isArray(policy.tags) ? policy.tags : [],
      nextReviewAt: relatedObligations
        .map((obligation) => obligation.dueAt)
        .filter(Boolean)
        .sort()[0] ?? null,
    };
  });

  return {
    policies: policySummaries,
    obligations: obligationItems,
    reminders: reminderItems,
    risks: risks.map((risk) => toPlain(risk)),
    audits: audits.map((audit) => toPlain(audit)),
  };
}

function buildLeadershipHub({ rituals = [], okrs = [], decisions = [], briefings = [], bets = [], rooms = [], projects = [] }) {
  const projectLookup = new Map(projects.map((project) => [project.id, project]));
  const collaborationRooms = rooms
    .map((room) => toPlain(room))
    .filter((room) => {
      if (!room) return false;
      const metadata = typeof room.metadata === 'object' && room.metadata !== null ? room.metadata : {};
      if (metadata.useCase && String(metadata.useCase).includes('leadership')) {
        return true;
      }
      return /leadership|governance|compliance/i.test(room.name ?? '') || /command/i.test(room.summary ?? '');
    })
    .map((room) => ({
      id: room.id,
      name: room.name,
      summary: room.summary,
      status: room.status,
      meetingCadence: room.meetingCadence,
      metadata: room.metadata ?? null,
      updatedAt: room.updatedAt ?? null,
    }));

  const strategicBets = bets.map((bet) => {
    const plain = toPlain(bet);
    const project = plain.projectId ? projectLookup.get(plain.projectId) ?? null : null;
    return {
      ...plain,
      project,
    };
  });

  return {
    rituals: rituals.map((ritual) => toPlain(ritual)),
    okrs: okrs.map((okr) => toPlain(okr)),
    decisions: decisions.map((decision) => toPlain(decision)),
    briefings: briefings.map((briefing) => toPlain(briefing)),
    strategicBets,
    collaborationRooms,
  };
}

function buildInnovationLab({ initiatives = [], fundingEvents = [] }) {
  const initiativeItems = initiatives.map((initiative) => toPlain(initiative));
  const fundingItems = fundingEvents.map((event) => toPlain(event));

  const totals = fundingItems.reduce(
    (accumulator, event) => {
      const type = event.eventType ?? 'allocation';
      const amount = normaliseNumber(event.amount, 0);
      accumulator[type] = (accumulator[type] ?? 0) + amount;
      return accumulator;
    },
    { allocation: 0, burn: 0, return: 0 },
  );

  return {
    initiatives: initiativeItems,
    funding: {
      summary: {
        allocated: totals.allocation ?? 0,
        spent: totals.burn ?? 0,
        returned: totals.return ?? 0,
        balance: (totals.allocation ?? 0) - (totals.burn ?? 0),
      },
      events: fundingItems,
    },
  };
}

function filterProjectsForWorkspace(projects, workspace) {
  if (!workspace) {
    return { projects, scope: 'global' };
  }

  const scoped = projects.filter((project) => {
    const settings = project.autoAssignSettings ?? {};
    if (settings.workspaceId && Number(settings.workspaceId) === workspace.id) {
      return true;
    }
    if (settings.workspaceSlug && settings.workspaceSlug === workspace.slug) {
      return true;
    }
    if (settings.workspace && Number(settings.workspace?.id) === workspace.id) {
      return true;
    }
    if (settings.metadata?.workspaceId && Number(settings.metadata.workspaceId) === workspace.id) {
      return true;
    }
    return false;
  });

  if (scoped.length) {
    return { projects: scoped, scope: 'workspace' };
  }

  return { projects, scope: 'global_fallback' };
}

export async function getAgencyDashboard({ workspaceId, workspaceSlug, lookbackDays = 90 } = {}) {
  const parsedLookback = Number.isFinite(Number(lookbackDays)) && Number(lookbackDays) > 0 ? Number(lookbackDays) : 90;

  let workspace = null;
  if (workspaceId || workspaceSlug) {
    const where = {};
    if (workspaceId) where.id = workspaceId;
    if (workspaceSlug) where.slug = workspaceSlug;
    workspace = await ProviderWorkspace.findOne({ where });
    if (!workspace) {
      throw new NotFoundError('Agency workspace not found.');
    }
  }

  if (!workspace) {
    workspace = await ProviderWorkspace.findOne({ where: { type: 'agency' }, order: [['createdAt', 'ASC']] });
  }

  const cacheKey = buildCacheKey('agency:dashboard', {
    workspace: workspace ? workspace.id : 'none',
    lookbackDays: parsedLookback,
  });

  return appCache.remember(cacheKey, 60, async () => {
    const now = new Date();
    const lookbackDate = new Date(now.getTime() - parsedLookback * 24 * 60 * 60 * 1000);

    const workspaceIdFilter = workspace ? workspace.id : null;

    let memberRows = [];
    let inviteRows = [];
    let noteRows = [];

    if (workspaceIdFilter) {
      [memberRows, inviteRows, noteRows] = await Promise.all([
        ProviderWorkspaceMember.findAll({
          where: { workspaceId: workspaceIdFilter },
          include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          order: [['role', 'ASC']],
        }),
        ProviderWorkspaceInvite.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['createdAt', 'DESC']],
        }),
        ProviderContactNote.findAll({
          where: { workspaceId: workspaceIdFilter },
          include: [
            { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] },
            { model: User, as: 'subject', attributes: ['id', 'firstName', 'lastName', 'email'] },
          ],
          order: [['createdAt', 'DESC']],
          limit: 10,
        }),
      ]);
    }

    const profileRows = workspaceIdFilter && memberRows.length
      ? await Profile.findAll({ where: { userId: { [Op.in]: memberRows.map((member) => member.userId) } } })
      : [];

    const [projectRows, gigRows, jobRows, agencyProfile] = await Promise.all([
      Project.findAll({ order: [['updatedAt', 'DESC']] }),
      Gig.findAll({ order: [['createdAt', 'DESC']], limit: 10 }),
      Job.findAll({ order: [['createdAt', 'DESC']], limit: 10 }),
      workspace && workspace.ownerId
        ? AgencyProfile.findOne({ where: { userId: workspace.ownerId } })
        : null,
    ]);

    const profilesByUserId = new Map(profileRows.map((profile) => [profile.userId, profile.get({ plain: true })]));

    const formattedMembers = memberRows.map((member) => formatMember(member, profilesByUserId));
    const formattedInvites = inviteRows.map((invite) => toPlain(invite));
    const formattedNotes = noteRows.map((note) => toPlain(note));

    const projectPlain = projectRows.map((project) => project.toPublicObject());
    const { projects: scopedProjects, scope } = filterProjectsForWorkspace(projectPlain, workspaceIdFilter ? workspace : null);

    const projectIds = scopedProjects.map((project) => project.id);

    const [queueRows, eventRows, escrowRows, gigTransactions] = await Promise.all([
      projectIds.length
        ? AutoAssignQueueEntry.findAll({
            where: {
              targetType: 'project',
              targetId: { [Op.in]: projectIds },
              createdAt: { [Op.gte]: lookbackDate },
            },
            order: [['createdAt', 'DESC']],
          })
        : [],
      projectIds.length
        ? ProjectAssignmentEvent.findAll({
            where: { projectId: { [Op.in]: projectIds }, createdAt: { [Op.gte]: lookbackDate } },
            include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName'] }],
            order: [['createdAt', 'DESC']],
            limit: 20,
          })
        : [],
      projectIds.length
        ? EscrowTransaction.findAll({
            where: {
              projectId: { [Op.in]: projectIds },
              createdAt: { [Op.gte]: lookbackDate },
            },
            order: [['createdAt', 'DESC']],
          })
        : [],
      workspaceIdFilter
        ? EscrowTransaction.findAll({
            where: {
              gigId: { [Op.not]: null },
              createdAt: { [Op.gte]: lookbackDate },
            },
            order: [['createdAt', 'DESC']],
            limit: 20,
          })
        : [],
    ]);

    const freelancerIds = [...new Set(queueRows.map((entry) => entry.freelancerId))];
    const freelancerRecords = freelancerIds.length
      ? await User.findAll({ where: { id: { [Op.in]: freelancerIds } }, attributes: ['id', 'firstName', 'lastName', 'email'] })
      : [];
    const freelancerMap = new Map(freelancerRecords.map((freelancer) => [freelancer.id, freelancer.get({ plain: true })]));

    const queueEntries = queueRows.map((entry) => entry.toPublicObject());
    const queueSummary = aggregateQueueEntries(queueEntries, freelancerMap);

    const projectSummary = aggregateProjects(scopedProjects);
    const membersSummary = buildMembersSummary(formattedMembers, formattedInvites);
    const financialSummary = aggregateFinancials(escrowRows.map((row) => row.toPublicObject()));

    const agencyProfilePlain = agencyProfile ? agencyProfile.get({ plain: true }) : null;

    const formattedProjects = scopedProjects.map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      budgetAmount: project.budgetAmount,
      budgetCurrency: project.budgetCurrency,
      autoAssignEnabled: project.autoAssignEnabled,
      autoAssignStatus: project.autoAssignStatus,
      updatedAt: project.updatedAt,
      createdAt: project.createdAt,
    }));

    const formattedEvents = eventRows.map((event) => {
      const plain = event.toPublicObject();
      const actor = event.actor ? event.actor.get({ plain: true }) : null;
      return {
        ...plain,
        actor: actor
          ? {
              id: actor.id,
              firstName: actor.firstName,
              lastName: actor.lastName,
            }
          : null,
      };
    });

    const gigSummaries = gigRows.map((gig) => toPlain(gig));
    const jobSummaries = jobRows.map((job) => toPlain(job));

    const totalClients = new Set(formattedNotes.map((note) => note.subjectUserId)).size;

    const targetWorkspaceId = workspace ? workspace.id : null;

    let executiveMetricsPlain = [];
    let scenarioPlansPlain = [];
    let scenarioBreakdownsPlain = [];
    let governanceRisksPlain = [];
    let governanceAuditsPlain = [];
    let leadershipRitualsPlain = [];
    let leadershipOkrsPlain = [];
    let leadershipDecisionsPlain = [];
    let leadershipBriefingsPlain = [];
    let leadershipBetsPlain = [];
    let innovationInitiativesPlain = [];
    let innovationFundingPlain = [];
    let leadershipRoomsPlain = [];
    let complianceDocumentsPlain = [];
    let complianceObligationsPlain = [];
    let complianceRemindersPlain = [];

    if (targetWorkspaceId) {
      const [
        executiveMetricRows,
        scenarioPlanRows,
        governanceRiskRows,
        auditRows,
        leadershipRitualRows,
        leadershipOkrRows,
        leadershipDecisionRows,
        leadershipBriefingRows,
        leadershipBetRows,
        innovationInitiativeRows,
        innovationFundingRows,
        leadershipRooms,
        complianceDocRows,
      ] = await Promise.all([
        ExecutiveIntelligenceMetric.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['reportedAt', 'DESC']],
          limit: 32,
        }),
        ExecutiveScenarioPlan.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['timeframeEnd', 'DESC']],
        }),
        GovernanceRiskRegister.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['impactScore', 'DESC']],
          limit: 20,
        }),
        GovernanceAuditExport.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['generatedAt', 'DESC']],
          limit: 10,
        }),
        LeadershipRitual.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['nextSessionAt', 'ASC']],
          limit: 12,
        }),
        LeadershipOkr.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['targetDate', 'ASC']],
          limit: 12,
        }),
        LeadershipDecision.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['decidedAt', 'DESC']],
          limit: 15,
        }),
        LeadershipBriefingPack.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['distributionDate', 'DESC']],
          limit: 10,
        }),
        LeadershipStrategicBet.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['lastReviewedAt', 'DESC']],
          limit: 12,
        }),
        InnovationInitiative.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['priorityScore', 'DESC']],
          limit: 15,
        }),
        InnovationFundingEvent.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [['recordedAt', 'DESC']],
          limit: 20,
        }),
        CollaborationSpace.findAll({
          where: { ownerId: workspace.ownerId },
          order: [['updatedAt', 'DESC']],
          limit: 8,
        }),
        ComplianceDocument.findAll({
          where: { workspaceId: targetWorkspaceId },
          order: [
            ['status', 'ASC'],
            ['expiryDate', 'ASC'],
          ],
          limit: 20,
        }),
      ]);

      const scenarioIds = scenarioPlanRows.map((plan) => plan.id);
      const docIds = complianceDocRows.map((doc) => doc.id);

      const [scenarioBreakdownRows, obligationsRows, reminderRows] = await Promise.all([
        scenarioIds.length
          ? ExecutiveScenarioBreakdown.findAll({
              where: { scenarioId: { [Op.in]: scenarioIds } },
              order: [
                ['dimensionType', 'ASC'],
                ['revenue', 'DESC'],
              ],
              limit: 60,
            })
          : [],
        docIds.length
          ? ComplianceObligation.findAll({
              where: { documentId: { [Op.in]: docIds } },
              order: [['dueAt', 'ASC']],
            })
          : [],
        docIds.length
          ? ComplianceReminder.findAll({
              where: { documentId: { [Op.in]: docIds } },
              order: [['sendAt', 'ASC']],
            })
          : [],
      ]);

      executiveMetricsPlain = executiveMetricRows.map((row) => toPlain(row));
      scenarioPlansPlain = scenarioPlanRows.map((row) => toPlain(row));
      scenarioBreakdownsPlain = scenarioBreakdownRows.map((row) => toPlain(row));
      governanceRisksPlain = governanceRiskRows.map((row) => toPlain(row));
      governanceAuditsPlain = auditRows.map((row) => toPlain(row));
      leadershipRitualsPlain = leadershipRitualRows.map((row) => toPlain(row));
      leadershipOkrsPlain = leadershipOkrRows.map((row) => toPlain(row));
      leadershipDecisionsPlain = leadershipDecisionRows.map((row) => toPlain(row));
      leadershipBriefingsPlain = leadershipBriefingRows.map((row) => toPlain(row));
      leadershipBetsPlain = leadershipBetRows.map((row) => toPlain(row));
      innovationInitiativesPlain = innovationInitiativeRows.map((row) => toPlain(row));
      innovationFundingPlain = innovationFundingRows.map((row) => toPlain(row));
      leadershipRoomsPlain = leadershipRooms.map((row) => toPlain(row));
      complianceDocumentsPlain = complianceDocRows.map((row) => toPlain(row));
      complianceObligationsPlain = obligationsRows.map((row) => toPlain(row));
      complianceRemindersPlain = reminderRows.map((row) => toPlain(row));
    }

    const analyticsWarRoom = buildAnalyticsWarRoom(executiveMetricsPlain);
    const scenarioExplorer = buildScenarioExplorer(scenarioPlansPlain, scenarioBreakdownsPlain);
    const governanceDesk = buildGovernanceDesk(
      complianceDocumentsPlain,
      complianceObligationsPlain,
      complianceRemindersPlain,
      governanceRisksPlain,
      governanceAuditsPlain,
    );
    const leadershipHub = buildLeadershipHub({
      rituals: leadershipRitualsPlain,
      okrs: leadershipOkrsPlain,
      decisions: leadershipDecisionsPlain,
      briefings: leadershipBriefingsPlain,
      bets: leadershipBetsPlain,
      rooms: leadershipRoomsPlain,
      projects: formattedProjects,
    });
    const innovationLab = buildInnovationLab({ initiatives: innovationInitiativesPlain, fundingEvents: innovationFundingPlain });

    const executive = {
      intelligence: {
        metrics: analyticsWarRoom.scorecards,
        focusMetrics: analyticsWarRoom.summary,
        compliancePolicies: governanceDesk.policies.slice(0, 6),
        upcomingObligations: governanceDesk.obligations.slice(0, 6),
        collaborationRooms: leadershipHub.collaborationRooms.slice(0, 4),
      },
      analyticsWarRoom,
      scenarioExplorer,
      governance: governanceDesk,
      leadership: leadershipHub,
      innovation: innovationLab,
    };

    return {
      workspace: workspace ? sanitizeWorkspaceRecord(workspace) : null,
      agencyProfile: agencyProfilePlain,
      scope,
      summary: {
        members: membersSummary,
        projects: projectSummary,
        pipeline: queueSummary,
        financials: financialSummary,
        clients: {
          active: totalClients,
          notes: formattedNotes.length,
        },
        gigs: {
          total: gigSummaries.length,
        },
        jobs: {
          total: jobSummaries.length,
        },
      },
      executive,
      members: {
        list: formattedMembers,
        invites: formattedInvites,
      },
      projects: {
        list: formattedProjects,
        events: formattedEvents,
      },
      contactNotes: formattedNotes,
      gigs: gigSummaries,
      jobs: jobSummaries,
      financials: escrowRows.map((row) => row.toPublicObject()),
      gigFinancials: gigTransactions.map((row) => row.toPublicObject()),
      refreshedAt: new Date().toISOString(),
    };
  });
}

export default {
  getAgencyDashboard,
};

