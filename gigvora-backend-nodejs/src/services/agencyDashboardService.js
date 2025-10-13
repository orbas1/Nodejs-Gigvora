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
  GigPackage,
  GigAddon,
  GigMediaAsset,
  GigPerformanceSnapshot,
  GigOrder,
  GigBundle,
  GigBundleItem,
  GigUpsell,
  AgencyAlliance,
  AgencyAllianceMember,
  AgencyAllianceRateCard,
  AgencyAllianceRevenueSplit,
  PartnerEngagement,
  PipelineCampaign,
  PipelineDeal,
  PipelineFollowUp,
  PipelineProposal,
  RecruitingCalendarEvent,
  EmployerBrandAsset,
  ClientSuccessPlaybook,
  ClientSuccessEnrollment,
  ClientSuccessEvent,
  ClientSuccessReferral,
  ClientSuccessReviewNudge,
  ClientSuccessAffiliateLink,
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
  ProjectOperationalSnapshot,
  ProjectDependencyLink,
  WorkspaceOperatingBlueprint,
  ResourceCapacitySnapshot,
  ResourceScenarioPlan,
  QualityReviewRun,
  FinancialEngagementSummary,
  TalentCandidate,
  TalentInterview,
  TalentOffer,
  TalentPipelineMetric,
  PeopleOpsPolicy,
  PeopleOpsPerformanceReview,
  PeopleOpsSkillMatrixEntry,
  PeopleOpsWellbeingSnapshot,
  InternalOpportunity,
  InternalOpportunityMatch,
  MemberBrandingAsset,
  MemberBrandingApproval,
  MemberBrandingMetric,
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
function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildProjectPortfolioInsights({ projects, snapshots, dependencies, events }) {
  const projectMap = new Map((projects ?? []).map((project) => [project.id, project]));

  const latestSnapshots = new Map();
  (snapshots ?? []).forEach((snapshot) => {
    if (!snapshot || snapshot.projectId == null) return;
    const existing = latestSnapshots.get(snapshot.projectId) ?? null;
    const existingDate = existing ? parseDate(existing.reportingDate ?? existing.createdAt) : null;
    const snapshotDate = parseDate(snapshot.reportingDate ?? snapshot.createdAt);
    if (!existing || (snapshotDate && (!existingDate || snapshotDate > existingDate))) {
      latestSnapshots.set(snapshot.projectId, snapshot);
    }
  });

  const statusCounts = { on_track: 0, at_risk: 0, critical: 0, other: 0 };
  let marginSum = 0;
  let marginCount = 0;
  let qualitySum = 0;
  let qualityCount = 0;
  let automationSum = 0;
  let automationCount = 0;

  latestSnapshots.forEach((snapshot) => {
    const scope = String(snapshot.scopeHealth ?? 'other').toLowerCase();
    if (statusCounts[scope] != null) {
      statusCounts[scope] += 1;
    } else {
      statusCounts.other += 1;
    }

    if (snapshot.marginPercent != null) {
      marginSum += normaliseNumber(snapshot.marginPercent, 0);
      marginCount += 1;
    }
    if (snapshot.qualityScore != null) {
      qualitySum += normaliseNumber(snapshot.qualityScore, 0);
      qualityCount += 1;
    }
    if (snapshot.automationCoverage != null) {
      automationSum += normaliseNumber(snapshot.automationCoverage, 0);
      automationCount += 1;
    }
  });

  const projectSummaries = (projects ?? []).map((project) => {
    const snapshot = latestSnapshots.get(project.id) ?? null;
    return {
      id: project.id,
      title: project.title,
      status: project.status,
      scopeHealth: snapshot?.scopeHealth ?? 'unknown',
      staffingStatus: snapshot?.staffingStatus ?? 'unknown',
      profitabilityStatus: snapshot?.profitabilityStatus ?? 'unknown',
      marginPercent: snapshot?.marginPercent ?? null,
      qualityScore: snapshot?.qualityScore ?? null,
      qaStatus: snapshot?.qaStatus ?? 'in_control',
      automationCoverage: snapshot?.automationCoverage ?? null,
      riskLevel: snapshot?.riskLevel ?? 'low',
      issuesOpen: snapshot?.issuesOpen ?? 0,
      reportingDate: snapshot?.reportingDate ?? snapshot?.createdAt ?? project.updatedAt,
    };
  });

  const dependencySummaries = (dependencies ?? []).map((dependency) => {
    const project = projectMap.get(dependency.projectId);
    const dependent = projectMap.get(dependency.dependentProjectId) ?? dependency.dependentProject ?? null;
    return {
      id: dependency.id,
      projectId: dependency.projectId,
      projectTitle: project?.title ?? `Project ${dependency.projectId}`,
      dependentProjectId: dependency.dependentProjectId,
      dependentProjectTitle: dependent?.title ?? (dependency.dependentProjectId ? `Project ${dependency.dependentProjectId}` : 'External dependency'),
      dependencyType: dependency.dependencyType,
      status: dependency.status,
      riskLevel: dependency.riskLevel,
      leadTimeDays: dependency.leadTimeDays,
      isCritical: dependency.isCritical,
      notes: dependency.notes ?? null,
    };
  });

  const calendarEntries = (events ?? [])
    .slice(0, 40)
    .map((event) => ({
      id: event.id,
      projectId: event.projectId,
      projectTitle: projectMap.get(event.projectId)?.title ?? `Project ${event.projectId}`,
      eventType: event.eventType,
      occurredAt: event.createdAt,
      description: event.payload?.milestone ?? event.payload?.note ?? null,
    }));

  return {
    summary: {
      totalProjects: projects?.length ?? 0,
      onTrack: statusCounts.on_track,
      atRisk: statusCounts.at_risk,
      critical: statusCounts.critical,
      avgMargin: marginCount ? marginSum / marginCount : 0,
      avgQualityScore: qualityCount ? qualitySum / qualityCount : 0,
      avgAutomationCoverage: automationCount ? automationSum / automationCount : 0,
    },
    projects: projectSummaries,
    dependencies: dependencySummaries,
    calendar: calendarEntries,
  };
}

function normaliseGuardrails(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'object') {
    return Object.values(value).filter(Boolean);
  }
  return [];
}

function normalizeChecklist(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.items)) return value.items;
  return [];
}

