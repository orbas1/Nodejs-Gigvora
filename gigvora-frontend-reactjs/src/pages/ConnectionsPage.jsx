import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import ConnectionsGrid from '../components/connections/ConnectionsGrid.jsx';
import InvitationManager from '../components/connections/InvitationManager.jsx';
import PeopleSearchBar from '../components/connections/PeopleSearchBar.jsx';
import ConnectionProfileCard from '../components/connections/ConnectionProfileCard.jsx';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';
import useConnectionNetwork from '../hooks/useConnectionNetwork.js';
import { createConnectionRequest, respondToConnection, withdrawConnection } from '../services/connections.js';

export function ConnectionCard({ node, ...props }) {
  if (!node) {
    return null;
  }
  return <ConnectionProfileCard connection={node} {...props} />;
}

ConnectionCard.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    actions: PropTypes.shape({
      canRequestConnection: PropTypes.bool,
      reason: PropTypes.string,
    }),
  }).isRequired,
};

const DEFAULT_FILTERS = { focusAreas: [], locations: [], availability: [] };

function normalise(value) {
  return (value ?? '').toString().trim().toLowerCase();
}

function safeArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return [value].filter(Boolean);
}

function computeAvailableFilters(connections) {
  const focus = new Set();
  const locations = new Set();
  const availability = new Set();

  connections.forEach((connection) => {
    safeArray(connection.focusAreas ?? connection.industries ?? connection.tags).forEach((item) => focus.add(item));
    if (connection.persona) {
      focus.add(connection.persona);
    }
    if (connection.userType) {
      focus.add(connection.userType);
    }
    const location = connection.location;
    if (location) {
      locations.add(location);
    }
    safeArray(connection.availability).forEach((item) => availability.add(item));
  });

  const toSortedArray = (collection) => Array.from(collection).filter(Boolean).sort((a, b) => a.localeCompare(b));

  return {
    focusAreas: toSortedArray(focus).slice(0, 20),
    locations: toSortedArray(locations).slice(0, 20),
    availability: toSortedArray(availability).slice(0, 12),
  };
}

