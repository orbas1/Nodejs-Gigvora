import { Op, fn, col, literal } from 'sequelize';

import { sequelize, Message, MessageThread, SupportCase } from '../models/messagingModels.js';
import {
  SupportPlaybook,
  SupportPlaybookStep,
  FreelancerTimelinePost,
  CompanyTimelinePost,
  AdminTimelineEvent,
  AnalyticsEvent,
  UserEvent,
  UserEventGuest,
  UserEventTask,
} from '../models/liveServiceTelemetryModels.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError } from '../utils/errors.js';

const DEFAULT_WINDOW_MINUTES = 60;
const MIN_WINDOW_MINUTES = 5;
const MAX_WINDOW_MINUTES = 24 * 60;
const CACHE_TTL_SECONDS = 30;
const MESSAGE_SAMPLE_LIMIT = 2_000;
const CASE_SAMPLE_LIMIT = 750;

const RUNBOOK_BASE_URL = (process.env.OPERATIONS_RUNBOOK_BASE_URL || process.env.DOCS_PUBLIC_BASE_URL || 'https://guides.gigvora.com/runbooks').replace(/\/$/, '');

function coerceWindowMinutes(input) {
  if (input == null || Number.isNaN(Number(input))) {
    return DEFAULT_WINDOW_MINUTES;
  }
  const value = Math.floor(Number(input));
  if (!Number.isFinite(value)) {
    return DEFAULT_WINDOW_MINUTES;
  }
  return Math.min(Math.max(value, MIN_WINDOW_MINUTES), MAX_WINDOW_MINUTES);
}

function resolveWindowRange(windowMinutes) {
  const now = new Date();
  const since = new Date(now.getTime() - windowMinutes * 60_000);
  return { since, until: now };
}

function average(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return null;
  }
  const finite = numbers.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (!finite.length) {
    return null;
  }
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function median(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return null;
  }
  const sorted = numbers
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (!sorted.length) {
    return null;
  }
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function safePercentage(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
}

function normaliseChannelMetadata(thread) {
  const metadata = thread?.metadata && typeof thread.metadata === 'object' ? thread.metadata : {};
  return {
    slug: metadata.channelSlug ?? metadata.slug ?? null,
    name: metadata.channelName ?? metadata.name ?? thread?.subject ?? `thread-${thread?.id ?? 'unknown'}`,
    retentionDays: metadata.retentionDays ?? null,
  };
}

function buildIncidentSignals({ chat, inbox, analytics }) {
  const notes = [];
  let severityRank = 0;

  if (chat.flaggedRatio > 0.15 || chat.moderationBacklog >= 10) {
    severityRank = Math.max(severityRank, 2);
    notes.push('Community moderation backlog is rising — prioritise review queue triage.');
  }

  if (inbox.breachedSlaCases > 0 || inbox.awaitingFirstResponse > 0) {
    severityRank = Math.max(severityRank, 3);
    notes.push('Support SLA breaches detected — review escalations and redistribute coverage.');
  }

  if (analytics.ingestionLagSeconds != null && analytics.ingestionLagSeconds > 300) {
    severityRank = Math.max(severityRank, 4);
    notes.push('Analytics ingestion lag exceeds five minutes — verify exporter and queue health.');
  }

  if (severityRank === 0) {
    notes.push('Live services operating within expected thresholds. Continue scheduled runbook checks.');
  }

  const severity = severityRank >= 4 ? 'critical' : severityRank >= 3 ? 'elevated' : severityRank >= 2 ? 'warning' : 'normal';

  return { severity, notes };
}

