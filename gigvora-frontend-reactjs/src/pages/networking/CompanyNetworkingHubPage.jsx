import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import NetworkingSessionsBoard from '../../components/networking/NetworkingSessionsBoard.jsx';
import NetworkingSessionDesigner from '../../components/networking/NetworkingSessionDesigner.jsx';
import NetworkingSessionShowcase from '../../components/networking/NetworkingSessionShowcase.jsx';
import NetworkingDuringSessionConsole from '../../components/networking/NetworkingDuringSessionConsole.jsx';
import NetworkingBusinessCardStudio from '../../components/networking/NetworkingBusinessCardStudio.jsx';
import useNetworkingSessions, { useNetworkingSessionRuntime } from '../../hooks/useNetworkingSessions.js';
import {
  createNetworkingSession,
  createNetworkingBusinessCard,
  listNetworkingBusinessCards,
} from '../../services/networking.js';
import useNetworkingAccess from '../../hooks/useNetworkingAccess.js';

const DEFAULT_PENALTY_RULES = { noShowThreshold: 2, cooldownDays: 14 };
const CARD_TEMPLATE_BASELINE = 3;

function toNullableNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toNumberOrZero(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function computeSessionMetrics(session) {
  const signups = Array.isArray(session?.signups) ? session.signups : [];
  const metrics = {
    registered: 0,
    waitlisted: 0,
    checkedIn: 0,
    completed: 0,
    noShows: 0,
    cardShares: 0,
    penalties: 0,
    profileSharedCount: 0,
    connectionsSaved: 0,
    messagesSent: 0,
    followUpsScheduled: 0,
    averageSatisfaction: null,
    penaltyRules: { ...DEFAULT_PENALTY_RULES },
  };

  const satisfactionScores = [];

  signups.forEach((signup) => {
    const status = signup?.status;
    if (status === 'registered') metrics.registered += 1;
    if (status === 'waitlisted') metrics.waitlisted += 1;
    if (status === 'checked_in') metrics.checkedIn += 1;
    if (status === 'completed') metrics.completed += 1;
    if (status === 'no_show') metrics.noShows += 1;

    if (signup?.businessCardId != null) {
      metrics.cardShares += 1;
    }
    if (toNumberOrZero(signup?.penaltyCount) > 0) {
      metrics.penalties += 1;
    }

    metrics.profileSharedCount += toNumberOrZero(signup?.profileSharedCount);
    metrics.connectionsSaved += toNumberOrZero(signup?.connectionsSaved);
    metrics.messagesSent += toNumberOrZero(signup?.messagesSent);
    metrics.followUpsScheduled += toNumberOrZero(signup?.followUpsScheduled);

    const score = toNullableNumber(signup?.satisfactionScore);
    if (score != null) {
      satisfactionScores.push(score);
    }
  });

  if (satisfactionScores.length) {
    metrics.averageSatisfaction = Number(
      (
        satisfactionScores.reduce((sum, value) => sum + value, 0) /
        satisfactionScores.length
      ).toFixed(2),
    );
  }

  const penaltyRules =
    session && typeof session.penaltyRules === 'object' && session.penaltyRules != null
      ? { ...DEFAULT_PENALTY_RULES, ...session.penaltyRules }
      : { ...DEFAULT_PENALTY_RULES };

  metrics.penaltyRules = {
    ...penaltyRules,
    noShowThreshold: Math.max(
      1,
      Math.round(Number(penaltyRules.noShowThreshold) || DEFAULT_PENALTY_RULES.noShowThreshold),
    ),
    cooldownDays: Math.max(
      1,
      Math.round(Number(penaltyRules.cooldownDays) || DEFAULT_PENALTY_RULES.cooldownDays),
    ),
  };

  return metrics;
}

function buildNetworkingOverview({ sessions = [], cards = [] }) {
  const sessionList = Array.isArray(sessions) ? sessions : [];
  const cardsList = Array.isArray(cards) ? cards : [];
  const now = Date.now();

  const sessionSummaries = sessionList.map((session) => {
    const metrics = computeSessionMetrics(session);
    const start = session?.startTime ? new Date(session.startTime).getTime() : null;
    return {
      ...session,
      metrics,
      upcoming: start != null && start > now,
      signups: Array.isArray(session?.signups) ? session.signups : [],
    };
  });

  const totals = {
    total: sessionSummaries.length,
    active: 0,
    upcoming: 0,
    completed: 0,
    draft: 0,
    cancelled: 0,
    joinLimits: [],
    rotationDurations: [],
    registered: 0,
    waitlist: 0,
    checkedIn: 0,
    completedAttendees: 0,
    noShows: 0,
    profileShares: 0,
    connectionsSaved: 0,
    messagesSent: 0,
    followUps: 0,
    paidSessions: 0,
    freeSessions: 0,
    revenueCents: 0,
    pricePoints: [],
    satisfactionScores: [],
    videoQuality: [],
    browserLoadShare: [],
    videoFailover: [],
    hostAnnouncements: 0,
    remindersSent: 0,
    searchDemand: 0,
    sponsorSlots: 0,
  };

  sessionSummaries.forEach((session) => {
    const status = session?.status;
    if (status === 'in_progress') totals.active += 1;
    if (status === 'scheduled' && session.upcoming) totals.upcoming += 1;
    if (status === 'completed') totals.completed += 1;
    if (status === 'draft') totals.draft += 1;
    if (status === 'cancelled') totals.cancelled += 1;

    const joinLimit = toNullableNumber(session?.joinLimit);
    if (joinLimit != null) {
      totals.joinLimits.push(joinLimit);
    }
    const rotationSeconds = toNullableNumber(session?.rotationDurationSeconds);
    if (rotationSeconds != null) {
      totals.rotationDurations.push(rotationSeconds);
    }

    const metrics = session.metrics;
    totals.registered += metrics.registered;
    totals.waitlist += metrics.waitlisted;
    totals.checkedIn += metrics.checkedIn;
    totals.completedAttendees += metrics.completed;
    totals.noShows += metrics.noShows;
    totals.profileShares += metrics.profileSharedCount;
    totals.connectionsSaved += metrics.connectionsSaved;
    totals.messagesSent += metrics.messagesSent;
    totals.followUps += metrics.followUpsScheduled;

    if (session?.accessType === 'paid') {
      totals.paidSessions += 1;
      const price = toNullableNumber(session?.priceCents);
      if (price != null) {
        const attendees = metrics.checkedIn + metrics.completed;
        totals.revenueCents += price * Math.max(0, attendees);
        totals.pricePoints.push(price);
      }
    } else {
      totals.freeSessions += 1;
    }

    if (metrics.averageSatisfaction != null) {
      totals.satisfactionScores.push(metrics.averageSatisfaction);
    }

    const telemetry = session?.videoTelemetry ?? {};
    const qualityScore = toNullableNumber(telemetry.qualityScore);
    if (qualityScore != null) {
      totals.videoQuality.push(qualityScore);
    }
    const announcementCount = toNullableNumber(telemetry.announcements);
    if (announcementCount != null) {
      totals.hostAnnouncements += announcementCount;
    }
    const failoverRate = toNullableNumber(telemetry.failoverRate);
    if (failoverRate != null) {
      totals.videoFailover.push(failoverRate);
    }

    const videoConfig = session?.videoConfig ?? {};
    const loadShare = toNullableNumber(videoConfig.clientLoadShare);
    if (loadShare != null) {
      totals.browserLoadShare.push(loadShare);
    }

    totals.remindersSent += toNumberOrZero(session?.metadata?.remindersSent);
    totals.searchDemand += toNumberOrZero(session?.metadata?.searchInterest);
    totals.sponsorSlots += toNumberOrZero(session?.monetization?.sponsorSlots);
  });

  const averageJoinLimit = totals.joinLimits.length
    ? Math.round(totals.joinLimits.reduce((sum, value) => sum + value, 0) / totals.joinLimits.length)
    : null;
  const averageRotationSeconds = totals.rotationDurations.length
    ? Math.round(totals.rotationDurations.reduce((sum, value) => sum + value, 0) / totals.rotationDurations.length)
    : null;
  const averagePriceCents = totals.pricePoints.length
    ? Math.round(totals.pricePoints.reduce((sum, value) => sum + value, 0) / totals.pricePoints.length)
    : null;
  const averageSatisfaction = totals.satisfactionScores.length
    ? Number(
        (
          totals.satisfactionScores.reduce((sum, value) => sum + value, 0) /
          totals.satisfactionScores.length
        ).toFixed(2),
      )
    : null;
  const averageVideoQuality = totals.videoQuality.length
    ? Number(
        (totals.videoQuality.reduce((sum, value) => sum + value, 0) / totals.videoQuality.length).toFixed(2),
      )
    : null;
  const averageBrowserLoadShare = totals.browserLoadShare.length
    ? Number(
        (
          totals.browserLoadShare.reduce((sum, value) => sum + value, 0) /
          totals.browserLoadShare.length
        ).toFixed(2),
      )
    : null;
  const averageFailoverRate = totals.videoFailover.length
    ? Number(
        (totals.videoFailover.reduce((sum, value) => sum + value, 0) / totals.videoFailover.length).toFixed(3),
      )
    : null;

  const totalSignups =
    totals.registered + totals.waitlist + totals.checkedIn + totals.completedAttendees + totals.noShows;
  const noShowRate = totalSignups > 0 ? Number(((totals.noShows / totalSignups) * 100).toFixed(1)) : null;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cardsUpdatedThisWeek = cardsList.filter((card) => {
    const updatedAt = card?.updatedAt ? new Date(card.updatedAt).getTime() : null;
    return updatedAt != null && updatedAt >= sevenDaysAgo;
  }).length;
  const uniqueTags = new Set(
    cardsList.flatMap((card) => (Array.isArray(card?.tags) ? card.tags : [])).filter(Boolean),
  );
  const cardsAvailable = cardsList.filter((card) => card?.status !== 'archived').length;
  const cardShares = sessionSummaries.reduce((sum, session) => sum + session.metrics.cardShares, 0);

  const featuredSession =
    sessionSummaries
      .filter((session) => session.upcoming)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0] ??
    sessionSummaries[0] ??
    null;

  return {
    sessions: {
      total: totals.total,
      active: totals.active,
      upcoming: totals.upcoming,
      completed: totals.completed,
      draft: totals.draft,
      cancelled: totals.cancelled,
      averageJoinLimit,
      rotationDurationSeconds: averageRotationSeconds,
      registered: totals.registered,
      waitlist: totals.waitlist,
      checkedIn: totals.checkedIn,
      completedAttendees: totals.completedAttendees,
      paid: totals.paidSessions,
      free: totals.freeSessions,
      revenueCents: totals.revenueCents,
      averagePriceCents,
      satisfactionAverage: averageSatisfaction,
      list: sessionSummaries,
    },
    scheduling: {
      preRegistrations: totals.registered + totals.checkedIn + totals.completedAttendees,
      waitlist: totals.waitlist,
      remindersSent: totals.remindersSent,
      searches: totals.searchDemand,
      sponsorSlots: totals.sponsorSlots,
    },
    monetization: {
      paid: totals.paidSessions,
      free: totals.freeSessions,
      revenueCents: totals.revenueCents,
      averagePriceCents,
    },
    penalties: {
      noShowRate,
      activePenalties: totals.noShows,
      restrictedParticipants: sessionSummaries.reduce((count, session) => {
        const threshold = Number(
          session.metrics?.penaltyRules?.noShowThreshold ?? DEFAULT_PENALTY_RULES.noShowThreshold,
        );
        const signups = Array.isArray(session.signups) ? session.signups : [];
        return (
          count +
          signups.filter((signup) => Number(signup?.penaltyCount ?? 0) >= Math.max(1, threshold || 0)).length
        );
      }, 0),
      cooldownDays: sessionSummaries.reduce(
        (max, session) =>
          Math.max(
            max,
            Number(session.metrics?.penaltyRules?.cooldownDays ?? DEFAULT_PENALTY_RULES.cooldownDays) || 0,
          ),
        DEFAULT_PENALTY_RULES.cooldownDays,
      ),
    },
    attendeeExperience: {
      profilesShared: totals.profileShares,
      connectionsSaved: totals.connectionsSaved,
      averageMessagesPerSession: sessionSummaries.length
        ? Number(((totals.messagesSent || 0) / sessionSummaries.length).toFixed(1))
        : 0,
      followUpsScheduled: totals.followUps,
    },
    digitalBusinessCards: {
      created: cardsList.length,
      updatedThisWeek: cardsUpdatedThisWeek,
      sharedInSession: cardShares,
      templates: Math.max(CARD_TEMPLATE_BASELINE, uniqueTags.size || 0),
      available: cardsAvailable,
    },
    video: {
      averageQualityScore: averageVideoQuality,
      browserLoadShare: averageBrowserLoadShare,
      hostAnnouncements: totals.hostAnnouncements,
      failoverRate: averageFailoverRate,
    },
    showcase: {
      featured: featuredSession,
      librarySize: sessionSummaries.length,
      cardsAvailable,
      sessionHighlights:
        featuredSession?.showcaseConfig?.sessionHighlights ??
        featuredSession?.sessionHighlights ??
        ['Timed rotations', 'Digital business cards', 'Browser-based video'],
    },
  };
}

