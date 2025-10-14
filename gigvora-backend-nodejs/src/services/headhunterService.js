import { Op } from 'sequelize';

import { ProviderAvailabilityWindow, ProviderWellbeingLog } from '../models/headhunterExtras.js';
import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderContactNote,
  SupportKnowledgeArticle,
  Application,
  MessageThread,
  Message,
  Profile,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function coerceDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function average(values, fallback = 0) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) {
    return fallback;
  }
  const total = valid.reduce((sum, value) => sum + value, 0);
  return total / valid.length;
}

function sum(values) {
  return values.filter((value) => Number.isFinite(value)).reduce((acc, value) => acc + value, 0);
}

function normaliseStage(status = '') {
  const value = status.toLowerCase();
  if (['interview', 'interviewing', 'onsite'].includes(value)) return 'interviewing';
  if (['offer', 'offer_extended', 'offer_made'].includes(value)) return 'offer';
  if (['hired', 'accepted'].includes(value)) return 'hired';
  if (['rejected', 'withdrawn', 'closed', 'pass'].includes(value)) return 'closed';
  return value || 'submitted';
}

function buildPipelineSummary(applications, lookbackDate) {
  const withinRange = applications.filter((application) => {
    const submittedAt = coerceDate(application.submittedAt) ?? coerceDate(application.createdAt);
    return !lookbackDate || !submittedAt || submittedAt >= lookbackDate;
  });

  const stageMap = new Map();
  withinRange.forEach((application) => {
    const key = normaliseStage(application.status ?? application.stage);
    stageMap.set(key, (stageMap.get(key) ?? 0) + 1);
  });

  const stageBreakdown = Array.from(stageMap.entries()).map(([key, count]) => ({
    key,
    label: key.replace(/_/g, ' '),
    count,
  }));

  const decisionDurations = withinRange
    .map((application) => {
      const submittedAt = coerceDate(application.submittedAt);
      const decisionAt = coerceDate(application.decisionAt);
      if (!submittedAt || !decisionAt) {
        return null;
      }
      return Math.max(0, (decisionAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));
    })
    .filter((value) => value != null);

  return {
    totals: {
      applications: withinRange.length,
      interviews: stageMap.get('interviewing') ?? 0,
      offers: stageMap.get('offer') ?? 0,
      hires: stageMap.get('hired') ?? 0,
    },
    stageBreakdown,
    interviewVelocityDays: decisionDurations.length ? Number(average(decisionDurations).toFixed(1)) : null,
  };
}

function buildCandidateSpotlight(applications, profileMap) {
  if (!applications.length) {
    return [];
  }

  const sorted = [...applications].sort((a, b) => {
    const aTouched = coerceDate(a.metadata?.lastTouchpointAt ?? a.updatedAt) ?? new Date(0);
    const bTouched = coerceDate(b.metadata?.lastTouchpointAt ?? b.updatedAt) ?? new Date(0);
    return bTouched - aTouched;
  });

  return sorted.slice(0, 5).map((application) => {
    const candidateProfile = profileMap.get(application.applicantId);
    return {
      userId: application.applicantId,
      name: candidateProfile?.name ?? candidateProfile?.headline ?? null,
      availability: candidateProfile?.availabilityStatus ?? null,
      trustScore: candidateProfile?.trustScore ?? null,
      activeApplication: {
        id: application.id,
        projectId: application.targetId ?? null,
        stage: normaliseStage(application.status),
        submittedAt: application.submittedAt,
        notes: ensureArray(application.metadata?.notes),
      },
    };
  });
}

function buildPassOnSummary(applications) {
  const passOnRecords = applications.filter((application) => application.metadata?.passOnTargets);
  return {
    totalCandidates: passOnRecords.length,
    recentShares: passOnRecords.slice(0, 10).map((application) => ({
      userId: application.applicantId,
      sharedAt: application.metadata?.sharedAt ?? application.decisionAt ?? application.updatedAt,
      targets: application.metadata?.passOnTargets ?? {},
    })),
  };
}

function buildOutreachPerformance(threads, messages, lookbackDate) {
  const threadIds = threads.map((thread) => thread.id);
  const messagesByThread = new Map(threadIds.map((id) => [id, []]));
  messages.forEach((message) => {
    if (!messagesByThread.has(message.threadId)) {
      messagesByThread.set(message.threadId, []);
    }
    messagesByThread.get(message.threadId).push(message);
  });

  const recentThreads = threads.filter((thread) => {
    const createdAt = coerceDate(thread.createdAt);
    return !lookbackDate || !createdAt || createdAt >= lookbackDate;
  });

  const totalMessages = sum(messages.map((message) => (message.body ? 1 : 0)));
  const repliedThreads = recentThreads.filter((thread) => {
    const threadMessages = messagesByThread.get(thread.id) ?? [];
    return threadMessages.some((message) => message.metadata?.direction === 'inbound');
  });

  return {
    campaignCount: recentThreads.length,
    totalMessages,
    responseRate: recentThreads.length
      ? Number(((repliedThreads.length / recentThreads.length) * 100).toFixed(1))
      : 0,
  };
}

