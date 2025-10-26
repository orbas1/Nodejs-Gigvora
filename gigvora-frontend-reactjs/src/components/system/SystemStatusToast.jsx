import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ArrowUpRightIcon,
  BoltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SignalIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const STATUS_CONFIG = {
  operational: {
    tone: 'success',
    accent: '#10b981',
    label: 'All systems operational',
    icon: ShieldCheckIcon,
  },
  degraded: {
    tone: 'error',
    accent: '#f59e0b',
    label: 'Performance degradation',
    icon: ExclamationTriangleIcon,
  },
  outage: {
    tone: 'error',
    accent: '#f97316',
    label: 'Service outage',
    icon: BoltIcon,
  },
  maintenance: {
    tone: 'info',
    accent: '#6366f1',
    label: 'Scheduled maintenance',
    icon: WrenchScrewdriverIcon,
  },
};

const SERVICE_STATUS_CONFIG = {
  operational: { label: 'Operational', dot: 'bg-emerald-500' },
  degraded: { label: 'Degraded', dot: 'bg-amber-500' },
  outage: { label: 'Outage', dot: 'bg-rose-500' },
  maintenance: { label: 'Maintenance', dot: 'bg-indigo-500' },
  investigating: { label: 'Investigating', dot: 'bg-sky-500' },
  recovering: { label: 'Recovering', dot: 'bg-blue-500' },
};

