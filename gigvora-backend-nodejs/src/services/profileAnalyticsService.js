import { trackEvent } from './analyticsService.js';

const MIN_TRUST_DELTA = 0.05;

function safeNumber(value, decimals = 2) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (decimals == null) {
    return numeric;
  }
  return Number(numeric.toFixed(decimals));
}

function safeInteger(value) {
  if (value == null) {
    return 0;
  }
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((item) => item != null);
  }
  return [value];
}

function toPlainObject(entity) {
  if (!entity) {
    return {};
  }
  return entity.get ? entity.get({ plain: true }) : { ...entity };
}

function toIsoString(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normaliseStatusFlags(flags) {
  return toArray(flags)
    .map((flag) => `${flag}`.trim())
    .filter((flag) => flag.length > 0);
}

function normaliseVolunteerBadges(badges) {
  return toArray(badges)
    .map((badge) => `${badge}`.trim())
    .filter((badge) => badge.length > 0);
}

function normalisePipelineInsights(insights) {
  if (!insights) {
    return [];
  }
  if (Array.isArray(insights)) {
    return insights.filter((item) => item && typeof item === 'object');
  }
  if (typeof insights === 'string') {
    try {
      const parsed = JSON.parse(insights);
      return normalisePipelineInsights(parsed);
    } catch (error) {
      return [];
    }
  }
  return [];
}

export function buildSnapshotFromOverview(overview) {
  if (!overview) {
    return { profileId: null, userId: null, metrics: {} };
  }

  const metrics = overview.metrics ?? {};

  return {
    profileId: overview.id ?? overview.profileId ?? null,
    userId: overview.userId ?? overview.id ?? null,
    metrics: {
      trustScore: safeNumber(metrics.trustScore),
      trustScoreLevel: metrics.trustScoreLevel ?? null,
      profileCompletion: safeNumber(metrics.profileCompletion),
      likesCount: safeInteger(metrics.likesCount),
      followersCount: safeInteger(metrics.followersCount),
      connectionsCount: safeInteger(metrics.connectionsCount),
      engagementRefreshedAt: toIsoString(metrics.engagementRefreshedAt),
    },
    launchpadEligibility: overview.launchpadEligibility ?? null,
    volunteerBadges: normaliseVolunteerBadges(overview.volunteerBadges),
    statusFlags: normaliseStatusFlags(overview.statusFlags),
    pipelineInsights: normalisePipelineInsights(overview.pipelineInsights),
  };
}

export function buildSnapshotFromProfile(profile, overrides = {}) {
  if (!profile && !overrides) {
    return { profileId: null, userId: null, metrics: {} };
  }

  const plain = { ...toPlainObject(profile), ...overrides };

  return {
    profileId: plain.id ?? plain.profileId ?? null,
    userId: plain.userId ?? null,
    metrics: {
      trustScore: safeNumber(plain.trustScore ?? overrides.trustScore),
      trustScoreLevel: plain.trustScoreLevel ?? overrides.trustScoreLevel ?? null,
      profileCompletion: safeNumber(plain.profileCompletion ?? overrides.profileCompletion),
      likesCount: safeInteger(overrides.likesCount ?? plain.likesCount),
      followersCount: safeInteger(overrides.followersCount ?? plain.followersCount),
      connectionsCount: safeInteger(overrides.connectionsCount ?? plain.connectionsCount),
      engagementRefreshedAt: toIsoString(overrides.engagementRefreshedAt ?? plain.engagementRefreshedAt),
    },
    launchpadEligibility: plain.launchpadEligibility ?? overrides.launchpadEligibility ?? null,
    volunteerBadges: normaliseVolunteerBadges(overrides.volunteerBadges ?? plain.volunteerBadges),
    statusFlags: normaliseStatusFlags(overrides.statusFlags ?? plain.statusFlags),
    pipelineInsights: normalisePipelineInsights(overrides.pipelineInsights ?? plain.pipelineInsights),
  };
}

function deriveLaunchpadStatusScore(status) {
  if (!status) {
    return 0;
  }
  const value = `${status}`.toLowerCase();
  const scoreMap = {
    graduated: 1,
    completed: 0.95,
    active: 0.9,
    invited: 0.78,
    shortlisted: 0.72,
    eligible: 0.62,
    in_review: 0.54,
    applied: 0.48,
    paused: 0.35,
    not_eligible: 0.2,
    disqualified: 0.12,
    rejected: 0.1,
  };
  return scoreMap[value] ?? 0.3;
}

function countPipelineMatches(items, regex) {
  return items.filter((item) => regex.test(`${item.status ?? ''}`.toLowerCase())).length;
}

export function deriveTargetingSnapshot(snapshot = {}) {
  const metrics = snapshot.metrics ?? {};
  const launchpadEligibility = snapshot.launchpadEligibility ?? {};
  const volunteerBadges = normaliseVolunteerBadges(snapshot.volunteerBadges);
  const statusFlags = normaliseStatusFlags(snapshot.statusFlags).map((flag) => flag.toLowerCase());
  const pipelineInsights = normalisePipelineInsights(snapshot.pipelineInsights);

  const trustScore = safeNumber(metrics.trustScore) ?? 0;
  const profileCompletion = safeNumber(metrics.profileCompletion) ?? 0;
  const likesCount = safeInteger(metrics.likesCount);
  const followersCount = safeInteger(metrics.followersCount);
  const connectionsCount = safeInteger(metrics.connectionsCount);
  const launchpadScore = deriveLaunchpadStatusScore(launchpadEligibility.status);
  const launchpadCohorts = normaliseStatusFlags(launchpadEligibility.cohorts).length;
  const pipelineWins = countPipelineMatches(
    pipelineInsights,
    /(won|signed|hired|completed|filled|placed|awarded)/,
  );
  const interviewStages = countPipelineMatches(
    pipelineInsights,
    /(interview|screen|shortlist|review)/,
  );

  const segments = new Set();

  if (profileCompletion >= 70 || trustScore >= 45) {
    segments.add('profile_ready');
  }
  if (likesCount >= 40 || followersCount >= 60 || connectionsCount >= 50) {
    segments.add('audience_builder');
  }
  if (followersCount >= 200 || (trustScore >= 80 && likesCount >= 80)) {
    segments.add('high_intent_talent');
  }
  if (launchpadScore >= 0.62 || launchpadCohorts > 0) {
    segments.add('launchpad_ready');
  }
  if (
    volunteerBadges.length >= 2 ||
    statusFlags.some((flag) => flag.includes('volunteer') || flag.includes('mentor'))
  ) {
    segments.add('volunteer_advocate');
  }
  if (
    pipelineWins >= 1 ||
    statusFlags.includes('preferred_talent') ||
    statusFlags.includes('jobs_board_featured') ||
    statusFlags.includes('featured_in_jobs_board')
  ) {
    segments.add('delivery_proven');
  }
  if (pipelineWins >= 3 || trustScore >= 90) {
    segments.add('premium_candidate');
  }
  if (statusFlags.includes('instant_book')) {
    segments.add('instant_book_ready');
  }

  let stage = 'awareness';
  if (segments.has('profile_ready') || segments.has('audience_builder') || trustScore >= 45) {
    stage = 'consideration';
  }
  if (segments.has('launchpad_ready') || segments.has('delivery_proven') || trustScore >= 70) {
    stage = 'ready';
  }
  if (
    segments.has('premium_candidate') ||
    (segments.has('launchpad_ready') && segments.has('delivery_proven')) ||
    trustScore >= 88
  ) {
    stage = 'prime';
  }

  return {
    stage,
    segments: Array.from(segments),
    metrics: {
      trustScore,
      profileCompletion,
      likesCount,
      followersCount,
      connectionsCount,
      pipelineWins,
      interviewStages,
      volunteerBadges: volunteerBadges.length,
      launchpadCohorts,
    },
  };
}

function computeSegmentDiff(previousTargeting = {}, nextTargeting = {}) {
  const previousSegments = new Set(previousTargeting.segments ?? []);
  const nextSegments = new Set(nextTargeting.segments ?? []);
  const addedSegments = Array.from(nextSegments).filter((segment) => !previousSegments.has(segment));
  const removedSegments = Array.from(previousSegments).filter((segment) => !nextSegments.has(segment));
  const stageChanged = (previousTargeting.stage ?? null) !== (nextTargeting.stage ?? null);
  return {
    stageChanged,
    previousStage: previousTargeting.stage ?? null,
    nextStage: nextTargeting.stage ?? null,
    addedSegments,
    removedSegments,
  };
}

async function safeTrack(eventName, payload) {
  try {
    return await trackEvent({ eventName, ...payload });
  } catch (error) {
    console.error('Failed to record analytics event', { eventName, error });
    return null;
  }
}

export async function recordTrustScoreChange({
  profileId,
  userId,
  previousSnapshot = {},
  nextSnapshot = {},
  previousTargeting = null,
  nextTargeting = null,
  triggeredBy = 'profile_service',
  breakdown = null,
} = {}) {
  const previousMetrics = previousSnapshot.metrics ?? {};
  const nextMetrics = nextSnapshot.metrics ?? {};
  const previousScore = previousMetrics.trustScore;
  const nextScore = nextMetrics.trustScore;

  if (nextScore == null) {
    return null;
  }

  const previousLevel = previousMetrics.trustScoreLevel ?? null;
  const nextLevel = nextMetrics.trustScoreLevel ?? null;
  let delta = null;

  if (previousScore == null) {
    delta = Number(nextScore.toFixed(2));
  } else {
    delta = Number((nextScore - previousScore).toFixed(2));
    if (Math.abs(delta) < MIN_TRUST_DELTA && previousLevel === nextLevel) {
      return null;
    }
  }

  const resolvedPreviousTargeting = previousTargeting ?? deriveTargetingSnapshot(previousSnapshot);
  const resolvedNextTargeting = nextTargeting ?? deriveTargetingSnapshot(nextSnapshot);
  const diff = computeSegmentDiff(resolvedPreviousTargeting, resolvedNextTargeting);

  await safeTrack('profile.trust_score.updated', {
    actorType: 'system',
    entityType: 'profile',
    entityId: profileId,
    userId,
    source: triggeredBy,
    context: {
      previousScore,
      nextScore,
      delta,
      previousLevel,
      nextLevel,
      levelChanged: previousLevel !== nextLevel,
      breakdown,
      stage: resolvedNextTargeting.stage,
      previousStage: resolvedPreviousTargeting.stage,
      stageChanged: diff.stageChanged,
      addedSegments: diff.addedSegments,
      removedSegments: diff.removedSegments,
      currentSegments: resolvedNextTargeting.segments,
      metrics: resolvedNextTargeting.metrics,
    },
  });

  return { delta, diff, nextTargeting: resolvedNextTargeting };
}

export async function recordEngagementRefresh({
  profileId,
  userId,
  previousSnapshot = {},
  nextSnapshot = {},
  previousTargeting = null,
  nextTargeting = null,
  reason = 'manual_recalculation',
  triggeredBy = 'profile_engagement_service',
  jobId = null,
} = {}) {
  const previousMetrics = previousSnapshot.metrics ?? {};
  const nextMetrics = nextSnapshot.metrics ?? {};
  const previousLikes = safeInteger(previousMetrics.likesCount);
  const nextLikes = safeInteger(nextMetrics.likesCount);
  const previousFollowers = safeInteger(previousMetrics.followersCount);
  const nextFollowers = safeInteger(nextMetrics.followersCount);
  const likesDelta = nextLikes - previousLikes;
  const followersDelta = nextFollowers - previousFollowers;

  if (likesDelta === 0 && followersDelta === 0 && !reason) {
    return null;
  }

  const resolvedPreviousTargeting = previousTargeting ?? deriveTargetingSnapshot(previousSnapshot);
  const resolvedNextTargeting = nextTargeting ?? deriveTargetingSnapshot(nextSnapshot);
  const diff = computeSegmentDiff(resolvedPreviousTargeting, resolvedNextTargeting);

  await safeTrack('profile.engagement.metrics_refreshed', {
    actorType: 'system',
    entityType: 'profile',
    entityId: profileId,
    userId,
    source: triggeredBy,
    context: {
      reason,
      jobId,
      likes: {
        previous: previousLikes,
        next: nextLikes,
        delta: likesDelta,
      },
      followers: {
        previous: previousFollowers,
        next: nextFollowers,
        delta: followersDelta,
      },
      previousRefreshedAt: previousMetrics.engagementRefreshedAt
        ? toIsoString(previousMetrics.engagementRefreshedAt)
        : null,
      refreshedAt: toIsoString(nextMetrics.engagementRefreshedAt),
      stage: resolvedNextTargeting.stage,
      previousStage: resolvedPreviousTargeting.stage,
      stageChanged: diff.stageChanged,
      addedSegments: diff.addedSegments,
      removedSegments: diff.removedSegments,
      currentSegments: resolvedNextTargeting.segments,
      metrics: resolvedNextTargeting.metrics,
    },
  });

  return { likesDelta, followersDelta, diff, nextTargeting: resolvedNextTargeting };
}

export async function recordTargetingSnapshotChange({
  profileId,
  userId,
  previousSnapshot = null,
  nextSnapshot = null,
  previousTargeting = null,
  nextTargeting = null,
  triggeredBy = 'profile_service',
} = {}) {
  const resolvedPreviousTargeting =
    previousTargeting ?? deriveTargetingSnapshot(previousSnapshot ?? {});
  const resolvedNextTargeting = nextTargeting ?? deriveTargetingSnapshot(nextSnapshot ?? {});
  const diff = computeSegmentDiff(resolvedPreviousTargeting, resolvedNextTargeting);

  if (!diff.stageChanged && diff.addedSegments.length === 0 && diff.removedSegments.length === 0) {
    return diff;
  }

  await safeTrack('profile.targeting.funnel_updated', {
    actorType: 'system',
    entityType: 'profile',
    entityId: profileId,
    userId,
    source: triggeredBy,
    context: {
      previousStage: diff.previousStage,
      nextStage: diff.nextStage,
      stageChanged: diff.stageChanged,
      addedSegments: diff.addedSegments,
      removedSegments: diff.removedSegments,
      currentSegments: resolvedNextTargeting.segments,
      metrics: resolvedNextTargeting.metrics,
    },
  });

  return diff;
}

export default {
  buildSnapshotFromOverview,
  buildSnapshotFromProfile,
  deriveTargetingSnapshot,
  recordTrustScoreChange,
  recordEngagementRefresh,
  recordTargetingSnapshotChange,
};