function buildClientPartnerships(notes) {
  if (!notes.length) {
    return { totalClients: 0, latestNotes: [] };
  }

  const latestNotes = [...notes]
    .sort((a, b) => (coerceDate(b.createdAt) ?? new Date(0)) - (coerceDate(a.createdAt) ?? new Date(0)))
    .slice(0, 5)
    .map((note) => ({
      id: note.id,
      subjectUserId: note.subjectUserId,
      authorId: note.authorId,
      note: note.note,
      createdAt: note.createdAt,
    }));

  const uniqueClients = new Set(notes.map((note) => note.subjectUserId).filter(Boolean));

  return {
    totalClients: uniqueClients.size,
    latestNotes,
  };
}

function buildAvailabilitySummary(windows) {
  return {
    windows: windows.map((window) => ({
      id: window.id,
      memberId: window.memberId,
      dayOfWeek: window.dayOfWeek,
      startTimeUtc: window.startTimeUtc,
      endTimeUtc: window.endTimeUtc,
      availabilityType: window.availabilityType,
      broadcastChannels: ensureArray(window.broadcastChannels),
    })),
  };
}

function buildWellbeingSummary(logs, memberCount) {
  if (!logs.length) {
    return {
      metrics: {
        workloadPerMember: memberCount ? Number((1 / memberCount).toFixed(2)) : 0,
        burnoutRisk: 'unknown',
        wellbeingScore: null,
      },
      recentLogs: [],
    };
  }

  const workloadScores = logs.map((log) => Number(log.workloadScore)).filter((value) => Number.isFinite(value));
  const wellbeingScores = logs.map((log) => Number(log.wellbeingScore)).filter((value) => Number.isFinite(value));
  const stressScores = logs.map((log) => Number(log.stressScore)).filter((value) => Number.isFinite(value));

  const averageWorkload = workloadScores.length ? average(workloadScores) : 0;
  const averageWellbeing = wellbeingScores.length ? average(wellbeingScores) : null;
  const averageStress = stressScores.length ? average(stressScores) : null;

  const burnoutRisk = averageStress != null && averageStress >= 6 ? 'elevated' : averageStress != null ? 'steady' : 'unknown';

  const recentLogs = [...logs]
    .sort((a, b) => (coerceDate(b.recordedAt) ?? new Date(0)) - (coerceDate(a.recordedAt) ?? new Date(0)))
    .slice(0, 5)
    .map((log) => ({
      id: log.id,
      recordedAt: log.recordedAt,
      energyScore: log.energyScore,
      stressScore: log.stressScore,
      wellbeingScore: log.wellbeingScore,
      notes: log.metadata?.note ?? null,
    }));

  return {
    metrics: {
      workloadPerMember: Number((averageWorkload / Math.max(1, memberCount)).toFixed(2)),
      burnoutRisk,
      wellbeingScore: averageWellbeing != null ? Number(averageWellbeing.toFixed(1)) : null,
    },
    recentLogs,
  };
}

function buildKnowledgeBaseSummary(articles, workspaceSlug) {
  if (!articles.length) {
    return { totalArticles: 0, featured: [] };
  }

  const sorted = [...articles]
    .sort((a, b) => (coerceDate(b.lastReviewedAt) ?? new Date(0)) - (coerceDate(a.lastReviewedAt) ?? new Date(0)));

  const featured = sorted
    .slice(0, 3)
    .map((article) => ({ id: article.id, slug: article.slug, title: article.title, summary: article.summary }));

  return {
    totalArticles: articles.length,
    featured,
    workspaceMatches: articles.filter((article) => ensureArray(article.tags).some((tag) => tag.includes(workspaceSlug))).length,
  };
}

