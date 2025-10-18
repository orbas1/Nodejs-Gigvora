import { formatDistanceToNow } from 'date-fns';

export function toDesignerDefaults(session) {
  if (!session) {
    return {};
  }

  return {
    id: session.id,
    title: session.title,
    description: session.description,
    status: session.status,
    startTime: session.startTime,
    sessionLengthMinutes: session.sessionLengthMinutes,
    rotationDurationSeconds: session.rotationDurationSeconds,
    joinLimit: session.joinLimit,
    waitlistLimit: session.waitlistLimit,
    accessType: session.accessType,
    priceCents: session.priceCents,
    requiresApproval: session.requiresApproval,
    lobbyInstructions: session.lobbyInstructions,
    followUpActions: session.followUpActions,
    penaltyRules: session.penaltyRules,
  };
}

function normaliseNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function summariseSessions(sessions = []) {
  const now = Date.now();
  const aggregate = {
    total: 0,
    draft: 0,
    upcoming: 0,
    live: 0,
    done: 0,
    cancelled: 0,
    averageJoinLimit: null,
    averageRotation: null,
    averageSatisfaction: null,
    noShowRate: null,
    averageMessages: null,
  };

  const joinLimits = [];
  const rotations = [];
  const satisfaction = [];
  const noShow = { missed: 0, total: 0 };
  const messageStats = { total: 0, sessions: 0 };

  sessions.forEach((session) => {
    aggregate.total += 1;

    const status = session?.status;
    if (status === 'draft') aggregate.draft += 1;
    if (status === 'scheduled') aggregate.upcoming += 1;
    if (status === 'in_progress') aggregate.live += 1;
    if (status === 'completed' || (session?.endTime && new Date(session.endTime).getTime() < now)) {
      aggregate.done += 1;
    }
    if (status === 'cancelled') aggregate.cancelled += 1;

    const joinLimit = normaliseNumber(session?.joinLimit);
    if (joinLimit != null) {
      joinLimits.push(joinLimit);
    }

    const rotation = normaliseNumber(session?.rotationDurationSeconds);
    if (rotation != null) {
      rotations.push(rotation);
    }

    const score = normaliseNumber(session?.metrics?.averageSatisfaction);
    if (score != null) {
      satisfaction.push(score);
    }

    const registered = normaliseNumber(session?.metrics?.registered) ?? 0;
    const waitlisted = normaliseNumber(session?.metrics?.waitlisted) ?? 0;
    const checkedIn = normaliseNumber(session?.metrics?.checkedIn) ?? 0;
    const completed = normaliseNumber(session?.metrics?.completed) ?? 0;
    const noShows = normaliseNumber(session?.metrics?.noShows) ?? 0;

    noShow.total += registered + waitlisted + checkedIn + completed + noShows;
    noShow.missed += noShows;

    const messages = normaliseNumber(session?.metrics?.messagesSent);
    if (messages != null) {
      messageStats.total += messages;
      messageStats.sessions += 1;
    }
  });

  if (joinLimits.length) {
    aggregate.averageJoinLimit = Math.round(joinLimits.reduce((sum, value) => sum + value, 0) / joinLimits.length);
  }
  if (rotations.length) {
    aggregate.averageRotation = Math.round(rotations.reduce((sum, value) => sum + value, 0) / rotations.length);
  }
  if (satisfaction.length) {
    aggregate.averageSatisfaction = Number(
      (satisfaction.reduce((sum, value) => sum + value, 0) / satisfaction.length).toFixed(2),
    );
  }
  if (noShow.total > 0) {
    aggregate.noShowRate = Number(((noShow.missed / noShow.total) * 100).toFixed(1));
  }
  if (messageStats.sessions > 0) {
    aggregate.averageMessages = Number((messageStats.total / messageStats.sessions).toFixed(1));
  }

  return aggregate;
}

export function summariseSpend(sessions = []) {
  const summary = {
    paidSessions: 0,
    freeSessions: 0,
    revenueCents: 0,
    purchases: 0,
    actualSpendCents: 0,
    targetSpendCents: 0,
    averagePriceCents: null,
  };

  const pricePoints = [];

  sessions.forEach((session) => {
    const signups = Array.isArray(session?.signups) ? session.signups : [];
    const joiners = signups.filter((signup) => ['checked_in', 'completed'].includes(signup?.status));
    const activeSeats = signups.filter((signup) => signup?.status !== 'removed');

    const priceCents = normaliseNumber(session?.priceCents);
    const monetization = session?.monetization ?? {};

    if (session?.accessType === 'paid' && priceCents != null) {
      summary.paidSessions += 1;
      summary.revenueCents += priceCents * Math.max(0, joiners.length);
      summary.purchases += Math.max(0, activeSeats.length);
      pricePoints.push(priceCents);
    } else {
      summary.freeSessions += 1;
    }

    const actualSpend = normaliseNumber(monetization.actualSpendCents);
    if (actualSpend != null) {
      summary.actualSpendCents += actualSpend;
    }

    const targetSpend = normaliseNumber(monetization.targetSpendCents);
    if (targetSpend != null) {
      summary.targetSpendCents += targetSpend;
    }
  });

  if (pricePoints.length) {
    summary.averagePriceCents = Math.round(pricePoints.reduce((sum, value) => sum + value, 0) / pricePoints.length);
  }

  return summary;
}

export function buildRecentConnections(sessions = []) {
  return sessions
    .flatMap((session) => {
      const signups = Array.isArray(session?.signups) ? session.signups : [];
      return signups
        .filter((signup) => ['checked_in', 'completed'].includes(signup?.status))
        .map((signup) => ({
          ...signup,
          sessionId: session?.id,
          sessionTitle: session?.title,
          companyId: session?.companyId,
        }));
    })
    .sort((a, b) => {
      const aTime = new Date(a?.completedAt || a?.updatedAt || a?.createdAt || 0).getTime();
      const bTime = new Date(b?.completedAt || b?.updatedAt || b?.createdAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 100)
    .map((connection) => ({
      ...connection,
      completedAgo: connection.completedAt || connection.updatedAt || connection.createdAt
        ? formatDistanceToNow(new Date(connection.completedAt || connection.updatedAt || connection.createdAt), {
            addSuffix: true,
          })
        : null,
    }));
}

export function extractCompanyIds(sessions = []) {
  const ids = new Set();
  sessions.forEach((session) => {
    const companyId = normaliseNumber(session?.companyId);
    if (companyId != null) {
      ids.add(companyId);
    }
  });
  return Array.from(ids);
}

export function resolveActiveCompanyId({ requestedId, sessions }) {
  const requested = normaliseNumber(requestedId);
  if (requested != null) {
    return requested;
  }
  const ids = extractCompanyIds(sessions);
  if (ids.length) {
    return ids[0];
  }
  return null;
}

export default {
  toDesignerDefaults,
  summariseSessions,
  summariseSpend,
  buildRecentConnections,
  extractCompanyIds,
  resolveActiveCompanyId,
};
