import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAgencyConnections,
  fetchAgencyProfile,
  listAgencyFollowers,
  removeAgencyConnection,
  removeAgencyFollower,
  requestAgencyConnection,
  respondToAgencyConnection,
  updateAgencyAvatar,
  updateAgencyFollower,
  updateAgencyProfile,
} from '../../../services/agency.js';
import AgencyAvatarManager from './AgencyAvatarManager.jsx';
import AgencyConnectionsPanel from './AgencyConnectionsPanel.jsx';
import AgencyFollowersPanel from './AgencyFollowersPanel.jsx';
import AgencyProfileEditForm from './AgencyProfileEditForm.jsx';
import AgencyProfileOverview from './AgencyProfileOverview.jsx';

const EMPTY_FOLLOWERS = { items: [], pagination: { limit: 25, offset: 0, total: 0 } };
const EMPTY_CONNECTIONS = {
  accepted: [],
  pendingIncoming: [],
  pendingOutgoing: [],
  summary: { accepted: 0, pendingIncoming: 0, pendingOutgoing: 0 },
};

function normaliseFollowers(source, fallback = EMPTY_FOLLOWERS) {
  if (!source) {
    return fallback;
  }
  return {
    items: Array.isArray(source.items)
      ? source.items.map((item) => ({ ...(item ?? {}), user: item?.user ? { ...item.user } : item?.user ?? null }))
      : [],
    pagination: { ...EMPTY_FOLLOWERS.pagination, ...(source.pagination ?? {}) },
  };
}

function normaliseConnections(source, fallback = EMPTY_CONNECTIONS) {
  if (!source) {
    return fallback;
  }
  return {
    accepted: Array.isArray(source.accepted)
      ? source.accepted.map((item) => ({
          ...(item ?? {}),
          counterpart: item?.counterpart ? { ...item.counterpart } : item?.counterpart ?? null,
          requester: item?.requester ? { ...item.requester } : item?.requester ?? null,
          target: item?.target ? { ...item.target } : item?.target ?? null,
        }))
      : [],
    pendingIncoming: Array.isArray(source.pendingIncoming)
      ? source.pendingIncoming.map((item) => ({
          ...(item ?? {}),
          requester: item?.requester ? { ...item.requester } : item?.requester ?? null,
          target: item?.target ? { ...item.target } : item?.target ?? null,
        }))
      : [],
    pendingOutgoing: Array.isArray(source.pendingOutgoing)
      ? source.pendingOutgoing.map((item) => ({
          ...(item ?? {}),
          requester: item?.requester ? { ...item.requester } : item?.requester ?? null,
          target: item?.target ? { ...item.target } : item?.target ?? null,
        }))
      : [],
    summary: { ...EMPTY_CONNECTIONS.summary, ...(source.summary ?? {}) },
  };
}

function updateOverviewCounts(overview, followers, connections) {
  if (!overview) {
    return overview;
  }
  const followerCount = followers?.pagination?.total ?? followers?.items?.length ?? 0;
  const connectionCount = connections?.summary?.accepted ?? connections?.accepted?.length ?? 0;
  const metrics = { ...(overview.metrics ?? {}) };
  metrics.followersCount = followerCount;
  metrics.connectionsCount = connectionCount;
  return {
    ...overview,
    agencyProfile: overview.agencyProfile ? { ...overview.agencyProfile } : overview.agencyProfile,
    metrics,
    followersCount: followerCount,
    connectionsCount: connectionCount,
  };
}

function buildState(payload, previousState = {}) {
  const followers = normaliseFollowers(payload.followers, previousState.followers ?? EMPTY_FOLLOWERS);
  const connections = normaliseConnections(payload.connections, previousState.connections ?? EMPTY_CONNECTIONS);
  const overview = updateOverviewCounts(
    payload.overview ?? previousState.overview ?? null,
    followers,
    connections,
  );
  const preferences = payload.preferences ? { ...payload.preferences } : previousState.preferences ?? null;
  const lastUpdated = payload.lastUpdated ?? previousState.lastUpdated ?? new Date().toISOString();
  return {
    overview,
    followers,
    connections,
    preferences,
    lastUpdated,
  };
}

function mergeFollowers(list, updatedFollower) {
  const followerId = updatedFollower?.followerId ?? updatedFollower?.id;
  if (!followerId) {
    return list;
  }
  const items = Array.isArray(list.items) ? [...list.items] : [];
  const index = items.findIndex((item) => (item?.followerId ?? item?.id) === followerId);
  if (index >= 0) {
    items[index] = { ...items[index], ...updatedFollower };
  } else {
    items.unshift(updatedFollower);
  }
  return {
    ...list,
    items,
  };
}

function removeFollowerById(list, followerId) {
  if (!followerId) {
    return list;
  }
  const items = (list.items ?? []).filter((item) => (item?.followerId ?? item?.id) !== followerId);
  const total = Math.max((list.pagination?.total ?? items.length) - 1, 0);
  return {
    items,
    pagination: { ...list.pagination, total },
  };
}