async function loadTimelineStats({ since, until, likeOperator }) {
  const [
    freelancerPublished,
    companyPublished,
    adminMoments,
    freelancerScheduledSoon,
    companyScheduledSoon,
    adminScheduledSoon,
    freelancerOverdue,
    companyOverdue,
  ] = await Promise.all([
    FreelancerTimelinePost.count({ where: { status: 'published', publishedAt: { [Op.between]: [since, until] } } }),
    CompanyTimelinePost.count({ where: { status: 'published', publishedAt: { [Op.between]: [since, until] } } }),
    AdminTimelineEvent.count({ where: { createdAt: { [Op.between]: [since, until] } } }),
    FreelancerTimelinePost.count({
      where: {
        status: 'scheduled',
        scheduledAt: { [Op.between]: [until, new Date(until.getTime() + 60 * 60_000)] },
      },
    }),
    CompanyTimelinePost.count({
      where: {
        status: 'scheduled',
        scheduledFor: { [Op.between]: [until, new Date(until.getTime() + 60 * 60_000)] },
      },
    }),
    AdminTimelineEvent.count({
      where: {
        status: { [Op.ne]: 'complete' },
        startDate: { [Op.between]: [until, new Date(until.getTime() + 60 * 60_000)] },
      },
    }),
    FreelancerTimelinePost.count({ where: { status: 'scheduled', scheduledAt: { [Op.lt]: until }, publishedAt: null } }),
    CompanyTimelinePost.count({ where: { status: 'scheduled', scheduledFor: { [Op.lt]: until }, publishedAt: null } }),
  ]);

  const timelineEventRows = await AnalyticsEvent.findAll({
    attributes: ['eventName', [fn('COUNT', col('eventName')), 'count']],
    where: {
      occurredAt: { [Op.gte]: since },
      [Op.or]: [
        { eventName: { [likeOperator]: 'timeline.%' } },
        { eventName: { [likeOperator]: 'community.timeline.%' } },
      ],
    },
    group: ['eventName'],
    order: [[literal('count'), 'DESC']],
    limit: 6,
  });

  return {
    windowPublished: freelancerPublished + companyPublished,
    adminEventsRecorded: adminMoments,
    scheduledNextHour: freelancerScheduledSoon + companyScheduledSoon + adminScheduledSoon,
    overdue: freelancerOverdue + companyOverdue,
    trendingEvents: timelineEventRows.map((row) => ({
      eventName: row.get('eventName'),
      count: Number(row.get('count')),
    })),
  };
}

async function loadChatStats({ since, until }) {
  const baseWhere = { createdAt: { [Op.between]: [since, until] } };

  const [totalMessages, distinctThreads] = await Promise.all([
    Message.count({ where: baseWhere }),
    Message.count({ where: baseWhere, distinct: true, col: 'threadId' }),
  ]);

  const messageCountsByThread = await Message.findAll({
    attributes: ['threadId', [fn('COUNT', col('id')), 'messageCount']],
    where: baseWhere,
    group: ['threadId'],
    order: [[literal('messageCount'), 'DESC']],
    limit: 20,
  });

  const threadIds = messageCountsByThread.map((row) => row.get('threadId')).filter(Boolean);
  const threads = threadIds.length
    ? await MessageThread.findAll({ where: { id: { [Op.in]: threadIds } } })
    : [];
  const threadsById = new Map(threads.map((thread) => [thread.id, thread]));

  const busiestChannels = messageCountsByThread.map((row) => {
    const threadId = row.get('threadId');
    const messageCount = Number(row.get('messageCount'));
    const thread = threadsById.get(threadId) ?? null;
    const metadata = normaliseChannelMetadata(thread);
    return {
      threadId,
      channelSlug: metadata.slug,
      channelName: metadata.name,
      messageCount,
    };
  });

  const sampleSize = totalMessages > 0 ? Math.min(MESSAGE_SAMPLE_LIMIT, totalMessages) : 0;
  const messageSample = sampleSize
    ? await Message.findAll({
        attributes: ['id', 'threadId', 'messageType', 'metadata', 'createdAt'],
        where: baseWhere,
        order: [['createdAt', 'DESC']],
        limit: sampleSize,
      })
    : [];

  const moderationScores = [];
  let moderationBacklog = 0;
  let flaggedMessages = 0;

  messageSample.forEach((message) => {
    const moderation = message?.metadata?.moderation;
    if (moderation && typeof moderation === 'object') {
      const status = `${moderation.status ?? ''}`.toLowerCase();
      const score = Number(moderation.score);
      if (Number.isFinite(score)) {
        moderationScores.push(score);
      }
      if (status && status !== 'approved') {
        flaggedMessages += 1;
        if (status === 'pending_review' || status === 'escalated') {
          moderationBacklog += 1;
        }
      }
    }
  });

  const averageModerationScore = average(moderationScores);
  const flaggedRatio = safePercentage(flaggedMessages, sampleSize || totalMessages || 1);

  return {
    totalMessages,
    activeThreads: distinctThreads,
    sampleSize,
    flaggedMessages,
    flaggedRatio,
    moderationBacklog,
    averageModerationScore,
    busiestChannels,
  };
}

function extractSlaMetadata(supportCase) {
  const metadata = supportCase?.metadata && typeof supportCase.metadata === 'object' ? supportCase.metadata : {};
  const sla = metadata.sla && typeof metadata.sla === 'object' ? metadata.sla : {};
  return sla;
}