function computeSearchStats(connections, summary, refreshedAt) {
  const total = summary?.total ?? connections.length;
  const thirtyDaysMs = 1000 * 60 * 60 * 24 * 30;
  const recent = connections.filter((connection) => {
    const timestamp = connection.connectedAt ?? connection.createdAt;
    if (!timestamp) {
      return false;
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    return Date.now() - date.getTime() <= thirtyDaysMs;
  }).length;
  const responseRates = connections
    .map((connection) => Number(connection.responseRate))
    .filter((rate) => !Number.isNaN(rate));
  const responseRate = responseRates.length
    ? Math.round((responseRates.reduce((sum, rate) => sum + rate, 0) / responseRates.length) * 10) / 10
    : '—';

  const lastUpdated = refreshedAt
    ? new Date(refreshedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return {
    total,
    newConnections: recent,
    responseRate,
    lastUpdated,
  };
}

function buildSuggestions(connections, engagementSignals) {
  const fromConnections = connections
    .slice(0, 40)
    .flatMap((connection) => [connection.name, connection.headline, connection.location])
    .filter(Boolean);
  const fromSignals = engagementSignals.connectionSuggestions
    .map((suggestion) => suggestion.headline ?? suggestion.reason ?? suggestion.name)
    .filter(Boolean);
  return Array.from(new Set([...fromSignals, ...fromConnections])).slice(0, 12);
}

function dedupeInvitations(items) {
  const seen = new Set();
  const output = [];
  items.forEach((item) => {
    const key = item?.id ?? item?.userId ?? item?.targetId;
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    output.push({ ...item, id: key });
  });
  return output;
}

function matchesFilters(connection, query, filters) {
  const normalisedQuery = normalise(query);
  if (normalisedQuery) {
    const haystack = [
      connection.name,
      connection.headline,
      connection.location,
      connection.persona,
      connection.userType,
      connection.summary,
      connection.bio,
      ...(safeArray(connection.focusAreas ?? connection.industries ?? connection.tags)),
      ...(safeArray(connection.connectors).map((connector) => connector?.name ?? connector)),
    ]
      .filter(Boolean)
      .map((value) => normalise(value));

    if (!haystack.some((value) => value.includes(normalisedQuery))) {
      return false;
    }
  }

  if (filters.focusAreas.length) {
    const focusValues = new Set(
      [
        ...safeArray(connection.focusAreas),
        ...safeArray(connection.industries),
        ...safeArray(connection.tags),
        connection.persona,
        connection.userType,
      ]
        .filter(Boolean)
        .map((value) => normalise(value)),
    );
    if (!filters.focusAreas.some((value) => focusValues.has(normalise(value)))) {
      return false;
    }
  }

  if (filters.locations.length) {
    const locationValue = normalise(connection.location);
    if (!filters.locations.some((value) => locationValue.includes(normalise(value)))) {
      return false;
    }
  }

  if (filters.availability.length) {
    const availabilityValues = new Set(
      safeArray(connection.availability)
        .filter(Boolean)
        .map((value) => normalise(value)),
    );
    if (!filters.availability.some((value) => availabilityValues.has(normalise(value)))) {
      return false;
    }
  }

  return true;
}

export default function ConnectionsPage() {
  const { session } = useSession();
  const [feedback, setFeedback] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeSegment, setActiveSegment] = useState('first');
  const [sortOrder, setSortOrder] = useState('recommended');
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const userId = session?.id ?? session?.userId ?? null;
  const engagementSignals = useEngagementSignals({ session, limit: 8 });
  const networkState = useConnectionNetwork({ userId, viewerId: userId, includePending: true, enabled: Boolean(userId) });
  const { data: network, loading, error } = networkState;

  const directConnections = network?.firstDegree ?? [];
  const secondDegree = network?.secondDegree ?? [];
  const thirdDegree = network?.thirdDegree ?? [];
  const summary = network?.summary ?? { firstDegree: 0, secondDegree: 0, thirdDegree: 0, total: 0 };

  const segments = useMemo(
    () => [
      {
        id: 'first',
        title: '1st degree',
        description: 'Direct collaborators who receive instant updates and direct messages.',
        connections: directConnections,
      },
      {
        id: 'second',
        title: '2nd degree',
        description: 'Warm introductions surfaced by trusted partners to unlock fast-track intros.',
        connections: secondDegree,
      },
      {
        id: 'third',
        title: '3rd degree',
        description: 'Strategic relationships two hops away—pair outreach with context and intent.',
        connections: thirdDegree,
      },
    ],
    [directConnections, secondDegree, thirdDegree],
  );

  useEffect(() => {
    if (!segments.some((segment) => segment.id === activeSegment) && segments[0]) {
      setActiveSegment(segments[0].id);
    }
  }, [segments, activeSegment]);

  const allConnections = useMemo(
    () => segments.flatMap((segment) => segment.connections ?? []),
    [segments],
  );

  const availableFilters = useMemo(() => computeAvailableFilters(allConnections), [allConnections]);
  const searchStats = useMemo(
    () => computeSearchStats(allConnections, summary, network?.refreshedAt ?? network?.updatedAt),
    [allConnections, summary, network?.refreshedAt, network?.updatedAt],
  );

  const suggestions = useMemo(
    () => buildSuggestions(allConnections, engagementSignals),
    [allConnections, engagementSignals],
  );

  const filteredSegments = useMemo(
    () =>
      segments.map((segment) => ({
        ...segment,
        connections: (segment.connections ?? []).filter((connection) => matchesFilters(connection, searchQuery, filters)),
      })),
    [segments, searchQuery, filters],
  );

  const knownNames = useMemo(
    () => new Set(directConnections.map((connection) => normalise(connection.name))),
    [directConnections],
  );

  const recommendedConnections = useMemo(
    () =>
      engagementSignals.connectionSuggestions.filter((suggestion) => {
        const key = normalise(suggestion.name);
        return key && !knownNames.has(key);
      }),
    [engagementSignals.connectionSuggestions, knownNames],
  );

  const groupSuggestions = engagementSignals.groupSuggestions;

  const pending = network?.pending ?? network?.requests ?? {};
  const incomingInvitations = pending.incoming ?? pending.received ?? [];
  const outgoingInvitations = pending.outgoing ?? pending.sent ?? [];
  const suggestedInvitations = useMemo(() => {
    const networkSuggestions = safeArray(network?.suggestedConnections ?? network?.suggested ?? []);
    const recommendationPayload = recommendedConnections.map((suggestion) => ({
      id: suggestion.id,
      name: suggestion.name,
      headline: suggestion.headline,
      location: suggestion.location,
      mutualConnections: suggestion.mutualConnections,
      persona: suggestion.userType ?? suggestion.persona,
      industries: suggestion.industries ?? suggestion.tags,
      focusAreas: suggestion.focusAreas,
      note: suggestion.reason,
      sentAt: suggestion.lastActive,
    }));
    return dedupeInvitations([...networkSuggestions, ...recommendationPayload]);
  }, [network?.suggestedConnections, network?.suggested, recommendedConnections]);

  const invitationAnalytics = useMemo(() => {
    const analytics = network?.invitationAnalytics ?? {};
    const acceptanceValue = analytics.acceptanceRate;
    const acceptanceRate =
      typeof acceptanceValue === 'number'
        ? Math.round(acceptanceValue)
        : Number.isFinite(Number.parseFloat(acceptanceValue))
        ? Math.round(Number.parseFloat(acceptanceValue))
        : '—';
    const closedValue =
      typeof analytics.closed === 'number'
        ? analytics.closed
        : incomingInvitations.filter((invitation) => invitation.status === 'accepted').length;
    return {
      acceptanceRate,
      medianResponse: analytics.medianResponse ?? '—',
      closed: closedValue,
    };
  }, [network?.invitationAnalytics, incomingInvitations]);

  const handleConnect = useCallback(
    async (connection) => {
      if (!connection || !userId) {
        return;
      }
      try {
        setSubmittingId(connection.id);
        setFeedback(null);
        await createConnectionRequest({ actorId: userId, targetId: connection.id });
        setFeedback({ type: 'success', message: `Connection request queued for ${connection.name}.` });
        await networkState.refresh?.({ force: true });
      } catch (requestError) {
        const message =
          requestError?.body?.message ?? requestError?.message ?? 'Unable to create the connection request right now.';
        setFeedback({ type: 'error', message });
      } finally {
        setSubmittingId(null);
      }
    },
    [userId, networkState],
  );

  const handleMessage = useCallback((connection) => {
    setFeedback({ type: 'info', message: `Message composer launching soon for ${connection.name}.` });
  }, []);

  const handleBookmark = useCallback((connection) => {
    setBookmarkedIds((previous) => {
      const next = new Set(previous);
      const alreadySaved = next.has(connection.id);
      if (alreadySaved) {
        next.delete(connection.id);
        setFeedback({ type: 'info', message: `${connection.name} removed from your follow-up list.` });
      } else {
        next.add(connection.id);
        setFeedback({ type: 'success', message: `${connection.name} saved to your follow-up list.` });
      }
      return next;
    });
  }, []);

  const handleAcceptInvitation = useCallback(
    async (invitation, { note } = {}) => {
      if (!userId || !invitation?.id) {
        return;
      }
      try {
        setFeedback(null);
        await respondToConnection({ connectionId: invitation.id, actorId: userId, decision: 'accept', note });
        setFeedback({ type: 'success', message: `Accepted invitation from ${invitation.name}.` });
        await networkState.refresh?.({ force: true });
      } catch (requestError) {
        const message =
          requestError?.body?.message ??
          requestError?.message ??
          `Unable to accept the invitation from ${invitation.name}.`;
        setFeedback({ type: 'error', message });
      }
    },
    [userId, networkState],
  );

  const handleDeclineInvitation = useCallback(
    async (invitation, { note } = {}) => {
      if (!userId || !invitation?.id) {
        return;
      }
      try {
        setFeedback(null);
        await respondToConnection({ connectionId: invitation.id, actorId: userId, decision: 'reject', note });
        setFeedback({ type: 'info', message: `Declined invitation from ${invitation.name}.` });
        await networkState.refresh?.({ force: true });
      } catch (requestError) {
        const message =
          requestError?.body?.message ??
          requestError?.message ??
          `Unable to decline the invitation from ${invitation.name}.`;
        setFeedback({ type: 'error', message });
      }
    },
    [userId, networkState],
  );

  const handleRescindInvitation = useCallback(
    async (invitation, { note, withdraw } = {}) => {
      if (!userId || !invitation?.id) {
        return;
      }
      if (!withdraw) {
        setFeedback({ type: 'info', message: `Reminder set for ${invitation.name}.` });
        return;
      }
      try {
        setFeedback(null);
        await withdrawConnection({ connectionId: invitation.id, actorId: userId });
        setFeedback({ type: 'success', message: `Withdrew invitation for ${invitation.name}.` });
        await networkState.refresh?.({ force: true });
      } catch (requestError) {
        const message =
          requestError?.body?.message ??
          requestError?.message ??
          `Unable to withdraw the invitation for ${invitation.name}.`;
        setFeedback({ type: 'error', message });
      }
    },
    [userId, networkState],
  );

  const handleSendInvitation = useCallback(
    async (invitation, { note, skip } = {}) => {
      if (!userId || !invitation?.id) {
        return;
      }
      if (skip) {
        setFeedback({ type: 'info', message: `Skipped invitation to ${invitation.name}.` });
        return;
      }
      try {
        setFeedback(null);
        await createConnectionRequest({ actorId: userId, targetId: invitation.id, message: note });
        setFeedback({ type: 'success', message: `Invitation sent to ${invitation.name}.` });
        await networkState.refresh?.({ force: true });
      } catch (requestError) {
        const message =
          requestError?.body?.message ??
          requestError?.message ??
          `Unable to send the invitation to ${invitation.name}.`;
        setFeedback({ type: 'error', message });
      }
    },
    [userId, networkState],
  );

  if (!userId) {
    return (
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-6">
          <PageHeader
            eyebrow="Network"
            title="Followers &amp; connects"
            description="Sign in to unlock 1st, 2nd, and 3rd-degree visibility and manage introductions across the Gigvora network."
          />
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <p className="text-sm font-semibold text-slate-900">Access restricted</p>
            <p className="mt-3 text-sm text-slate-600">
              Create or load a session to view your trusted connections and connection policies.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accentDark"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Network"
          title="Followers &amp; connects"
          description="Nurture your relationships across the Gigvora network and unlock collaborations faster."
        />
        <div className="mt-10 space-y-10">
          {feedback ? (
            <div
              className={`rounded-3xl border px-6 py-4 text-sm font-medium ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : feedback.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
              We couldn’t load your network right now. Please refresh shortly.
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)]">
            <ConnectionsGrid
              segments={filteredSegments}
              activeSegment={activeSegment}
              onSegmentChange={setActiveSegment}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              onConnect={handleConnect}
              onMessage={handleMessage}
              onBookmark={handleBookmark}
              submittingId={submittingId}
              bookmarkedIds={bookmarkedIds}
            />
            <PeopleSearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              filters={filters}
              onFiltersChange={setFilters}
              stats={searchStats}
              suggestions={suggestions}
              availableFilters={availableFilters}
              onSuggestionSelect={setSearchQuery}
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Network summary</p>
                <p className="mt-1 text-xs text-slate-500">Live visibility of 1st, 2nd, and 3rd-degree relationships.</p>
                <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">1st degree</dt>
                    <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.firstDegree}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">2nd degree</dt>
                    <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.secondDegree}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">3rd degree</dt>
                    <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.thirdDegree}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Connection policy</p>
                <p className="mt-1 text-xs text-slate-500">Roles you are cleared to engage with directly.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(network?.policy?.allowedRoles ?? []).map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      {role}
                    </span>
                  ))}
                </div>
                {network?.policy?.notes ? <p className="mt-4 text-xs text-slate-500">{network.policy.notes}</p> : null}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[...Array(4).keys()].map((index) => (
                <div key={index} className="h-48 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : null}

          <InvitationManager
            incoming={incomingInvitations}
            outgoing={outgoingInvitations}
            suggested={suggestedInvitations}
            analytics={invitationAnalytics}
            onAccept={handleAcceptInvitation}
            onDecline={handleDeclineInvitation}
            onRescind={handleRescindInvitation}
            onSend={handleSendInvitation}
          />

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.5fr),minmax(0,1fr)]">
            {recommendedConnections.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-semibold text-slate-900">People you should connect with</p>
                <p className="mt-1 text-xs text-slate-500">
                  Matches are based on shared interests and mutual collaborators.
                </p>
                <div className="mt-4 grid gap-4">
                  {recommendedConnections.slice(0, 4).map((person) => (
                    <ConnectionProfileCard
                      key={person.id}
                      connection={{
                        ...person,
                        degreeLabel: 'Recommended',
                        actions: { canRequestConnection: true, requiresIntroduction: person.requiresIntroduction },
                        connectors: person.connectors,
                        trustScore: person.score,
                      }}
                      onConnect={handleConnect}
                      onMessage={handleMessage}
                      onBookmark={handleBookmark}
                      isSubmitting={submittingId === person.id}
                      isBookmarked={bookmarkedIds.has(person.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {groupSuggestions.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-semibold text-slate-900">Groups to join</p>
                <p className="mt-1 text-xs text-slate-500">Grow relationships faster by joining aligned discussion circles.</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {groupSuggestions.slice(0, 3).map((group) => (
                    <li key={group.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {group.members} members · {safeArray(group.focus).slice(0, 2).join(' • ')}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-right text-xs text-accent">
                  <Link to="/groups" className="font-semibold hover:text-accentDark">
                    View all groups
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
