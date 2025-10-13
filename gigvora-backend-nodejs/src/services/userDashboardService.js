import { Op, fn, col } from 'sequelize';
import {
  Application,
  ApplicationReview,
  ExperienceLaunchpad,
  ExperienceLaunchpadApplication,
  Job,
  Gig,
  Project,
  ProjectAssignmentEvent,
  Notification,
  SupportCase,
  SupportKnowledgeArticle,
  CareerAnalyticsSnapshot,
  CareerPeerBenchmark,
  WeeklyDigestSubscription,
  CalendarIntegration,
  CandidateCalendarEvent,
  FocusSession,
  AdvisorCollaboration,
  AdvisorCollaborationMember,
  AdvisorCollaborationAuditLog,
  AdvisorDocumentRoom,
  SupportAutomationLog,
  User,
} from '../models/index.js';
import profileService from './profileService.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'dashboard:user';
const CACHE_TTL_SECONDS = 60;

const TERMINAL_STATUSES = new Set(['withdrawn', 'rejected', 'hired']);
const OFFER_STATUSES = new Set(['offered', 'hired']);
const INTERVIEW_STATUSES = new Set(['interview']);
const FOLLOW_UP_STATUSES = new Set(['submitted', 'under_review', 'shortlisted', 'interview', 'offered']);

function normalizeUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function toPlainReviewer(instance) {
  if (!instance) return null;
  const reviewer = instance.get?.('reviewer') ?? instance.reviewer;
  if (!reviewer) return null;
  const plain = reviewer.get?.({ plain: true }) ?? reviewer;
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
  };
}

function differenceInDays(from, to = new Date()) {
  if (!from) return null;
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const end = new Date(to);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date, days) {
  const base = new Date(date);
  if (Number.isNaN(base.getTime())) {
    return null;
  }
  const clone = new Date(base);
  clone.setDate(clone.getDate() + days);
  return clone.toISOString();
}

function resolveNextStep(status) {
  switch (status) {
    case 'draft':
      return 'Finalize documents and submit the application.';
    case 'submitted':
      return 'Awaiting review — send a polite nudge if there is no update in 5 days.';
    case 'under_review':
      return 'Prepare recruiter notes and confirm availability for screening.';
    case 'shortlisted':
      return 'Expect interview scheduling — review role research notes.';
    case 'interview':
      return 'Confirm interview logistics and share prep material with collaborators.';
    case 'offered':
      return 'Review compensation details and compare against target ranges.';
    case 'hired':
      return 'Complete onboarding checklist and archive supporting documents.';
    case 'withdrawn':
      return 'Archive the record and capture learnings for future opportunities.';
    case 'rejected':
    default:
      return 'Close out the record and note any feedback for retrospectives.';
  }
}

function sanitizeApplication(application, targetMap) {
  if (!application) return null;
  const base = application.toPublicObject();
  const target = targetMap.get(`${base.targetType}:${base.targetId}`) ?? null;
  const reviews = Array.isArray(application.reviews)
    ? application.reviews.map((review) => ({
        ...review.toPublicObject(),
        reviewer: toPlainReviewer(review),
      }))
    : [];

  const submittedAt = base.submittedAt ?? base.createdAt ?? base.updatedAt;
  const daysSinceUpdate = differenceInDays(base.updatedAt ?? base.createdAt ?? base.submittedAt);

  return {
    ...base,
    target,
    reviews,
    nextStep: resolveNextStep(base.status),
    daysSinceSubmission: submittedAt ? differenceInDays(submittedAt) : null,
    daysSinceUpdate,
  };
}

function sanitizeNotification(notification) {
  const plain = notification.toPublicObject();
  return {
    ...plain,
    isUnread: !plain.readAt,
  };
}

function toPlainTarget(instance) {
  if (!instance) return null;
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return { ...instance };
}

