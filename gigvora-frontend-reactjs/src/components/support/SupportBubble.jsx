import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  LifebuoyIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  ArrowUpRightIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { getSupportDeskSnapshot } from '../../services/supportDesk.js';
import { formatRelativeTime } from '../../utils/date.js';

const PRESENCE_TOKENS = {
  online: 'bg-emerald-400',
  away: 'bg-amber-400',
  offline: 'bg-slate-300',
};

const STALE_THRESHOLD_MS = 1000 * 60 * 5; // five minutes

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function toNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ensureSeed(value, fallback) {
  return value ?? fallback;
}

function computeInitials(name) {
  if (!name) return '?';
  const segments = `${name}`
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!segments.length) {
    return '?';
  }
  return segments
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('');
}

function resolvePresence(contact) {
  const token = `${contact?.status ?? contact?.availability ?? ''}`.toLowerCase();
  if (!token) return 'offline';
  if (['online', 'active', 'present'].includes(token)) return 'online';
  if (['away', 'busy', 'dnd'].includes(token)) return 'away';
  return 'offline';
}

function buildContactSummary(contact) {
  if (!contact) {
    return null;
  }
  return {
    id: ensureSeed(contact.id, contact.email ?? contact.name ?? 'support'),
    name: ensureSeed(contact.name, 'Concierge team'),
    title: ensureSeed(contact.role, contact.title ?? 'Support concierge'),
    presence: resolvePresence(contact),
    initials: ensureSeed(contact.initials, computeInitials(contact.name ?? 'Support')),
    lastActiveAt:
      contact.lastActiveAt ??
      contact.lastMessageAt ??
      contact.updatedAt ??
      contact.lastSeenAt ??
      null,
  };
}

function formatMetricSummary(snapshot) {
  const metrics = snapshot?.metrics ?? null;
  const openCases = toNumber(
    metrics?.openSupportCases ?? metrics?.activeCases ?? metrics?.pendingCases,
  );
  const openDisputes = toNumber(
    metrics?.openDisputes ?? metrics?.activeDisputes ?? metrics?.pendingDisputes,
  );
  const csat = toNumber(metrics?.csatScore ?? metrics?.satisfactionScore);
  const responseMinutes = toNumber(
    metrics?.averageFirstResponseMinutes ?? metrics?.firstReplyMinutes,
  );
  const resolutionMinutes = toNumber(
    metrics?.averageResolutionMinutes ?? metrics?.resolutionMinutes,
  );
  const playbookCount = toNumber(
    metrics?.publishedPlaybooks ?? metrics?.livePlaybooks ?? metrics?.playbookCount,
  );
  const derivedPlaybooks = Array.isArray(snapshot?.playbooks)
    ? snapshot.playbooks.length
    : null;
  let disputesCount = openDisputes;
  if (disputesCount == null && Array.isArray(snapshot?.disputes)) {
    disputesCount = snapshot.disputes.filter(
      (dispute) => !['settled', 'closed'].includes(`${dispute?.status ?? ''}`.toLowerCase()),
    ).length;
  }
  return {
    openCases: openCases ?? 0,
    openDisputes: disputesCount ?? null,
    csat: csat ?? null,
    responseMinutes: responseMinutes ?? null,
    resolutionMinutes: resolutionMinutes ?? null,
    publishedPlaybooks: playbookCount ?? derivedPlaybooks ?? null,
  };
}

function formatCasesCopy(openCases) {
  if (!openCases) {
    return 'All clear · 0 active cases';
  }
  const value = Number(openCases);
  if (Number.isNaN(value)) {
    return 'Active cases ready for review';
  }
  if (value === 1) {
    return '1 active case needs your eyes';
  }
  return `${value} active cases are in motion`;
}

function formatDisputesCopy(openDisputes) {
  if (openDisputes == null) {
    return null;
  }
  if (openDisputes === 0) {
    return 'No disputes in review';
  }
  if (openDisputes === 1) {
    return '1 dispute is currently under review';
  }
  return `${openDisputes} disputes are currently under review`;
}

