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
  User,
} from '../models/index.js';
import profileService from './profileService.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError } from '../utils/errors.js';
import careerPipelineAutomationService from './careerPipelineAutomationService.js';

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

  const [
    applications,
    pipelineRows,
    notifications,
    launchpadApplications,
    projectEvents,
    careerPipelineAutomation,
  ] = await Promise.all([
    applicationQuery,
    pipelineQuery,
    notificationsQuery,
    launchpadApplicationsQuery,
    projectEventsQuery,
    careerPipelineAutomationService.getCareerPipelineAutomation(userId, { bypassCache }),
  ]);

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
    careerPipelineAutomation,
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