async function loadInboxStats({ since, until }) {
  const activeStatuses = ['triage', 'in_progress', 'waiting_on_customer'];

  const [openCases, awaitingFirstResponse, backlogByPriorityRows] = await Promise.all([
    SupportCase.count({ where: { status: { [Op.in]: activeStatuses } } }),
    SupportCase.count({ where: { status: 'triage', firstResponseAt: null } }),
    SupportCase.findAll({
      attributes: ['priority', [fn('COUNT', col('id')), 'count']],
      where: { status: { [Op.in]: activeStatuses } },
      group: ['priority'],
    }),
  ]);

  const backlogByPriority = backlogByPriorityRows.reduce(
    (accumulator, row) => {
      const priority = `${row.get('priority') ?? ''}`.toLowerCase();
      const count = Number(row.get('count')) || 0;
      accumulator[priority] = count;
      return accumulator;
    },
    { low: 0, medium: 0, high: 0, urgent: 0 },
  );

  const caseSampleLimit = openCases > 0 ? Math.min(CASE_SAMPLE_LIMIT, openCases) : 0;
  const caseSample = caseSampleLimit
    ? await SupportCase.findAll({
        where: { status: { [Op.in]: activeStatuses } },
        order: [['createdAt', 'DESC']],
        limit: caseSampleLimit,
      })
    : [];

  const firstResponseMinutes = [];
  let breachedSlaCases = 0;
  let escalationsLastWindow = 0;

  caseSample.forEach((supportCase) => {
    if (supportCase.firstResponseAt && supportCase.createdAt) {
      const deltaMs = new Date(supportCase.firstResponseAt).getTime() - new Date(supportCase.createdAt).getTime();
      if (Number.isFinite(deltaMs) && deltaMs >= 0) {
        firstResponseMinutes.push(deltaMs / 60_000);
      }
    }
    const sla = extractSlaMetadata(supportCase);
    if (sla.firstResponseBreachedAt || sla.resolutionBreachedAt) {
      breachedSlaCases += 1;
    }
    if (sla.escalatedAt) {
      const escalatedAt = new Date(sla.escalatedAt);
      if (Number.isFinite(escalatedAt.getTime()) && escalatedAt >= since && escalatedAt <= until) {
        escalationsLastWindow += 1;
      }
    }
  });

  return {
    openCases,
    awaitingFirstResponse,
    backlogByPriority,
    breachedSlaCases,
    escalationsLastWindow,
    medianFirstResponseMinutes: median(firstResponseMinutes),
    sampleSize: caseSampleLimit,
  };
}

async function loadEventStats({ since, until }) {
  const [liveNow, startingSoon, cancellations] = await Promise.all([
    UserEvent.count({
      where: {
        [Op.or]: [
          { status: 'in_progress' },
          {
            startAt: { [Op.lte]: until },
            endAt: { [Op.gte]: since },
            status: { [Op.notIn]: ['cancelled', 'archived'] },
          },
        ],
      },
    }),
    UserEvent.count({
      where: {
        status: { [Op.notIn]: ['cancelled', 'archived'] },
        startAt: { [Op.between]: [until, new Date(until.getTime() + 2 * 60 * 60_000)] },
      },
    }),
    UserEvent.count({ where: { status: 'cancelled', updatedAt: { [Op.between]: [since, until] } } }),
  ]);

  const upcomingEvents = await UserEvent.findAll({
    attributes: ['id', 'title', 'status', 'format', 'visibility', 'startAt', 'endAt', 'capacity'],
    where: {
      status: { [Op.notIn]: ['cancelled', 'archived'] },
      startAt: { [Op.gte]: since },
    },
    order: [['startAt', 'ASC']],
    limit: 5,
  });

  const eventIds = upcomingEvents.map((event) => event.id);
  const attendanceRows = eventIds.length
    ? await UserEventGuest.findAll({
        attributes: [
          'eventId',
          [fn('SUM', col('seatsReserved')), 'reserved'],
          [fn('SUM', literal("CASE WHEN status IN ('confirmed','checked_in') THEN seatsReserved ELSE 0 END")), 'committed'],
          [fn('SUM', literal("CASE WHEN status = 'checked_in' THEN seatsReserved ELSE 0 END")), 'checkedIn'],
        ],
        where: { eventId: { [Op.in]: eventIds } },
        group: ['eventId'],
      })
    : [];

  const attendanceByEvent = attendanceRows.reduce((accumulator, row) => {
    accumulator.set(row.get('eventId'), {
      reserved: Number(row.get('reserved')) || 0,
      committed: Number(row.get('committed')) || 0,
      checkedIn: Number(row.get('checkedIn')) || 0,
    });
    return accumulator;
  }, new Map());

  const tasksAtRisk = await UserEventTask.count({
    where: {
      status: { [Op.not]: 'done' },
      dueAt: { [Op.lte]: new Date(until.getTime() + 6 * 60 * 60_000) },
    },
  });

  const upcoming = upcomingEvents.map((event) => {
    const attendance = attendanceByEvent.get(event.id) ?? { reserved: 0, committed: 0, checkedIn: 0 };
    const capacity = Number(event.capacity) || null;
    const commitmentRate = capacity
      ? safePercentage(Math.min(attendance.committed, capacity), capacity)
      : safePercentage(attendance.committed, attendance.reserved || capacity || 1);
    return {
      id: event.id,
      title: event.title,
      status: event.status,
      format: event.format,
      visibility: event.visibility,
      startAt: event.startAt,
      endAt: event.endAt,
      capacity,
      commitmentRate,
      checkedIn: attendance.checkedIn,
    };
  });

  return {
    liveNow,
    startingSoon,
    cancellationsLastWindow: cancellations,
    tasksAtRisk,
    upcoming,
  };
}

