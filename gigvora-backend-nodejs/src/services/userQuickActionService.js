import { Op } from 'sequelize';
import {
  User,
  Gig,
  FreelancerTimelineEntry,
  NetworkingConnection,
  FreelancerDashboardOverview,
} from '../models/index.js';
import supportDeskService from './supportDeskService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const CACHE_NAMESPACE = 'quickActions:user';
const CACHE_TTL_SECONDS = 90;
const RELATIVE_TIME_UNITS = [
  { limit: 60, divisor: 1, unit: 'second' },
  { limit: 60 * 60, divisor: 60, unit: 'minute' },
  { limit: 60 * 60 * 24, divisor: 60 * 60, unit: 'hour' },
  { limit: 60 * 60 * 24 * 7, divisor: 60 * 60 * 24, unit: 'day' },
  { limit: 60 * 60 * 24 * 30, divisor: 60 * 60 * 24 * 7, unit: 'week' },
  { limit: 60 * 60 * 24 * 365, divisor: 60 * 60 * 24 * 30, unit: 'month' },
  { limit: Infinity, divisor: 60 * 60 * 24 * 365, unit: 'year' },
];

const CONNECTION_PENDING_STATUSES = ['new', 'follow_up'];
const GIG_PUBLISHED_STATUSES = ['published'];

function normalizeUserId(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function toDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRelativeTime(value) {
  const date = toDate(value);
  if (!date) {
    return null;
  }
  const diffMs = date.getTime() - Date.now();
  if (!Number.isFinite(diffMs)) {
    return null;
  }
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const { limit, divisor, unit } of RELATIVE_TIME_UNITS) {
    if (absSeconds < limit) {
      const valueForUnit = Math.round(diffSeconds / divisor);
      return rtf.format(valueForUnit, unit);
    }
  }

  return rtf.format(Math.round(diffSeconds / (60 * 60 * 24)), 'day');
}

function describeLastUpdate(timestamp) {
  if (!timestamp) {
    return 'Share a milestone to stay top-of-mind with your network.';
  }
  const relative = formatRelativeTime(timestamp);
  if (!relative) {
    return 'Share a milestone to stay top-of-mind with your network.';
  }
  return `Last update was ${relative}.`;
}

function describeConnections(count) {
  if (!Number.isFinite(count) || count <= 0) {
    return 'Invite collaborators to expand your trusted operations pod.';
  }
  const suffix = count === 1 ? 'lead' : 'leads';
  return `Follow up with ${count} new ${suffix}.`;
}

function describeNextSession(entry) {
  if (!entry?.startsAt) {
    return 'Book a 25-minute strategy session with mentors or partners.';
  }
  const relative = formatRelativeTime(entry.startsAt);
  if (!relative) {
    return 'Manage upcoming sessions and bookings without leaving the dashboard.';
  }
  return `Next session ${relative}.`;
}

function describeSupportCases(openCases, awaitingReply) {
  if (Number.isFinite(openCases) && openCases > 0) {
    const waitingSuffix = Number.isFinite(awaitingReply) && awaitingReply > 0 ? `, ${awaitingReply} awaiting your reply` : '';
    return `Resolve ${openCases} active cases${waitingSuffix}.`;
  }
  return 'Review concierge insights, playbooks, and transcripts.';
}

function pickNextScheduleEntry(schedule = []) {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return null;
  }
  const now = Date.now();
  const sorted = schedule
    .map((entry) => ({
      ...entry,
      startsAt: toDate(entry.startsAt)?.toISOString() ?? null,
    }))
    .filter((entry) => entry.startsAt)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return sorted.find((entry) => new Date(entry.startsAt).getTime() >= now) ?? sorted[sorted.length - 1] ?? null;
}