function buildInsights(pipelineSummary, outreachPerformance, wellbeingSummary, hasScopedData) {
  const pipelineValue = (pipelineSummary.totals.applications ?? 0) * 1000 + (pipelineSummary.totals.offers ?? 0) * 5000;

  const alerts = [];
  if (outreachPerformance.responseRate < 30 && outreachPerformance.campaignCount > 0) {
    alerts.push({
      type: 'outreach',
      level: 'warning',
      message: 'Low reply rate detected in recent outreach sequences.',
    });
  }
  if (wellbeingSummary.metrics.burnoutRisk === 'elevated') {
    alerts.push({
      type: 'wellbeing',
      level: 'warning',
      message: 'Team stress indicators are elevated. Consider reallocating workload.',
    });
  }

  return {
    metrics: {
      pipelineValue: {
        label: 'Projected pipeline value',
        value: Number(pipelineValue.toFixed(2)),
        currency: 'USD',
      },
      outreachResponseRate: {
        label: 'Outreach response rate',
        value: outreachPerformance.responseRate,
        unit: 'percentage',
      },
      wellbeingScore: {
        label: 'Team wellbeing score',
        value: wellbeingSummary.metrics.wellbeingScore,
        unit: 'score',
      },
    },
    alerts,
    confidence: hasScopedData ? 'workspace' : 'network',
  };
}

async function loadWorkspaceContext(workspaceId) {
  const workspace = await ProviderWorkspace.findByPk(workspaceId);
  if (!workspace) {
    throw new NotFoundError('Headhunter workspace not found.');
  }

  const members = await ProviderWorkspaceMember.findAll({
    where: { workspaceId, status: 'active' },
  });

  return {
    workspace,
    members,
  };
}

function mapProfiles(profiles) {
  const map = new Map();
  profiles.forEach((profile) => {
    const plain = profile.get({ plain: true });
    map.set(profile.userId, plain);
  });
  return map;
}

export async function getDashboardSnapshot({ workspaceId, lookbackDays = 30 } = {}) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required to build the headhunter dashboard.');
  }

  const lookbackDate = coerceDate(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
  const { workspace, members } = await loadWorkspaceContext(workspaceId);

  const applications = await Application.findAll({
    where: {
      [Op.or]: [
        { metadata: { headhunterWorkspaceId: workspaceId } },
        { metadata: null },
      ],
    },
  });

  const scopedApplications = applications.filter(
    (application) => application.metadata?.headhunterWorkspaceId === workspaceId,
  );
  const hasWorkspaceScopedData = scopedApplications.length > 0;
  const effectiveApplications = hasWorkspaceScopedData ? scopedApplications : applications;

  const applicantIds = Array.from(new Set(effectiveApplications.map((application) => application.applicantId))).filter(Boolean);
  const profiles = await Profile.findAll({ where: { userId: { [Op.in]: applicantIds } } });
  const profileMap = mapProfiles(profiles);

  const threads = await MessageThread.findAll({
    where: {
      [Op.or]: [
        { metadata: { headhunterWorkspaceId: workspaceId } },
        hasWorkspaceScopedData ? null : {},
      ].filter(Boolean),
    },
  });

  const messages = await Message.findAll({
    where: {
      threadId: { [Op.in]: threads.map((thread) => thread.id) },
    },
  });

  const contactNotes = await ProviderContactNote.findAll({ where: { workspaceId } });
  const availabilityWindows = await ProviderAvailabilityWindow.findAll({ where: { workspaceId } });
  const wellbeingLogs = await ProviderWellbeingLog.findAll({ where: { workspaceId } });

  const knowledgeBaseArticles = await SupportKnowledgeArticle.findAll({
    where: {
      [Op.or]: [
        { tags: { [Op.like]: `%workspace:${workspace.slug}%` } },
        hasWorkspaceScopedData ? null : {},
      ].filter(Boolean),
    },
  });

  const pipelineSummary = buildPipelineSummary(effectiveApplications, lookbackDate);
  const candidateSpotlight = buildCandidateSpotlight(effectiveApplications, profileMap);
  const passOnNetwork = buildPassOnSummary(effectiveApplications);
  const outreachPerformance = buildOutreachPerformance(threads, messages, lookbackDate);
  const clientPartnerships = buildClientPartnerships(contactNotes);
  const calendarOrchestration = {
    availability: buildAvailabilitySummary(availabilityWindows),
  };
  const wellbeing = buildWellbeingSummary(wellbeingLogs, members.length || 1);
  const knowledgeBase = buildKnowledgeBaseSummary(knowledgeBaseArticles, workspace.slug);
  const insights = buildInsights(pipelineSummary, outreachPerformance, wellbeing, hasWorkspaceScopedData);

  const workspaceSummary = {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    timezone: workspace.timezone,
    memberCount: members.length,
  };

  return {
    workspaceSummary,
    pipelineSummary,
    candidateSpotlight,
    passOnNetwork,
    outreachPerformance,
    clientPartnerships,
    calendarOrchestration,
    wellbeing,
    knowledgeBase,
    insights,
    meta: {
      hasWorkspaceScopedData,
      fallbackReason: hasWorkspaceScopedData ? null : 'Using network-wide intelligence due to limited workspace data.',
      generatedAt: new Date().toISOString(),
    },
  };
}

export default {
  getDashboardSnapshot,
};
