import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import { fetchPlatformWarRoomSnapshot } from '../../../services/warRoom.js';
import { classNames } from '../../../utils/classNames.js';

const MENU_SECTIONS = [
  {
    label: 'War room',
    items: [
      {
        id: 'platform-war-room',
        name: 'Platform performance',
        sectionId: 'platform-overview',
      },
      {
        id: 'security-fabric',
        name: 'Security fabric',
        href: '/dashboard/admin/war-room/security',
      },
    ],
  },
  {
    label: 'Dashboards',
    items: [{ id: 'admin-dashboard', name: 'Admin', href: '/dashboard/admin' }],
  },
];

const DEFAULT_SNAPSHOT = {
  generatedAt: null,
  window: { minutes: 30, since: null, until: null },
  healthScore: 100,
  posture: 'stable',
  readiness: {
    status: 'ok',
    http: null,
    uptimeSeconds: 0,
    dependencies: { counts: { ok: 0, degraded: 0, error: 0, disabled: 0, unknown: 0 }, degraded: [], total: 0 },
    workers: { counts: { ok: 0, degraded: 0, error: 0, disabled: 0, unknown: 0 }, degraded: [], total: 0 },
  },
  rateLimit: {
    requestsPerSecond: 0,
    blockedRatio: 0,
    approachingLimit: [],
    busiestKey: null,
    topConsumers: [],
    maxRequestsPerWindow: null,
  },
  database: {
    vendor: null,
    saturation: 0,
    headroom: null,
    borrowed: 0,
    available: 0,
    pending: 0,
    max: null,
  },
  maintenance: {
    active: [],
    upcoming: [],
    highestSeverity: null,
    totalAnnouncements: 0,
    statusPageUrl: null,
  },
  liveServices: {
    incidentSignals: { severity: 'normal', notes: [] },
    chat: { totalMessages: 0, flaggedRatio: 0, moderationBacklog: 0, busiestChannels: [] },
    inbox: {
      openCases: 0,
      breachedSlaCases: 0,
      awaitingFirstResponse: 0,
      medianFirstResponseMinutes: null,
      backlogByPriority: {},
    },
    timeline: { windowPublished: 0, scheduledNextHour: 0, overdue: 0, trendingEvents: [] },
    analytics: { ingestionLagSeconds: 0, topEvents: [] },
    events: { liveNow: 0, startingSoon: 0, cancellationsLastWindow: 0, tasksAtRisk: [] },
    runbooks: [],
  },
  focus: { hotspots: [], recommendations: [] },
};

const POSTURE_BADGES = {
  stable: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  watch: 'bg-amber-100 text-amber-700 ring-amber-500/20',
  alert: 'bg-orange-100 text-orange-700 ring-orange-500/20',
  critical: 'bg-rose-100 text-rose-700 ring-rose-500/20',
};

