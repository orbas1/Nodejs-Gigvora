import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  CheckBadgeIcon,
  ShieldExclamationIcon,
  SignalSlashIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';
import { formatRelativeTime } from '../../utils/date.js';

const STATUS_CONFIG = {
  operational: {
    label: 'Operational',
    description: 'All systems nominal',
    Icon: CheckBadgeIcon,
    gradient: 'from-emerald-500/25 via-emerald-500/10 to-slate-950/95',
    chipTone: 'bg-emerald-500/20 text-emerald-100',
    accentColor: '#22c55e',
    severity: 'low',
  },
  degraded: {
    label: 'Degraded performance',
    description: 'Performance dip detected',
    Icon: SignalSlashIcon,
    gradient: 'from-amber-400/30 via-amber-400/15 to-slate-950/95',
    chipTone: 'bg-amber-400/20 text-amber-100',
    accentColor: '#f59e0b',
    severity: 'medium',
  },
  maintenance: {
    label: 'Scheduled maintenance',
    description: 'Planned downtime window',
    Icon: WrenchScrewdriverIcon,
    gradient: 'from-sky-400/25 via-sky-400/10 to-slate-950/95',
    chipTone: 'bg-sky-400/20 text-sky-100',
    accentColor: '#38bdf8',
    severity: 'notice',
  },
  incident: {
    label: 'Incident update',
    description: 'Active investigation underway',
    Icon: BoltIcon,
    gradient: 'from-violet-500/25 via-violet-500/10 to-slate-950/95',
    chipTone: 'bg-violet-500/20 text-violet-100',
    accentColor: '#8b5cf6',
    severity: 'high',
  },
  outage: {
    label: 'Service disruption',
    description: 'Critical outage impacting users',
    Icon: ShieldExclamationIcon,
    gradient: 'from-rose-500/30 via-rose-500/15 to-slate-950/95',
    chipTone: 'bg-rose-500/20 text-rose-100',
    accentColor: '#f43f5e',
    severity: 'critical',
  },
};

const ACTION_VARIANTS = {
  primary: 'bg-white/90 text-slate-900 hover:bg-white focus-visible:ring-white',
  secondary: 'bg-transparent text-white ring-1 ring-white/50 hover:bg-white/10 focus-visible:ring-white',
  ghost: 'bg-transparent text-white/80 hover:bg-white/10 focus-visible:ring-white/70',
};

function normaliseActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }
  return actions
    .filter((action) => action && typeof action.label === 'string')
    .map((action, index) => ({
      id: action.id ?? `${action.label}-${index}`,
      variant: action.variant ?? 'primary',
      ...action,
    }));
}

function formatMeta(meta) {
  if (!Array.isArray(meta)) {
    return [];
  }
  return meta
    .filter((item) => item && typeof item.label === 'string' && typeof item.value === 'string')
    .map((item, index) => ({
      id: item.id ?? `${item.label}-${index}`,
      ...item,
    }));
}

function resolveStatus(status) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.operational;
}

function buildDefaultTitle(status) {
  const config = resolveStatus(status);
  return config.description;
}

function buildRelativeTimestamp(timestamp, reference) {
  if (!timestamp) {
    return '';
  }
  return formatRelativeTime(timestamp, reference ? { now: reference } : undefined);
}