function buildWorkspaceOrchestratorInsights({ blueprints, projects, contactNotes }) {
  const blueprintCards = (blueprints ?? []).map((blueprint) => {
    const guardrails = normaliseGuardrails(blueprint.automationGuardrails);
    const checklist = normalizeChecklist(blueprint.kickoffChecklist);
    const cadenceDays = blueprint.cadenceCycleDays == null ? null : Number(blueprint.cadenceCycleDays);
    const lastRun = parseDate(blueprint.lastRunAt);
    let nextRunAt = null;
    if (lastRun && cadenceDays) {
      const nextRun = new Date(lastRun.getTime());
      nextRun.setDate(nextRun.getDate() + cadenceDays);
      nextRunAt = nextRun.toISOString();
    }

    return {
      id: blueprint.id,
      name: blueprint.blueprintName,
      clientName: blueprint.clientName ?? null,
      status: blueprint.status,
      sowUrl: blueprint.sowUrl ?? null,
      deliveryCadence: blueprint.deliveryCadence ?? null,
      cadenceCycleDays: cadenceDays,
      guardrailCount: guardrails.length,
      guardrails,
      checklistCount: checklist.length,
      checklist,
      lastRunAt: blueprint.lastRunAt ?? null,
      nextRunAt,
      metadata: blueprint.metadata ?? null,
    };
  });

  const activeBlueprints = blueprintCards.filter((blueprint) => blueprint.status === 'active').length;
  const cadenceValues = blueprintCards
    .map((blueprint) => blueprint.cadenceCycleDays)
    .filter((value) => Number.isFinite(value) && value > 0);
  const averageCadence = cadenceValues.length ? average(cadenceValues) : 0;
  const automationGuardrailsTotal = blueprintCards.reduce((total, blueprint) => total + blueprint.guardrailCount, 0);

  const sortedNotes = [...(contactNotes ?? [])].sort((a, b) => {
    const dateA = parseDate(a.createdAt) ?? new Date(0);
    const dateB = parseDate(b.createdAt) ?? new Date(0);
    return dateB - dateA;
  });

  const clientDashboards = blueprintCards.map((blueprint) => {
    const relatedNote = sortedNotes.find((note) => {
      if (!blueprint.clientName || !note?.note) return false;
      return note.note.toLowerCase().includes(blueprint.clientName.toLowerCase());
    }) ?? sortedNotes[0] ?? null;

    return {
      blueprintId: blueprint.id,
      clientName: blueprint.clientName ?? blueprint.name,
      status: blueprint.status,
      experienceSummary: relatedNote?.note ?? null,
      lastTouchpointAt: relatedNote?.createdAt ?? null,
      nextRunAt: blueprint.nextRunAt,
      sowUrl: blueprint.sowUrl,
      brandTheme: blueprint.metadata?.brandTheme ?? null,
    };
  });

  const cadences = blueprintCards
    .filter((blueprint) => blueprint.deliveryCadence || blueprint.cadenceCycleDays)
    .map((blueprint) => ({
      blueprintId: blueprint.id,
      blueprintName: blueprint.name,
      cadence:
        blueprint.deliveryCadence ??
        (blueprint.cadenceCycleDays ? `${blueprint.cadenceCycleDays}-day cadence` : 'Custom cadence'),
      nextRunAt: blueprint.nextRunAt,
    }))
    .slice(0, 10);

  return {
    summary: {
      totalBlueprints: blueprintCards.length,
      activeBlueprints,
      averageCadenceDays: averageCadence,
      automationGuardrails: automationGuardrailsTotal,
    },
    blueprints: blueprintCards,
    cadences,
    automationGuardrails: blueprintCards
      .filter((blueprint) => blueprint.guardrailCount)
      .map((blueprint) => ({
        blueprintId: blueprint.id,
        blueprintName: blueprint.name,
        guardrails: blueprint.guardrails,
      })),
    clientDashboards,
    latestNotes: sortedNotes.slice(0, 10).map((note) => ({
      id: note.id,
      note: note.note,
      createdAt: note.createdAt,
      subjectUserId: note.subjectUserId,
    })),
  };
}

function buildResourceIntelligenceInsights({ capacitySnapshots, scenarioPlans, members }) {
  const latestBySkill = new Map();
  (capacitySnapshots ?? []).forEach((snapshot) => {
    if (!snapshot || !snapshot.skillGroup) return;
    const key = snapshot.skillGroup.toLowerCase();
    const existing = latestBySkill.get(key);
    const existingDate = existing ? parseDate(existing.reportingDate ?? existing.createdAt) : null;
    const snapshotDate = parseDate(snapshot.reportingDate ?? snapshot.createdAt);
    if (!existing || (snapshotDate && (!existingDate || snapshotDate > existingDate))) {
      latestBySkill.set(key, snapshot);
    }
  });

  const heatmap = Array.from(latestBySkill.values()).map((snapshot) => {
    const availableHours = normaliseNumber(snapshot.availableHours, 0);
    const assignedHours = normaliseNumber(snapshot.assignedHours, 0);
    const utilisation = snapshot.utilizationRate != null
      ? normaliseNumber(snapshot.utilizationRate, null)
      : availableHours
        ? Math.round(((assignedHours / availableHours) * 100 + Number.EPSILON) * 10) / 10
        : null;

    return {
      skillGroup: snapshot.skillGroup,
      reportingDate: snapshot.reportingDate ?? snapshot.createdAt ?? null,
      availableHours,
      assignedHours,
      utilizationRate: utilisation,
      burnoutRisk: snapshot.burnoutRisk,
      benchHours: normaliseNumber(snapshot.benchHours, 0),
      billableRate: snapshot.billableRate == null ? null : Number(snapshot.billableRate),
      costRate: snapshot.costRate == null ? null : Number(snapshot.costRate),
      notes: snapshot.notes ?? null,
    };
  });

  const utilisationValues = heatmap
    .map((entry) => (entry.utilizationRate != null ? Number(entry.utilizationRate) : null))
    .filter((value) => value != null);

  const summary = {
    totalSkillGroups: heatmap.length,
    averageUtilization: utilisationValues.length ? average(utilisationValues) : 0,
    benchHours: heatmap.reduce((total, entry) => total + normaliseNumber(entry.benchHours, 0), 0),
    atRiskSkills: heatmap
      .filter((entry) => ['high', 'critical'].includes(String(entry.burnoutRisk).toLowerCase()))
      .map((entry) => entry.skillGroup),
    totalScenarioPlans: scenarioPlans?.length ?? 0,
    totalMembers: members?.length ?? 0,
  };

  const assignmentMatches = heatmap.slice(0, 10).map((entry) => ({
    skillGroup: entry.skillGroup,
    availableHours: entry.availableHours,
    assignedHours: entry.assignedHours,
    utilizationRate: entry.utilizationRate,
    burnoutRisk: entry.burnoutRisk,
    benchHours: entry.benchHours,
    recommendation:
      entry.utilizationRate != null && entry.utilizationRate > 110
        ? 'Rebalance workload'
        : entry.utilizationRate != null && entry.utilizationRate < 70
          ? 'Allocate additional engagements'
          : 'Maintain cadence',
  }));

  const formattedScenarioPlans = (scenarioPlans ?? []).map((plan) => ({
    id: plan.id,
    title: plan.title,
    scenarioType: plan.scenarioType,
    status: plan.status,
    window: { startDate: plan.startDate, endDate: plan.endDate },
    projectedRevenue: plan.projectedRevenue,
    projectedCost: plan.projectedCost,
    projectedMargin: plan.projectedMargin,
    staffingPlan: plan.staffingPlan ?? null,
    notes: plan.notes ?? null,
  }));

  return {
    summary,
    heatmap,
    assignmentMatches,
    scenarioPlans: formattedScenarioPlans,
  };
}

