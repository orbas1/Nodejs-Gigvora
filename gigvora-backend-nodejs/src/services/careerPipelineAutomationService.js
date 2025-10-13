import { Op } from 'sequelize';
import {
  CareerPipelineBoard,
  CareerPipelineStage,
  CareerOpportunity,
  CareerOpportunityCollaborator,
  CareerOpportunityNudge,
  CareerCandidateBrief,
  CareerInterviewWorkspace,
  CareerInterviewTask,
  CareerInterviewScorecard,
  CareerOfferPackage,
  CareerOfferScenario,
  CareerOfferDocument,
  CareerAutoApplyRule,
  CareerAutoApplyTestRun,
  CareerAutoApplyAnalytics,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'dashboard:user:career-pipeline';
const CACHE_TTL_SECONDS = 60;

function normalizeUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function differenceInHours(from, to = new Date()) {
  if (!from) return null;
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const end = new Date(to);
  return Number(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2));
}

function buildShareUrl(code) {
  if (!code) return null;
  return `https://app.gigvora.com/brief/${code}`;
}

function normalizeChecklist(checklist) {
  if (Array.isArray(checklist)) {
    return checklist;
  }
  if (checklist && typeof checklist === 'object') {
    return Object.entries(checklist).map(([label, value]) => ({ label, completed: Boolean(value?.completed ?? value) }));
  }
  return [];
}

function normalizePrompts(prompts) {
  if (Array.isArray(prompts)) {
    return prompts;
  }
  if (prompts && typeof prompts === 'object') {
    return Object.values(prompts);
  }
  return [];
}

function buildReminder(opportunity, stage, now = new Date()) {
  if (!opportunity.nextActionDueAt && !stage?.slaHours) {
    return null;
  }

  const dueAt = opportunity.nextActionDueAt ? new Date(opportunity.nextActionDueAt) : null;
  const stageDuration = differenceInHours(opportunity.stageEnteredAt, now);
  const overdueBySla = stage?.slaHours && stageDuration != null ? stageDuration - stage.slaHours : null;
  const isOverdue = opportunity.followUpStatus === 'overdue' || (overdueBySla != null && overdueBySla > 0);

  const recommendation = isOverdue
    ? 'Stage breached SLA — send an escalation update and log recruiter outreach.'
    : 'Due soon — share progress notes and confirm next touchpoint with the recruiter.';

  return {
    opportunityId: opportunity.id,
    title: opportunity.title,
    companyName: opportunity.companyName,
    dueAt: dueAt ? dueAt.toISOString() : null,
    stageKey: stage?.key ?? null,
    stageName: stage?.name ?? null,
    followUpStatus: opportunity.followUpStatus,
    severity: isOverdue ? 'critical' : opportunity.followUpStatus === 'attention' ? 'warning' : 'info',
    recommendation,
  };
}

function summarizeChecklistItems(workspaces) {
  return workspaces.reduce(
    (totals, workspace) => {
      const checklist = normalizeChecklist(workspace.prepChecklist);
      const completed = checklist.filter((item) => item.completed).length;
      totals.total += checklist.length;
      totals.completed += completed;
      return totals;
    },
    { total: 0, completed: 0 },
  );
}

function summarizeScorecards(scorecards) {
  if (!scorecards.length) {
    return { averageScore: null, recommendations: {} };
  }
  const aggregate = scorecards.reduce(
    (acc, card) => {
      if (card.overallScore != null) {
        acc.scoreSum += Number(card.overallScore);
        acc.scoreCount += 1;
      }
      const current = acc.recommendations[card.recommendation] ?? 0;
      acc.recommendations[card.recommendation] = current + 1;
      return acc;
    },
    { scoreSum: 0, scoreCount: 0, recommendations: {} },
  );
  return {
    averageScore: aggregate.scoreCount ? Number((aggregate.scoreSum / aggregate.scoreCount).toFixed(2)) : null,
    recommendations: aggregate.recommendations,
  };
}

