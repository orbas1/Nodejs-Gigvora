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
  ProjectOperationalSnapshot,
  ProjectDependencyLink,
  WorkspaceOperatingBlueprint,
  ResourceCapacitySnapshot,
  ResourceScenarioPlan,
  QualityReviewRun,
  FinancialEngagementSummary,
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

    const totalClients = new Set(formattedNotes.map((note) => note.subjectUserId)).size;

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
      },
      refreshedAt: new Date().toISOString(),
    };
  });
}

export default {
  getAgencyDashboard,
};