function buildQualityWorkflowInsights({ qualityReviews, projects }) {
  const projectMap = new Map((projects ?? []).map((project) => [project.id, project]));
  const reviews = qualityReviews ?? [];
  const completed = reviews.filter((review) => String(review.status ?? '').toLowerCase() === 'completed');
  const qaValues = completed
    .map((review) => (review.qaScore != null ? normaliseNumber(review.qaScore, null) : null))
    .filter((value) => value != null);
  const csatValues = completed
    .map((review) => (review.clientSatisfaction != null ? normaliseNumber(review.clientSatisfaction, null) : null))
    .filter((value) => value != null);

  const upcomingStatuses = new Set(['scheduled', 'in_review', 'pending', 'planned']);

  const upcoming = reviews
    .filter((review) => upcomingStatuses.has(String(review.status ?? '').toLowerCase()))
    .map((review) => ({
      id: review.id,
      projectId: review.projectId,
      projectTitle: projectMap.get(review.projectId)?.title ?? `Project ${review.projectId}`,
      reviewType: review.reviewType,
      status: review.status,
      reviewDate: review.reviewDate,
      automationCoverage: review.automationCoverage,
      reviewer: review.reviewer ?? null,
    }))
    .slice(0, 10);

  const scorecards = reviews.slice(0, 20).map((review) => ({
    id: review.id,
    projectId: review.projectId,
    projectTitle: projectMap.get(review.projectId)?.title ?? `Project ${review.projectId}`,
    reviewType: review.reviewType,
    status: review.status,
    qaScore: review.qaScore,
    clientSatisfaction: review.clientSatisfaction,
    lessonsLearnedCount: Array.isArray(review.lessonsLearned)
      ? review.lessonsLearned.length
      : review.lessonsLearned && typeof review.lessonsLearned === 'object'
        ? Object.keys(review.lessonsLearned).length
        : 0,
    followUpActionsCount: Array.isArray(review.followUpActions)
      ? review.followUpActions.length
      : review.followUpActions && typeof review.followUpActions === 'object'
        ? Object.keys(review.followUpActions).length
        : 0,
  }));

  const lessons = [];
  reviews.forEach((review) => {
    const lessonEntries = Array.isArray(review.lessonsLearned)
      ? review.lessonsLearned
      : review.lessonsLearned && typeof review.lessonsLearned === 'object'
        ? Object.values(review.lessonsLearned)
        : [];
    lessonEntries.forEach((entry) => {
      if (!entry) return;
      if (typeof entry === 'string') {
        lessons.push({
          reviewId: review.id,
          projectId: review.projectId,
          projectTitle: projectMap.get(review.projectId)?.title ?? `Project ${review.projectId}`,
          lesson: entry,
          category: null,
        });
      } else if (typeof entry === 'object') {
        lessons.push({
          reviewId: review.id,
          projectId: review.projectId,
          projectTitle: projectMap.get(review.projectId)?.title ?? `Project ${review.projectId}`,
          lesson: entry.summary ?? entry.title ?? null,
          category: entry.category ?? entry.type ?? null,
        });
      }
    });
  });

  const incentives = [];
  reviews.forEach((review) => {
    const actions = Array.isArray(review.followUpActions)
      ? review.followUpActions
      : review.followUpActions && typeof review.followUpActions === 'object'
        ? Object.values(review.followUpActions)
        : [];
    actions.forEach((action) => {
      if (!action || typeof action !== 'object') return;
      if (String(action.category ?? '').toLowerCase() === 'incentive') {
        incentives.push({
          reviewId: review.id,
          title: action.title ?? 'Incentive action',
          dueDate: action.dueDate ?? null,
          owner: action.owner ?? null,
        });
      }
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
    summary: {
      totalReviews: reviews.length,
      completedReviews: completed.length,
      averageQaScore: qaValues.length ? average(qaValues) : 0,
      averageClientSatisfaction: csatValues.length ? average(csatValues) : 0,
    },
    upcoming,
    scorecards,
    lessonsLearned: lessons.slice(0, 25),
    incentives: incentives.slice(0, 15),
  };
}

function buildFinancialOversightInsights({ financialSummaries, escrowTransactions }) {
  const byCurrency = new Map();

  const engagements = (financialSummaries ?? []).map((summary) => {
    const currency = summary.billingCurrency ?? 'USD';
    if (!byCurrency.has(currency)) {
      byCurrency.set(currency, {
        budgetAmount: 0,
        actualSpend: 0,
        invoicedAmount: 0,
        outstandingAmount: 0,
        changeOrders: 0,
        engagements: 0,
      });
    }

    const bucket = byCurrency.get(currency);
    bucket.budgetAmount += normaliseNumber(summary.budgetAmount, 0);
    bucket.actualSpend += normaliseNumber(summary.actualSpend, 0);
    bucket.invoicedAmount += normaliseNumber(summary.invoicedAmount, 0);
    bucket.outstandingAmount += normaliseNumber(summary.outstandingAmount, 0);
    bucket.changeOrders += Number(summary.changeOrdersCount ?? 0);
    bucket.engagements += 1;

    return {
      id: summary.id,
      projectId: summary.projectId,
      clientName: summary.clientName ?? 'Client engagement',
      policyName: summary.policyName ?? 'Financial policy',
      billingCurrency: currency,
      budgetAmount: summary.budgetAmount ?? 0,
      actualSpend: summary.actualSpend ?? 0,
      invoicedAmount: summary.invoicedAmount ?? 0,
      outstandingAmount: summary.outstandingAmount ?? 0,
      changeOrdersCount: Number(summary.changeOrdersCount ?? 0),
      profitabilityScore: summary.profitabilityScore == null ? null : Number(summary.profitabilityScore),
      marginPercent: summary.marginPercent == null ? null : Number(summary.marginPercent),
      lastInvoiceDate: summary.lastInvoiceDate ?? null,
      nextInvoiceDate: summary.nextInvoiceDate ?? null,
      complianceStatus: summary.complianceStatus ?? 'on_track',
      lastComplianceExportAt: summary.lastComplianceExportAt ?? null,
      metadata: summary.metadata ?? null,
    };
  });

  const alerts = [];
  engagements.forEach((engagement) => {
    if (engagement.marginPercent != null && engagement.marginPercent < 20) {
      alerts.push({
        type: 'margin',
        severity: engagement.marginPercent < 10 ? 'critical' : 'warning',
        message: `Margin below target for ${engagement.clientName}`,
        engagementId: engagement.id,
      });
    }
    if (engagement.outstandingAmount != null && engagement.outstandingAmount > 0) {
      alerts.push({
        type: 'outstanding_invoice',
        severity: engagement.outstandingAmount > 10000 ? 'critical' : 'warning',
        message: `Outstanding invoices of ${engagement.outstandingAmount} ${engagement.billingCurrency} for ${engagement.clientName}`,
        engagementId: engagement.id,
      });
    }
    if (String(engagement.complianceStatus ?? '').toLowerCase() === 'overdue') {
      alerts.push({
        type: 'compliance',
        severity: 'critical',
        message: `Compliance policy overdue for ${engagement.clientName}`,
        engagementId: engagement.id,
      });
    }
  });

  const currencySummaries = Array.from(byCurrency.entries()).map(([currency, totals]) => ({
    currency,
    budgetAmount: Math.round(totals.budgetAmount * 100) / 100,
    actualSpend: Math.round(totals.actualSpend * 100) / 100,
    invoicedAmount: Math.round(totals.invoicedAmount * 100) / 100,
    outstandingAmount: Math.round(totals.outstandingAmount * 100) / 100,
    changeOrders: totals.changeOrders,
    engagements: totals.engagements,
  }));

  const escrowTotals = (escrowTransactions ?? []).reduce(
    (acc, transaction) => {
      const currency = transaction.currencyCode ?? 'USD';
      if (!acc.byCurrency.has(currency)) {
        acc.byCurrency.set(currency, { inEscrow: 0, released: 0 });
      }
      const bucket = acc.byCurrency.get(currency);
      if (transaction.status === 'released') {
        bucket.released += normaliseNumber(transaction.amount, 0);
      } else if (['in_escrow', 'funded', 'initiated'].includes(String(transaction.status ?? '').toLowerCase())) {
        bucket.inEscrow += normaliseNumber(transaction.amount, 0);
      }
      acc.count += 1;
      return acc;
    },
    { byCurrency: new Map(), count: 0 },
  );

  const escrow = Array.from(escrowTotals.byCurrency.entries()).map(([currency, totals]) => ({
    currency,
    inEscrow: Math.round(totals.inEscrow * 100) / 100,
    released: Math.round(totals.released * 100) / 100,
  }));

  return {
    summary: {
      totalEngagements: engagements.length,
      currencies: currencySummaries,
      escrow,
      alerts: alerts.length,
    },
    engagements,
    alerts,
    escrow,
function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function calculateDaysBetween(start, end) {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    return null;
  }
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs > 0 ? diffMs / (1000 * 60 * 60 * 24) : 0;
}

function formatRate(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function buildTalentCrmSummary(candidates, interviews, offers, metrics) {
  const now = new Date();
  const stageCounts = {};
  const typeCounts = {};
  const diversityCounts = {};
  let signedOffers = 0;
  let sentOffers = 0;
  let scheduledInterviews = 0;
  let totalTimeToFill = 0;
  let timeToFillSamples = 0;

  const candidateList = candidates
    .map((candidate) => candidate.toPublicObject())
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0));

  candidateList.forEach((candidate) => {
    stageCounts[candidate.pipelineStage ?? 'unknown'] = (stageCounts[candidate.pipelineStage ?? 'unknown'] ?? 0) + 1;
    typeCounts[candidate.candidateType ?? 'unspecified'] = (typeCounts[candidate.candidateType ?? 'unspecified'] ?? 0) + 1;

    ensureArray(candidate.diversityTags).forEach((tag) => {
      diversityCounts[tag] = (diversityCounts[tag] ?? 0) + 1;
    });

    if (candidate.hiredAt) {
      const days = candidate.timeToFillDays ?? calculateDaysBetween(candidate.createdAt, candidate.hiredAt);
      if (Number.isFinite(days)) {
        totalTimeToFill += Number(days);
        timeToFillSamples += 1;
      }
    }
  });

  const interviewList = interviews
    .map((interview) => interview.toPublicObject())
    .sort((a, b) => new Date(a.scheduledAt ?? 0) - new Date(b.scheduledAt ?? 0));

  const upcomingInterviews = interviewList
    .filter((interview) => {
      if (interview.status !== 'scheduled' && interview.status !== 'feedback_pending') return false;
      const scheduledAt = new Date(interview.scheduledAt ?? 0);
      return !Number.isNaN(scheduledAt.valueOf()) && scheduledAt >= now;
    })
    .slice(0, 6);

  const recentInterviews = interviewList.slice(-6).reverse();

  const offerList = offers
    .map((offer) => offer.toPublicObject())
    .sort((a, b) => new Date(b.sentAt ?? b.createdAt ?? 0) - new Date(a.sentAt ?? a.createdAt ?? 0));

  offerList.forEach((offer) => {
    if (offer.status === 'sent' || offer.status === 'signed') {
      sentOffers += 1;
    }
    if (offer.status === 'signed') {
      signedOffers += 1;
    }
  });

  interviewList.forEach((interview) => {
    if (interview.status === 'scheduled' || interview.status === 'feedback_pending') {
      scheduledInterviews += 1;
    }
  });

  const metricList = metrics
    .map((metric) => metric.toPublicObject())
    .sort((a, b) => new Date(b.periodEndDate ?? 0) - new Date(a.periodEndDate ?? 0));

  const latestMetric = metricList[0] ?? null;

  return {
    totals: {
      candidates: candidateList.length,
      interviewsScheduled: scheduledInterviews,
      offersSent: sentOffers,
      offersSigned: signedOffers,
    },
    stageCounts,
    typeCounts,
    diversityBreakdown: diversityCounts,
    averageTimeToFillDays: timeToFillSamples ? totalTimeToFill / timeToFillSamples : 0,
    conversionRate: formatRate(signedOffers, candidateList.length || 0),
    recentCandidates: candidateList.slice(0, 6),
    upcomingInterviews,
    recentInterviews,
    offerWorkflows: offerList.slice(0, 6),
    pipelineAnalytics: {
      latest: latestMetric,
      history: metricList.slice(0, 6),
    },
  };
}

function buildPeopleOpsSummary(policies, reviews, skills, wellbeing) {
  const policyList = policies
    .map((policy) => policy.toPublicObject())
    .sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0));

  const reviewList = reviews
    .map((review) => review.toPublicObject())
    .sort((a, b) => new Date(b.dueAt ?? b.updatedAt ?? 0) - new Date(a.dueAt ?? a.updatedAt ?? 0));

  const skillList = skills
    .map((entry) => entry.toPublicObject())
    .sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0));

  const wellbeingList = wellbeing
    .map((snapshot) => snapshot.toPublicObject())
    .sort((a, b) => new Date(b.capturedAt ?? 0) - new Date(a.capturedAt ?? 0));

  const activePolicies = policyList.filter((policy) => policy.status === 'active');
  const acknowledgementRate = policyList.length
    ? formatRate(
        policyList.reduce((total, policy) => total + Math.min(policy.acknowledgedCount ?? 0, policy.audienceCount ?? 0), 0),
        policyList.reduce((total, policy) => total + (policy.audienceCount ?? 0), 0) || 0,
      )
    : 0;

  const outstandingReviews = reviewList.filter((review) => !['completed', 'closed'].includes(review.status));
  const completedReviews = reviewList.filter((review) => ['completed', 'closed'].includes(review.status));

  const skillsCoverage = {};
  const skillGaps = [];
  skillList.forEach((entry) => {
    const category = entry.skillCategory ?? 'General';
    if (!skillsCoverage[category]) {
      skillsCoverage[category] = { total: 0, ready: 0, needsGrowth: 0 };
    }
    skillsCoverage[category].total += 1;
    if (entry.targetLevel && entry.proficiencyLevel != null && entry.proficiencyLevel < entry.targetLevel) {
      skillsCoverage[category].needsGrowth += 1;
      skillGaps.push(entry);
    } else {
      skillsCoverage[category].ready += 1;
    }
  });

  const wellbeingScores = wellbeingList.map((entry) => Number(entry.wellbeingScore) || 0);
  const wellbeingAverage = wellbeingScores.length
    ? Math.round((wellbeingScores.reduce((sum, score) => sum + score, 0) / wellbeingScores.length) * 10) / 10
    : 0;
  const wellbeingRiskCounts = wellbeingList.reduce(
    (acc, entry) => {
      const key = entry.riskLevel ?? 'low';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 },
  );
  const wellbeingAtRisk = (wellbeingRiskCounts.high ?? 0) + (wellbeingRiskCounts.critical ?? 0);

  return {
    policies: {
      list: policyList.slice(0, 6),
      total: policyList.length,
      active: activePolicies.length,
      acknowledgementRate,
    },
    performance: {
      outstanding: outstandingReviews.length,
      completed: completedReviews.length,
      reviews: reviewList.slice(0, 6),
    },
    skills: {
      entries: skillList.slice(0, 10),
      coverage: skillsCoverage,
      gaps: skillGaps.slice(0, 6),
    },
    wellbeing: {
      averageScore: wellbeingAverage,
      riskCounts: wellbeingRiskCounts,
      atRisk: wellbeingAtRisk,
      snapshots: wellbeingList.slice(0, 6),
    },
  };
}