function formatPercent(value, { fallback = '0%' } = {}) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '0';
  }
  if (value >= 1000) {
    return `${Math.round((value / 1000) * 10) / 10}k`;
  }
  return `${Math.round(value)}`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) {
    return '—';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatTimestamp(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
}

export default function AdminPlatformWarRoomPage() {
  const [snapshot, setSnapshot] = useState(DEFAULT_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const sections = useMemo(
    () => [
      {
        id: 'platform-overview',
        name: 'Platform overview',
        description: 'Unified health score, posture, and telemetry window for the platform war room.',
      },
      {
        id: 'runtime-readiness',
        name: 'Runtime readiness',
        description: 'Dependency, worker, and database signals that influence resiliency.',
      },
      {
        id: 'live-services',
        name: 'Live services',
        description: 'Real-time chat, inbox, timeline, and analytics telemetry for live operations.',
      },
      {
        id: 'focus-hotspots',
        name: 'Focus & hotspots',
        description: 'Escalations and recommended actions to stabilise the platform.',
      },
    ],
    [],
  );

  const loadSnapshot = useCallback(
    async ({ signal, silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        const data = await fetchPlatformWarRoomSnapshot({ windowMinutes: 30, signal });
        setSnapshot((previous) => ({ ...previous, ...data }));
        setError('');
      } catch (err) {
        console.error('Failed to load platform war room snapshot', err);
        setError('Unable to refresh the war room snapshot. Please retry shortly.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadSnapshot({ signal: controller.signal }).catch(() => {});
    const interval = setInterval(() => {
      loadSnapshot({ silent: true }).catch(() => {});
    }, 60_000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [loadSnapshot]);

  const postureBadgeClass = POSTURE_BADGES[snapshot.posture] ?? POSTURE_BADGES.stable;

  const hotspotSeverityTone = useCallback((severity) => {
    switch (severity) {
      case 'critical':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'alert':
        return 'border-orange-200 bg-orange-50 text-orange-700';
      case 'watch':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  }, []);

  const readinessCounts = snapshot.readiness.dependencies.counts ?? {};
  const workerCounts = snapshot.readiness.workers.counts ?? {};

  const busyChannels = snapshot.liveServices.chat.busiestChannels ?? [];
  const runbooks = snapshot.liveServices.runbooks ?? [];

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Platform performance war room"
      subtitle="Sustain Gigvora’s reliability posture with live readiness, telemetry, and escalation context"
      description="Blend runtime health, live-service load, and operational hotspots into a single command centre for SRE, platform, and support squads."
      menuSections={MENU_SECTIONS}
      sections={sections}
    >
      <div className="space-y-12">
        {error ? (
          <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <section id="platform-overview" className="space-y-6">
          <div className="overflow-hidden rounded-4xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-8 text-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-widest text-white/70">Unified health score</p>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-5xl font-bold leading-none">{Math.round(snapshot.healthScore)}</span>
                  <span
                    className={classNames(
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset backdrop-blur',
                      postureBadgeClass,
                    )}
                  >
                    {snapshot.posture}
                  </span>
                </div>
                <p className="mt-3 max-w-xl text-sm text-white/70">
                  Score synthesises readiness posture, rate-limit ceilings, worker state, and live service telemetry in the last
                  {` ${snapshot.window.minutes ?? 30}`} minutes so execs can steer incident response with confidence.
                </p>
                <dl className="mt-6 grid grid-cols-1 gap-4 text-sm text-white/80 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-white/60">Window</dt>
                    <dd className="mt-1 font-semibold">
                      {formatTimestamp(snapshot.window.since)} – {formatTimestamp(snapshot.window.until)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-white/60">Generated</dt>
                    <dd className="mt-1 font-semibold">{formatTimestamp(snapshot.generatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-white/60">Platform uptime</dt>
                    <dd className="mt-1 font-semibold">{formatDuration(snapshot.readiness.uptimeSeconds)}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => loadSnapshot()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  disabled={refreshing}
                >
                  <ArrowPathIcon className={classNames('h-5 w-5', refreshing ? 'animate-spin' : '')} />
                  {refreshing ? 'Refreshing…' : loading ? 'Loading snapshot' : 'Refresh snapshot'}
                </button>
                {snapshot.maintenance.statusPageUrl ? (
                  <a
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    href={snapshot.maintenance.statusPageUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ShieldCheckIcon className="h-5 w-5" />
                    View status page
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section id="runtime-readiness" className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Readiness posture</h2>
                  <p className="text-sm text-slate-600">
                    Dependency and worker health across the platform runtime. Investigate degraded or errored nodes immediately.
                  </p>
                </div>
                <BoltIcon className="h-6 w-6 text-indigo-500" />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-6 text-sm text-slate-600 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Dependencies ok</dt>
                  <dd className="mt-2 text-xl font-semibold text-slate-900">{readinessCounts.ok ?? 0}</dd>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-amber-600">Dependencies degraded</dt>
                  <dd className="mt-2 text-xl font-semibold text-amber-700">{readinessCounts.degraded ?? 0}</dd>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-rose-600">Dependencies error</dt>
                  <dd className="mt-2 text-xl font-semibold text-rose-700">{readinessCounts.error ?? 0}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Worker failures</dt>
                  <dd className="mt-2 text-xl font-semibold text-rose-600">{workerCounts.error ?? 0}</dd>
                </div>
              </dl>
              {snapshot.readiness.dependencies.degraded.length > 0 || snapshot.readiness.workers.degraded.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {[...snapshot.readiness.dependencies.degraded, ...snapshot.readiness.workers.degraded].map((item) => (
                    <div
                      key={`${item.name}-${item.updatedAt}`}
                      className="flex items-start justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-inner"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">Last updated {formatTimestamp(item.updatedAt)}</p>
                        {item.error?.message ? (
                          <p className="mt-1 text-xs text-slate-500">{item.error.message}</p>
                        ) : null}
                      </div>
                      <span
                        className={classNames(
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize',
                          item.status === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  All dependencies and workers are stable.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Database pool</h2>
                  <p className="text-sm text-slate-600">
                    Track headroom and pending connections to anticipate saturation before it becomes critical.
                  </p>
                </div>
                <SignalIcon className="h-6 w-6 text-indigo-500" />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-6 text-sm text-slate-600 sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Vendor</dt>
                  <dd className="mt-2 font-semibold text-slate-900">{snapshot.database.vendor ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Saturation</dt>
                  <dd className="mt-2 font-semibold text-slate-900">{formatPercent(snapshot.database.saturation)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Borrowed</dt>
                  <dd className="mt-2 font-semibold text-slate-900">{formatNumber(snapshot.database.borrowed)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Headroom</dt>
                  <dd className="mt-2 font-semibold text-slate-900">
                    {snapshot.database.headroom != null ? formatNumber(snapshot.database.headroom) : '—'}
                  </dd>
                </div>
              </dl>
              {snapshot.maintenance.active.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                  <p className="font-semibold">Active maintenance</p>
                  <ul className="mt-2 space-y-1">
                    {snapshot.maintenance.active.map((window) => (
                      <li key={window.id} className="text-xs">
                        <span className="font-semibold">{window.summary ?? window.label}</span> ·{' '}
                        {formatTimestamp(window.startAt)} – {formatTimestamp(window.endAt)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Rate-limit utilisation</h2>
                  <p className="text-sm text-slate-600">
                    Monitor throttle risk and coordinate with API consumers before automated blocking triggers.
                  </p>
                </div>
                <SparklesIcon className="h-6 w-6 text-indigo-500" />
              </div>
              <dl className="mt-6 grid grid-cols-1 gap-4 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Requests per second</dt>
                  <dd className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(snapshot.rateLimit.requestsPerSecond)}</dd>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-amber-600">Blocked ratio</dt>
                  <dd className="mt-2 text-xl font-semibold text-amber-700">{formatPercent(snapshot.rateLimit.blockedRatio)}</dd>
                </div>
                {snapshot.rateLimit.busiestKey ? (
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-inner">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Busiest key</dt>
                    <dd className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{snapshot.rateLimit.busiestKey.key}</span> ·{' '}
                      {snapshot.rateLimit.busiestKey.hits} hits · last seen {formatTimestamp(snapshot.rateLimit.busiestKey.lastSeenAt)}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {snapshot.rateLimit.approachingLimit.length > 0 ? (
                <div className="mt-6 space-y-2">
                  {snapshot.rateLimit.approachingLimit.map((entry) => (
                    <div key={entry.key} className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs text-orange-700">
                      <p className="font-semibold">{entry.key}</p>
                      <p>{formatPercent(entry.utilisation)} of window · {entry.hits} hits · last seen {formatTimestamp(entry.lastSeenAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  No keys are currently approaching the rate-limit ceiling.
                </p>
              )}
            </div>
          </div>
        </section>

        <section id="live-services" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Chat & community moderation</h2>
                <p className="text-sm text-slate-600">
                  Flagged ratio and backlog keep community health visible during spikes.
                </p>
              </div>
              <ShieldCheckIcon className="h-6 w-6 text-indigo-500" />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Messages sampled</dt>
                <dd className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(snapshot.liveServices.chat.totalMessages)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-rose-500">Flagged ratio</dt>
                <dd className="mt-2 text-xl font-semibold text-rose-600">
                  {formatPercent(snapshot.liveServices.chat.flaggedRatio)}
                </dd>
              </div>
            </dl>
            <div className="mt-6 space-y-3 text-xs text-slate-600">
              {busyChannels.length > 0 ? (
                busyChannels.map((channel) => (
                  <div key={channel.threadId} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-900">{channel.channelName ?? channel.channelSlug ?? 'Channel'}</p>
                    <p>{channel.messageCount} messages in window</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">No standout channels detected this window.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Support desk pulse</h2>
                <p className="text-sm text-slate-600">
                  Monitor SLA breaches, first-response cadence, and backlog mix for the service desk.
                </p>
              </div>
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Open cases</dt>
                <dd className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(snapshot.liveServices.inbox.openCases)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-rose-500">SLA breaches</dt>
                <dd className="mt-2 text-xl font-semibold text-rose-600">
                  {formatNumber(snapshot.liveServices.inbox.breachedSlaCases)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Awaiting first response</dt>
                <dd className="mt-2 text-xl font-semibold text-slate-900">
                  {formatNumber(snapshot.liveServices.inbox.awaitingFirstResponse)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Median first response</dt>
                <dd className="mt-2 text-xl font-semibold text-slate-900">
                  {snapshot.liveServices.inbox.medianFirstResponseMinutes != null
                    ? `${Math.round(snapshot.liveServices.inbox.medianFirstResponseMinutes)}m`
                    : '—'}
                </dd>
              </div>
            </dl>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-600">
              {Object.entries(snapshot.liveServices.inbox.backlogByPriority ?? {}).map(([priority, count]) => (
                <div key={priority} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">{priority}</p>
                  <p>{count} cases</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Analytics & events</h2>
                <p className="text-sm text-slate-600">
                  Track ingestion lag and program signals to coordinate with data and events squads.
                </p>
              </div>
              <SparklesIcon className="h-6 w-6 text-indigo-500" />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Ingestion lag</dt>
                <dd className="mt-2 text-xl font-semibold text-rose-600">
                  {snapshot.liveServices.analytics.ingestionLagSeconds != null
                    ? `${Math.round(snapshot.liveServices.analytics.ingestionLagSeconds / 60)}m`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Events live now</dt>
                <dd className="mt-2 text-xl font-semibold text-slate-900">{snapshot.liveServices.events.liveNow}</dd>
              </div>
            </dl>
            <ul className="mt-6 space-y-2 text-xs text-slate-600">
              {snapshot.liveServices.analytics.topEvents.map((event) => (
                <li key={event.eventName} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-900">{event.eventName}</span> · {event.count} hits
                </li>
              ))}
              {snapshot.liveServices.events.tasksAtRisk.map((task) => (
                <li key={task.id} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-700">
                  {task.title ?? 'Operational task'} needs attention
                </li>
              ))}
              {snapshot.liveServices.analytics.topEvents.length === 0 &&
              snapshot.liveServices.events.tasksAtRisk.length === 0 ? (
                <li className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">No analytics or event alerts.</li>
              ) : null}
            </ul>
          </div>

          <div id="focus-hotspots" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Hotspots & actions</h2>
                <p className="text-sm text-slate-600">
                  Escalations and next steps keep command shifts aligned during the incident cycle.
                </p>
              </div>
              <BoltIcon className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-700">
              {snapshot.focus.hotspots.length > 0 ? (
                snapshot.focus.hotspots.map((hotspot) => (
                  <div
                    key={hotspot.id}
                    className={classNames(
                      'rounded-2xl border px-4 py-3 shadow-inner',
                      hotspotSeverityTone(hotspot.severity),
                    )}
                  >
                    <p className="font-semibold">{hotspot.label}</p>
                    <p className="text-xs opacity-80">{hotspot.detail}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No hotspots flagged in this window.
                </p>
              )}
            </div>
            <div className="mt-6 space-y-2 text-xs text-slate-600">
              <p className="font-semibold uppercase tracking-wide text-slate-500">Recommended actions</p>
              {snapshot.focus.recommendations.map((recommendation, index) => (
                <p key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  {recommendation}
                </p>
              ))}
              {snapshot.focus.recommendations.length === 0 ? (
                <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  Maintain monitoring cadence and keep runbooks handy.
                </p>
              ) : null}
            </div>
            {runbooks.length > 0 ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Runbooks</p>
                <ul className="mt-3 space-y-2 text-xs text-indigo-600">
                  {runbooks.map((runbook) => (
                    <li key={runbook.slug}>
                      <a
                        className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-600 transition hover:bg-indigo-100"
                        href={runbook.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        {runbook.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
