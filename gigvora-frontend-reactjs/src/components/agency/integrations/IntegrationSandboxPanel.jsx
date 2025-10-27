import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const STATUS_TONES = {
  online: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  offline: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
  unknown: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

const STATUS_LABELS = {
  online: 'Online',
  offline: 'Offline',
  unknown: 'Unknown',
};

function formatPercentage(value) {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${Number(value).toFixed(2)}%`;
}

function formatDateTime(value) {
  if (!value) {
    return 'n/a';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'n/a';
  }
  return date.toLocaleString();
}

function formatEventInsight(insight) {
  if (!insight) {
    return 'No activity logged yet';
  }
  const parts = [insight.title];
  if (insight.workspaceName) {
    parts.push(`• ${insight.workspaceName}`);
  }
  if (insight.startsAt) {
    parts.push(`• ${formatDateTime(insight.startsAt)}`);
  }
  return parts.join(' ');
}

function formatTopList(items, { labelKey = 'type', countKey = 'count' } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return '—';
  }
  return items.map((item) => `${item[labelKey]} (${item[countKey]})`).join(' • ');
}

function formatWorkspaceDensity(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '—';
  }
  return items.map((item) => `${item.name} (${item.count})`).join(' • ');
}

function formatLatency(latency) {
  if (!latency) {
    return '0 ms';
  }
  const min = typeof latency.minMs === 'number' ? Math.max(0, latency.minMs) : 0;
  const max = typeof latency.maxMs === 'number' ? Math.max(0, latency.maxMs) : min;
  if (min === max) {
    return `${min} ms`;
  }
  return `${min}–${max} ms`;
}

function formatHealthLatency(health) {
  if (!health || !health.latencyMs) {
    return 'n/a';
  }
  return `${Math.round(health.latencyMs)} ms`;
}

function formatOrigins(origins = [], fallbackOrigin) {
  if (origins.length === 0) {
    return fallbackOrigin || 'All origins';
  }
  return origins.join(', ');
}

function ScenarioChip({ scenario }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
      {scenario}
    </span>
  );
}

function WorkspaceChip({ label }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-600">
      {label}
    </span>
  );
}

function ObservabilityMetric({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm shadow-slate-900/5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default function IntegrationSandboxPanel({
  environments = [],
  loading = false,
  error = null,
  onRetry,
  clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : null,
}) {
  const [copiedEnvironmentId, setCopiedEnvironmentId] = useState(null);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const summaries = useMemo(
    () =>
      environments.map((environment) => ({
        ...environment,
        status: environment.status ?? 'unknown',
        scenarios: Array.isArray(environment.scenarios) ? environment.scenarios : [],
        roles: environment.roles || { view: [], manage: [] },
        allowedOrigins: Array.isArray(environment.allowedOrigins)
          ? environment.allowedOrigins
          : [],
        observability: environment.observability || null,
        scenarioDetails: Array.isArray(environment.scenarioDetails) ? environment.scenarioDetails : [],
        workspaceHighlights: environment.workspaceHighlights || { preview: [], timezones: [], membershipRoles: [] },
        insights: environment.insights || {},
        healthHistory: Array.isArray(environment.healthHistory) ? environment.healthHistory : [],
      })),
    [environments],
  );

  const handleCopy = async (environment) => {
    if (!environment?.baseUrl) {
      return;
    }
    try {
      if (clipboard && typeof clipboard.writeText === 'function') {
        await clipboard.writeText(environment.baseUrl);
      }
      setCopiedEnvironmentId(environment.id);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopiedEnvironmentId(null);
        copyTimerRef.current = null;
      }, 2000);
    } catch (copyError) {
      console.warn('Unable to copy base URL', copyError);
    }
  };

  return (
    <section className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Integration sandbox</p>
          <h3 className="text-xl font-semibold text-slate-900">Stub environments & health</h3>
          <p className="max-w-2xl text-sm text-slate-600">
            Monitor local stubs, latency windows, and RBAC posture so teams can rehearse integrations without
            sacrificing enterprise polish.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
              <ArrowPathIcon className="h-4 w-4 animate-spin" /> Loading
            </span>
          ) : null}
          {onRetry ? (
            <button
              type="button"
              onClick={() => onRetry()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              <ArrowPathIcon className="h-4 w-4" /> Refresh
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
          {onRetry ? (
            <button
              type="button"
              onClick={() => onRetry()}
              className="text-xs font-semibold text-rose-700 underline"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {loading && summaries.length === 0 ? (
          <div className="animate-pulse rounded-3xl border border-slate-200 bg-slate-100/60 p-6" />
        ) : null}

        {summaries.map((environment) => {
          const tone = STATUS_TONES[environment.status] || STATUS_TONES.unknown;
          const label = STATUS_LABELS[environment.status] || STATUS_LABELS.unknown;
          const isCopied = copiedEnvironmentId === environment.id;
          const workspaceInsights = environment.insights?.workspaces ?? {};
          const eventInsights = environment.insights?.events ?? null;

          return (
            <article
              key={environment.id}
              className="relative flex flex-col gap-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-lg shadow-slate-900/5 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{environment.category}</p>
                  <h4 className="mt-2 text-lg font-semibold text-slate-900">{environment.name}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{environment.description}</p>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${tone}`}>
                  {label}
                </span>
              </div>

              <dl className="grid grid-cols-1 gap-4 text-sm text-slate-600 sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Base URL</dt>
                  <dd className="flex items-center gap-3">
                    <code className="truncate font-mono text-slate-800">{environment.baseUrl}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(environment)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                      aria-label={`Copy ${environment.name} base URL`}
                    >
                      {isCopied ? <CheckIcon className="h-4 w-4" /> : <DocumentDuplicateIcon className="h-4 w-4" />}
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Latency window</dt>
                  <dd className="font-semibold text-slate-800">{formatLatency(environment.latency)}</dd>
                  <dd className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Live health: {formatHealthLatency(environment.health)}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Workspaces</dt>
                  <dd className="font-semibold text-slate-800">{environment.workspaceCount}</dd>
                  <dd className="text-xs uppercase tracking-[0.25em] text-slate-500">Source: {environment.workspaceSource}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Seeded events</dt>
                  <dd className="font-semibold text-slate-800">{environment.eventCount}</dd>
                  <dd className="text-xs uppercase tracking-[0.25em] text-slate-500">Types: {environment.eventTypes.join(', ')}</dd>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Allowed origins</dt>
                  <dd className="font-semibold text-slate-800">{formatOrigins(environment.allowedOrigins, environment.fallbackOrigin)}</dd>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Roles</dt>
                  <dd className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                      View: {environment.roles.view.join(', ') || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                      Manage: {environment.roles.manage.join(', ') || '—'}
                    </span>
                    {environment.requiresApiKey ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 font-semibold text-slate-700">
                        <ShieldCheckIcon className="h-4 w-4" /> API key required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 font-semibold text-slate-600">
                        <ShieldCheckIcon className="h-4 w-4" /> Key optional
                      </span>
                    )}
                  </dd>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Workspace coverage</dt>
                  <dd className="flex flex-wrap gap-2">
                    {(workspaceInsights.preview || environment.workspaceHighlights?.preview || []).map((workspace) => (
                      <WorkspaceChip key={workspace} label={workspace} />
                    ))}
                    {workspaceInsights.timezones?.length ? (
                      <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                        Timezones: {workspaceInsights.timezones.length}
                      </span>
                    ) : null}
                    {workspaceInsights.membershipRoles?.length ? (
                      <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                        Roles: {workspaceInsights.membershipRoles.join(', ')}
                      </span>
                    ) : null}
                  </dd>
                </div>
              </dl>

              {environment.scenarios.length ? (
                <div className="flex flex-wrap gap-2">
                  {environment.scenarios.map((scenario) => (
                    <ScenarioChip key={scenario} scenario={scenario} />
                  ))}
                </div>
              ) : null}

              {environment.observability ? (
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Observability</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Last incident: {formatDateTime(environment.observability.lastIncidentAt) || 'n/a'}
                      </p>
                    </div>
                    <ChartBarIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <ObservabilityMetric
                      label="Uptime (24h)"
                      value={formatPercentage(environment.observability.uptimeLast24h)}
                      helper={`${environment.observability.sampleSize} health samples`}
                    />
                    <ObservabilityMetric
                      label="Average latency"
                      value={environment.observability.averageLatencyMs != null ? `${environment.observability.averageLatencyMs} ms` : '—'}
                      helper="Across health checks"
                    />
                    <ObservabilityMetric
                      label="P95 latency"
                      value={environment.observability.p95LatencyMs != null ? `${environment.observability.p95LatencyMs} ms` : '—'}
                      helper="Peak spikes"
                    />
                    <ObservabilityMetric
                      label="Current health"
                      value={formatHealthLatency(environment.health)}
                      helper={`Status: ${label}`}
                    />
                  </div>
                </div>
              ) : null}

              {eventInsights ? (
                <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-inner">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Event rehearsal insights</p>
                      <p className="mt-1 text-sm text-slate-600">Real fixtures to pressure test your integrations.</p>
                    </div>
                    <SparklesIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="space-y-1">
                      <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Next event</dt>
                      <dd className="font-semibold text-slate-800">{formatEventInsight(eventInsights.nextEvent)}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Last event</dt>
                      <dd className="font-semibold text-slate-800">{formatEventInsight(eventInsights.lastEvent)}</dd>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Top event types</dt>
                      <dd className="font-semibold text-slate-800">{formatTopList(eventInsights.topEventTypes)}</dd>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Workspace density</dt>
                      <dd className="font-semibold text-slate-800">{formatWorkspaceDensity(eventInsights.workspaceDensity)}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              {environment.scenarioDetails.length ? (
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Scenario catalog</p>
                      <p className="mt-1 text-sm text-slate-600">Comprehensive drills ready for API rehearsals.</p>
                    </div>
                    <ClockIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <ul className="mt-4 space-y-3">
                    {environment.scenarioDetails.map((scenario) => (
                      <li key={scenario.id} className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm shadow-slate-900/5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">{scenario.label}</span>
                          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">{scenario.id}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{scenario.description}</p>
                        {scenario.docsUrl ? (
                          <a
                            className="mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 transition hover:text-slate-900"
                            href={scenario.docsUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View drill docs <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 pt-2 text-sm">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Health checked {environment.health?.checkedAt ? new Date(environment.health.checkedAt).toLocaleString() : 'n/a'}
                </span>
                {environment.docsUrl ? (
                  <a
                    href={environment.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                  >
                    Docs <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