function sanitizeLaunchpadApplication(record) {
  const base = record.toPublicObject();
  const launchpadInstance = record.get?.('launchpad') ?? record.launchpad;
  const launchpad = launchpadInstance?.toPublicObject?.() ?? null;
  return {
    ...base,
    launchpad,
  };
}

function sanitizeProjectEvent(event) {
  const base = event.toPublicObject();
  const projectInstance = event.get?.('project') ?? event.project;
  const project = projectInstance?.toPublicObject?.() ?? null;
  return {
    ...base,
    project,
  };
}

function collectAttachments(applications) {
  const attachments = [];
  applications.forEach((application) => {
    const appPlain = application.toPublicObject();
    if (Array.isArray(appPlain.attachments)) {
      appPlain.attachments.forEach((attachment) => {
        attachments.push({
          ...attachment,
          applicationId: appPlain.id,
          targetType: appPlain.targetType,
          targetId: appPlain.targetId,
          uploadedAt: appPlain.updatedAt,
        });
      });
    }
  });
  return attachments;
}

function buildFollowUps(applications, targetMap) {
  const now = new Date();
  const items = [];

  applications.forEach((application) => {
    const base = application.toPublicObject();
    if (!FOLLOW_UP_STATUSES.has(base.status)) {
      return;
    }
    const referenceDate = base.updatedAt ?? base.submittedAt ?? base.createdAt;
    if (!referenceDate) {
      return;
    }
    const daysSince = differenceInDays(referenceDate, now);
    const threshold = base.status === 'submitted' ? 5 : base.status === 'offered' ? 2 : 3;
    const dueAt = addDays(referenceDate, threshold);
    const target = targetMap.get(`${base.targetType}:${base.targetId}`) ?? {};
    const targetName = target?.title || target?.name || `#${base.targetId}`;

    items.push({
      applicationId: base.id,
      targetName,
      status: base.status,
      nextStep: resolveNextStep(base.status),
      dueAt,
      overdue: daysSince > threshold,
      daysSinceUpdate: differenceInDays(referenceDate, now),
    });
  });

  return items
    .sort((a, b) => {
      if (a.overdue !== b.overdue) {
        return a.overdue ? -1 : 1;
      }
      return (new Date(a.dueAt || now)).getTime() - (new Date(b.dueAt || now)).getTime();
    })
    .slice(0, 8);
}

function toPlain(instance, options = {}) {
  if (!instance) return null;
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject(options);
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true, ...options });
  }
  return { ...instance };
}

function computeChange(current, previous) {
  if (current == null || previous == null) {
    return null;
  }
  const delta = Number(current) - Number(previous);
  const percent = Number(previous) === 0 ? null : (delta / Number(previous)) * 100;
  return {
    absolute: Math.round(delta * 100) / 100,
    percent: percent == null ? null : Math.round(percent * 10) / 10,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  };
}