function buildOpportunityBoardSummary(opportunities, matches) {
  const opportunityList = opportunities
    .map((opportunity) => opportunity.toPublicObject())
    .sort((a, b) => new Date(a.startDate ?? 0) - new Date(b.startDate ?? 0));

  const matchList = matches
    .map((match) => match.toPublicObject())
    .sort((a, b) => new Date(b.notifiedAt ?? b.createdAt ?? 0) - new Date(a.notifiedAt ?? a.createdAt ?? 0));

  const open = opportunityList.filter((opportunity) => ['open', 'matched'].includes(opportunity.status)).length;
  const filled = opportunityList.filter((opportunity) => opportunity.status === 'filled').length;
  const averageMatchScore = matchList.length
    ? Math.round(
        (matchList.reduce((total, match) => total + (Number(match.matchScore) || 0), 0) / matchList.length) * 10,
      ) / 10
    : 0;
  const mobileAlerts = matchList.filter((match) => match.isMobileAlert).length;
  const acceptedMatches = matchList.filter((match) => match.status === 'accepted').length;

  const upcoming = opportunityList
    .filter((opportunity) => ['open', 'matched'].includes(opportunity.status))
    .slice(0, 6);

  return {
    summary: {
      open,
      filled,
      averageMatchScore,
      mobileAlerts,
      acceptedMatches,
    },
    opportunities: upcoming,
    matches: matchList.slice(0, 6),
  };
}

function buildBrandingSummary(assets, approvals, metrics) {
  const assetList = assets
    .map((asset) => asset.toPublicObject())
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0));

  const approvalList = approvals
    .map((approval) => approval.toPublicObject())
    .sort((a, b) => new Date(b.requestedAt ?? 0) - new Date(a.requestedAt ?? 0));

  const metricList = metrics
    .map((metric) => metric.toPublicObject())
    .sort((a, b) => new Date(b.metricDate ?? 0) - new Date(a.metricDate ?? 0));

  const pendingApprovals = approvalList.filter((approval) => approval.status === 'pending');
  const publishedAssets = assetList.filter((asset) => asset.status === 'published');

  const totals = metricList.reduce(
    (acc, metric) => {
      acc.reach += Number(metric.reach) || 0;
      acc.engagements += Number(metric.engagements) || 0;
      acc.clicks += Number(metric.clicks) || 0;
      acc.leadsAttributed += Number(metric.leadsAttributed) || 0;
      return acc;
    },
    { reach: 0, engagements: 0, clicks: 0, leadsAttributed: 0 },
  );

  return {
    assets: assetList.slice(0, 6),
    totals: {
      assets: assetList.length,
      published: publishedAssets.length,
    },
    approvals: {
      pending: pendingApprovals.length,
      queue: pendingApprovals.slice(0, 6),
    },
    metrics: {
      totals,
      recent: metricList.slice(0, 6),
    },
  };
}

function buildHrManagementSummary(members, candidates, policies) {
  const activeHeadcount = members.filter((member) => member.status === 'active').length;
  const contractors = members.filter((member) => (member.role ?? '').toLowerCase().includes('contract')).length;
  const onboarding = candidates.filter((candidate) => candidate.status === 'hired' && candidate.onboardingStatus !== 'completed').length;
  const exitsInProgress = candidates.filter(
    (candidate) => candidate.exitWorkflowStatus && !['not_applicable', 'completed'].includes(candidate.exitWorkflowStatus),
  ).length;
  const complianceOutstanding = policies.reduce((total, policy) => {
    const outstanding = Math.max((policy.audienceCount ?? 0) - (policy.acknowledgedCount ?? 0), 0);
    return total + outstanding;
  }, 0);

  return {
    activeHeadcount,
    contractors,
    onboarding,
    exitsInProgress,
    complianceOutstanding,
  };
}

