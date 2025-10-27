import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Transition } from '@headlessui/react';
import { fetchAdminDashboard } from '../../../services/admin.js';
import { analytics } from '../../../services/analytics.js';
import AdminEnterprise360Panel from './AdminEnterprise360Panel.jsx';

const TIMEFRAMES = [
  { id: 7, label: '7 days', description: 'Rapid response pulse' },
  { id: 30, label: '30 days', description: 'Executive monthly review' },
  { id: 90, label: '90 days', description: 'Quarterly board view' },
];

const SEGMENTS = [
  { id: 'global', label: 'Global network' },
  { id: 'enterprise', label: 'Enterprise accounts' },
  { id: 'startups', label: 'High-growth startups' },
  { id: 'mentors', label: 'Mentors & advisors' },
];

function formatNumber(value) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  if (Math.abs(numeric) >= 1000000) {
    return `${(numeric / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(numeric) >= 1000) {
    return `${(numeric / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US').format(numeric);
}

function formatPercent(value) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return `${numeric >= 1 ? numeric.toFixed(1) : (numeric * 100).toFixed(1)}%`;
}

function formatCurrency(value) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: numeric >= 100000 ? 0 : 1,
  }).format(numeric);
}

function normaliseMetrics(payload, segment) {
  if (!payload) {
    return [];
  }

  const metrics = Array.isArray(payload)
    ? payload
    : Object.entries(payload).map(([key, metric]) => ({
        key,
        label: metric?.label ?? key,
        value: metric?.value ?? metric?.count ?? 0,
        change: metric?.change ?? metric?.delta ?? 0,
        direction: metric?.direction ?? (metric?.change ?? metric?.delta ?? 0) >= 0 ? 'up' : 'down',
        target: metric?.target ?? null,
        unit: metric?.unit ?? metric?.units ?? null,
        segment: metric?.segment ?? metric?.cohort ?? 'global',
        description:
          metric?.description ??
          metric?.caption ??
          'Live telemetry surfaced from production data pipelines and anomaly monitors.',
      }));

  return metrics
    .map((metric) => ({
      ...metric,
      segment: metric.segment ?? 'global',
    }))
    .filter((metric) => metric.segment === segment || metric.segment === 'global');
}

function deriveAnomalies(metrics) {
  return metrics
    .filter((metric) => metric && Number.isFinite(Number(metric.change)))
    .filter((metric) => Math.abs(Number(metric.change)) >= 8)
    .map((metric) => ({
      key: metric.key,
      label: metric.label,
      severity: Math.abs(Number(metric.change)) >= 15 ? 'critical' : 'warning',
      change: metric.change,
      direction: metric.direction,
      caption:
        metric.direction === 'up'
          ? 'Positive outlier detected — validate promotion pacing and infrastructure readiness.'
          : 'Negative drop spotted — trigger mitigation playbooks with Ops, Support, and Comms.',
    }));
}

function deriveAlerts(payload) {
  if (!payload) {
    return [];
  }

  const alerts = Array.isArray(payload)
    ? payload
    : Object.entries(payload).map(([key, alert]) => ({
        key,
        title: alert?.title ?? key,
        status: alert?.status ?? 'open',
        slaMinutes: alert?.slaMinutes ?? alert?.sla ?? null,
        owner: alert?.owner ?? alert?.team ?? 'Unassigned',
        startedAt: alert?.startedAt ?? alert?.createdAt ?? null,
        category: alert?.category ?? 'operations',
        href: alert?.href ?? null,
      }));

  return alerts.sort((a, b) => (a.status === 'open' && b.status !== 'open' ? -1 : 0));
}

function deriveQuickActions(payload, onNavigate) {
  const baseActions = [
    {
      key: 'incidents',
      label: 'Review incidents',
      description: 'Triage live incidents, provide updates, and coordinate stakeholder comms.',
      href: '/admin/incidents',
    },
    {
      key: 'sla-audit',
      label: 'Audit SLAs',
      description: 'Inspect SLA breaches and re-assign owners before the next executive sync.',
      href: '/admin/support/sla',
    },
    {
      key: 'launchpad',
      label: 'Plan launchpad',
      description: 'Coordinate go-to-market calendar across marketing, success, and mentoring pods.',
      href: '/admin/launchpad',
    },
  ];

  const actions = Array.isArray(payload) ? payload : baseActions;

  return actions.map((action) => ({
    ...action,
    onClick: () => {
      if (action.onClick) {
        action.onClick();
        return;
      }
      if (action.href && typeof onNavigate === 'function') {
        onNavigate(action.href, action);
      } else if (action.href) {
        window.open(action.href, '_blank', 'noopener');
      }
    },
  }));
}