export default function SupportBubble({
  userId: userIdProp = null,
  freelancerId = null,
  initialSnapshot = null,
  onOpen,
  onDismiss,
  className = '',
}) {
  const resolvedUserId = useMemo(() => {
    const candidates = [userIdProp, freelancerId];
    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null) {
        continue;
      }
      const parsed = Number.parseInt(candidate, 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return null;
  }, [userIdProp, freelancerId]);

  const seededSnapshot = useMemo(() => {
    if (!initialSnapshot) {
      return null;
    }
    if (initialSnapshot.data) {
      return {
        data: initialSnapshot.data,
        cachedAt: initialSnapshot.cachedAt ?? null,
        fromCache: initialSnapshot.fromCache ?? false,
      };
    }
    return { data: initialSnapshot, cachedAt: null, fromCache: false };
  }, [initialSnapshot]);

  const [state, setState] = useState(() =>
    seededSnapshot
      ? { loading: false, error: null, data: seededSnapshot.data }
      : { loading: true, error: null, data: null },
  );
  const [refreshing, setRefreshing] = useState(false);

  const controllerRef = useRef(null);

  const loadSnapshot = useCallback(async ({ forceRefresh = false } = {}) => {
    if (!resolvedUserId) {
      setState({
        loading: false,
        error: 'Complete your profile to unlock live concierge support.',
        data: null,
      });
      return;
    }
    setState((previous) => ({
      ...previous,
      loading: previous.data == null,
      error: null,
    }));
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      if (forceRefresh) {
        setRefreshing(true);
      }
      const result = await getSupportDeskSnapshot(resolvedUserId, {
        signal: controller.signal,
        forceRefresh,
      });
      setState({ loading: false, error: null, data: result?.data ?? null });
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      const message = error?.message ?? 'We could not reach the support desk right now.';
      setState({ loading: false, error: message, data: null });
    } finally {
      if (forceRefresh) {
        setRefreshing(false);
      }
      controllerRef.current = null;
    }
  }, [resolvedUserId]);

  useEffect(() => {
    if (!seededSnapshot) {
      loadSnapshot();
    }
    return () => {
      controllerRef.current?.abort();
    };
  }, [seededSnapshot, loadSnapshot]);

  const contact = useMemo(
    () => buildContactSummary(state.data?.contacts?.[0] ?? state.data?.contact ?? null),
    [state.data],
  );
  const metrics = useMemo(() => formatMetricSummary(state.data ?? null), [state.data]);
  const latestUpdate = contact?.lastActiveAt ?? state.data?.refreshedAt ?? null;
  const isStale = useMemo(() => {
    if (!latestUpdate) {
      return true;
    }
    const date = new Date(latestUpdate);
    if (Number.isNaN(date.getTime())) {
      return true;
    }
    return Date.now() - date.getTime() > STALE_THRESHOLD_MS;
  }, [latestUpdate]);

  const handleOpen = useCallback(() => {
    if (isStale && !state.loading && !refreshing) {
      loadSnapshot({ forceRefresh: true });
    }
    if (typeof onOpen === 'function') {
      onOpen({ source: 'support-bubble', snapshot: state.data ?? null });
    } else {
      window.dispatchEvent(new CustomEvent('support-launcher:open'));
    }
  }, [isStale, onOpen, state.data, state.loading, refreshing, loadSnapshot]);

  const handleDismiss = useCallback(() => {
    if (typeof onDismiss === 'function') {
      onDismiss();
    }
  }, [onDismiss]);

  return (
    <section
      aria-live="polite"
      className={classNames(
        'pointer-events-auto fixed bottom-6 right-6 z-40 max-w-sm rounded-3xl border border-white/40 bg-white/70 p-4 shadow-xl backdrop-blur',
        'ring-1 ring-blue-500/10 transition-all duration-300 hover:shadow-2xl hover:ring-blue-500/20',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-inner">
                <LifebuoyIcon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Resolution concierge</p>
                <h3 className="text-base font-semibold text-slate-900">Need a fast assist?</h3>
                {latestUpdate ? (
                  <p className="text-xs text-slate-500">
                    Updated {formatRelativeTime(latestUpdate) || 'moments ago'}
                    {isStale ? ' • Refresh recommended' : ''}
                  </p>
                ) : null}
              </div>
            </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-600"
            aria-label="Hide support bubble"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-blue-100/60 bg-blue-50/60 p-3">
          <div className="flex items-center justify-between text-sm text-blue-900">
            <span className="font-medium">{formatCasesCopy(metrics.openCases)}</span>
            {refreshing ? (
              <span className="text-xs text-blue-500">Refreshing…</span>
            ) : null}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-blue-800">
            <div>
              <dt className="font-semibold uppercase tracking-wide text-blue-500">CSAT</dt>
              <dd>{metrics.csat != null ? `${metrics.csat.toFixed(1)}/5` : '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-blue-500">First reply</dt>
              <dd>
                {metrics.responseMinutes != null
                  ? `${Math.round(metrics.responseMinutes)} mins`
                  : 'Monitoring'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-blue-500">Resolution</dt>
              <dd>
                {metrics.resolutionMinutes != null
                  ? `${Math.round(metrics.resolutionMinutes)} mins`
                  : 'Monitoring'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-blue-500">Playbooks</dt>
              <dd>
                {metrics.publishedPlaybooks != null ? metrics.publishedPlaybooks : '—'}
              </dd>
            </div>
          </dl>
          {formatDisputesCopy(metrics.openDisputes) ? (
            <p className="mt-2 text-xs font-medium text-blue-600">
              {formatDisputesCopy(metrics.openDisputes)}
            </p>
          ) : null}
        </div>

        {state.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700">
            {state.error}
          </div>
        ) : null}

        {contact ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
            <div className="relative">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-semibold text-white">
                {contact.initials}
              </span>
              <span
                className={classNames(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-white',
                  PRESENCE_TOKENS[contact.presence],
                )}
              />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold text-slate-900">{contact.name}</p>
              <p className="text-xs text-slate-500">{contact.title}</p>
              {contact.lastActiveAt ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {formatRelativeTime(contact.lastActiveAt) || 'Just now'}
                </p>
              ) : null}
            </div>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              Concierge
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleOpen}
          disabled={state.loading || Boolean(state.error)}
          className={classNames(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            state.loading || state.error ? 'opacity-80' : 'hover:from-blue-500 hover:to-indigo-500',
          )}
        >
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
          Talk to support
          <ArrowUpRightIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => loadSnapshot({ forceRefresh: true })}
          disabled={state.loading || refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
        >
          <SparklesIcon className="h-4 w-4" />
          Sync insights
        </button>
      </div>
    </section>
  );
}

SupportBubble.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  freelancerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  initialSnapshot: PropTypes.oneOfType([
    PropTypes.shape({
      data: PropTypes.object,
      cachedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      fromCache: PropTypes.bool,
    }),
    PropTypes.object,
  ]),
  onOpen: PropTypes.func,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