function formatMembershipLabel(value) {
  if (!value) {
    return 'Workspace';
  }
  const normalised = `${value}`.replace(/_/g, ' ').trim();
  return normalised.charAt(0).toUpperCase() + normalised.slice(1);
}

function AccessDeniedNotice({ reason, memberships }) {
  const hasMemberships = Array.isArray(memberships) && memberships.length > 0;

  return (
    <section className="flex flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <LockClosedIcon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Networking hub is locked</h2>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          {reason ||
            'Switch to a company workspace with networking permissions to unlock full speed networking controls.'}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {hasMemberships ? (
          memberships.map((membership) => (
            <span
              key={membership}
              className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600"
            >
              {formatMembershipLabel(membership)}
            </span>
          ))
        ) : (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Company or agency membership required
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href="/dashboard/company"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          Return to company overview
        </a>
        <a
          href="mailto:success@gigvora.com?subject=Networking%20hub%20access"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          Contact success team
        </a>
      </div>
    </section>
  );
}

export default function CompanyNetworkingHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const networkingAccess = useNetworkingAccess();
  const { canManageNetworking, reason: accessDeniedReason, allowedMemberships } = networkingAccess;
  const companyIdParam = searchParams.get('companyId');
  const parsedCompanyId = Number(companyIdParam);
  const companyId = Number.isFinite(parsedCompanyId) ? parsedCompanyId : undefined;

  const [runtimeSessionId, setRuntimeSessionId] = useState(null);
  const [cardLibrary, setCardLibrary] = useState([]);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardLoadError, setCardLoadError] = useState(null);

  const {
    data: networkingData,
    loading,
    error,
    refresh,
  } = useNetworkingSessions({ companyId, lookbackDays: 180, enabled: canManageNetworking });

  const networkingOverview = useMemo(
    () => buildNetworkingOverview({ sessions: networkingData?.sessions ?? [], cards: cardLibrary }),
    [networkingData?.sessions, cardLibrary],
  );

  const sessions = networkingOverview.sessions?.list ?? [];

  const permittedWorkspaceIds = useMemo(() => {
    const metaIds = networkingData?.meta?.permittedWorkspaceIds;
    if (!Array.isArray(metaIds)) {
      return [];
    }
    return metaIds
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
  }, [networkingData?.meta?.permittedWorkspaceIds]);

  const resolvedCompanyId = useMemo(() => {
    if (!canManageNetworking) {
      return undefined;
    }
    const metaSelected = Number(networkingData?.meta?.selectedWorkspaceId);
    if (Number.isFinite(metaSelected) && (!permittedWorkspaceIds.length || permittedWorkspaceIds.includes(metaSelected))) {
      return metaSelected;
    }
    if (Number.isFinite(companyId) && (!permittedWorkspaceIds.length || permittedWorkspaceIds.includes(companyId))) {
      return companyId;
    }
    if (sessions.length) {
      const firstId = Number(sessions[0]?.companyId);
      if (Number.isFinite(firstId) && (!permittedWorkspaceIds.length || permittedWorkspaceIds.includes(firstId))) {
        return firstId;
      }
    }
    return permittedWorkspaceIds[0] ?? undefined;
  }, [canManageNetworking, networkingData?.meta?.selectedWorkspaceId, companyId, sessions, permittedWorkspaceIds]);

  const selectedSessionId = useMemo(() => {
    if (!canManageNetworking) return null;
    if (runtimeSessionId) return runtimeSessionId;
    if (sessions.length) {
      return sessions[0].id;
    }
    return null;
  }, [canManageNetworking, runtimeSessionId, sessions]);

  useEffect(() => {
    if (!runtimeSessionId) return;
    if (!sessions.some((session) => session.id === runtimeSessionId)) {
      setRuntimeSessionId(null);
    }
  }, [runtimeSessionId, sessions]);

  const runtime = useNetworkingSessionRuntime(selectedSessionId, {
    enabled: canManageNetworking && Boolean(selectedSessionId),
  });

  const handleRefreshCards = useCallback(async () => {
    if (!canManageNetworking) {
      const message = 'Networking business cards are available to company or agency managers.';
      setCardLibrary([]);
      setCardLoadError(message);
      return [];
    }
    if (!resolvedCompanyId) {
      setCardLibrary([]);
      setCardLoadError(null);
      return [];
    }
    setCardLoading(true);
    setCardLoadError(null);
    try {
      const cards = await listNetworkingBusinessCards({ companyId: resolvedCompanyId });
      const nextCards = Array.isArray(cards) ? cards : [];
      setCardLibrary(nextCards);
      return nextCards;
    } catch (refreshError) {
      const message = refreshError?.message || 'Failed to load digital business cards.';
      setCardLoadError(message);
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to load networking business cards', refreshError);
      }
      return null;
    } finally {
      setCardLoading(false);
    }
  }, [canManageNetworking, resolvedCompanyId]);

  useEffect(() => {
    if (!resolvedCompanyId) {
      return;
    }
    handleRefreshCards();
  }, [resolvedCompanyId, handleRefreshCards]);

  const handleCreateSession = useCallback(
    async (payload) => {
      if (!canManageNetworking) {
        throw new Error('You do not have permission to create networking sessions.');
      }
      const request = { ...payload };
      if (!resolvedCompanyId) {
        throw new Error('Select an eligible workspace before creating a networking session.');
      }
      request.companyId = resolvedCompanyId;
      try {
        await createNetworkingSession(request);
        await refresh({ force: true });
        setRuntimeSessionId(null);
      } catch (submissionError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to create networking session', submissionError);
        }
        throw submissionError;
      }
    },
    [canManageNetworking, refresh, resolvedCompanyId],
  );

  const handleCreateCard = useCallback(
    async (payload) => {
      if (!canManageNetworking) {
        const message = 'You do not have permission to create networking business cards.';
        setCardLoadError(message);
        throw new Error(message);
      }
      if (!resolvedCompanyId) {
        const message = 'Select a workspace before creating business cards.';
        setCardLoadError(message);
        throw new Error(message);
      }
      try {
        await createNetworkingBusinessCard({ ...payload, companyId: resolvedCompanyId });
        await handleRefreshCards();
      } catch (submissionError) {
        const message = submissionError?.message || 'Failed to create business card.';
        setCardLoadError(message);
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to create networking business card', submissionError);
        }
        throw submissionError;
      }
    },
    [canManageNetworking, handleRefreshCards, resolvedCompanyId],
  );

  const menuSections = [
    {
      label: 'Networking',
      items: [
        { name: 'Sessions', sectionId: 'networking-sessions-board' },
        { name: 'Designer', sectionId: 'networking-session-designer' },
        { name: 'Runtime console', sectionId: 'networking-runtime-console' },
        { name: 'Business cards', sectionId: 'networking-card-studio' },
      ],
    },
  ];

  if (!canManageNetworking) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Networking hub"
        subtitle="Plan, promote, and run browser-based speed networking."
        description="Design immersive networking programs, monitor attendance in real time, and keep digital cards ready to share."
        menuSections={[]}
        sections={[]}
        availableDashboards={['company', 'agency', 'headhunter']}
        activeMenuItem="sessions"
      >
        <AccessDeniedNotice reason={accessDeniedReason} memberships={allowedMemberships} />
      </DashboardLayout>
    );
  }

  const pageContent = (
    <div className="flex flex-col gap-8">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message || 'Failed to load networking data.'}
        </div>
      ) : null}

      <div id="networking-sessions-board">
        <NetworkingSessionsBoard
          networking={networkingOverview}
          selectedSessionId={selectedSessionId}
          onSelectSession={(session) => setRuntimeSessionId(session?.id ?? null)}
          onCreateSession={() => {
            const params = new URLSearchParams(searchParams);
            if (resolvedCompanyId) {
              params.set('companyId', resolvedCompanyId);
              setSearchParams(params, { replace: true });
            }
            const designer = document.getElementById('networking-session-designer');
            designer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      </div>

      <div id="networking-session-designer">
        <NetworkingSessionDesigner onCreateSession={handleCreateSession} defaultValues={{ companyId: resolvedCompanyId }} disabled={loading} />
      </div>

      <NetworkingSessionShowcase
        showcase={networkingOverview.showcase}
        onPreview={() => setRuntimeSessionId(selectedSessionId)}
      />

      <div id="networking-runtime-console">
        <NetworkingDuringSessionConsole
          runtime={runtime.data}
          loading={runtime.loading}
          onRefresh={() => runtime.refresh?.({ force: true })}
        />
      </div>

      <div id="networking-card-studio">
        <NetworkingBusinessCardStudio
          cards={cardLibrary}
          onCreateCard={handleCreateCard}
          onRefresh={handleRefreshCards}
          disabled={loading}
          loading={cardLoading}
          errorMessage={cardLoadError}
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Networking hub"
      subtitle="Plan, promote, and run browser-based speed networking."
      description="Design immersive networking programs, monitor attendance in real time, and keep digital cards ready to share."
      menuSections={menuSections}
      sections={[]}
      availableDashboards={['company', 'agency', 'headhunter']}
      activeMenuItem="sessions"
    >
      {loading && !networkingData ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading networking data…</div>
      ) : (
        pageContent
      )}
    </DashboardLayout>
  );
}
