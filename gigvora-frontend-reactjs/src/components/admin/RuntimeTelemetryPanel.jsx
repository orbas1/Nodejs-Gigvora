import {
  ArrowPathIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  SignalIcon,
  WrenchScrewdriverIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat().format(Math.round(numeric));
}

function formatPercent(value, fractionDigits = 0) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${(numeric * 100).toFixed(fractionDigits)}%`;
}

function formatDuration(seconds) {
  const numeric = Number(seconds ?? 0);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return '—';
  }
  if (numeric < 60) {
    return `${numeric.toFixed(0)}s`;
  }
  if (numeric < 3600) {
    return `${(numeric / 60).toFixed(1)}m`;
  }
  if (numeric < 86400) {
    return `${(numeric / 3600).toFixed(1)}h`;
  }
  return `${(numeric / 86400).toFixed(1)}d`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return '—';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function formatRelative(timestamp) {
  if (!timestamp) {
    return 'moments ago';
  }
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return 'moments ago';
  }
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) {
    return 'moments ago';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const STATUS_STYLES = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  starting: 'border-sky-200 bg-sky-50 text-sky-700',
  degraded: 'border-amber-200 bg-amber-50 text-amber-700',
  error: 'border-red-200 bg-red-50 text-red-700',
  stopped: 'border-red-200 bg-red-50 text-red-700',
};

function resolveStatusStyle(status) {
  if (!status) {
    return 'border-slate-200 bg-slate-50 text-slate-600';
  }
  return STATUS_STYLES[status] ?? 'border-slate-200 bg-slate-50 text-slate-600';
}

function StatusBadge({ status, label, description }) {
  return (
    <div className="rounded-2xl border bg-white/50 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={classNames('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', resolveStatusStyle(status))}>
          {status ? status.toUpperCase() : 'UNKNOWN'}
        </span>
        <span className="text-sm font-semibold text-slate-900">{label}</span>
      </div>
      {description ? <p className="mt-2 text-xs text-slate-600">{description}</p> : null}
    </div>
  );
}

function DependencyList({ title, items }) {
  if (!items?.length) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map(({ name, status, meta }) => (
          <div key={name} className="flex items-start justify-between gap-3 text-xs">
            <div>
              <p className="font-semibold text-slate-700">{name}</p>
              {meta ? <p className="mt-1 text-[11px] text-slate-500">{meta}</p> : null}
            </div>
            <span className={classNames('inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold', resolveStatusStyle(status))}>
              {status?.toUpperCase() ?? 'UNKNOWN'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RateLimitBar({ allowed = 0, blocked = 0 }) {
  const total = Math.max(allowed + blocked, 1);
  const allowedPercent = Math.min(100, Math.round((allowed / total) * 100));
  const blockedPercent = 100 - allowedPercent;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>Throughput</span>
        <span>
          {formatNumber(allowed)} allowed · {formatNumber(blocked)} blocked
        </span>
      </div>
      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-emerald-500" style={{ width: `${allowedPercent}%` }} />
        <div className="h-full bg-red-400" style={{ width: `${blockedPercent}%` }} />
      </div>
    </div>
  );
}

function ConsumersTable({ items, emptyLabel }) {
  if (!items?.length) {
    return <p className="text-xs text-slate-500">{emptyLabel}</p>;
  }
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-xs">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-2 text-left font-semibold">
              Consumer
            </th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">
              Hits
            </th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">
              Blocked
            </th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">
              Last seen
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {items.slice(0, 5).map((item) => (
            <tr key={item.key}>
              <td className="px-4 py-2 font-semibold text-slate-700">{item.key}</td>
              <td className="px-4 py-2 text-right text-slate-600">{formatNumber(item.hits)}</td>
              <td className="px-4 py-2 text-right text-slate-600">{formatNumber(item.blocked)}</td>
              <td className="px-4 py-2 text-right text-slate-500">{formatRelative(item.lastSeenAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApproachingLimitList({ items, max }) {
  if (!items?.length) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
        <BoltIcon className="h-4 w-4" /> Nearing limit
      </p>
      <p className="mt-1 text-xs text-amber-700">
        Track consumers above 80% of the {formatNumber(max)} requests/window allocation to preempt throttling.
      </p>
      <ul className="mt-3 space-y-2 text-xs">
        {items.slice(0, 4).map((item) => (
          <li key={item.key} className="flex items-center justify-between">
            <span className="font-semibold text-amber-800">{item.key}</span>
            <span className="text-amber-700">
              {formatNumber(item.hits)} hits · {formatPercent(item.utilisation, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RuntimeTelemetrySkeleton() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-2/3 rounded-full bg-slate-200" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-48 rounded-2xl bg-slate-100" />
          <div className="h-48 rounded-2xl bg-slate-100 lg:col-span-2" />
        </div>
      </div>
    </section>
  );
}

export default function RuntimeTelemetryPanel({ snapshot, loading, refreshing, error, onRefresh, lastUpdated }) {
  if (loading && !snapshot) {
    return <RuntimeTelemetrySkeleton />;
  }

  const readiness = snapshot?.readiness ?? {};
  const liveness = snapshot?.liveness ?? {};
  const rateLimit = snapshot?.rateLimit ?? {};
  const currentWindow = rateLimit.currentWindow ?? {};
  const environment = snapshot?.environment ?? {};
  const maintenance = snapshot?.maintenance ?? {};
  const maintenanceActive = Array.isArray(maintenance.active) ? maintenance.active : [];
  const maintenanceUpcoming = Array.isArray(maintenance.upcoming) ? maintenance.upcoming : [];
  const security = snapshot?.security ?? {};
  const securityEvents = Array.isArray(security.events) ? security.events : [];
  const securityLevel = security.level ?? 'normal';
  const lastIncidentAt = security.lastIncidentAt ?? null;
  const latestSecurityEvent = security.latest ?? null;
  const perimeter = snapshot?.perimeter ?? {};
  const blockedOrigins = Array.isArray(perimeter.blockedOrigins) ? perimeter.blockedOrigins : [];
  const totalPerimeterBlocked = Number(perimeter.totalBlocked ?? 0);
  const lastPerimeterBlockAt = perimeter.lastBlockedAt ?? null;

  const dependencyEntries = Object.entries(readiness.dependencies ?? {}).map(([name, meta]) => ({
    name,
    status: meta?.status ?? 'unknown',
    meta: meta?.vendor ? `${meta.vendor}${meta.latencyMs ? ` · ${meta.latencyMs}ms` : ''}` : null,
  }));

  const workerEntries = Object.entries(readiness.workers ?? {}).map(([name, meta]) => ({
    name,
    status: meta?.status ?? 'unknown',
    meta: meta?.updatedAt ? `Updated ${formatRelative(meta.updatedAt)}` : null,
  }));

  const approachingLimit = currentWindow.approachingLimit ?? [];
  const topConsumers = rateLimit.topConsumers ?? [];
  const history = rateLimit.history ?? [];

  return (
    <section id="admin-runtime-health" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Runtime health & API perimeter</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Monitor service readiness, dependency posture, and rate-limit pressure so operations teams can intervene before users feel the impact.
          </p>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          {lastUpdated ? (
            <p className="text-xs text-slate-500">Updated {formatRelative(lastUpdated)}</p>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={classNames('h-4 w-4', refreshing ? 'animate-spin' : '')} /> Refresh
          </button>
        </div>
      </div>

      {error && !snapshot ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" />
          <div>
            <p className="font-semibold">Telemetry temporarily unavailable</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      ) : null}

      {snapshot ? (
        <>
          {error && snapshot ? (
            <div className="mt-6 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4" />
              <p>Showing last known data. Manual refresh recommended.</p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <StatusBadge
                status={readiness.status ?? readiness.http?.status ?? 'unknown'}
                label="Service readiness"
                description={`HTTP ${readiness.httpStatus ?? readiness.http?.status ?? 503}`}
              />
              <StatusBadge
                status={liveness.status ?? 'unknown'}
                label="Process uptime"
                description={`Up ${formatDuration(liveness.uptimeSeconds)}`}
              />
              <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <ShieldCheckIcon className="h-4 w-4" /> Environment metadata
                </p>
                <dl className="mt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold text-slate-700">Node env</dt>
                    <dd>{environment.nodeEnv ?? '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold text-slate-700">Release</dt>
                    <dd>{environment.releaseId ?? environment.version ?? '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold text-slate-700">Region</dt>
                    <dd>{environment.region ?? '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold text-slate-700">CPU load</dt>
                    <dd>
                      {Array.isArray(environment.system?.loadAverage) && environment.system.loadAverage.length
                        ? environment.system.loadAverage.map((value) => value.toFixed(2)).join(' / ')
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <WrenchScrewdriverIcon className="h-4 w-4" /> Maintenance windows
                </p>
                {maintenanceActive.length ? (
                  <div className="mt-3 space-y-2 text-xs text-amber-800">
                    {maintenanceActive.map((window) => (
                      <div key={window.id} className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                        <p className="font-semibold">{window.summary}</p>
                        <p className="mt-1 text-[11px] text-amber-700">
                          Active until {formatTimestamp(window.endAt)} ({window.timezone})
                        </p>
                        <p className="mt-1 text-[11px] text-amber-700">
                          Impact: {window.impact?.toUpperCase() ?? 'NOTICE'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    No active maintenance.{' '}
                    {maintenanceUpcoming[0]
                      ? `Next window ${formatTimestamp(maintenanceUpcoming[0].startAt)} (${maintenanceUpcoming[0].timezone}).`
                      : 'Operations running normally.'}
                  </p>
                )}
                {maintenanceUpcoming.length ? (
                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">Scheduled</p>
                    <ul className="space-y-2">
                      {maintenanceUpcoming.slice(0, 2).map((window) => (
                        <li key={window.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <p className="font-semibold text-slate-700">{window.summary}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatTimestamp(window.startAt)} → {formatTimestamp(window.endAt)} ({window.timezone})
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Contact: {maintenance.supportContact ?? 'support@gigvora.com'}</span>
                  {maintenance.statusPageUrl ? (
                    <a
                      href={maintenance.statusPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-slate-700 hover:text-slate-900"
                    >
                      View status page
                    </a>
                  ) : null}
                </div>
              </div>
              <div
                className={classNames(
                  'rounded-2xl border p-4 shadow-sm',
                  securityLevel === 'attention'
                    ? 'border-red-200 bg-red-50/80'
                    : 'border-emerald-200 bg-emerald-50/80',
                )}
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <ShieldExclamationIcon className="h-4 w-4" /> Security telemetry
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {securityLevel === 'attention'
                    ? `Review incidents logged ${lastIncidentAt ? formatRelative(lastIncidentAt) : 'recently'}.`
                    : 'No critical incidents detected in the last polling window.'}
                </p>
                {latestSecurityEvent ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-700">
                    <p className="font-semibold">
                      {latestSecurityEvent.eventType}{' '}
                      <span className="text-[11px] text-slate-500">{formatRelative(latestSecurityEvent.createdAt)}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">{latestSecurityEvent.message}</p>
                  </div>
                ) : null}
                {securityEvents.length ? (
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-600">
                    {securityEvents.slice(0, 4).map((event) => (
                      <li key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <span className="font-semibold text-slate-700">{event.eventType}</span>
                        <span className="text-slate-500">{formatRelative(event.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <GlobeAltIcon className="h-4 w-4" /> API perimeter
                  </p>
                  {blockedOrigins.length ? (
                    <>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {formatNumber(totalPerimeterBlocked)} blocked {totalPerimeterBlocked === 1 ? 'request' : 'requests'} this window.
                        {lastPerimeterBlockAt ? ` Last attempt ${formatRelative(lastPerimeterBlockAt)}.` : ''}
                      </p>
                      <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                        {blockedOrigins.slice(0, 3).map((origin) => (
                          <li
                            key={origin.origin}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >
                            <span className="truncate font-semibold text-slate-700">{origin.origin}</span>
                            <span className="text-slate-500">{formatNumber(origin.attempts)} blocked</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-500">No perimeter blocks recorded this window.</p>
                  )}
                </div>
              </div>
              <DependencyList title="Dependencies" items={dependencyEntries} />
              <DependencyList title="Workers" items={workerEntries} />
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <SignalIcon className="h-5 w-5" /> Rate limit utilisation
                </p>
                <p className="text-xs text-slate-500">
                  Window {formatTimestamp(currentWindow.startedAt)} → {formatTimestamp(currentWindow.endsAt)}
                </p>
              </div>
              <RateLimitBar allowed={currentWindow.allowed ?? 0} blocked={currentWindow.blocked ?? 0} />
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requests</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(currentWindow.hits)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requests/sec</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{currentWindow.requestsPerSecond ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blocked ratio</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{formatPercent(currentWindow.blockedRatio ?? 0, 1)}</p>
                </div>
              </div>
              <ApproachingLimitList items={approachingLimit} max={rateLimit.config?.max ?? 0} />
              <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-800">Top consumers</p>
                <ConsumersTable items={topConsumers} emptyLabel="No clients have triggered the rate limiter within this window." />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-800">Window history</p>
                {history.length ? (
                  <ul className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    {history.slice(0, 4).map((entry, index) => (
                      <li key={`${entry.startedAt}-${index}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="font-semibold text-slate-700">{formatTimestamp(entry.startedAt)}</p>
                        <p className="mt-1 text-[11px]">
                          {formatNumber(entry.hits)} hits · {formatNumber(entry.blocked)} blocked · {formatNumber(entry.activeKeys)} keys
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">History will populate once the current window rolls over.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