async function loadAnalyticsSummary({ since }) {
  const topEvents = await AnalyticsEvent.findAll({
    attributes: ['eventName', [fn('COUNT', col('eventName')), 'count']],
    where: { occurredAt: { [Op.gte]: since } },
    group: ['eventName'],
    order: [[literal('count'), 'DESC']],
    limit: 10,
  });

  const latestEvent = await AnalyticsEvent.findOne({
    attributes: ['ingestedAt'],
    order: [['ingestedAt', 'DESC']],
  });

  const ingestionLagSeconds = latestEvent?.ingestedAt
    ? Math.max(0, Math.round((Date.now() - new Date(latestEvent.ingestedAt).getTime()) / 1000))
    : null;

  return {
    topEvents: topEvents.map((row) => ({
      eventName: row.get('eventName'),
      count: Number(row.get('count')),
    })),
    ingestionLagSeconds,
  };
}

async function loadRunbookReferences() {
  const playbooks = await SupportPlaybook.findAll({
    attributes: ['slug', 'title', 'summary', 'channel', 'persona', 'csatImpact', 'updatedAt'],
    where: {
      channel: { [Op.in]: ['inbox', 'chat', 'community', 'platform'] },
    },
    order: [['updatedAt', 'DESC']],
    limit: 6,
  });

  return playbooks.map((playbook) => ({
    slug: playbook.slug,
    title: playbook.title,
    summary: playbook.summary,
    channel: playbook.channel,
    persona: playbook.persona,
    csatImpact: playbook.csatImpact,
    url: `${RUNBOOK_BASE_URL}/${playbook.slug}`,
  }));
}

export async function sampleLiveServiceTelemetry({ windowMinutes, forceRefresh = false } = {}) {
  if (windowMinutes != null && (Number.isNaN(Number(windowMinutes)) || Number(windowMinutes) <= 0)) {
    throw new ValidationError('windowMinutes must be a positive integer.');
  }

  const resolvedWindow = coerceWindowMinutes(windowMinutes);
  const cacheKey = buildCacheKey('live-services:telemetry', { window: resolvedWindow });

  if (forceRefresh) {
    appCache.delete(cacheKey);
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const { since, until } = resolveWindowRange(resolvedWindow);
    const likeOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

    const [timeline, chat, inbox, events, analytics, runbooks] = await Promise.all([
      loadTimelineStats({ since, until, likeOperator }),
      loadChatStats({ since, until }),
      loadInboxStats({ since, until }),
      loadEventStats({ since, until }),
      loadAnalyticsSummary({ since }),
      loadRunbookReferences(),
    ]);

    const incidentSignals = buildIncidentSignals({ chat, inbox, analytics });

    return {
      generatedAt: new Date().toISOString(),
      window: {
        minutes: resolvedWindow,
        since: since.toISOString(),
        until: until.toISOString(),
      },
      timeline,
      chat,
      inbox,
      events,
      analytics,
      incidentSignals,
      runbooks,
    };
  });
}

export default {
  sampleLiveServiceTelemetry,
};