function buildActions(context) {
  const actions = [];

  actions.push({
    id: 'launch-gig',
    label: 'Launch a gig',
    description:
      context.publishedGigCount > 0
        ? `You have ${context.publishedGigCount} live gig${context.publishedGigCount === 1 ? '' : 's'}.`
        : 'Craft a premium gig launch with pricing, milestones, and assets.',
    href: '/gigs/create',
    icon: 'briefcase',
    tone: 'violet',
    badge: context.publishedGigCount > 0 ? `${context.publishedGigCount} live` : 'New',
    recommended: context.publishedGigCount === 0,
  });

  actions.push({
    id: 'share-update',
    label: 'Share an update',
    description: describeLastUpdate(context.lastTimelineEntryAt),
    href: '/feed/new',
    icon: 'megaphone',
    tone: 'sky',
    badge: context.lastTimelineEntryAt ? null : 'Fresh',
  });

  actions.push({
    id: 'invite-ally',
    label: 'Invite a collaborator',
    description: describeConnections(context.pendingConnections),
    href: '/connections/invite',
    icon: 'user-plus',
    tone: 'emerald',
    badge: context.pendingConnections > 0 ? `${context.pendingConnections} pending` : null,
  });

  if (['freelancer', 'agency'].includes(context.userType)) {
    actions.push({
      id: 'schedule-session',
      label: 'Schedule a session',
      description: describeNextSession(context.nextSession),
      href: '/calendar/new',
      icon: 'calendar',
      tone: 'amber',
      badge: context.nextSession ? null : 'Open',
    });

    actions.push({
      id: 'open-support',
      label: 'Open support desk',
      description: describeSupportCases(context.openSupportCases, context.awaitingReplyCases),
      href: '/dashboards/freelancer#support',
      icon: 'lifebuoy',
      tone: 'slate',
      badge: context.openSupportCases > 0 ? `${context.openSupportCases} active` : null,
      recommended: context.openSupportCases > 0,
    });
  }

  return actions;
}

async function loadSupportSnapshot(user, { bypassCache = false } = {}) {
  if (!user || !['freelancer', 'agency'].includes(user.userType ?? '')) {
    return null;
  }

  try {
    return await supportDeskService.getFreelancerSupportDesk(user.id, { bypassCache });
  } catch (error) {
    return null;
  }
}

export async function getUserQuickActions(userId, { bypassCache = false } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { userId: normalizedUserId });

  if (!bypassCache) {
    const cached = appCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const user = await User.findByPk(normalizedUserId, {
    attributes: ['id', 'userType', 'primaryRole'],
  });

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const [publishedGigCount, timelineEntry, pendingConnections, overviewRecord, supportSnapshot] = await Promise.all([
    Gig.count({
      where: {
        ownerId: normalizedUserId,
        status: { [Op.in]: GIG_PUBLISHED_STATUSES },
      },
    }),
    FreelancerTimelineEntry.findOne({
      where: { freelancerId: normalizedUserId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'createdAt'],
    }),
    NetworkingConnection.count({
      where: {
        ownerId: normalizedUserId,
        status: { [Op.in]: CONNECTION_PENDING_STATUSES },
      },
    }),
    FreelancerDashboardOverview.findOne({
      where: { freelancerId: normalizedUserId },
      attributes: ['id', 'upcomingSchedule'],
    }),
    loadSupportSnapshot({ id: normalizedUserId, userType: user.userType }, { bypassCache }),
  ]);

  const nextSession = pickNextScheduleEntry(overviewRecord?.upcomingSchedule ?? []);
  const openSupportCasesRaw =
    supportSnapshot?.metrics?.openSupportCases ??
    supportSnapshot?.metrics?.activeCases ??
    null;
  const openSupportCases = Number.isFinite(Number(openSupportCasesRaw))
    ? Number(openSupportCasesRaw)
    : 0;
  const awaitingReplyRaw =
    supportSnapshot?.metrics?.awaitingReplyCases ??
    supportSnapshot?.metrics?.awaitingReply ??
    null;
  const awaitingReplyCases = Number.isFinite(Number(awaitingReplyRaw))
    ? Number(awaitingReplyRaw)
    : 0;

  const context = {
    userType: user.userType,
    publishedGigCount,
    lastTimelineEntryAt: timelineEntry?.createdAt ?? null,
    pendingConnections,
    nextSession,
    openSupportCases,
    awaitingReplyCases,
  };

  const actions = buildActions(context);
  const recommendedActionId =
    actions.find((action) => action.recommended)?.id ?? actions[0]?.id ?? null;

  const payload = {
    userId: normalizedUserId,
    generatedAt: new Date().toISOString(),
    recommendedActionId,
    actions,
    metrics: {
      publishedGigCount,
      lastTimelineEntryAt: timelineEntry?.createdAt ?? null,
      pendingConnections,
      nextSessionAt: nextSession?.startsAt ?? null,
      openSupportCases,
      awaitingReplyCases,
    },
  };

  appCache.set(cacheKey, payload, CACHE_TTL_SECONDS);
  return payload;
}

export default {
  getUserQuickActions,
};