function summarizeOffers(packages) {
  if (!packages.length) {
    return {
      activeOffers: 0,
      acceptedOffers: 0,
      declinedOffers: 0,
      averageTotalValue: null,
    };
  }

  const summary = packages.reduce(
    (acc, offer) => {
      if (['review', 'negotiating'].includes(offer.status)) {
        acc.activeOffers += 1;
      }
      if (offer.status === 'accepted') {
        acc.acceptedOffers += 1;
      }
      if (offer.status === 'declined') {
        acc.declinedOffers += 1;
      }
      if (offer.totalCompValue != null) {
        acc.totalValue += Number(offer.totalCompValue);
        acc.totalValueCount += 1;
      }
      return acc;
    },
    { activeOffers: 0, acceptedOffers: 0, declinedOffers: 0, totalValue: 0, totalValueCount: 0 },
  );

  return {
    activeOffers: summary.activeOffers,
    acceptedOffers: summary.acceptedOffers,
    declinedOffers: summary.declinedOffers,
    averageTotalValue: summary.totalValueCount
      ? Number((summary.totalValue / summary.totalValueCount).toFixed(2))
      : null,
  };
}

async function loadAutomationPayload(userId) {
  const [board] = await CareerPipelineBoard.findAll({
    where: { userId },
    order: [
      ['isPrimary', 'DESC'],
      ['createdAt', 'ASC'],
    ],
    limit: 1,
  });

  if (!board) {
    return {
      generatedAt: new Date().toISOString(),
      board: null,
      kanban: { stages: [], metrics: { totalOpportunities: 0, overdueOpportunities: 0, averageStageDurationHours: null } },
      bulkOperations: { pendingBulkUpdates: 0, reminders: [] },
      candidateBriefs: [],
      compliance: { flaggedOpportunities: 0, pendingReports: 0, completedReports: 0, lastAuditAt: null, snapshots: [] },
      interviewCommandCenter: {
        workspaces: [],
        tasks: [],
        scorecards: [],
        readiness: { totalItems: 0, completedItems: 0 },
        summary: { upcoming: 0, completed: 0 },
      },
      offerVault: { packages: [], metrics: summarizeOffers([]) },
      autoApply: { rules: [], guardrails: { manualReviewRequired: 0, premiumProtected: 0 }, analytics: [] },
    };
  }

  const [stages, opportunities] = await Promise.all([
    CareerPipelineStage.findAll({ where: { boardId: board.id }, order: [['position', 'ASC']] }),
    CareerOpportunity.findAll({
      where: { boardId: board.id, userId },
      order: [
        ['lastActivityAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: 120,
    }),
  ]);

  const stageMap = new Map();
  stages.forEach((stage) => {
    stageMap.set(stage.id, stage.toPublicObject());
  });

  const opportunityIds = opportunities.map((opportunity) => opportunity.id);

  const [collaborators, nudges, briefs, interviewWorkspaces, offerPackages, autoApplyRules] = await Promise.all([
    opportunityIds.length
      ? CareerOpportunityCollaborator.findAll({ where: { opportunityId: { [Op.in]: opportunityIds } } })
      : [],
    opportunityIds.length
      ? CareerOpportunityNudge.findAll({
          where: { opportunityId: { [Op.in]: opportunityIds } },
          order: [['triggeredAt', 'DESC']],
        })
      : [],
    CareerCandidateBrief.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      limit: 20,
    }),
    CareerInterviewWorkspace.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      limit: 20,
    }),
    CareerOfferPackage.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      limit: 20,
    }),
    CareerAutoApplyRule.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      limit: 20,
    }),
  ]);

  const collaboratorMap = new Map();
  collaborators.forEach((record) => {
    const plain = record.toPublicObject();
    const list = collaboratorMap.get(plain.opportunityId) ?? [];
    list.push(plain);
    collaboratorMap.set(plain.opportunityId, list);
  });

  const nudgeMap = new Map();
  nudges.forEach((record) => {
    const plain = record.toPublicObject();
    const list = nudgeMap.get(plain.opportunityId) ?? [];
    list.push(plain);
    nudgeMap.set(plain.opportunityId, list);
  });

  const briefByOpportunity = new Map();
  briefs.forEach((record) => {
    const plain = record.toPublicObject();
    plain.shareUrl = buildShareUrl(plain.shareCode);
    if (!briefByOpportunity.has(plain.opportunityId)) {
      briefByOpportunity.set(plain.opportunityId, plain);
    }
  });

  const now = new Date();
  const stageBuckets = stages.map((stageInstance) => {
    const stage = stageInstance.toPublicObject();
    return {
      ...stage,
      opportunities: [],
      metrics: { total: 0, overdue: 0 },
    };
  });

  const stageBucketsById = new Map(stageBuckets.map((bucket) => [bucket.id, bucket]));

  const enrichedOpportunities = opportunities.map((opportunity) => {
    const plain = opportunity.toPublicObject();
    const stage = stageMap.get(plain.stageId) ?? null;
    const stageDurationHours = differenceInHours(plain.stageEnteredAt, now);
    const isOverdue = stage?.slaHours && stageDurationHours != null ? stageDurationHours > stage.slaHours : false;
    const bucket = stageBucketsById.get(plain.stageId);
    const candidateBrief = briefByOpportunity.get(plain.id) ?? null;
    const collaboratorList = collaboratorMap.get(plain.id) ?? [];
    const nudgeList = nudgeMap.get(plain.id) ?? [];

    const formatted = {
      id: plain.id,
      title: plain.title,
      companyName: plain.companyName,
      location: plain.location,
      salary: plain.salary,
      stageId: plain.stageId,
      stageKey: stage?.key ?? null,
      stageName: stage?.name ?? null,
      stageType: stage?.stageType ?? null,
      stageDurationHours,
      isOverdue,
      followUpStatus: plain.followUpStatus,
      stageEnteredAt: plain.stageEnteredAt,
      lastActivityAt: plain.lastActivityAt,
      nextActionDueAt: plain.nextActionDueAt,
      researchSummary: plain.researchSummary,
      researchLinks: plain.researchLinks,
      attachments: plain.attachments,
      collaboratorNotes: plain.collaboratorNotes,
      collaborators: collaboratorList,
      nudges: nudgeList,
      complianceStatus: plain.complianceStatus,
      equalOpportunityReport: plain.equalOpportunityReport,
      automationMetadata: plain.automationMetadata,
      candidateBrief,
    };

    if (bucket) {
      bucket.opportunities.push(formatted);
      bucket.metrics.total += 1;
      if (isOverdue || plain.followUpStatus === 'overdue') {
        bucket.metrics.overdue += 1;
      }
    }

    return formatted;
  });

  const totalOpportunities = enrichedOpportunities.length;
  const overdueOpportunities = enrichedOpportunities.filter(
    (item) => item.isOverdue || item.followUpStatus === 'overdue',
  ).length;
  const totalStageHours = enrichedOpportunities.reduce((sum, item) => {
    if (item.stageDurationHours != null) {
      return sum + item.stageDurationHours;
    }
    return sum;
  }, 0);
  const averageStageDurationHours = totalOpportunities
    ? Number((totalStageHours / totalOpportunities).toFixed(2))
    : null;

  const reminders = enrichedOpportunities
    .map((opportunity) => buildReminder(opportunity, stageMap.get(opportunity.stageId), now))
    .filter(Boolean)
    .sort((a, b) => {
      const timeA = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    })
    .slice(0, 8);

  const candidateBriefs = briefs.map((record) => {
    const plain = record.toPublicObject();
    return {
      ...plain,
      shareUrl: buildShareUrl(plain.shareCode),
    };
  });

  const compliance = enrichedOpportunities.reduce(
    (acc, opportunity) => {
      if (opportunity.complianceStatus === 'flagged') {
        acc.flaggedOpportunities += 1;
      } else if (opportunity.complianceStatus === 'pending') {
        acc.pendingReports += 1;
      } else if (opportunity.complianceStatus === 'complete') {
        acc.completedReports += 1;
      }

      const report = opportunity.equalOpportunityReport;
      if (report?.submittedAt) {
        const timestamp = new Date(report.submittedAt).getTime();
        if (!Number.isNaN(timestamp) && timestamp > acc.lastAuditTimestamp) {
          acc.lastAuditTimestamp = timestamp;
        }
      }

      if (report) {
        acc.snapshots.push({
          opportunityId: opportunity.id,
          companyName: opportunity.companyName,
          submittedAt: report.submittedAt ?? null,
          metrics: report.metrics ?? null,
        });
      }

      return acc;
    },
    {
      flaggedOpportunities: 0,
      pendingReports: 0,
      completedReports: 0,
      lastAuditTimestamp: 0,
      snapshots: [],
    },
  );

  const workspaces = interviewWorkspaces.map((workspace) => {
    const plain = workspace.toPublicObject();
    return {
      ...plain,
      prepChecklist: normalizeChecklist(plain.prepChecklist),
      aiPrompts: normalizePrompts(plain.aiPrompts),
    };
  });

  const workspaceIds = workspaces.map((workspace) => workspace.id);

  const [workspaceTasks, workspaceScorecards] = await Promise.all([
    workspaceIds.length
      ? CareerInterviewTask.findAll({
          where: { workspaceId: { [Op.in]: workspaceIds } },
          order: [['dueAt', 'ASC']],
        })
      : [],
    workspaceIds.length
      ? CareerInterviewScorecard.findAll({
          where: { workspaceId: { [Op.in]: workspaceIds } },
          order: [['submittedAt', 'DESC']],
        })
      : [],
  ]);

  const tasksByWorkspace = new Map();
  workspaceTasks.forEach((task) => {
    const plain = task.toPublicObject();
    const list = tasksByWorkspace.get(plain.workspaceId) ?? [];
    list.push(plain);
    tasksByWorkspace.set(plain.workspaceId, list);
  });

  const scorecardsByWorkspace = new Map();
  workspaceScorecards.forEach((scorecard) => {
    const plain = scorecard.toPublicObject();
    const list = scorecardsByWorkspace.get(plain.workspaceId) ?? [];
    list.push(plain);
    scorecardsByWorkspace.set(plain.workspaceId, list);
  });

  const enrichedWorkspaces = workspaces.map((workspace) => ({
    ...workspace,
    tasks: tasksByWorkspace.get(workspace.id) ?? [],
    scorecards: scorecardsByWorkspace.get(workspace.id) ?? [],
  }));

  const readinessSummary = summarizeChecklistItems(enrichedWorkspaces);
  const scorecardSummary = summarizeScorecards(workspaceScorecards.map((scorecard) => scorecard.toPublicObject()));

  const offerPackageIds = offerPackages.map((offer) => offer.id);
  const [offerScenarios, offerDocuments] = await Promise.all([
    offerPackageIds.length
      ? CareerOfferScenario.findAll({ where: { packageId: { [Op.in]: offerPackageIds } } })
      : [],
    offerPackageIds.length
      ? CareerOfferDocument.findAll({ where: { packageId: { [Op.in]: offerPackageIds } } })
      : [],
  ]);

  const scenarioByPackage = new Map();
  offerScenarios.forEach((scenario) => {
    const plain = scenario.toPublicObject();
    const list = scenarioByPackage.get(plain.packageId) ?? [];
    list.push(plain);
    scenarioByPackage.set(plain.packageId, list);
  });

  const documentsByPackage = new Map();
  offerDocuments.forEach((document) => {
    const plain = document.toPublicObject();
    const list = documentsByPackage.get(plain.packageId) ?? [];
    list.push(plain);
    documentsByPackage.set(plain.packageId, list);
  });

  const offerVaultPackages = offerPackages.map((offer) => {
    const plain = offer.toPublicObject();
    return {
      ...plain,
      scenarios: scenarioByPackage.get(plain.id) ?? [],
      documents: documentsByPackage.get(plain.id) ?? [],
    };
  });

  const offerMetrics = summarizeOffers(offerPackages.map((offer) => offer.toPublicObject()));

  const ruleIds = autoApplyRules.map((rule) => rule.id);
  const [testRuns, analytics] = await Promise.all([
    ruleIds.length
      ? CareerAutoApplyTestRun.findAll({
          where: { ruleId: { [Op.in]: ruleIds } },
          order: [['executedAt', 'DESC']],
        })
      : [],
    ruleIds.length
      ? CareerAutoApplyAnalytics.findAll({
          where: { ruleId: { [Op.in]: ruleIds } },
          order: [['windowEnd', 'DESC']],
        })
      : [],
  ]);

  const testRunsByRule = new Map();
  testRuns.forEach((run) => {
    const plain = run.toPublicObject();
    const list = testRunsByRule.get(plain.ruleId) ?? [];
    list.push(plain);
    testRunsByRule.set(plain.ruleId, list);
  });

  const analyticsByRule = new Map();
  analytics.forEach((record) => {
    const plain = record.toPublicObject();
    const list = analyticsByRule.get(plain.ruleId) ?? [];
    list.push(plain);
    analyticsByRule.set(plain.ruleId, list);
  });

  const autoApplyRulesEnriched = autoApplyRules.map((rule) => {
    const plain = rule.toPublicObject();
    return {
      ...plain,
      analytics: analyticsByRule.get(plain.id)?.slice(0, 3) ?? [],
      recentTestRuns: testRunsByRule.get(plain.id)?.slice(0, 3) ?? [],
    };
  });

  const sortedWorkspaceTasks = workspaceTasks
    .map((task) => task.toPublicObject())
    .sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });

  const sortedAnalytics = analytics.map((record) => record.toPublicObject());

  const manualReviewRequired = autoApplyRulesEnriched.filter((rule) => rule.requiresManualReview).length;
  const premiumProtected = autoApplyRulesEnriched.filter((rule) => rule.premiumRoleGuardrail).length;

  return {
    generatedAt: new Date().toISOString(),
    board: board.toPublicObject(),
    kanban: {
      stages: stageBuckets,
      metrics: {
        totalOpportunities,
        overdueOpportunities,
        averageStageDurationHours,
      },
    },
    bulkOperations: {
      pendingBulkUpdates: enrichedOpportunities.filter((item) => item.followUpStatus !== 'on_track').length,
      reminders,
    },
    candidateBriefs,
    compliance: {
      flaggedOpportunities: compliance.flaggedOpportunities,
      pendingReports: compliance.pendingReports,
      completedReports: compliance.completedReports,
      lastAuditAt: compliance.lastAuditTimestamp ? new Date(compliance.lastAuditTimestamp).toISOString() : null,
      snapshots: compliance.snapshots.slice(0, 10),
    },
    interviewCommandCenter: {
      workspaces: enrichedWorkspaces,
      tasks: sortedWorkspaceTasks.slice(0, 10),
      scorecards: workspaceScorecards.map((scorecard) => scorecard.toPublicObject()).slice(0, 10),
      readiness: {
        totalItems: readinessSummary.total,
        completedItems: readinessSummary.completed,
      },
      summary: {
        upcoming: enrichedWorkspaces.filter((workspace) => ['planning', 'scheduled'].includes(workspace.status)).length,
        completed: enrichedWorkspaces.filter((workspace) => workspace.status === 'completed').length,
        averageScore: scorecardSummary.averageScore,
        recommendations: scorecardSummary.recommendations,
      },
    },
    offerVault: {
      packages: offerVaultPackages,
      metrics: offerMetrics,
    },
    autoApply: {
      rules: autoApplyRulesEnriched,
      guardrails: {
        manualReviewRequired,
        premiumProtected,
      },
      analytics: sortedAnalytics.slice(0, 10),
    },
  };
}

export async function getCareerPipelineAutomation(userId, { bypassCache = false } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { userId: normalizedUserId });

  if (bypassCache) {
    return loadAutomationPayload(normalizedUserId);
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, () => loadAutomationPayload(normalizedUserId));
}

export default {
  getCareerPipelineAutomation,
};
