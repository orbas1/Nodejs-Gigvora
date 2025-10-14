import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  SignalIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';
import { CpuChipIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/solid';
import AccessRestricted from '../components/AccessRestricted.jsx';
import useSession from '../hooks/useSession.js';
import { hasSecurityOperationsAccess } from '../utils/permissions.js';
import { formatAbsolute, formatRelativeTime } from '../utils/date.js';
import { classNames } from '../utils/classNames.js';
import {
  acknowledgeSecurityAlert,
  fetchSecurityTelemetry,
  suppressSecurityAlert,
  triggerThreatSweep,
} from '../services/security.js';

const severityTone = {
  critical: 'border-rose-300 bg-rose-50 text-rose-700',
  high: 'border-amber-300 bg-amber-50 text-amber-700',
  medium: 'border-sky-300 bg-sky-50 text-sky-700',
  low: 'border-emerald-300 bg-emerald-50 text-emerald-700',
};

const severityLabel = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function formatNumber(value) {
  try {
    return new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value ?? 0);
  } catch (error) {
    return `${value ?? 0}`;
  }
}

function MetricCard({ icon: Icon, title, value, caption, accent }) {
  return (
    <div
      className={classNames(
        'group relative overflow-hidden rounded-3xl border bg-white/80 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-xl',
        accent,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-transparent" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
          {caption ? <p className="mt-1 text-sm text-slate-600">{caption}</p> : null}
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/10 to-accent/20 text-accent">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function AlertRow({ alert, onAcknowledge, onSuppress, loading }) {
  const tone = severityTone[alert.severity] ?? severityTone.medium;
  const isAcknowledged = ['acknowledged', 'suppressed', 'closed', 'resolved'].includes(alert.status);
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-soft transition hover:border-accent/40 hover:shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <span className={classNames('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold', tone)}>
            <ShieldExclamationIcon className="h-4 w-4" aria-hidden="true" />
            {severityLabel[alert.severity] ?? alert.severity}
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">{alert.category}</p>
            <p className="mt-1 text-sm text-slate-600">
              {alert.source} · {alert.asset}
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Detected {formatRelativeTime(alert.detectedAt)} ({formatAbsolute(alert.detectedAt)})
          </p>
          <p className="text-sm text-slate-600">{alert.recommendedAction}</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {alert.location}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSuppress(alert)}
              disabled={loading || isAcknowledged}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-amber-400 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
              Suppress
            </button>
            <button
              type="button"
              onClick={() => onAcknowledge(alert)}
              disabled={loading || isAcknowledged}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
              Acknowledge
            </button>
          </div>
          <p className="text-xs text-slate-500">Current state: {alert.status}</p>
        </div>
      </div>
    </div>
  );
}

function IncidentCard({ incident }) {
  const tone = severityTone[incident.severity] ?? severityTone.medium;
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft transition hover:border-accent/40 hover:shadow-lg">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className={classNames('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold', tone)}>
            <BoltIcon className="h-4 w-4" aria-hidden="true" />
            {severityLabel[incident.severity] ?? incident.severity}
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{incident.owner}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{incident.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{incident.summary}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>Opened {formatRelativeTime(incident.openedAt)}</span>
          <span>·</span>
          <span>Status: {incident.status}</span>
        </div>
      </div>
    </article>
  );
}

export default function SecurityOperationsPage() {
  const { session, isAuthenticated } = useSession();
  const [telemetry, setTelemetry] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionState, setActionState] = useState({});
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const securityAccess = useMemo(() => hasSecurityOperationsAccess(session), [session]);

  const loadTelemetry = useCallback(
    async (options = {}) => {
      if (!securityAccess) {
        return null;
      }
      const result = await fetchSecurityTelemetry(options);
      setTelemetry(result);
      setAlerts(result.alerts ?? []);
      setLastSyncedAt(new Date());
      return result;
    },
    [securityAccess],
  );

  useEffect(() => {
    if (!securityAccess) {
      setTelemetry(null);
      setAlerts([]);
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    loadTelemetry({ signal: controller.signal })
      .catch((err) => {
        if (!mounted || err?.name === 'AbortError') {
          return;
        }
        setError(err.message || 'Unable to load security telemetry.');
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [securityAccess, loadTelemetry]);

  useEffect(() => {
    if (!securityAccess || !autoRefresh) {
      return undefined;
    }
    const interval = setInterval(() => {
      loadTelemetry().catch(() => {
        /* ignore background refresh errors */
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadTelemetry, securityAccess]);

  const handleRefresh = useCallback(async () => {
    if (!securityAccess) {
      return;
    }
    setRefreshing(true);
    setError(null);
    try {
      await loadTelemetry();
      setSuccessMessage('Security telemetry synchronised successfully.');
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError(err.message || 'Failed to refresh telemetry.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [loadTelemetry, securityAccess]);

  const updateAlertState = useCallback((alertId, status) => {
    setAlerts((prev) =>
      prev.map((existing) =>
        existing.id === alertId
          ? {
              ...existing,
              status,
              acknowledgedAt: new Date().toISOString(),
            }
          : existing,
      ),
    );
  }, []);

  const handleAcknowledge = useCallback(
    async (alert) => {
      if (!securityAccess) {
        return;
      }
      setActionState((prev) => ({ ...prev, [alert.id]: 'acknowledging' }));
      setError(null);
      try {
        await acknowledgeSecurityAlert(alert.id, { note: 'Acknowledged via security operations console.' });
        updateAlertState(alert.id, 'acknowledged');
        setSuccessMessage(`Alert ${alert.id} acknowledged.`);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setError(err.message || `Unable to acknowledge alert ${alert.id}.`);
        }
      } finally {
        setActionState((prev) => {
          const next = { ...prev };
          delete next[alert.id];
          return next;
        });
      }
    },
    [securityAccess, updateAlertState],
  );

  const handleSuppress = useCallback(
    async (alert) => {
      if (!securityAccess) {
        return;
      }
      setActionState((prev) => ({ ...prev, [alert.id]: 'suppressing' }));
      setError(null);
      try {
        await suppressSecurityAlert(alert.id, { reason: 'Suppressed from console', expiresInMinutes: 60 });
        updateAlertState(alert.id, 'suppressed');
        setSuccessMessage(`Alert ${alert.id} suppressed for 60 minutes.`);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setError(err.message || `Unable to suppress alert ${alert.id}.`);
        }
      } finally {
        setActionState((prev) => {
          const next = { ...prev };
          delete next[alert.id];
          return next;
        });
      }
    },
    [securityAccess, updateAlertState],
  );

  const handleThreatSweep = useCallback(async () => {
    if (!securityAccess) {
      return;
    }
    setActionState((prev) => ({ ...prev, sweep: 'running' }));
    setError(null);
    try {
      await triggerThreatSweep({ scope: 'all-production', reason: 'Manual sweep from console' });
      setSuccessMessage('Network wide threat sweep queued. You will be notified on completion.');
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError(err.message || 'Unable to launch the threat sweep.');
      }
    } finally {
      setActionState((prev) => {
        const next = { ...prev };
        delete next.sweep;
        return next;
      });
    }
  }, [securityAccess]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setSuccessMessage(''), 5000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  const posture = telemetry?.posture;
  const incidents = telemetry?.incidents ?? [];
  const playbooks = telemetry?.playbooks ?? [];
  const metrics = telemetry?.metrics;
  const patchWindow = telemetry?.patchWindow;

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <AccessRestricted
          tone="blue"
          badge="Security operations"
          title="Sign in to open the security console"
          description="This area is restricted to Gigvora security operations. Authenticate with the correct workspace role to continue."
        />
      </div>
    );
  }

  if (!securityAccess) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <AccessRestricted
          badge="Restricted"
          tone="amber"
          title="Security clearance required"
          description="Only members of the security, trust, or admin teams can administer breach prevention controls. Request access from your workspace owner."
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-accent/10 via-transparent to-transparent" />
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent/80">Security & Breach Prevention</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Security Operations Control Room
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Monitor threats, orchestrate responses, and govern enterprise defences across Gigvora infrastructure and endpoint fleets.
            Every action is audited, multi-factor enforced, and aligned with zero trust controls.
          </p>
          {posture ? (
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-sm font-semibold text-emerald-700">
              <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
              Posture: {posture.status} · Attack surface score {posture.attackSurfaceScore}
              {typeof posture.attackSurfaceChange === 'number' ? (
                <span className={classNames('text-xs font-semibold', posture.attackSurfaceChange <= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {posture.attackSurfaceChange > 0 ? '+' : ''}
                  {posture.attackSurfaceChange}%
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className={classNames('h-4 w-4', refreshing ? 'animate-spin' : '')} aria-hidden="true" />
              Refresh telemetry
            </button>
            <button
              type="button"
              onClick={handleThreatSweep}
              disabled={Boolean(actionState.sweep)}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              Launch threat sweep
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
            />
            Auto-refresh every minute
          </label>
          <p className="text-xs text-slate-500">
            {loading ? 'Syncing telemetry…' : lastSyncedAt ? `Last synced ${formatRelativeTime(lastSyncedAt)}.` : 'Awaiting telemetry sync.'}
          </p>
        </div>
      </header>

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {loading && !telemetry ? (
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-3xl bg-gradient-to-br from-slate-100 via-white to-slate-50" />
          ))}
        </div>
      ) : null}

      {telemetry ? (
        <div className="mt-12 space-y-12">
          <section>
            <div className="grid gap-6 lg:grid-cols-4">
              <MetricCard
                icon={ShieldExclamationIcon}
                title="Blocked intrusions"
                value={formatNumber(metrics?.blockedIntrusions ?? 0)}
                caption="Stops in the past 24 hours"
                accent="border-slate-200"
              />
              <MetricCard
                icon={LockClosedIcon}
                title="Quarantined assets"
                value={formatNumber(metrics?.quarantinedAssets ?? 0)}
                caption="Devices isolated pending triage"
                accent="border-slate-200"
              />
              <MetricCard
                icon={CpuChipIcon}
                title="High-risk vulnerabilities"
                value={formatNumber(metrics?.highRiskVulnerabilities ?? 0)}
                caption="Awaiting remediation"
                accent="border-slate-200"
              />
              <MetricCard
                icon={SignalIcon}
                title="Mean time to respond"
                value={`${metrics?.meanTimeToRespondMinutes ?? 0}m`}
                caption="Across the last 10 incidents"
                accent="border-slate-200"
              />
            </div>
            {posture?.signals?.length ? (
              <div className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft md:grid-cols-2">
                {posture.signals.map((signal) => (
                  <div key={signal} className="flex items-start gap-3">
                    <ShieldCheckIcon className="mt-0.5 h-5 w-5 text-emerald-500" aria-hidden="true" />
                    <p className="text-sm text-slate-600">{signal}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Threat queue</h2>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {alerts.length} active {alerts.length === 1 ? 'alert' : 'alerts'}
                </p>
              </div>
              <div className="space-y-4">
                {alerts.length ? (
                  alerts.map((alert) => (
                    <AlertRow
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={handleAcknowledge}
                      onSuppress={handleSuppress}
                      loading={Boolean(actionState[alert.id])}
                    />
                  ))
                ) : (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 text-sm text-emerald-700">
                    <ShieldCheckIcon className="mb-2 h-6 w-6" aria-hidden="true" />
                    No unacknowledged threats in the queue. Continuous monitoring is active across all zones.
                  </div>
                )}
              </div>
            </div>
            <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft lg:col-span-2">
              <div className="flex items-center gap-3">
                <WifiIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-900">Patch and resilience</h2>
              </div>
              <p className="text-sm text-slate-600">
                Next maintenance window {patchWindow?.nextWindow ? formatAbsolute(patchWindow.nextWindow) : 'to be scheduled'}.
                {typeof patchWindow?.backlog === 'number' ? ` ${patchWindow.backlog} items in backlog.` : ''}
              </p>
              {typeof patchWindow?.backlogChange === 'number' ? (
                <p className={classNames('text-sm font-semibold', patchWindow.backlogChange <= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {patchWindow.backlogChange > 0 ? '+' : ''}
                  {patchWindow.backlogChange} vs last window
                </p>
              ) : null}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Automation</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <ShieldCheckIcon className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
                    Endpoint quarantine and credential revocation run automatically on policy triggers.
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheckIcon className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
                    Every suppression is automatically reviewed after 60 minutes to prevent blind spots.
                  </li>
                </ul>
              </div>
            </aside>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ShieldExclamationIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-900">Open incidents</h2>
              </div>
              <div className="space-y-4">
                {incidents.length ? (
                  incidents.map((incident) => <IncidentCard key={incident.id} incident={incident} />)
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600">
                    No active incidents require intervention. Response crews are standing by.
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <LockClosedIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-900">Response playbooks</h2>
              </div>
              <div className="space-y-3">
                {playbooks.length ? (
                  playbooks.map((playbook) => (
                    <div
                      key={playbook.id}
                      className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-soft"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{playbook.name}</p>
                        <p className="text-xs text-slate-500">Owned by {playbook.owner}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Runs</p>
                        <p className="text-base font-bold text-slate-900">{formatNumber(playbook.runCount ?? 0)}</p>
                        <p className="text-xs text-slate-500">Last executed {formatRelativeTime(playbook.lastExecutedAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600">
                    Build and publish response playbooks to guide teams through zero-day and ransomware events.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