function buildCapacityPlanningSummary(membersSummary, metrics, opportunities) {
  const latestMetric = metrics[0] ?? null;
  const openRoles = latestMetric?.openRoles ?? 0;
  const benchCapacityHours = latestMetric?.benchCapacityHours ?? membersSummary.averageWeeklyCapacity * (membersSummary.bench ?? 0);
  const hiringVelocity = latestMetric?.hiringVelocity ?? 0;
  const utilizationRate = membersSummary.utilizationRate ?? 0;
  const upcomingStarts = opportunities.filter((opportunity) => {
    if (!opportunity.startDate) return false;
    const startDate = new Date(opportunity.startDate);
    if (Number.isNaN(startDate.valueOf())) return false;
    const now = new Date();
    const diff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }).length;

  return {
    openRoles,
    benchCapacityHours,
    hiringVelocity,
    utilizationRate,
    upcomingStarts,
  };
}

function buildInternalMarketplaceSummary(members, opportunities, matches) {
  const benchAvailable = members.filter((member) => member.availability?.status === 'available').length;
  const openOpportunities = opportunities.filter((opportunity) => ['open', 'matched'].includes(opportunity.status)).length;
  const activeMatches = matches.filter((match) => ['new', 'contacted', 'accepted'].includes(match.status)).length;
  const acceptedMatches = matches.filter((match) => match.status === 'accepted').length;

  return {
    benchAvailable,
    openOpportunities,
    activeMatches,
    acceptedMatches,
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

function toPlainValue(record) {
  if (!record) {
    return null;
  }
  if (typeof record.toPublicObject === 'function') {
    return record.toPublicObject();
  }
  if (typeof record.toBuilderObject === 'function') {
    return record.toBuilderObject();
  }
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  return { ...record };
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start, end) {
  const from = parseDate(start);
  const to = parseDate(end);
  if (!from || !to) return null;
  const diff = to.getTime() - from.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function groupByKey(items, key) {
  const map = new Map();
  items.forEach((item) => {
    if (!item || item[key] == null) {
      return;
    }
    const groupKey = item[key];
    if (!map.has(groupKey)) {
      map.set(groupKey, []);
    }
    map.get(groupKey).push(item);
  });
  return map;
}

function centsToAmount(value) {
  if (value == null) {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round((numeric / 100) * 100) / 100;
}

function safePercentage(numerator, denominator) {
  if (!denominator) return 0;
  const rate = (numerator / denominator) * 100;
  return Math.round((rate + Number.EPSILON) * 10) / 10;
}

function collectAllianceMembersByAlliance(members) {
  const grouped = new Map();
  members.forEach((member) => {
    if (!member || member.allianceId == null) return;
    if (!grouped.has(member.allianceId)) {
      grouped.set(member.allianceId, []);
    }
    grouped.get(member.allianceId).push(member);
  });
  return grouped;
}

function buildGigStudioInsights({
  gigs,
  packages,
  addons,
  mediaAssets,
  performanceSnapshots,
  orders,
  bundles,
  bundleItems,
  upsells,
  alliances,
  allianceMembers,
}) {
  const packagesByGig = groupByKey(packages, 'gigId');
  const addonsByGig = groupByKey(addons, 'gigId');
  const ordersByGig = groupByKey(orders, 'gigId');
  const bundleItemsByBundle = groupByKey(bundleItems, 'bundleId');

  const heroAssetByGig = new Map();
  mediaAssets.forEach((asset) => {
    if (asset.gigId == null || heroAssetByGig.has(asset.gigId)) {
      return;
    }
    heroAssetByGig.set(asset.gigId, asset);
  });

  const performanceByGig = new Map();
  performanceSnapshots.forEach((snapshot) => {
    if (snapshot.gigId == null) return;
    if (!performanceByGig.has(snapshot.gigId)) {
      performanceByGig.set(snapshot.gigId, snapshot);
    }
  });

  const formattedGigs = gigs.map((gig) => {
    const gigOrders = ordersByGig.get(gig.id) ?? [];
    const openOrders = gigOrders.filter((order) => !['completed', 'cancelled'].includes(order.status));
    return {
      ...gig,
      packages: packagesByGig.get(gig.id) ?? [],
      addons: addonsByGig.get(gig.id) ?? [],
      heroAsset: heroAssetByGig.get(gig.id) ?? null,
      latestPerformance: performanceByGig.get(gig.id) ?? null,
      orders: {
        total: gigOrders.length,
        open: openOrders.length,
      },
    };
  });

  const bundleSummaries = bundles.map((bundle) => ({
    ...bundle,
    priceAmount: centsToAmount(bundle.priceCents),
    items: (bundleItemsByBundle.get(bundle.id) ?? []).sort((a, b) => a.orderIndex - b.orderIndex),
  }));

  const upsellSummaries = upsells.map((upsell) => ({
    ...upsell,
    estimatedValueAmount: centsToAmount(upsell.estimatedValueCents),
  }));

  const totalOrders = orders.length;
  const completedWithDue = orders.filter((order) => order.completedAt && order.dueAt);
  const onTime = completedWithDue.filter((order) => {
    const completed = parseDate(order.completedAt);
    const due = parseDate(order.dueAt);
    return completed && due && completed.getTime() <= due.getTime();
  });
  const deliveryDurations = completedWithDue
    .map((order) => daysBetween(order.submittedAt ?? order.createdAt, order.completedAt))
    .filter((value) => Number.isFinite(value) && value != null);

  const backlog = orders.filter((order) => !['completed', 'cancelled'].includes(order.status));
  const breaches = orders.filter((order) => {
    const due = parseDate(order.dueAt);
    if (!due) return false;
    if (['completed', 'cancelled'].includes(order.status)) {
      const completed = parseDate(order.completedAt);
      return completed && completed.getTime() > due.getTime();
    }
    const now = new Date();
    return now.getTime() > due.getTime();
  });

  const alliancesById = new Map(alliances.map((alliance) => [alliance.id, alliance]));
  const membersByAlliance = collectAllianceMembersByAlliance(allianceMembers);
  const rosterAlliances = alliances.filter((alliance) =>
    ['delivery_pod', 'managed_service'].includes(alliance.allianceType ?? ''),
  );

  const rosters = rosterAlliances.map((alliance) => {
    const members = (membersByAlliance.get(alliance.id) ?? []).map((member) => ({
      id: member.id,
      role: member.role,
      status: member.status,
      commitmentHours: member.commitmentHours,
      revenueSharePercent: member.revenueSharePercent,
      user: member.user
        ? {
            id: member.user.id,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
          }
        : null,
    }));
    return {
      id: alliance.id,
      name: alliance.name,
      status: alliance.status,
      allianceType: alliance.allianceType,
      focusAreas: alliance.focusAreas ?? [],
      members,
    };
  });

  const summary = {
    managedGigs: formattedGigs.filter((gig) => gig.status === 'active' || gig.status === 'in_delivery').length,
    totalGigs: formattedGigs.length,
    packages: packages.length,
    addons: addons.length,
    hybridBundles: bundleSummaries.filter((bundle) => bundle.status === 'live').length,
    upsellPrograms: upsellSummaries.filter((upsell) => upsell.status === 'running' || upsell.status === 'pilot').length,
    activeOrders: backlog.length,
    onTimeRate: safePercentage(onTime.length, completedWithDue.length || totalOrders || 0),
    averageDeliveryDays: deliveryDurations.length ? Math.round((average(deliveryDurations) + Number.EPSILON) * 10) / 10 : 0,
    breaches: breaches.length,
  };

  const deliverables = {
    totalDeliverables: bundleItems.length,
    backlog: backlog.length,
    breaches: breaches.length,
    activeContracts: completedWithDue.length + backlog.length,
    upcomingDue: orders.filter((order) => {
      const due = parseDate(order.dueAt);
      if (!due) return false;
      if (['completed', 'cancelled'].includes(order.status)) return false;
      const now = new Date();
      const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length,
  };

  return {
    summary,
    gigs: formattedGigs,
    bundles: bundleSummaries,
    upsells: upsellSummaries,
    deliverables,
    rosters,
    alliances: Array.from(alliancesById.values()),
  };
}

function buildPartnerProgramInsights({ alliances, allianceMembers, rateCards, revenueSplits, partnerEngagements }) {
  const membersByAlliance = collectAllianceMembersByAlliance(allianceMembers);
  const allianceSummaries = alliances.map((alliance) => {
    const members = membersByAlliance.get(alliance.id) ?? [];
    return {
      ...alliance,
      memberCount: members.length,
      leadCount: members.filter((member) => member.role === 'lead').length,
    };
  });

  const engagementsByType = {};
  partnerEngagements.forEach((engagement) => {
    const key = engagement.partnerType ?? 'unspecified';
    if (!engagementsByType[key]) {
      engagementsByType[key] = { count: 0, touchpoints: 0, conversionRateSamples: [] };
    }
    engagementsByType[key].count += 1;
    engagementsByType[key].touchpoints += normaliseNumber(engagement.touchpoints, 0);
    if (engagement.conversionRate != null) {
      engagementsByType[key].conversionRateSamples.push(Number(engagement.conversionRate));
    }
  });

  const engagements = Object.entries(engagementsByType).map(([partnerType, details]) => ({
    partnerType,
    count: details.count,
    touchpoints: details.touchpoints,
    averageConversionRate: details.conversionRateSamples.length
      ? Math.round((average(details.conversionRateSamples) + Number.EPSILON) * 10) / 10
      : 0,
  }));

  const summary = {
    alliances: alliances.length,
    activeAlliances: allianceSummaries.filter((alliance) => alliance.status === 'active').length,
    partnerEngagements: partnerEngagements.length,
    averageConversionRate:
      partnerEngagements.length
        ? Math.round(
            (average(
              partnerEngagements
                .map((item) => (item.conversionRate != null ? Number(item.conversionRate) : null))
                .filter((value) => value != null),
            ) || 0 + Number.EPSILON) * 10,
          ) / 10
        : 0,
    pendingRateCards: rateCards.filter((card) => card.status === 'draft' || card.status === 'in_review').length,
    activeRateCards: rateCards.filter((card) => card.status === 'active').length,
    activeRevenueSplits: revenueSplits.filter((split) => split.status === 'active').length,
  };

  return {
    summary,
    alliances: allianceSummaries,
    engagements,
    rateCards,
    revenueSplits,
  };
}

function buildMarketingAutomationInsights({ campaigns, deals, followUps, proposals, events, landingPages }) {
  const openDeals = deals.filter((deal) => deal.status === 'open');
  const wonDeals = deals.filter((deal) => deal.status === 'won');
  const totalPipelineValue = deals.reduce((total, deal) => total + normaliseNumber(deal.pipelineValue, 0), 0);
  const winProbabilitySamples = deals
    .map((deal) => (deal.winProbability != null ? Number(deal.winProbability) : null))
    .filter((value) => value != null);
  const followUpsDueSoon = followUps.filter((followUp) => {
    if (followUp.status === 'completed' || followUp.status === 'cancelled') return false;
    const due = parseDate(followUp.dueAt);
    if (!due) return false;
    const now = new Date();
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14;
  });

  const webinarEvents = events.filter((event) =>
    (event.eventType ?? '').toLowerCase().includes('webinar') || (event.metadata?.format ?? '') === 'webinar',
  );

  const summary = {
    activeCampaigns: campaigns.filter((campaign) => campaign.status === 'active').length,
    totalCampaigns: campaigns.length,
    openDeals: openDeals.length,
    wonDeals: wonDeals.length,
    totalPipelineValue,
    averageWinProbability: winProbabilitySamples.length
      ? Math.round((average(winProbabilitySamples) + Number.EPSILON) * 10) / 10
      : 0,
    followUpsDueSoon: followUpsDueSoon.length,
    liveLandingPages: landingPages.filter((asset) => asset.status === 'published').length,
  };

  return {
    summary,
    campaigns,
    deals,
    followUps,
    proposals,
    events,
    landingPages,
    webinars: webinarEvents,
  };
}

function buildClientAdvocacyInsights({
  playbooks,
  enrollments,
  events,
  referrals,
  reviewNudges,
  affiliateLinks,
  gigs,
}) {
  const activePlaybooks = playbooks.filter((playbook) => playbook.isActive !== false);
  const activeEnrollments = enrollments.filter((enrollment) => enrollment.status === 'in_progress' || enrollment.status === 'pending');
  const completedEnrollments = enrollments.filter((enrollment) => enrollment.status === 'completed');

  const nudgesResponded = reviewNudges.filter((nudge) => nudge.responseAt);
  const rewardValue = referrals.reduce((total, referral) => total + normaliseNumber(referral.rewardValueAmount, 0), 0);
  const affiliateConversions = affiliateLinks.reduce((total, link) => total + normaliseNumber(link.totalConversions, 0), 0);

  const summary = {
    activePlaybooks: activePlaybooks.length,
    totalPlaybooks: playbooks.length,
    enrollmentsInFlight: activeEnrollments.length,
    enrollmentsCompleted: completedEnrollments.length,
    reviewResponseRate: safePercentage(nudgesResponded.length, reviewNudges.length),
    referralCount: referrals.length,
    referralRewardValue: rewardValue,
    affiliatePrograms: affiliateLinks.length,
    affiliateConversions,
  };

  const storytellingKits = gigs
    .filter((gig) => gig.csatScore != null)
    .map((gig) => ({
      id: gig.id,
      title: gig.title,
      csatScore: gig.csatScore,
      csatResponseCount: gig.csatResponseCount,
      clientName: gig.clientName,
    }));

  return {
    summary,
    playbooks,
    enrollments,
    events,
    referrals,
    reviewNudges,
    affiliateLinks,
    storytellingKits,
  };
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
    let talentCandidateRows = [];
    let talentInterviewRows = [];
    let talentOfferRows = [];
    let talentPipelineMetricRows = [];
    let peopleOpsPolicyRows = [];
    let peopleOpsReviewRows = [];
    let peopleOpsSkillRows = [];
    let peopleOpsWellbeingRows = [];
    let internalOpportunityRows = [];
    let internalMatchRows = [];
    let brandingAssetRows = [];
    let brandingApprovalRows = [];
    let brandingMetricRows = [];

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

      [
        talentCandidateRows,
        talentInterviewRows,
        talentOfferRows,
        talentPipelineMetricRows,
        peopleOpsPolicyRows,
        peopleOpsReviewRows,
        peopleOpsSkillRows,
        peopleOpsWellbeingRows,
        internalOpportunityRows,
        internalMatchRows,
        brandingAssetRows,
        brandingApprovalRows,
        brandingMetricRows,
      ] = await Promise.all([
        TalentCandidate.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['updatedAt', 'DESC']],
          limit: 200,
        }),
        TalentInterview.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['scheduledAt', 'ASC']],
          limit: 120,
        }),
        TalentOffer.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['updatedAt', 'DESC']],
          limit: 120,
        }),
        TalentPipelineMetric.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['periodEndDate', 'DESC']],
          limit: 12,
        }),
        PeopleOpsPolicy.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['updatedAt', 'DESC']],
          limit: 60,
        }),
        PeopleOpsPerformanceReview.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['dueAt', 'DESC']],
          limit: 100,
        }),
        PeopleOpsSkillMatrixEntry.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['updatedAt', 'DESC']],
          limit: 200,
        }),
        PeopleOpsWellbeingSnapshot.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['capturedAt', 'DESC']],
          limit: 120,
        }),
        InternalOpportunity.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['createdAt', 'DESC']],
          limit: 120,
        }),
        InternalOpportunityMatch.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['notifiedAt', 'DESC']],
          limit: 200,
        }),
        MemberBrandingAsset.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['updatedAt', 'DESC']],
          limit: 120,
        }),
        MemberBrandingApproval.findAll({
          include: [{ model: MemberBrandingAsset, as: 'asset' }],
          where: {
            '$asset.workspaceId$': workspaceIdFilter,
          },
          order: [['requestedAt', 'DESC']],
          limit: 120,
        }),
        MemberBrandingMetric.findAll({
          include: [{ model: MemberBrandingAsset, as: 'asset' }],
          where: {
            '$asset.workspaceId$': workspaceIdFilter,
          },
          order: [['metricDate', 'DESC']],
          limit: 120,
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

    const [
      queueRows,
      eventRows,
      escrowRows,
      gigTransactions,
      snapshotRows,
      dependencyRows,
      blueprintRows,
      capacityRows,
      scenarioRows,
      qualityReviewRows,
      financialSummaryRows,
    ] = await Promise.all([
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
      projectIds.length
        ? ProjectOperationalSnapshot.findAll({
            where: { projectId: { [Op.in]: projectIds } },
            order: [
              ['reportingDate', 'DESC'],
              ['createdAt', 'DESC'],
            ],
            limit: 200,
          })
        : [],
      projectIds.length
        ? ProjectDependencyLink.findAll({
            where: { projectId: { [Op.in]: projectIds } },
            include: [{ model: Project, as: 'dependentProject', attributes: ['id', 'title'] }],
            order: [['updatedAt', 'DESC']],
          })
        : [],
      workspaceIdFilter
        ? WorkspaceOperatingBlueprint.findAll({
            where: { workspaceId: workspaceIdFilter },
            order: [['updatedAt', 'DESC']],
          })
        : [],
      workspaceIdFilter
        ? ResourceCapacitySnapshot.findAll({
            where: { workspaceId: workspaceIdFilter },
            order: [['reportingDate', 'DESC']],
            limit: 60,
          })
        : [],
      workspaceIdFilter
        ? ResourceScenarioPlan.findAll({
            where: { workspaceId: workspaceIdFilter },
            order: [['updatedAt', 'DESC']],
            limit: 20,
          })
        : [],
      projectIds.length
        ? QualityReviewRun.findAll({
            where: { projectId: { [Op.in]: projectIds } },
            include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] }],
            order: [['reviewDate', 'DESC']],
            limit: 40,
          })
        : [],
      workspaceIdFilter || projectIds.length
        ? FinancialEngagementSummary.findAll({
            where: workspaceIdFilter
              ? { workspaceId: workspaceIdFilter }
              : { projectId: { [Op.in]: projectIds } },
            order: [['updatedAt', 'DESC']],
            limit: 40,
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

    const escrowTransactions = escrowRows.map((row) => row.toPublicObject());
    const financialSummary = aggregateFinancials(escrowTransactions);

    const operationalSnapshots = snapshotRows.map((row) => row.toPublicObject());
    const dependencyPlain = dependencyRows.map((row) => {
      const plain = row.toPublicObject();
      const dependent = row.dependentProject ? row.dependentProject.get({ plain: true }) : null;
      return {
        ...plain,
        dependentProject: dependent ? { id: dependent.id, title: dependent.title } : null,
      };
    });
    const blueprintPlain = blueprintRows.map((row) => row.toPublicObject());
    const capacityPlain = capacityRows.map((row) => row.toPublicObject());
    const scenarioPlain = scenarioRows.map((row) => row.toPublicObject());
    const qualityPlain = qualityReviewRows.map((row) => {
      const plain = row.toPublicObject();
      const reviewer = row.reviewer ? row.reviewer.get({ plain: true }) : null;
      return {
        ...plain,
        reviewer: reviewer
          ? { id: reviewer.id, firstName: reviewer.firstName, lastName: reviewer.lastName }
          : null,
      };
    });
    const financialSummaries = financialSummaryRows.map((row) => row.toPublicObject());

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

    const gigIds = gigSummaries.map((gig) => gig.id).filter((id) => Number.isInteger(id));
    const workspaceOwnerId = workspace?.ownerId ?? null;

    let gigPackageRows = [];
    let gigAddonRows = [];
    let gigMediaRows = [];
    let gigPerformanceRows = [];
    let gigOrderRows = [];

    if (gigIds.length) {
      [gigPackageRows, gigAddonRows, gigMediaRows, gigPerformanceRows, gigOrderRows] = await Promise.all([
        GigPackage.findAll({
          where: { gigId: { [Op.in]: gigIds } },
          order: [
            ['gigId', 'ASC'],
            ['priceAmount', 'ASC'],
          ],
        }),
        GigAddon.findAll({
          where: { gigId: { [Op.in]: gigIds } },
          order: [
            ['gigId', 'ASC'],
            ['priceAmount', 'ASC'],
          ],
        }),
        GigMediaAsset.findAll({
          where: { gigId: { [Op.in]: gigIds } },
          order: [['displayOrder', 'ASC']],
        }),
        GigPerformanceSnapshot.findAll({
          where: { gigId: { [Op.in]: gigIds } },
          order: [['snapshotDate', 'DESC']],
        }),
        GigOrder.findAll({
          where: {
            gigId: { [Op.in]: gigIds },
            createdAt: { [Op.gte]: lookbackDate },
          },
          order: [['createdAt', 'DESC']],
        }),
      ]);
    }

    const gigBundleRows = workspaceOwnerId
      ? await GigBundle.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']] })
      : [];
    const bundleIds = gigBundleRows.map((bundle) => bundle.id).filter((id) => Number.isInteger(id));
    const gigBundleItemRows = bundleIds.length
      ? await GigBundleItem.findAll({
          where: { bundleId: { [Op.in]: bundleIds } },
          order: [['orderIndex', 'ASC']],
        })
      : [];
    const gigUpsellRows = workspaceOwnerId
      ? await GigUpsell.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']] })
      : [];

    const alliances = workspaceIdFilter
      ? await AgencyAlliance.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['createdAt', 'DESC']],
        })
      : [];
    const allianceIds = alliances.map((alliance) => alliance.id).filter((id) => Number.isInteger(id));
    const allianceMemberRows = allianceIds.length
      ? await AgencyAllianceMember.findAll({
          where: { allianceId: { [Op.in]: allianceIds } },
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
        })
      : [];
    const allianceRateCardRows = allianceIds.length
      ? await AgencyAllianceRateCard.findAll({
          where: { allianceId: { [Op.in]: allianceIds } },
          order: [['version', 'DESC']],
        })
      : [];
    const allianceRevenueSplitRows = allianceIds.length
      ? await AgencyAllianceRevenueSplit.findAll({
          where: { allianceId: { [Op.in]: allianceIds } },
          order: [['createdAt', 'DESC']],
        })
      : [];
    const partnerEngagementRows = workspaceIdFilter
      ? await PartnerEngagement.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['lastInteractionAt', 'DESC']],
        })
      : [];

    const pipelineOwnerId = workspace ? workspace.id : null;
    let campaignRows = [];
    let dealRows = [];
    let followUpRows = [];
    if (pipelineOwnerId) {
      [campaignRows, dealRows, followUpRows] = await Promise.all([
        PipelineCampaign.findAll({
          where: { ownerId: pipelineOwnerId, ownerType: 'agency' },
          order: [['createdAt', 'DESC']],
          limit: 50,
        }),
        PipelineDeal.findAll({
          where: { ownerId: pipelineOwnerId, ownerType: 'agency' },
          order: [['createdAt', 'DESC']],
          limit: 100,
        }),
        PipelineFollowUp.findAll({
          where: { ownerId: pipelineOwnerId, ownerType: 'agency' },
          order: [['dueAt', 'ASC']],
          limit: 100,
        }),
      ]);
    }
    const dealIds = dealRows.map((deal) => deal.id).filter((id) => Number.isInteger(id));
    const proposalRows = dealIds.length
      ? await PipelineProposal.findAll({ where: { dealId: { [Op.in]: dealIds } }, order: [['createdAt', 'DESC']] })
      : [];

    const eventRowsMarketing = workspaceIdFilter
      ? await RecruitingCalendarEvent.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['startsAt', 'ASC']],
          limit: 50,
        })
      : [];
    const landingPageRows = workspaceIdFilter
      ? await EmployerBrandAsset.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['createdAt', 'DESC']],
          limit: 50,
        })
      : [];

    let playbookRows = [];
    let enrollmentRows = [];
    let clientEventRows = [];
    let referralRows = [];
    let reviewNudgeRows = [];
    let affiliateLinkRows = [];
    if (workspaceOwnerId) {
      [playbookRows, enrollmentRows, clientEventRows, referralRows, reviewNudgeRows, affiliateLinkRows] = await Promise.all([
        ClientSuccessPlaybook.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']] }),
        ClientSuccessEnrollment.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']] }),
        ClientSuccessEvent.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']], limit: 100 }),
        ClientSuccessReferral.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']], limit: 100 }),
        ClientSuccessReviewNudge.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']], limit: 100 }),
        ClientSuccessAffiliateLink.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']], limit: 100 }),
      ]);
    }

    const gigPackages = gigPackageRows.map((row) => row.toBuilderObject());
    const gigAddons = gigAddonRows.map((row) => row.toBuilderObject());
    const gigMediaAssets = gigMediaRows.map((row) => row.toBuilderObject());
    const gigPerformanceSnapshots = gigPerformanceRows.map((row) => row.toBuilderObject());
    const gigOrders = gigOrderRows.map((row) => row.toPublicObject());
    const gigBundles = gigBundleRows.map((row) => row.toPublicObject());
    const gigBundleItems = gigBundleItemRows.map((row) => row.toPublicObject());
    const gigUpsells = gigUpsellRows.map((row) => row.toPublicObject());

    const allianceRecords = alliances.map((alliance) => alliance.toPublicObject());
    const allianceMemberRecords = allianceMemberRows.map((member) => {
      const plain = member.get({ plain: true });
      return {
        ...plain,
        commitmentHours: plain.commitmentHours != null ? Number.parseFloat(plain.commitmentHours) : null,
        revenueSharePercent: plain.revenueSharePercent != null ? Number.parseFloat(plain.revenueSharePercent) : null,
      };
    });
    const allianceRateCards = allianceRateCardRows.map((row) => row.toPublicObject());
    const allianceRevenueSplits = allianceRevenueSplitRows.map((row) => row.toPublicObject());
    const partnerEngagements = partnerEngagementRows.map((row) => {
      const plain = toPlainValue(row);
      return {
        ...plain,
        conversionRate: plain?.conversionRate != null ? Number(plain.conversionRate) : null,
        touchpoints: normaliseNumber(plain?.touchpoints, 0),
      };
    });

    const campaigns = campaignRows.map((row) => row.toPublicObject());
    const deals = dealRows.map((row) => row.toPublicObject());
    const followUps = followUpRows.map((row) => row.toPublicObject());
    const proposals = proposalRows.map((row) => row.toPublicObject());
    const marketingEvents = eventRowsMarketing.map((row) => toPlainValue(row));
    const landingPages = landingPageRows.map((row) => {
      const plain = toPlainValue(row);
      return {
        ...plain,
        engagementScore: plain?.engagementScore != null ? Number(plain.engagementScore) : null,
      };
    });

    const playbooks = playbookRows.map((row) => row.toPublicObject());
    const enrollments = enrollmentRows.map((row) => row.toPublicObject());
    const clientEvents = clientEventRows.map((row) => row.toPublicObject());
    const referrals = referralRows.map((row) => {
      const plain = row.toPublicObject();
      return {
        ...plain,
        rewardValueAmount: plain.rewardValueCents != null ? centsToAmount(plain.rewardValueCents) : 0,
      };
    });
    const reviewNudges = reviewNudgeRows.map((row) => row.toPublicObject());
    const affiliateLinks = affiliateLinkRows.map((row) => row.toPublicObject());

    const studioInsights = buildGigStudioInsights({
      gigs: gigSummaries,
      packages: gigPackages,
      addons: gigAddons,
      mediaAssets: gigMediaAssets,
      performanceSnapshots: gigPerformanceSnapshots,
      orders: gigOrders,
      bundles: gigBundles,
      bundleItems: gigBundleItems,
      upsells: gigUpsells,
      alliances: allianceRecords,
      allianceMembers: allianceMemberRecords,
    });

    const partnerProgramInsights = buildPartnerProgramInsights({
      alliances: allianceRecords,
      allianceMembers: allianceMemberRecords,
      rateCards: allianceRateCards,
      revenueSplits: allianceRevenueSplits,
      partnerEngagements,
    });

    const marketingAutomationInsights = buildMarketingAutomationInsights({
      campaigns,
      deals,
      followUps,
      proposals,
      events: marketingEvents,
      landingPages,
    });

    const clientAdvocacyInsights = buildClientAdvocacyInsights({
      playbooks,
      enrollments,
      events: clientEvents,
      referrals,
      reviewNudges,
      affiliateLinks,
      gigs: gigSummaries,
    });

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
    const projectPortfolioInsights = buildProjectPortfolioInsights({
      projects: formattedProjects,
      snapshots: operationalSnapshots,
      dependencies: dependencyPlain,
      events: formattedEvents,
    });

    const workspaceOrchestratorInsights = buildWorkspaceOrchestratorInsights({
      blueprints: blueprintPlain,
      projects: formattedProjects,
      contactNotes: formattedNotes,
    });

    const resourceIntelligenceInsights = buildResourceIntelligenceInsights({
      capacitySnapshots: capacityPlain,
      scenarioPlans: scenarioPlain,
      members: formattedMembers,
    });

    const qualityWorkflowInsights = buildQualityWorkflowInsights({
      qualityReviews: qualityPlain,
      projects: formattedProjects,
    });

    const financialOversightInsights = buildFinancialOversightInsights({
      financialSummaries,
      escrowTransactions,
    });
    const talentCrm = buildTalentCrmSummary(
      talentCandidateRows,
      talentInterviewRows,
      talentOfferRows,
      talentPipelineMetricRows,
    );
    const peopleOps = buildPeopleOpsSummary(
      peopleOpsPolicyRows,
      peopleOpsReviewRows,
      peopleOpsSkillRows,
      peopleOpsWellbeingRows,
    );
    const opportunityBoard = buildOpportunityBoardSummary(internalOpportunityRows, internalMatchRows);
    const branding = buildBrandingSummary(brandingAssetRows, brandingApprovalRows, brandingMetricRows);

    const talentCandidatePlain = talentCandidateRows.map((candidate) => candidate.toPublicObject());
    const peopleOpsPolicyPlain = peopleOpsPolicyRows.map((policy) => policy.toPublicObject());

    const hrManagement = buildHrManagementSummary(formattedMembers, talentCandidatePlain, peopleOpsPolicyPlain);
    const capacityPlanning = buildCapacityPlanningSummary(
      membersSummary,
      talentCrm.pipelineAnalytics.history,
      opportunityBoard.opportunities ?? [],
    );
    const internalMarketplace = buildInternalMarketplaceSummary(
      formattedMembers,
      opportunityBoard.opportunities ?? [],
      opportunityBoard.matches ?? [],
    );

    const talentLifecycleSummary = {
      totalCandidates: talentCrm.totals.candidates,
      conversionRate: talentCrm.conversionRate,
      wellbeingScore: peopleOps.wellbeing.averageScore,
      atRisk: peopleOps.wellbeing.atRisk,
      openInternalOpportunities: opportunityBoard.summary.open,
      brandingReach: branding.metrics.totals.reach,
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
        portfolio: projectPortfolioInsights.summary,
        workspaceOrchestrator: workspaceOrchestratorInsights.summary,
        resourceIntelligence: resourceIntelligenceInsights.summary,
        quality: qualityWorkflowInsights.summary,
        financialOversight: financialOversightInsights.summary,
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
      financials: escrowTransactions,
      gigFinancials: gigTransactions.map((row) => row.toPublicObject()),
      operatingIntelligence: {
        projectPortfolioMastery: projectPortfolioInsights,
        workspaceOrchestrator: workspaceOrchestratorInsights,
        resourceIntelligence: resourceIntelligenceInsights,
        qualityAssurance: qualityWorkflowInsights,
        financialOversight: financialOversightInsights,
      talentLifecycle: {
        summary: talentLifecycleSummary,
        crm: talentCrm,
        peopleOps,
        opportunityBoard,
        branding,
        hrManagement,
        capacityPlanning,
        internalMarketplace,
      marketplaceLeadership: {
        studio: studioInsights,
        partnerPrograms: partnerProgramInsights,
        marketingAutomation: marketingAutomationInsights,
        clientAdvocacy: clientAdvocacyInsights,
      },
      refreshedAt: new Date().toISOString(),
    };
  });
}

export default {
  getAgencyDashboard,
};