function renderAction(action, accentColor) {
  const { id, label, href, onClick, variant, icon: ActionIcon } = action;
  const variantClass = ACTION_VARIANTS[variant] ?? ACTION_VARIANTS.primary;
  const sharedProps = {
    className: clsx(
      'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
      variantClass,
    ),
    style: { '--toast-accent': accentColor },
  };

  const content = (
    <>
      {ActionIcon ? <ActionIcon className="h-4 w-4" aria-hidden="true" /> : null}
      <span>{label}</span>
      {href ? <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" /> : null}
    </>
  );

  if (href) {
    return (
      <a key={id} {...sharedProps} href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }
  return (
    <button key={id} {...sharedProps} type="button" onClick={onClick}>
      {content}
    </button>
  );
}

export default function SystemStatusToast({
  status,
  title,
  message,
  timestamp,
  impactedServices,
  meta,
  nextSteps,
  actions,
  acknowledgeLabel,
  onAcknowledge,
  onDismiss,
  dismissLabel = 'Dismiss notification',
  className,
  analyticsContext,
  referenceTime,
}) {
  const config = useMemo(() => resolveStatus(status), [status]);
  const accentColor = config.accentColor;
  const safeActions = useMemo(() => normaliseActions(actions), [actions]);
  const safeMeta = useMemo(() => formatMeta(meta), [meta]);
  const stepList = Array.isArray(nextSteps)
    ? nextSteps.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
  const services = Array.isArray(impactedServices)
    ? impactedServices.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];

  const [relativeTime, setRelativeTime] = useState(() => buildRelativeTimestamp(timestamp, referenceTime));

  useEffect(() => {
    setRelativeTime(buildRelativeTimestamp(timestamp, referenceTime));
    if (!timestamp) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setRelativeTime(buildRelativeTimestamp(timestamp, referenceTime));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [timestamp, referenceTime]);

  useEffect(() => {
    analytics?.track?.('system_status_toast_viewed', {
      status: config.label,
      severity: config.severity,
      hasActions: safeActions.length > 0,
      hasNextSteps: stepList.length > 0,
      impactedServices: services.length,
      ...analyticsContext,
    });
  }, [analyticsContext, config.label, config.severity, safeActions.length, services.length, stepList.length]);

  const resolvedTitle = title ?? buildDefaultTitle(status);

  return (
    <section
      aria-live="polite"
      className={clsx(
        'relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br p-6 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur',
        config.gradient,
        className,
      )}
      style={{ '--toast-accent': accentColor }}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" aria-hidden="true" />
      <header className="flex items-start justify-between gap-6">
        <div className="flex flex-1 items-start gap-4">
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/20">
            <config.Icon className="h-7 w-7" aria-hidden="true" />
            <span className="absolute -bottom-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--toast-accent)] shadow-[0_0_0_3px_rgba(15,23,42,0.8)]" />
          </span>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">System status</p>
            <h3 className="text-lg font-semibold leading-tight text-white">{resolvedTitle}</h3>
            {message ? <p className="text-sm text-white/80">{message}</p> : null}
          </div>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{dismissLabel}</span>
          </button>
        ) : null}
      </header>

      {services.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {services.map((service) => (
            <span key={service} className={clsx('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', config.chipTone)}>
              {service}
            </span>
          ))}
        </div>
      ) : null}

      {stepList.length ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Next steps</p>
          <ul className="mt-3 space-y-2 text-sm text-white/85">
            {stepList.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <SparklesIcon className="mt-0.5 h-4 w-4 flex-none text-white/60" aria-hidden="true" />
                <span>
                  <span className="mr-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {step}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {safeMeta.length ? (
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          {safeMeta.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">{item.label}</dt>
              <dd className="mt-2 text-sm font-semibold text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white/70">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--toast-accent)] shadow-[0_0_0_4px_rgba(15,23,42,0.6)]" />
            <span>{relativeTime ? `Updated ${relativeTime}` : 'Updating now'}</span>
          </span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60">
            {config.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {safeActions.map((action) => renderAction(action, accentColor))}
          {acknowledgeLabel && onAcknowledge ? (
            <button
              type="button"
              onClick={onAcknowledge}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              <span>{acknowledgeLabel}</span>
            </button>
          ) : null}
        </div>
      </footer>
    </section>
  );
}

SystemStatusToast.propTypes = {
  status: PropTypes.oneOf(['operational', 'degraded', 'maintenance', 'incident', 'outage']).isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  impactedServices: PropTypes.arrayOf(PropTypes.string),
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ),
  nextSteps: PropTypes.arrayOf(PropTypes.string),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      onClick: PropTypes.func,
      variant: PropTypes.oneOf(['primary', 'secondary', 'ghost']),
      icon: PropTypes.elementType,
    }),
  ),
  acknowledgeLabel: PropTypes.string,
  onAcknowledge: PropTypes.func,
  onDismiss: PropTypes.func,
  dismissLabel: PropTypes.string,
  className: PropTypes.string,
  analyticsContext: PropTypes.object,
  referenceTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
};