function deriveTimeline(events) {
  if (!events) {
    return [];
  }
  const rawEvents = Array.isArray(events)
    ? events
    : Object.entries(events).map(([key, event]) => ({ key, ...event }));

  return rawEvents
    .map((event) => ({
      key: event.key ?? event.id ?? `${event.type ?? 'event'}-${event.timestamp ?? event.occurredAt ?? Date.now()}`,
      title: event.title ?? event.summary ?? 'Operational update',
      timestamp: event.timestamp ?? event.occurredAt ?? event.createdAt ?? new Date().toISOString(),
      persona: event.persona ?? event.team ?? 'Ops',
      highlight: event.highlight ?? false,
      href: event.href ?? null,
      icon: event.icon ?? null,
      description:
        event.description ??
        event.caption ??
        'Captured automatically from admin workflows, compliance audits, and automation pipelines.',
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);
}

function lastUpdatedLabel(timestamp) {
  if (!timestamp) {
    return 'Live sync • <60s latency';
  }
  const updated = new Date(timestamp);
  if (Number.isNaN(updated.getTime())) {
    return 'Live sync • <60s latency';
  }
  const now = Date.now();
  const diffMinutes = Math.max(0, Math.round((now - updated.getTime()) / 60000));
  if (diffMinutes < 1) {
    return 'Updated moments ago';
  }
  if (diffMinutes < 60) {
    return `Updated ${diffMinutes}m ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }
  return updated.toLocaleString();
}

function MetricCard({ metric }) {
  const isPositive = metric.direction !== 'down';
  const changeLabel = metric.unit === '%' || metric.unit === 'percent' ? formatPercent(metric.change) : `${formatNumber(metric.change)}${metric.unit ? ` ${metric.unit}` : ''}`;
  const valueLabel = metric.unit === '$' || metric.unit === 'currency' ? formatCurrency(metric.value) : metric.unit === '%' || metric.unit === 'percent' ? formatPercent(metric.value) : formatNumber(metric.value);

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-lg shadow-blue-100/20 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{valueLabel}</p>
        </div>
        <span
          className={clsx(
            'inline-flex h-12 w-12 items-center justify-center rounded-3xl border bg-slate-900 text-white shadow-inner transition group-hover:scale-110',
            isPositive ? 'border-blue-500/30 bg-gradient-to-br from-blue-600 to-indigo-600' : 'border-rose-400/30 bg-gradient-to-br from-rose-500 to-amber-500',
          )}
        >
          {isPositive ? <ArrowTrendingUpIcon className="h-6 w-6" aria-hidden="true" /> : <ArrowDownIcon className="h-6 w-6" aria-hidden="true" />}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{metric.description}</p>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
        <span
          className={clsx(
            'inline-flex h-2 w-2 rounded-full',
            isPositive ? 'bg-emerald-500' : 'bg-rose-500',
          )}
          aria-hidden="true"
        />
        {isPositive ? 'Trending upward' : 'Trending downward'}
        <span className="font-semibold text-slate-900">{changeLabel}</span>
        {metric.target ? <span className="text-slate-400">Target {formatNumber(metric.target)}</span> : null}
      </div>
    </div>
  );
}

MetricCard.propTypes = {
  metric: PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    unit: PropTypes.string,
    change: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    direction: PropTypes.string,
    description: PropTypes.string,
    target: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

function AnomalyBadge({ anomaly }) {
  const severityClass = anomaly.severity === 'critical' ? 'bg-rose-500/10 text-rose-600 ring-rose-500/30' : 'bg-amber-500/10 text-amber-600 ring-amber-500/30';
  return (
    <div className="rounded-3xl border border-transparent bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className={clsx('inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1', severityClass)}>
          <BoltIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{anomaly.label}</p>
            <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {anomaly.severity === 'critical' ? 'Critical' : 'Warning'}
            </span>
          </div>
          <p className="text-xs text-slate-500">{anomaly.caption}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            {anomaly.direction === 'up' ? '+' : '-'}
            {Math.abs(Number(anomaly.change)).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

AnomalyBadge.propTypes = {
  anomaly: PropTypes.shape({
    label: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    change: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    direction: PropTypes.string,
    caption: PropTypes.string,
  }).isRequired,
};

function AlertRow({ alert, onNavigate }) {
  const isOpen = alert.status === 'open' || alert.status === 'investigating';
  return (
    <button
      type="button"
      onClick={() => {
        if (alert.href) {
          if (onNavigate) {
            onNavigate(alert.href, alert);
            return;
          }
          window.open(alert.href, '_blank', 'noopener');
        }
      }}
      className="flex w-full items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left text-sm text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={clsx('inline-flex h-2 w-2 rounded-full', isOpen ? 'bg-rose-500' : 'bg-emerald-500')} aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
        </div>
        <p className="text-xs text-slate-500">
          Owner: {alert.owner} • SLA {alert.slaMinutes ? `${alert.slaMinutes}m` : 'N/A'} • {alert.category}
        </p>
        <p className="text-xs text-slate-400">{alert.startedAt ? new Date(alert.startedAt).toLocaleString() : 'Realtime signal'}</p>
      </div>
      <ChevronRightIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
    </button>
  );
}

AlertRow.propTypes = {
  alert: PropTypes.shape({
    title: PropTypes.string.isRequired,
    owner: PropTypes.string,
    slaMinutes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    status: PropTypes.string,
    category: PropTypes.string,
    startedAt: PropTypes.string,
    href: PropTypes.string,
  }).isRequired,
  onNavigate: PropTypes.func,
};

AlertRow.defaultProps = {
  onNavigate: undefined,
};

function TimelineEvent({ event, onNavigate }) {
  return (
    <li className="relative pl-6">
      <span className="absolute left-0 top-2 inline-flex h-3 w-3 -translate-x-1/2 items-center justify-center rounded-full bg-blue-500 shadow shadow-blue-200" aria-hidden="true" />
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white/95 px-5 py-4 shadow-sm transition hover:border-blue-300">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {event.persona}
            </span>
            <p className="text-sm font-semibold text-slate-900">{event.title}</p>
          </div>
          <time className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</time>
        </div>
        <p className="text-xs text-slate-500">{event.description}</p>
        {event.href ? (
          <div>
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate(event.href, event) : window.open(event.href, '_blank', 'noopener'))}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-700"
            >
              View details
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

TimelineEvent.propTypes = {
  event: PropTypes.shape({
    title: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    persona: PropTypes.string,
    description: PropTypes.string,
    href: PropTypes.string,
  }).isRequired,
  onNavigate: PropTypes.func,
};

TimelineEvent.defaultProps = {
  onNavigate: undefined,
};

function QuickActionCard({ action }) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      className="flex h-full flex-col justify-between rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 text-left shadow-soft transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
    >
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          Guided playbook
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{action.label}</h3>
        <p className="text-sm text-slate-500">{action.description}</p>
      </div>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
        Launch
        <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
      </div>
    </button>
  );
}

QuickActionCard.propTypes = {
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    onClick: PropTypes.func,
  }).isRequired,
};

export default function AdminDashboard({ initialLookbackDays, onNavigate }) {
  const [timeframe, setTimeframe] = useState(() => {
    const match = TIMEFRAMES.find((option) => option.id === initialLookbackDays);
    return match ? match.id : 30;
  });
  const [segment, setSegment] = useState('global');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState({
    metrics: [],
    anomalies: [],
    alerts: [],
    quickActions: [],
    timeline: [],
    generatedAt: null,
    finance: {},
    enterprise360: null,
  });

  const loadDashboard = useCallback(
    async (options = {}) => {
      const silent = options.silent ?? false;
      setStatus((current) => {
        if (silent && current === 'ready') {
          return 'refreshing';
        }
        if (!silent) {
          return 'loading';
        }
        return current;
      });
      setError('');
      try {
        const response = await fetchAdminDashboard({ lookbackDays: timeframe, segment });
        const payload = response?.commandCenter ?? response ?? {};
        const metrics = normaliseMetrics(payload.metrics ?? payload.kpis ?? payload.metricCards, segment);
        const alerts = deriveAlerts(payload.alerts ?? payload.slaAlerts ?? payload.incidents);
        const timeline = deriveTimeline(payload.timeline ?? payload.journal ?? payload.events);
        const anomalies = deriveAnomalies(metrics).concat(deriveAnomalies(payload.anomalies ?? []));
        const quickActions = deriveQuickActions(payload.quickActions, onNavigate);
        setDashboard({
          metrics,
          alerts,
          anomalies,
          quickActions,
          timeline,
          generatedAt: payload.generatedAt ?? response?.generatedAt ?? response?.refreshedAt ?? null,
          finance: payload.finance ?? response?.finance ?? {},
          support: payload.support ?? response?.support ?? {},
          reliability: payload.reliability ?? response?.reliability ?? {},
          enterprise360: payload.enterprise360 ?? response?.enterprise360 ?? null,
        });
        setStatus('ready');
        analytics.track('admin.command-center.view', {
          timeframe,
          segment,
          metrics: metrics.map((metric) => metric.key),
          alerts: alerts.length,
          anomalies: anomalies.length,
        });
      } catch (loadError) {
        console.error('Failed to load admin dashboard', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load admin dashboard.');
        setStatus('error');
      }
    },
    [timeframe, segment, onNavigate],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = useCallback(() => {
    loadDashboard({ silent: true });
  }, [loadDashboard]);

  const financeSnapshot = useMemo(() => {
    return {
      netRevenue: formatCurrency(dashboard.finance?.netRevenue ?? dashboard.finance?.net ?? 0),
      outstandingInvoices: formatCurrency(dashboard.finance?.outstandingInvoices ?? 0),
      escrowBalance: formatCurrency(dashboard.finance?.escrowBalance ?? dashboard.finance?.escrow ?? 0),
      payoutSuccessRate: formatPercent(dashboard.finance?.payoutSuccessRate ?? dashboard.finance?.payouts?.successRate ?? 0.99),
    };
  }, [dashboard.finance]);

  const supportSnapshot = useMemo(() => ({
    openTickets: dashboard.support?.openTickets ?? dashboard.support?.open ?? 0,
    breached: dashboard.support?.slaBreaches ?? 0,
    csat: formatPercent(dashboard.support?.csat ?? dashboard.support?.satisfaction ?? 0.97),
    avgResponse: dashboard.support?.avgFirstResponseMinutes ?? 6,
  }), [dashboard.support]);

  const reliabilitySnapshot = useMemo(() => ({
    uptime: formatPercent(dashboard.reliability?.uptime ?? 0.999),
    incidentCount: dashboard.reliability?.incidents ?? dashboard.reliability?.openIncidents ?? 0,
    errorRate: formatPercent(dashboard.reliability?.errorRate ?? 0.001),
    latencyP95: `${Math.round(dashboard.reliability?.latencyP95 ?? 420)}ms`,
  }), [dashboard.reliability]);

  const skeleton = status === 'loading' && !dashboard.metrics.length;

  return (
    <section id="admin-command-center" className="space-y-10 rounded-[40px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-lg shadow-blue-100/30">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-600">
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            Admin Console Command Center
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Executive runway for operations, finance, and trust</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-500">
              Align leadership around the freshest telemetry pulled directly from production systems. Drill into anomalies,
              reassign ownership, and trigger playbooks—all without leaving the command center.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
              <WifiIcon className="h-4 w-4" aria-hidden="true" />
              {lastUpdatedLabel(dashboard.generatedAt)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 font-semibold uppercase tracking-wide text-white shadow-sm">
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              SLA monitors live
            </span>
            {status === 'refreshing' ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 font-semibold uppercase tracking-wide text-blue-700">
                <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
                Syncing latest data…
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {TIMEFRAMES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTimeframe(option.id)}
                className={clsx(
                  'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-sm transition',
                  timeframe === option.id
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SEGMENTS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSegment(option.id)}
                className={clsx(
                  'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition',
                  segment === option.id
                    ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-200/40'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-slate-300"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              Refresh data
            </button>
            <button
              type="button"
              onClick={() => analytics.track('admin.command-center.export', { timeframe, segment })}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-md transition hover:bg-slate-700"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
              Configure widgets
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
            {error}
          </div>
          <p className="mt-1 text-xs text-rose-600">
            Retry shortly or export from the analytics warehouse snapshot if this persists.
          </p>
        </div>
      ) : null}

      <AdminEnterprise360Panel snapshot={dashboard.enterprise360} />

      {skeleton ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="h-48 animate-pulse rounded-[28px] border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {dashboard.metrics.map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Anomaly radar</h2>
          {dashboard.anomalies.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
              No anomalies detected in the current window.
            </div>
          ) : (
            <div className="space-y-4">
              {dashboard.anomalies.map((anomaly) => (
                <AnomalyBadge key={`${anomaly.key}-${anomaly.direction}`} anomaly={anomaly} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Live alerts</h2>
            <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {dashboard.alerts.length} active
            </span>
          </div>
          <div className="space-y-3">
            {dashboard.alerts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                All clear. Alerts triggered here will sync with the incident bridge in real time.
              </div>
            ) : (
              dashboard.alerts.map((alert) => (
                <AlertRow key={alert.key ?? alert.title} alert={alert} onNavigate={onNavigate} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Quick actions</h2>
          <div className="grid gap-4">
            {dashboard.quickActions.map((action) => (
              <QuickActionCard key={action.key ?? action.label} action={action} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-blue-100/20 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <BanknotesIcon className="h-4 w-4" aria-hidden="true" />
            Finance pulse
          </div>
          <dl className="grid gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>Net revenue</dt>
              <dd className="font-semibold text-slate-900">{financeSnapshot.netRevenue}</dd>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>Outstanding invoices</dt>
              <dd className="font-semibold text-slate-900">{financeSnapshot.outstandingInvoices}</dd>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>Escrow balance</dt>
              <dd className="font-semibold text-slate-900">{financeSnapshot.escrowBalance}</dd>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>Payout success</dt>
              <dd className="font-semibold text-slate-900">{financeSnapshot.payoutSuccessRate}</dd>
            </div>
          </dl>
        </div>
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
            Support quality
          </div>
          <dl className="grid gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>Open tickets</dt>
              <dd className="font-semibold text-slate-900">{formatNumber(supportSnapshot.openTickets)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>SLA breaches</dt>
              <dd className="font-semibold text-rose-600">{formatNumber(supportSnapshot.breached)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>CSAT</dt>
              <dd className="font-semibold text-slate-900">{supportSnapshot.csat}</dd>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>Avg first response</dt>
              <dd className="font-semibold text-slate-900">{supportSnapshot.avgResponse}m</dd>
            </div>
          </dl>
        </div>
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
            Platform health
          </div>
          <dl className="grid gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>Uptime (p99)</dt>
              <dd className="font-semibold text-slate-900">{reliabilitySnapshot.uptime}</dd>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>Open incidents</dt>
              <dd className="font-semibold text-rose-600">{formatNumber(reliabilitySnapshot.incidentCount)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>Error rate</dt>
              <dd className="font-semibold text-slate-900">{reliabilitySnapshot.errorRate}</dd>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <dt>Latency p95</dt>
              <dd className="font-semibold text-slate-900">{reliabilitySnapshot.latencyP95}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Timeline</h2>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Operational journal</span>
        </div>
        {dashboard.timeline.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
            No timeline entries in this window. Sync again or widen the timeframe to surface activity.
          </div>
        ) : (
          <ol className="space-y-3">
            {dashboard.timeline.map((event) => (
              <TimelineEvent key={event.key} event={event} onNavigate={onNavigate} />
            ))}
          </ol>
        )}
      </div>

      <Transition
        show={status === 'refreshing'}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform translate-y-2 opacity-0"
        enterTo="transform translate-y-0 opacity-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform translate-y-0 opacity-100"
        leaveTo="transform translate-y-2 opacity-0"
      >
        <div className="fixed bottom-6 right-6 z-40">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-xl">
            <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
            Syncing telemetry
          </div>
        </div>
      </Transition>
    </section>
  );
}

AdminDashboard.propTypes = {
  initialLookbackDays: PropTypes.number,
  onNavigate: PropTypes.func,
};

AdminDashboard.defaultProps = {
  initialLookbackDays: 30,
  onNavigate: undefined,
};
