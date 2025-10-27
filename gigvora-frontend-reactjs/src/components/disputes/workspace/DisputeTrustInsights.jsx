import PropTypes from 'prop-types';
import {
  BoltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../../utils/classNames.js';
import { formatAbsolute, formatRelativeTime } from '../../../utils/date.js';

function formatMinutes(minutes) {
  if (typeof minutes !== 'number' || Number.isNaN(minutes)) return null;
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  if (remaining === 0) {
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }
  return `${hours} hr${hours === 1 ? '' : 's'} ${remaining} min`;
}

function formatCurrency(amount, currency) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return null;
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `${amount.toLocaleString()} ${currency || ''}`.trim();
  }
}

function describeTrust(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 'Trust monitoring active across open disputes.';
  }
  if (score >= 85) return 'High trust driven by fast, transparent resolutions.';
  if (score >= 70) return 'Solid footing—monitor flagged cases to protect momentum.';
  return 'Confidence slipping. Escalate high-risk cases before reputational cost rises.';
}

function trustTone(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'bg-white/10 text-white';
  if (score >= 85) return 'bg-emerald-400/20 text-white';
  if (score >= 70) return 'bg-amber-400/20 text-white';
  return 'bg-rose-400/30 text-white';
}

const alertTone = {
  critical: 'bg-rose-500/20 text-rose-100 border border-rose-300/50',
  high: 'bg-rose-500/20 text-rose-100 border border-rose-300/40',
  medium: 'bg-amber-500/20 text-amber-100 border border-amber-300/40',
  low: 'bg-emerald-500/15 text-emerald-100 border border-emerald-300/30',
};

function AlertPill({ severity, children }) {
  const tone = alertTone[severity] ?? 'bg-slate-500/20 text-white border border-white/10';
  const label = severity ? severity.toUpperCase() : 'INFO';
  return (
    <span className={classNames('inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', tone)}>
      {label}
      {children ? <span className="ml-2 normal-case font-medium tracking-normal">{children}</span> : null}
    </span>
  );
}

AlertPill.propTypes = {
  severity: PropTypes.string,
  children: PropTypes.node,
};

export default function DisputeTrustInsights({ summary }) {
  const trustScore = typeof summary?.trustScore === 'number' ? Math.round(summary.trustScore) : null;
  const resolutionRate = typeof summary?.resolutionRate === 'number' ? Math.round(summary.resolutionRate * 100) : null;
  const firstResponse = formatMinutes(summary?.averageFirstResponseMinutes);
  const autoEscalationRate = typeof summary?.autoEscalationRate === 'number'
    ? Math.round(summary.autoEscalationRate * 100)
    : null;
  const deadlines = Array.isArray(summary?.upcomingDeadlines)
    ? summary.upcomingDeadlines.slice(0, 3)
    : [];
  const alerts = Array.isArray(summary?.riskAlerts) ? summary.riskAlerts.slice(0, 3) : [];
  const openExposure = summary?.openExposure ?? null;
  const nextReview = summary?.nextSlaReviewAt ?? null;

  return (
    <section className="flex h-full flex-col justify-between rounded-3xl border border-indigo-300/50 bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Trust posture</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold">{trustScore != null ? trustScore : '—'}</span>
            <span className="text-sm font-semibold uppercase tracking-widest text-white/60">/100</span>
          </div>
          <p className="max-w-sm text-sm text-white/80">{describeTrust(trustScore)}</p>
        </div>
        <div className="space-y-3 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
            <span>{resolutionRate != null ? `${resolutionRate}% resolution rate in the last quarter.` : 'Resolution rate calibrating.'}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-white" aria-hidden="true" />
            <span>{firstResponse ? `First responses landing in ${firstResponse}.` : 'Awaiting first-response telemetry.'}</span>
          </div>
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-white" aria-hidden="true" />
            <span>
              {autoEscalationRate != null
                ? `${autoEscalationRate}% of cases auto-escalated to specialist review.`
                : 'Auto-escalation cadence standing by for the next review.'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Upcoming deadlines</p>
            {nextReview ? (
              <span className="text-xs text-white/60">Next SLA review {formatAbsolute(nextReview)}</span>
            ) : null}
          </div>
          <ul className="mt-4 space-y-3 text-sm text-white/90">
            {deadlines.length ? (
              deadlines.map((deadline) => (
                <li key={deadline.id ?? deadline.disputeId ?? deadline.summary} className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{deadline.summary ?? `Dispute #${deadline.disputeId}`}</p>
                    <p className="text-xs text-white/60">Case #{deadline.disputeId ?? '—'}</p>
                  </div>
                  <div className="text-right text-xs text-white/70">
                    <p className="text-sm font-semibold text-white">{deadline.dueAt ? formatAbsolute(deadline.dueAt) : 'Date pending'}</p>
                    {deadline.dueAt ? <p>{formatRelativeTime(deadline.dueAt)}</p> : null}
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-2xl bg-white/5 px-3 py-3 text-sm text-white/70">No deadlines in the next 7 days.</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Risk watchlist</p>
            {openExposure?.amount != null ? (
              <span className="text-xs text-white/60">
                Exposure {formatCurrency(openExposure.amount, openExposure.currency)}
              </span>
            ) : null}
          </div>
          <ul className="mt-4 space-y-3 text-sm text-white/90">
            {alerts.length ? (
              alerts.map((alert, index) => (
                <li
                  key={alert.id ?? alert.disputeId ?? index}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{alert.title ?? alert.summary ?? 'Investigation required'}</p>
                    {alert.summary ? <p className="text-xs text-white/70">{alert.summary}</p> : null}
                    {alert.disputeId ? (
                      <p className="text-[11px] uppercase tracking-wide text-white/50">Case #{alert.disputeId}</p>
                    ) : null}
                  </div>
                  <AlertPill severity={alert.severity}>{alert.owner ? `@${alert.owner}` : null}</AlertPill>
                </li>
              ))
            ) : (
              <li className="rounded-2xl bg-white/5 px-3 py-3 text-sm text-white/70">
                No active risk alerts—keep sharing proactive updates to maintain trust.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className={classNames('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', trustTone(trustScore))}>
          Confidence {trustScore != null ? `${trustScore}/100` : 'Calibrating'}
        </span>
        {summary?.slaBreaches != null ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
            {summary.slaBreaches} SLA {summary.slaBreaches === 1 ? 'breach' : 'breaches'} this quarter
          </span>
        ) : null}
      </div>
    </section>
  );
}

DisputeTrustInsights.propTypes = {
  summary: PropTypes.shape({
    trustScore: PropTypes.number,
    resolutionRate: PropTypes.number,
    averageFirstResponseMinutes: PropTypes.number,
    autoEscalationRate: PropTypes.number,
    slaBreaches: PropTypes.number,
    nextSlaReviewAt: PropTypes.string,
    openExposure: PropTypes.shape({
      amount: PropTypes.number,
      currency: PropTypes.string,
    }),
    upcomingDeadlines: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        disputeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        summary: PropTypes.string,
        dueAt: PropTypes.string,
      }),
    ),
    riskAlerts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        disputeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        summary: PropTypes.string,
        severity: PropTypes.string,
        owner: PropTypes.string,
      }),
    ),
  }),
};

DisputeTrustInsights.defaultProps = {
  summary: {},
};