function normaliseServices(services) {
  if (!services) {
    return [];
  }
  const normalised = Array.isArray(services) ? services : [services];
  return normalised
    .map((entry, index) => {
      if (!entry) {
        return null;
      }
      if (typeof entry === 'string') {
        return { id: `service-${index}`, name: entry, status: 'investigating' };
      }
      if (typeof entry === 'object') {
        const id = entry.id || `service-${index}`;
        const name = entry.name || entry.service || null;
        if (!name) {
          return null;
        }
        const status = entry.status || entry.state || 'investigating';
        const impact = entry.impact || entry.description || entry.summary || null;
        const eta = entry.eta || entry.recoveryEta || entry.nextUpdateAt || null;
        const confidence = typeof entry.confidence === 'number' ? clamp(entry.confidence, 0, 1) : null;
        return {
          id,
          name,
          status: `${status}`.toLowerCase(),
          impact,
          eta,
          confidence,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function clamp(value, min, max) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function formatMaintenanceWindow(window) {
  if (!window || typeof window !== 'object') {
    return null;
  }
  const { startsAt, endsAt, timezone, summary } = window;
  if (!startsAt && !endsAt && !summary) {
    return null;
  }
  const startLabel = startsAt ? formatAbsolute(startsAt, { timeStyle: 'short', timeZone: timezone }) : null;
  const endLabel = endsAt ? formatAbsolute(endsAt, { timeStyle: 'short', timeZone: timezone }) : null;
  const dateLabel = startsAt
    ? formatAbsolute(startsAt, { dateStyle: 'medium', timeStyle: undefined, timeZone: timezone })
    : null;
  return {
    startLabel,
    endLabel,
    dateLabel,
    summary: summary || 'Scheduled maintenance window',
  };
}

export function SystemStatusToast({
  status = 'operational',
  headline,
  description,
  impactedServices,
  maintenanceWindow,
  updatedAt,
  statusPageUrl,
  onViewDetails,
  onAcknowledge,
  dismiss,
  analyticsContext,
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.operational;
  const normalisedServices = useMemo(() => normaliseServices(impactedServices), [impactedServices]);
  const services = useMemo(() => normalisedServices.slice(0, 4), [normalisedServices]);
  const overflowCount = Math.max(0, normalisedServices.length - services.length);
  const StatusIcon = config.icon;

  const windowDetails = useMemo(() => formatMaintenanceWindow(maintenanceWindow), [maintenanceWindow]);
  const relativeUpdated = useMemo(
    () => (updatedAt ? formatRelativeTime(updatedAt, { numeric: 'auto' }) : 'Just now'),
    [updatedAt],
  );
  const absoluteUpdated = useMemo(() => (updatedAt ? formatAbsolute(updatedAt, { timeStyle: 'short' }) : null), [updatedAt]);

  useEffect(() => {
    analytics.track('system_status_toast_viewed', {
      status,
      headline: headline || config.label,
      hasImpactedServices: services.length > 0,
      maintenanceWindow: Boolean(windowDetails),
      ...analyticsContext,
    });
  }, [analyticsContext, config.label, headline, services.length, status, windowDetails]);

  const handleView = () => {
    analytics.track('system_status_toast_action', {
      action: 'view_status',
      status,
      headline: headline || config.label,
      destination: statusPageUrl ?? null,
      ...analyticsContext,
    });
    onViewDetails?.();
    if (!statusPageUrl) {
      dismiss?.();
    }
  };

  const handleAcknowledge = () => {
    analytics.track('system_status_toast_action', {
      action: 'acknowledge',
      status,
      headline: headline || config.label,
      ...analyticsContext,
    });
    onAcknowledge?.();
    dismiss?.();
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-start gap-3 pr-10">
          <div
            className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white/70 shadow-inner"
            style={{ color: config.accent }}
          >
            <StatusIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{config.label}</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {headline || defaultHeadlineForStatus(status)}
            </p>
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 text-slate-500">
                <ClockIcon className="h-4 w-4" aria-hidden="true" />
                <span>{relativeUpdated}</span>
              </span>
              {absoluteUpdated ? <span className="text-slate-400">{absoluteUpdated}</span> : null}
              {windowDetails ? (
                <span className="inline-flex items-center gap-1 text-indigo-600">
                  <SignalIcon className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {windowDetails.summary}
                    {windowDetails.dateLabel ? ` · ${windowDetails.dateLabel}` : ''}
                    {windowDetails.startLabel && windowDetails.endLabel
                      ? ` (${windowDetails.startLabel} – ${windowDetails.endLabel})`
                      : ''}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {services.length > 0 ? (
        <section className="rounded-2xl border border-white/60 bg-white/75 px-4 py-3 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impacted services</p>
          <ul className="mt-3 flex flex-col gap-3">
            {services.map((service) => (
              <li key={service.id} className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className={clsx('mt-1 h-2.5 w-2.5 flex-none rounded-full',
                      SERVICE_STATUS_CONFIG[service.status]?.dot || SERVICE_STATUS_CONFIG.investigating.dot)}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{service.name}</p>
                    {service.impact ? <p className="mt-1 text-xs text-slate-500">{service.impact}</p> : null}
                  </div>
                </div>
                <aside className="flex flex-col items-end gap-1 text-right text-xs text-slate-500">
                  <span>{SERVICE_STATUS_CONFIG[service.status]?.label ?? 'Investigating'}</span>
                  {service.eta ? (
                    <span className="font-medium text-slate-600">ETA {formatRelativeTime(service.eta, { numeric: 'auto' })}</span>
                  ) : null}
                  {typeof service.confidence === 'number' ? (
                    <ConfidenceMeter value={service.confidence} />
                  ) : null}
                </aside>
              </li>
            ))}
            {overflowCount > 0 ? (
              <li className="text-xs font-medium text-slate-500">+{overflowCount} additional services monitored</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <footer className="flex flex-wrap items-center gap-2">
        {statusPageUrl ? (
          <a
            href={statusPageUrl}
            onClick={handleView}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            View status page
            <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : (
          <button
            type="button"
            onClick={handleView}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Open incident log
          </button>
        )}
        <button
          type="button"
          onClick={handleAcknowledge}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Acknowledge
        </button>
      </footer>
    </div>
  );
}

SystemStatusToast.propTypes = {
  status: PropTypes.oneOf(['operational', 'degraded', 'outage', 'maintenance']),
  headline: PropTypes.string,
  description: PropTypes.string,
  impactedServices: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
          service: PropTypes.string,
          status: PropTypes.string,
          impact: PropTypes.string,
          description: PropTypes.string,
          summary: PropTypes.string,
          eta: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
          recoveryEta: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
          nextUpdateAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
          confidence: PropTypes.number,
        }),
      ]),
    ),
    PropTypes.shape({}),
  ]),
  maintenanceWindow: PropTypes.shape({
    startsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
    endsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
    timezone: PropTypes.string,
    summary: PropTypes.string,
  }),
  updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
  statusPageUrl: PropTypes.string,
  onViewDetails: PropTypes.func,
  onAcknowledge: PropTypes.func,
  dismiss: PropTypes.func,
  analyticsContext: PropTypes.object,
};

SystemStatusToast.defaultProps = {
  status: 'operational',
  headline: undefined,
  description: undefined,
  impactedServices: undefined,
  maintenanceWindow: undefined,
  updatedAt: undefined,
  statusPageUrl: undefined,
  onViewDetails: undefined,
  onAcknowledge: undefined,
  dismiss: undefined,
  analyticsContext: undefined,
};

function ConfidenceMeter({ value }) {
  const percentage = Math.round(clamp(value, 0, 1) * 100);
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-500">
      <span>Confidence</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="tabular-nums text-slate-600">{percentage}%</span>
    </div>
  );
}

ConfidenceMeter.propTypes = {
  value: PropTypes.number.isRequired,
};

function defaultHeadlineForStatus(status) {
  switch (status) {
    case 'degraded':
      return 'We’re seeing degraded performance';
    case 'outage':
      return 'An outage is impacting service availability';
    case 'maintenance':
      return 'Planned maintenance is underway';
    default:
      return 'All systems operational';
  }
}

export function createSystemStatusToastPayload(props = {}) {
  const config = STATUS_CONFIG[props.status] ?? STATUS_CONFIG.operational;
  return {
    id: props.id,
    tone: config.tone,
    accent: config.accent,
    duration: props.duration ?? 14000,
    content: ({ dismiss }) => <SystemStatusToast {...props} dismiss={dismiss} />,
  };
}

export default SystemStatusToast;