function sanitizeCareerSnapshot(snapshot) {
  const plain = toPlain(snapshot);
  if (!plain) return null;
  return {
    id: plain.id,
    timeframeStart: plain.timeframeStart,
    timeframeEnd: plain.timeframeEnd,
    outreachConversionRate: plain.outreachConversionRate == null ? null : Number(plain.outreachConversionRate),
    interviewMomentum: plain.interviewMomentum == null ? null : Number(plain.interviewMomentum),
    offerWinRate: plain.offerWinRate == null ? null : Number(plain.offerWinRate),
    salaryMedian: plain.salaryMedian == null ? null : Number(plain.salaryMedian),
    salaryCurrency: plain.salaryCurrency ?? 'USD',
    salaryTrend: plain.salaryTrend ?? 'flat',
    diversityRepresentation: plain.diversityRepresentation ?? null,
    funnelBreakdown: plain.funnelBreakdown ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitizeBenchmark(benchmark) {
  const plain = toPlain(benchmark);
  if (!plain) return null;
  return {
    id: plain.id,
    cohortKey: plain.cohortKey,
    metric: plain.metric,
    value: plain.value == null ? null : Number(plain.value),
    percentile: plain.percentile == null ? null : Number(plain.percentile),
    sampleSize: plain.sampleSize == null ? null : Number(plain.sampleSize),
    capturedAt: plain.capturedAt,
    metadata: plain.metadata ?? null,
  };
}

function sanitizeCalendarIntegrationRecord(integration) {
  const plain = toPlain(integration);
  if (!plain) return null;
  return {
    id: plain.id,
    provider: plain.provider,
    externalAccount: plain.externalAccount,
    status: plain.status,
    lastSyncedAt: plain.lastSyncedAt,
    syncError: plain.syncError,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitizeCalendarEventRecord(event) {
  const plain = toPlain(event);
  if (!plain) return null;
  return {
    id: plain.id,
    title: plain.title,
    eventType: plain.eventType,
    source: plain.source,
    startsAt: plain.startsAt,
    endsAt: plain.endsAt,
    location: plain.location,
    isFocusBlock: Boolean(plain.isFocusBlock),
    focusMode: plain.focusMode,
    metadata: plain.metadata ?? null,
  };
}

function sanitizeFocusSessionRecord(session) {
  const plain = toPlain(session);
  if (!plain) return null;
  return {
    id: plain.id,
    focusType: plain.focusType,
    startedAt: plain.startedAt,
    endedAt: plain.endedAt,
    durationMinutes: plain.durationMinutes == null ? null : Number(plain.durationMinutes),
    completed: Boolean(plain.completed),
    notes: plain.notes,
    metadata: plain.metadata ?? null,
  };
}

function sanitizeAuditLogRecord(log) {
  const plain = toPlain(log);
  if (!plain) return null;
  const actorInstance = log?.get?.('actor') ?? log.actor ?? plain.actor;
  const actor = actorInstance
    ? {
        id: actorInstance.id,
        firstName: actorInstance.firstName,
        lastName: actorInstance.lastName,
        email: actorInstance.email,
      }
    : null;
  return {
    id: plain.id,
    collaborationId: plain.collaborationId,
    actor,
    action: plain.action,
    scope: plain.scope,
    details: plain.details ?? null,
    createdAt: plain.createdAt,
  };
}

function sanitizeCollaborationRecord(collaboration, auditLogMap = new Map()) {
  const base = toPlain(collaboration);
  if (!base) return null;
  const members = Array.isArray(collaboration?.members)
    ? collaboration.members.map((member) => {
        const memberPlain = toPlain(member) ?? {};
        const userInstance = member?.get?.('member') ?? member.member ?? null;
        const user = userInstance
          ? {
              id: userInstance.id,
              firstName: userInstance.firstName,
              lastName: userInstance.lastName,
              email: userInstance.email,
            }
          : null;
        return {
          ...memberPlain,
          user,
        };
      })
    : [];

  const documentRooms = Array.isArray(collaboration?.documentRooms)
    ? collaboration.documentRooms.map((room) => toPlain(room)).filter(Boolean)
    : [];

  const auditTrail = auditLogMap.get(base.id) ?? [];

  return {
    ...base,
    members,
    documentRooms,
    auditTrail,
  };
}

function sanitizeSupportCaseRecord(supportCase) {
  if (!supportCase) return null;
  const plain = supportCase.get({ plain: true });
  const assignedAgentInstance = supportCase.get?.('assignedAgent') ?? plain.assignedAgent ?? null;
  const assignedAgent = assignedAgentInstance
    ? {
        id: assignedAgentInstance.id,
        firstName: assignedAgentInstance.firstName,
        lastName: assignedAgentInstance.lastName,
        email: assignedAgentInstance.email,
      }
    : null;

  const openedAt = plain.escalatedAt ?? plain.createdAt ?? null;
  const now = new Date();
  const ageHours = openedAt ? Math.round((now.getTime() - new Date(openedAt).getTime()) / (1000 * 60 * 60)) : null;
  const resolved = Boolean(plain.resolvedAt);
  const responseTargetHours = plain.priority === 'urgent' ? 4 : plain.priority === 'high' ? 8 : 24;
  const responseMinutes = plain.firstResponseAt && openedAt
    ? Math.round((new Date(plain.firstResponseAt).getTime() - new Date(openedAt).getTime()) / (1000 * 60))
    : null;
  const resolutionMinutes = plain.resolvedAt && openedAt
    ? Math.round((new Date(plain.resolvedAt).getTime() - new Date(openedAt).getTime()) / (1000 * 60))
    : null;

  return {
    id: plain.id,
    status: plain.status,
    priority: plain.priority,
    reason: plain.reason,
    escalatedAt: plain.escalatedAt,
    firstResponseAt: plain.firstResponseAt,
    resolvedAt: plain.resolvedAt,
    assignedAgent,
    metadata: plain.metadata ?? null,
    ageHours,
    responseMinutes,
    resolutionMinutes,
    slaBreached: !resolved && ageHours != null && ageHours > responseTargetHours,
  };
}

function sanitizeAutomationLogRecord(log) {
  const plain = toPlain(log);
  if (!plain) return null;
  return {
    id: plain.id,
    source: plain.source,
    action: plain.action,
    status: plain.status,
    triggeredAt: plain.triggeredAt,
    completedAt: plain.completedAt,
    metadata: plain.metadata ?? null,
  };
}

function sanitizeKnowledgeArticleRecord(article) {
  const plain = toPlain(article);
  if (!plain) return null;
  return {
    id: plain.id,
    slug: plain.slug,
    title: plain.title,
    summary: plain.summary,
    category: plain.category,
    audience: plain.audience,
    resourceLinks: plain.resourceLinks ?? null,
    lastReviewedAt: plain.lastReviewedAt,
  };
}

function buildCareerAnalyticsInsights(snapshotRecords, benchmarkRecords) {
  const snapshots = snapshotRecords.map((record) => sanitizeCareerSnapshot(record)).filter(Boolean);
  const benchmarks = benchmarkRecords.map((record) => sanitizeBenchmark(record)).filter(Boolean);
  const latest = snapshots[0] ?? null;
  const previous = snapshots[1] ?? null;

  const summary = {
    conversionRate: latest?.outreachConversionRate ?? null,
    interviewMomentum: latest?.interviewMomentum ?? null,
    offerWinRate: latest?.offerWinRate ?? null,
    salary: {
      value: latest?.salaryMedian ?? null,
      currency: latest?.salaryCurrency ?? 'USD',
      trend: latest?.salaryTrend ?? 'flat',
      change: computeChange(latest?.salaryMedian, previous?.salaryMedian),
    },
    conversionChange: computeChange(latest?.outreachConversionRate, previous?.outreachConversionRate),
    interviewChange: computeChange(latest?.interviewMomentum, previous?.interviewMomentum),
    offerChange: computeChange(latest?.offerWinRate, previous?.offerWinRate),
  };

  const diversity = latest?.diversityRepresentation ?? null;
  const funnel = latest?.funnelBreakdown ?? null;

  return {
    summary,
    snapshots,
    benchmarks,
    diversity,
    funnel,
  };
}

function buildCalendarInsights(eventsRecords, focusSessionRecords, integrationRecords) {
  const events = eventsRecords.map((record) => sanitizeCalendarEventRecord(record)).filter(Boolean);
  const focusSessions = focusSessionRecords.map((record) => sanitizeFocusSessionRecord(record)).filter(Boolean);
  const integrations = integrationRecords.map((record) => sanitizeCalendarIntegrationRecord(record)).filter(Boolean);

  const now = new Date();
  const upcomingEvents = events.filter((event) => !event.startsAt || new Date(event.startsAt) >= now);
  const nextFocusBlock = upcomingEvents.find((event) => event.isFocusBlock) ?? null;
  const upcomingInterviews = upcomingEvents
    .filter((event) => event.eventType === 'interview')
    .slice(0, 3);

  const focusTotalMinutes = focusSessions.reduce((total, session) => {
    if (session.durationMinutes != null) {
      return total + Number(session.durationMinutes);
    }
    if (session.startedAt && session.endedAt) {
      const start = new Date(session.startedAt).getTime();
      const end = new Date(session.endedAt).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
        return total + Math.round((end - start) / (1000 * 60));
      }
    }
    return total;
  }, 0);

  const focusByType = focusSessions.reduce((accumulator, session) => {
    if (!session || !session.focusType) return accumulator;
    const key = session.focusType;
    accumulator[key] = (accumulator[key] ?? 0) + (session.durationMinutes ?? 0);
    return accumulator;
  }, {});

  return {
    integrations,
    events,
    upcomingInterviews,
    nextFocusBlock,
    focus: {
      sessions: focusSessions,
      totalMinutes: focusTotalMinutes,
      byType: focusByType,
    },
  };
}

function buildAdvisorInsights(collaborationRecords, auditLogRecords) {
  const auditLogMap = auditLogRecords.reduce((map, log) => {
    const sanitized = sanitizeAuditLogRecord(log);
    if (!sanitized) return map;
    if (!map.has(sanitized.collaborationId)) {
      map.set(sanitized.collaborationId, []);
    }
    map.get(sanitized.collaborationId).push(sanitized);
    return map;
  }, new Map());

  const collaborations = collaborationRecords
    .map((collaboration) => sanitizeCollaborationRecord(collaboration, auditLogMap))
    .filter(Boolean);

  const totalMembers = collaborations.reduce((total, collaboration) => total + (collaboration.members?.length ?? 0), 0);
  const activeRooms = collaborations.flatMap((collaboration) => collaboration.documentRooms ?? []).filter(
    (room) => room && room.status === 'active',
  );

  return {
    collaborations,
    summary: {
      totalCollaborations: collaborations.length,
      totalMembers,
      activeDocumentRooms: activeRooms.length,
    },
  };
}

function buildSupportDeskInsights(caseRecords, automationRecords, knowledgeRecords) {
  const cases = caseRecords.map((record) => sanitizeSupportCaseRecord(record)).filter(Boolean);
  const automation = automationRecords.map((record) => sanitizeAutomationLogRecord(record)).filter(Boolean);
  const articles = knowledgeRecords.map((record) => sanitizeKnowledgeArticleRecord(record)).filter(Boolean);

  const summary = cases.reduce(
    (accumulator, supportCase) => {
      const isOpen = !['resolved', 'closed'].includes(supportCase.status ?? '');
      if (isOpen) {
        accumulator.open += 1;
      }
      if (supportCase.slaBreached) {
        accumulator.slaBreached += 1;
      }
      if (supportCase.responseMinutes != null) {
        accumulator.responseMinutes.push(supportCase.responseMinutes);
      }
      if (supportCase.resolutionMinutes != null) {
        accumulator.resolutionMinutes.push(supportCase.resolutionMinutes);
      }
      return accumulator;
    },
    { open: 0, slaBreached: 0, responseMinutes: [], resolutionMinutes: [] },
  );

  const average = (values) => {
    if (!values.length) return null;
    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round((total / values.length) * 10) / 10;
  };

  return {
    cases,
    automation,
    knowledgeArticles: articles,
    summary: {
      openCases: summary.open,
      slaBreached: summary.slaBreached,
      averageFirstResponseMinutes: average(summary.responseMinutes),
      averageResolutionMinutes: average(summary.resolutionMinutes),
    },
  };
}

async function hydrateTargets(applications) {
  const jobIds = new Set();
  const gigIds = new Set();
  const projectIds = new Set();

  applications.forEach((application) => {
    const base = application.toPublicObject();
    if (base.targetType === 'job') {
      jobIds.add(base.targetId);
    } else if (base.targetType === 'gig') {
      gigIds.add(base.targetId);
    } else if (base.targetType === 'project') {
      projectIds.add(base.targetId);
    }
  });

  const [jobs, gigs, projects] = await Promise.all([
    jobIds.size
      ? Job.findAll({ where: { id: { [Op.in]: Array.from(jobIds) } } })
      : Promise.resolve([]),
    gigIds.size
      ? Gig.findAll({ where: { id: { [Op.in]: Array.from(gigIds) } } })
      : Promise.resolve([]),
    projectIds.size
      ? Project.findAll({ where: { id: { [Op.in]: Array.from(projectIds) } } })
      : Promise.resolve([]),
  ]);

  const map = new Map();
  jobs.forEach((job) => {
    const plain = toPlainTarget(job);
    if (plain) {
      map.set(`job:${job.id}`, plain);
    }
  });
  gigs.forEach((gig) => {
    const plain = toPlainTarget(gig);
    if (plain) {
      map.set(`gig:${gig.id}`, plain);
    }
  });
  projects.forEach((project) => {
    const plain = toPlainTarget(project);
    if (plain) {
      map.set(`project:${project.id}`, plain);
    }
  });

  return map;
}

async function loadDashboardPayload(userId, { bypassCache = false } = {}) {
  const profile = await profileService.getProfileOverview(userId, { bypassCache });

  const applicationQuery = Application.findAll({
    where: { applicantId: userId },
    include: [
      {
        model: ApplicationReview,
        as: 'reviews',
        include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
    ],
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: 40,
  });

  const pipelineQuery = Application.findAll({
    where: { applicantId: userId },
    attributes: ['status', [fn('COUNT', col('status')), 'count']],
    group: ['status'],
  });

  const notificationsQuery = Notification.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 12,
  });

  const launchpadApplicationsQuery = ExperienceLaunchpadApplication.findAll({
    where: { applicantId: userId },
    include: [{ model: ExperienceLaunchpad, as: 'launchpad' }],
    order: [['updatedAt', 'DESC']],
  });

  const projectEventsQuery = ProjectAssignmentEvent.findAll({
    where: { actorId: userId },
    include: [{ model: Project, as: 'project' }],
    order: [['createdAt', 'DESC']],
    limit: 12,
  });

  const careerSnapshotsQuery = CareerAnalyticsSnapshot.findAll({
    where: { userId },
    order: [['timeframeEnd', 'DESC']],
    limit: 6,
  });

  const peerBenchmarksQuery = CareerPeerBenchmark.findAll({
    where: { userId },
    order: [['capturedAt', 'DESC']],
    limit: 12,
  });

  const digestSubscriptionQuery = WeeklyDigestSubscription.findOne({ where: { userId } });

  const calendarWindowStart = new Date();
  calendarWindowStart.setDate(calendarWindowStart.getDate() - 14);
  const calendarWindowEnd = new Date();
  calendarWindowEnd.setDate(calendarWindowEnd.getDate() + 30);

  const calendarIntegrationsQuery = CalendarIntegration.findAll({
    where: { userId },
    order: [['provider', 'ASC']],
  });

  const calendarEventsQuery = CandidateCalendarEvent.findAll({
    where: {
      userId,
      startsAt: { [Op.between]: [calendarWindowStart, calendarWindowEnd] },
    },
    order: [['startsAt', 'ASC']],
    limit: 40,
  });

  const focusSessionsQuery = FocusSession.findAll({
    where: { userId },
    order: [['startedAt', 'DESC']],
    limit: 12,
  });

  const collaborationsQuery = AdvisorCollaboration.findAll({
    where: { ownerId: userId },
    include: [
      {
        model: AdvisorCollaborationMember,
        as: 'members',
        include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      { model: AdvisorDocumentRoom, as: 'documentRooms' },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 5,
  });

  const supportCasesQuery = SupportCase.findAll({
    where: { escalatedBy: userId },
    include: [{ model: User, as: 'assignedAgent', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['updatedAt', 'DESC']],
    limit: 10,
  });

  const automationLogsQuery = SupportAutomationLog.findAll({
    where: { userId },
    order: [['triggeredAt', 'DESC']],
    limit: 12,
  });

  const knowledgeArticlesQuery = SupportKnowledgeArticle.findAll({
    where: { audience: { [Op.in]: ['freelancer', 'support_team'] } },
    order: [['lastReviewedAt', 'DESC']],
    limit: 8,
  });

  const [
    applications,
    pipelineRows,
    notifications,
    launchpadApplications,
    projectEvents,
    careerSnapshots,
    peerBenchmarks,
    digestSubscription,
    calendarIntegrations,
    calendarEvents,
    focusSessions,
    collaborations,
    supportCases,
    automationLogs,
    knowledgeArticles,
  ] = await Promise.all([
    applicationQuery,
    pipelineQuery,
    notificationsQuery,
    launchpadApplicationsQuery,
    projectEventsQuery,
    careerSnapshotsQuery,
    peerBenchmarksQuery,
    digestSubscriptionQuery,
    calendarIntegrationsQuery,
    calendarEventsQuery,
    focusSessionsQuery,
    collaborationsQuery,
    supportCasesQuery,
    automationLogsQuery,
    knowledgeArticlesQuery,
  ]);

  const collaborationIds = collaborations.map((collaboration) => collaboration.id);
  const auditLogs = collaborationIds.length
    ? await AdvisorCollaborationAuditLog.findAll({
        where: { collaborationId: { [Op.in]: collaborationIds } },
        include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['createdAt', 'DESC']],
        limit: 40,
      })
    : [];

  const targetMap = await hydrateTargets(applications);
  const sanitizedApplications = applications.map((application) => sanitizeApplication(application, targetMap));
  const attachments = collectAttachments(applications);

  const pipeline = pipelineRows.map((row) => {
    const plain = row.get({ plain: true });
    const count = Number(plain.count ?? plain[0] ?? plain['count']);
    return {
      status: plain.status,
      count: Number.isFinite(count) ? count : 0,
    };
  });

  const totals = sanitizedApplications.reduce(
    (accumulator, application) => {
      accumulator.total += 1;
      if (!TERMINAL_STATUSES.has(application.status)) {
        accumulator.active += 1;
      }
      if (INTERVIEW_STATUSES.has(application.status)) {
        accumulator.interviews += 1;
      }
      if (OFFER_STATUSES.has(application.status)) {
        accumulator.offers += 1;
      }
      if (Array.isArray(application.attachments)) {
        accumulator.documents += application.attachments.length;
      }
      return accumulator;
    },
    { total: 0, active: 0, interviews: 0, offers: 0, documents: 0 },
  );

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const sanitizedNotifications = notifications.map((notification) => sanitizeNotification(notification));
  const sanitizedLaunchpad = launchpadApplications.map((record) => sanitizeLaunchpadApplication(record));
  const sanitizedProjectEvents = projectEvents.map((event) => sanitizeProjectEvent(event));

  const followUps = buildFollowUps(applications, targetMap);

  const automations = [];
  if (profile.launchpadEligibility?.status === 'eligible' && profile.launchpadEligibility?.score != null) {
    automations.push({
      title: 'Launchpad readiness',
      detail: `Score ${profile.launchpadEligibility.score}`,
      recommendation:
        'Schedule a strategy session with your Launchpad mentor to leverage your readiness score before the next cohort deadline.',
    });
  }
  if (profile.availability?.status === 'limited') {
    automations.push({
      title: 'Availability signal',
      detail: 'Limited availability',
      recommendation: 'Update availability to unlock more recruiter matches and auto-apply opportunities.',
    });
  }
  if (totals.documents < 2) {
    automations.push({
      title: 'Document library',
      detail: `${totals.documents} uploaded`,
      recommendation: 'Upload at least two tailored CVs to improve conversion tracking per role type.',
    });
  }

  const interviews = sanitizedApplications
    .filter((application) => INTERVIEW_STATUSES.has(application.status))
    .map((application) => {
      const targetName = application.target?.title || application.target?.name || `#${application.targetId}`;
      const scheduledReview = application.reviews.find((review) => review.stage === 'interview');
      const scheduledAt = scheduledReview?.decidedAt ?? application.metadata?.interviewScheduledAt ?? null;
      return {
        applicationId: application.id,
        targetName,
        scheduledAt,
        reviewer: scheduledReview?.reviewer ?? null,
        status: application.status,
        nextStep: application.nextStep,
      };
    });

  const documents = {
    attachments,
    portfolioLinks: Array.isArray(profile.portfolioLinks) ? profile.portfolioLinks : [],
    lastUpdatedAt: attachments.reduce((latest, attachment) => {
      const timestamp = attachment.uploadedAt ? new Date(attachment.uploadedAt).getTime() : 0;
      return timestamp > latest ? timestamp : latest;
    }, 0),
  };
  if (documents.lastUpdatedAt) {
    documents.lastUpdatedAt = new Date(documents.lastUpdatedAt).toISOString();
  } else {
    documents.lastUpdatedAt = null;
  }

  const summary = {
    totalApplications: totals.total,
    activeApplications: totals.active,
    interviewsScheduled: totals.interviews,
    offersNegotiating: totals.offers,
    documentsUploaded: totals.documents,
    connections: profile.connectionsCount ?? profile.metrics?.connectionsCount ?? 0,
  };

  const careerAnalytics = buildCareerAnalyticsInsights(careerSnapshots, peerBenchmarks);
  const calendarInsights = buildCalendarInsights(calendarEvents, focusSessions, calendarIntegrations);
  const advisorInsights = buildAdvisorInsights(collaborations, auditLogs);
  const supportDesk = buildSupportDeskInsights(supportCases, automationLogs, knowledgeArticles);

  const digestPlain = digestSubscription?.toPublicObject?.() ?? digestSubscription?.get?.({ plain: true }) ?? null;
  const weeklyDigest = {
    subscription: digestPlain
      ? {
          frequency: digestPlain.frequency,
          channels: Array.isArray(digestPlain.channels) ? digestPlain.channels : [],
          isActive: Boolean(digestPlain.isActive),
          lastSentAt: digestPlain.lastSentAt ?? null,
          nextScheduledAt: digestPlain.nextScheduledAt ?? null,
          metadata: digestPlain.metadata ?? null,
        }
      : null,
    integrations: Array.isArray(calendarInsights.integrations)
      ? calendarInsights.integrations.map((integration) => ({ ...integration }))
      : [],
  };

  return {
    generatedAt: new Date().toISOString(),
    profile,
    summary,
    pipeline: {
      statuses: pipeline,
      lastActivityAt: sanitizedApplications[0]?.updatedAt ?? null,
    },
    applications: {
      recent: sanitizedApplications.slice(0, 10),
    },
    interviews,
    documents,
    notifications: {
      unreadCount,
      recent: sanitizedNotifications,
    },
    launchpad: {
      applications: sanitizedLaunchpad,
    },
    projectActivity: {
      recent: sanitizedProjectEvents,
    },
    tasks: {
      followUps,
      automations,
    },
    insights: {
      careerAnalytics,
      weeklyDigest,
      calendar: calendarInsights,
      advisorCollaboration: advisorInsights,
      supportDesk,
    },
  };
}

export async function getUserDashboard(userId, { bypassCache = false } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { userId: normalizedUserId });

  if (bypassCache) {
    return loadDashboardPayload(normalizedUserId, { bypassCache: true });
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, () =>
    loadDashboardPayload(normalizedUserId, { bypassCache: false }),
  );
}

export default {
  getUserDashboard,
};