function PanelOverlay({ title, onClose, children }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-slate-900/40"
        role="presentation"
        onClick={() => onClose?.()}
      />
      <section className="relative ml-auto flex h-full w-full max-w-6xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </section>
    </div>
  );
}

export default function AgencyProfileWorkspace() {
  const [state, setState] = useState(() => buildState({ followers: EMPTY_FOLLOWERS, connections: EMPTY_CONNECTIONS }));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [followerUpdates, setFollowerUpdates] = useState({});
  const [connectionUpdates, setConnectionUpdates] = useState({});
  const [activePanel, setActivePanel] = useState(null);
  const lastUpdatedLabel = useMemo(() => {
    if (!state.lastUpdated) {
      return '—';
    }
    const date = new Date(state.lastUpdated);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString();
  }, [state.lastUpdated]);

  const initialise = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const payload = await fetchAgencyProfile({ includeFollowers: true, includeConnections: true });
      setState(buildState(payload));
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Unable to load agency profile.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initialise();
  }, [initialise]);

  useEffect(() => {
    if (!activePanel || typeof document === 'undefined') {
      return undefined;
    }
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previous;
    };
  }, [activePanel]);

  const openPanel = useCallback((panel) => {
    setActivePanel(panel);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const payload = await fetchAgencyProfile({ includeFollowers: true, includeConnections: true });
      setState((previous) => buildState(payload, previous));
      setFeedback({ type: 'success', message: 'Profile data refreshed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Unable to refresh profile.' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleProfileSubmit = useCallback(
    async (payload) => {
      setSavingProfile(true);
      setFeedback(null);
      try {
        const response = await updateAgencyProfile(payload);
        setState((previous) => buildState(response, previous));
        setFeedback({ type: 'success', message: 'Agency profile updated successfully.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error?.message || 'Unable to update agency profile.' });
      } finally {
        setSavingProfile(false);
      }
    },
    [],
  );

  const handleAvatarSubmit = useCallback(
    async (payload) => {
      setSavingAvatar(true);
      setFeedback(null);
      try {
        const response = await updateAgencyAvatar(payload);
        setState((previous) => buildState({ ...response, followers: previous.followers, connections: previous.connections }, previous));
        setFeedback({ type: 'success', message: 'Branding updated successfully.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error?.message || 'Unable to update branding.' });
      } finally {
        setSavingAvatar(false);
      }
    },
    [],
  );

  const handleFollowerUpdate = useCallback(async (followerId, updates) => {
    const identifier = Number(followerId);
    if (!Number.isInteger(identifier)) {
      return;
    }
    setFollowerUpdates((previous) => ({ ...previous, [identifier]: true }));
    try {
      const updatedFollower = await updateAgencyFollower(identifier, updates);
      setState((previous) => {
        const merged = mergeFollowers(previous.followers, updatedFollower);
        return buildState({ followers: merged }, previous);
      });
      setFeedback({ type: 'success', message: 'Follower preferences updated.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Unable to update follower.' });
    } finally {
      setFollowerUpdates((previous) => ({ ...previous, [identifier]: false }));
    }
  }, []);

  const handleRemoveFollower = useCallback(async (followerId) => {
    const identifier = Number(followerId);
    if (!Number.isInteger(identifier)) {
      return;
    }
    setFollowerUpdates((previous) => ({ ...previous, [identifier]: true }));
    try {
      await removeAgencyFollower(identifier);
      setState((previous) => buildState({ followers: removeFollowerById(previous.followers, identifier) }, previous));
      setFeedback({ type: 'success', message: 'Follower removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Unable to remove follower.' });
    } finally {
      setFollowerUpdates((previous) => ({ ...previous, [identifier]: false }));
    }
  }, []);

  const handleFollowersPageChange = useCallback(async (offset = 0) => {
    setFollowersLoading(true);
    try {
      const result = await listAgencyFollowers({ limit: state.followers.pagination?.limit ?? 25, offset });
      setState((previous) => buildState({ followers: result }, previous));
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Unable to load followers.' });
    } finally {
      setFollowersLoading(false);
    }
  }, [state.followers.pagination?.limit]);

  const refreshConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const result = await fetchAgencyConnections();
      setState((previous) => buildState({ connections: result }, previous));
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Unable to load connections.' });
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  const handleRequestConnection = useCallback(
    async (targetId) => {
      try {
        await requestAgencyConnection(targetId);
        await refreshConnections();
        setFeedback({ type: 'success', message: 'Connection request sent.' });
      } catch (error) {
        const message = error?.message || 'Unable to send connection request.';
        setFeedback({ type: 'error', message });
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [refreshConnections],
  );

  const handleRespondConnection = useCallback(
    async (connectionId, decision) => {
      const identifier = Number(connectionId);
      if (!Number.isInteger(identifier)) {
        return;
      }
      setConnectionUpdates((previous) => ({ ...previous, [identifier]: true }));
      try {
        await respondToAgencyConnection(identifier, decision);
        await refreshConnections();
        setFeedback({ type: 'success', message: 'Connection decision saved.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error?.message || 'Unable to update connection.' });
      } finally {
        setConnectionUpdates((previous) => ({ ...previous, [identifier]: false }));
      }
    },
    [refreshConnections],
  );

  const handleRemoveConnection = useCallback(
    async (connectionId) => {
      const identifier = Number(connectionId);
      if (!Number.isInteger(identifier)) {
        return;
      }
      setConnectionUpdates((previous) => ({ ...previous, [identifier]: true }));
      try {
        await removeAgencyConnection(identifier);
        await refreshConnections();
        setFeedback({ type: 'success', message: 'Connection removed.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error?.message || 'Unable to remove connection.' });
      } finally {
        setConnectionUpdates((previous) => ({ ...previous, [identifier]: false }));
      }
    },
    [refreshConnections],
  );

  const followerPendingMap = useMemo(() => followerUpdates, [followerUpdates]);
  const connectionPendingMap = useMemo(() => connectionUpdates, [connectionUpdates]);

  const followerTotal = useMemo(() => {
    return state.followers?.pagination?.total ?? state.followers?.items?.length ?? 0;
  }, [state.followers]);

  const connectionTotal = useMemo(() => {
    return state.connections?.summary?.accepted ?? state.connections?.accepted?.length ?? 0;
  }, [state.connections]);

  const profileCompletion = useMemo(() => {
    if (state.overview?.metrics?.profileCompletion == null) {
      return null;
    }
    const value = Number(state.overview.metrics.profileCompletion);
    if (Number.isNaN(value)) {
      return null;
    }
    return Math.round(value * 100);
  }, [state.overview]);

  const brandColor = useMemo(() => {
    return state.preferences?.brandColor ?? state.overview?.agencyProfile?.brandColor ?? '#2563EB';
  }, [state.overview, state.preferences]);

  const quickTiles = useMemo(
    () => [
      {
        id: 'edit',
        label: 'Details',
        value: profileCompletion != null ? `${profileCompletion}%` : '—',
      },
      {
        id: 'brand',
        label: 'Brand',
        value:
          brandColor && typeof brandColor === 'string'
            ? brandColor.toUpperCase()
            : brandColor
              ? `${brandColor}`
              : '—',
        swatch: typeof brandColor === 'string' ? brandColor : undefined,
      },
      {
        id: 'followers',
        label: 'Followers',
        value: followerTotal,
      },
      {
        id: 'connections',
        label: 'Links',
        value: connectionTotal,
      },
    ],
    [brandColor, connectionTotal, followerTotal, profileCompletion],
  );

  const panelTitles = {
    edit: 'Profile details',
    brand: 'Brand settings',
    followers: 'Followers',
    connections: 'Connections',
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'edit':
        return (
          <div className="mx-auto max-w-5xl">
            <AgencyProfileEditForm
              overview={state.overview}
              preferences={state.preferences}
              onSubmit={handleProfileSubmit}
              saving={savingProfile}
            />
          </div>
        );
      case 'brand':
        return (
          <div className="mx-auto max-w-4xl">
            <AgencyAvatarManager
              overview={state.overview}
              preferences={state.preferences}
              onSubmit={handleAvatarSubmit}
              saving={savingAvatar}
            />
          </div>
        );
      case 'followers':
        return (
          <div className="mx-auto max-w-5xl">
            <AgencyFollowersPanel
              followers={state.followers}
              loading={followersLoading}
              onRefresh={() => handleFollowersPageChange(state.followers.pagination?.offset ?? 0)}
              onPageChange={handleFollowersPageChange}
              onUpdateFollower={handleFollowerUpdate}
              onRemoveFollower={handleRemoveFollower}
              pendingUpdates={followerPendingMap}
            />
          </div>
        );
      case 'connections':
        return (
          <div className="mx-auto max-w-5xl">
            <AgencyConnectionsPanel
              connections={state.connections}
              loading={connectionsLoading}
              onRefresh={refreshConnections}
              onRequestConnection={handleRequestConnection}
              onRespond={handleRespondConnection}
              onRemove={handleRemoveConnection}
              pendingUpdates={connectionPendingMap}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">Loading agency profile…</p>
      </section>
    );
  }

  return (
    <>
      <div className="space-y-8" id="agency-profile">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-slate-900">Agency profile</h1>
            <p className="text-xs text-slate-500">Updated {lastUpdatedLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickTiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => openPanel(tile.id)}
              className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tile.label}</span>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-3xl font-semibold text-slate-900">{tile.value}</span>
                {tile.swatch ? (
                  <span
                    className="h-8 w-8 rounded-full border border-slate-200"
                    style={{ backgroundColor: tile.swatch }}
                  />
                ) : null}
              </div>
            </button>
          ))}
        </div>

        <AgencyProfileOverview
          overview={state.overview}
          preferences={state.preferences}
          followers={state.followers}
          connections={state.connections}
          onEdit={() => openPanel('edit')}
          onFollowers={() => openPanel('followers')}
          onConnections={() => openPanel('connections')}
        />
      </div>

      {activePanel ? (
        <PanelOverlay title={panelTitles[activePanel] ?? 'Panel'} onClose={closePanel}>{renderPanel()}</PanelOverlay>
      ) : null}
    </>
  );
}
