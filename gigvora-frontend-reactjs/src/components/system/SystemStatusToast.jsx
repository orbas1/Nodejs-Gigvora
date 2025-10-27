import PropTypes from 'prop-types';
import {
  BoltIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SignalIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';

const severityTokens = {
  operational: {
    label: 'Operational',
    badgeClass: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40',
    iconClass: 'text-emerald-200',
  },
  notice: {
    label: 'Notice',
    badgeClass: 'bg-sky-500/10 text-sky-200 border-sky-400/40',
    iconClass: 'text-sky-200',
  },
  minor: {
    label: 'Partial outage',
    badgeClass: 'bg-amber-500/10 text-amber-200 border-amber-400/40',
    iconClass: 'text-amber-200',
  },
  major: {
    label: 'Major outage',
    badgeClass: 'bg-orange-500/10 text-orange-200 border-orange-400/40',
    iconClass: 'text-orange-200',
  },
  critical: {
    label: 'Critical incident',
    badgeClass: 'bg-rose-500/10 text-rose-200 border-rose-400/40',
    iconClass: 'text-rose-200',
  },
};

function formatDuration(value) {
  if (!value) return 'Moments ago';
  try {
    const date = typeof value === 'string' ? parseISO(value) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Moments ago';
    }
    return `${formatDistanceToNowStrict(date, { addSuffix: true })}`;
  } catch (error) {
    return 'Moments ago';
  }
}

function formatDateTime(value) {
  if (!value) {
    return 'TBC';
  }
  try {
    const date = typeof value === 'string' ? parseISO(value) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'TBC';
    }
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch (error) {
    return 'TBC';
  }
}

function clampPercentage(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return Math.min(Math.max(value, 0), 100);
}

export default function SystemStatusToast({
  status,
  onAcknowledge,
  onViewIncidents,
  onViewRunbook,
  onDismiss,
}) {
  const severity = severityTokens[status.severity] ?? severityTokens.notice;
  const incidents = Array.isArray(status.incidents) ? status.incidents : [];
  const baseChannels = Array.isArray(status.channels) ? status.channels : [];
  const metrics = status.metrics ?? {};
  const windowMeta = status.window ?? null;
  const warnings = Array.isArray(status.warnings) ? status.warnings : [];
  const escalations = Array.isArray(status.escalations) ? status.escalations : [];
  const feedback = status.feedback ?? null;
  const lastBroadcast = status.lastBroadcast ?? null;
  const broadcastChannels = Array.isArray(lastBroadcast?.channels) && lastBroadcast.channels.length
    ? lastBroadcast.channels
    : baseChannels;

  return (
    <aside className="pointer-events-auto w-full max-w-xl rounded-3xl border border-white/20 bg-slate-900/95 p-6 shadow-[0_25px_65px_-30px_rgba(15,23,42,0.75)] backdrop-blur-xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${severity.badgeClass}`}
          >
            <SignalIcon className={`h-4 w-4 ${severity.iconClass}`} aria-hidden="true" />
            {severity.label}
          </span>
          <h2 className="text-lg font-semibold text-white">{status.title}</h2>
          <p className="text-sm text-slate-300">{status.summary}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-400">
          <p>
            Updated {formatDuration(status.updatedAt)} ·{' '}
            <span className="text-slate-100">{status.impactSurface}</span>
          </p>
          {status.acknowledgedAt ? (
            <p className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-200">
              <CheckBadgeIcon className="h-4 w-4" aria-hidden="true" />
              Acknowledged by {status.acknowledgedBy || 'SRE'}
            </p>
          ) : (
            <p className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-200">
              <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
              Awaiting acknowledgement
            </p>
          )}
        </div>
      </header>

      <dl className="mt-5 grid gap-3 text-xs text-slate-200 sm:grid-cols-4">
        <MetricCard label="Uptime (30d)" value={metrics.uptime ? `${metrics.uptime.toFixed(3)}%` : '—'} />
        <MetricCard
          label="API latency p95"
          value={metrics.latencyP95 ? `${Math.round(metrics.latencyP95)} ms` : '—'}
        />
        <MetricCard
          label="Error rate"
          value={typeof metrics.errorRate === 'number' ? `${(metrics.errorRate * 100).toFixed(2)}%` : '—'}
        />
        <MetricCard
          label="Active incidents"
          value={metrics.activeIncidents ?? incidents.length ?? 0}
        />
      </dl>

      {lastBroadcast ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold uppercase tracking-[0.3em] text-white/60">Last broadcast</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/60">
              Fingerprint {lastBroadcast.fingerprint ?? '—'}
            </span>
          </header>
          {lastBroadcast.subject ? (
            <p className="mt-2 text-sm text-slate-200">{lastBroadcast.subject}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.65rem] uppercase tracking-[0.25em] text-white/40">
            {lastBroadcast.audience ? <span>Audience · {lastBroadcast.audience}</span> : null}
            {lastBroadcast.dispatchedAt ? (
              <span>Dispatched {formatDuration(lastBroadcast.dispatchedAt)}</span>
            ) : null}
            {lastBroadcast.dispatchedBy ? <span>By {lastBroadcast.dispatchedBy}</span> : null}
          </div>
        </section>
      ) : null}

      {windowMeta ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
          <header className="flex items-center justify-between gap-2">
            <p className="font-semibold uppercase tracking-[0.3em] text-white/60">Maintenance window</p>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/70">
              <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {windowMeta.phase ?? 'Scheduled'}
            </span>
          </header>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <WindowMeta label="Starts" value={formatDateTime(windowMeta.startAt)} />
            <WindowMeta label="Ends" value={formatDateTime(windowMeta.endAt)} />
            <WindowMeta
              label="Time to action"
              value={windowMeta.phase === 'active' ? formatDuration(windowMeta.endAt) : formatDuration(windowMeta.startAt)}
            />
          </dl>
          {windowMeta.label ? (
            <p className="mt-3 text-[0.7rem] uppercase tracking-[0.25em] text-white/50">{windowMeta.label}</p>
          ) : null}
          {windowMeta.timezone ? (
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.25em] text-white/40">Timezone · {windowMeta.timezone}</p>
          ) : null}
        </section>
      ) : null}

      {incidents.length > 0 ? (
        <div className="mt-6 space-y-3">
          {incidents.map((incident) => (
            <article
              key={incident.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{incident.title}</p>
                  <p className="text-xs text-slate-400">
                    {incident.status} · {formatDuration(incident.startedAt)}
                  </p>
                </div>
                {incident.link ? (
                  <a
                    href={incident.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold uppercase tracking-wide text-sky-200 transition hover:text-sky-100"
                  >
                    View timeline
                  </a>
                ) : null}
              </div>
              {incident.summary ? (
                <p className="mt-2 text-xs text-slate-300">{incident.summary}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/80">Operational warnings</p>
          <div className="space-y-2">
            {warnings.map((warning) => {
              const key = warning?.id || warning?.message || warning;
              const message = warning?.message ?? warning;
              const actionLabel = warning?.actionLabel;
              const actionLink = warning?.actionLink;
              return (
                <div
                  key={key}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100"
                >
                  <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="flex-1 text-left">{message}</span>
                  {actionLabel && actionLink ? (
                    <a
                      href={actionLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-200/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-200/20"
                    >
                      {actionLabel}
                      <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {escalations.length > 0 ? (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Escalation checklist</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {escalations.map((item) => (
              <article
                key={item.id || item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200"
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    {item.owner ? (
                      <p className="text-[0.7rem] uppercase tracking-[0.25em] text-white/50">Owner · {item.owner}</p>
                    ) : null}
                  </div>
                  {item.dueAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/70">
                      Due {formatDuration(item.dueAt)}
                    </span>
                  ) : null}
                </header>
                {item.summary ? (
                  <p className="mt-3 text-xs text-slate-300">{item.summary}</p>
                ) : null}
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-sky-200 transition hover:text-sky-100"
                  >
                    Open artifact
                    <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {broadcastChannels.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Broadcast channels</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {broadcastChannels.map((channel) => (
              <span
                key={channel.id || channel}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
              >
                <BoltIcon className="h-4 w-4 text-slate-300" aria-hidden="true" />
                {channel.label || channel}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {feedback ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold uppercase tracking-[0.3em] text-white/60">Feedback pulse</p>
            <span className="text-[0.7rem] uppercase tracking-[0.25em] text-white/40">
              Updated {formatDuration(feedback.lastUpdated)}
            </span>
          </header>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <FeedbackMetric label="Experience score" value={feedback.experienceScore?.toFixed(1)} delta={feedback.trendDelta} />
            <FeedbackMetric
              label="Queue depth"
              value={`${feedback.queueDepth ?? '—'}`
              }
              target={feedback.queueTarget}
            />
            <FeedbackMetric
              label="Median response"
              value={feedback.medianResponseMinutes ? `${feedback.medianResponseMinutes}m` : '—'}
            />
          </div>
          {Array.isArray(feedback.alerts) && feedback.alerts.length > 0 ? (
            <div className="mt-3 space-y-2">
              {feedback.alerts.map((alert) => (
                <div
                  key={alert.id || alert.message}
                  className="flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[0.7rem] text-amber-100"
                >
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="flex-1">{alert.message}</span>
                </div>
              ))}
            </div>
          ) : null}
          {Array.isArray(feedback.responseBreakdown) && feedback.responseBreakdown.length > 0 ? (
            <div className="mt-4 space-y-2">
              {feedback.responseBreakdown.map((entry) => (
                <div key={entry.id || entry.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.25em] text-white/50">
                    <span>{entry.label}</span>
                    <span>
                      {(() => {
                        const percent = clampPercentage(entry.percentage);
                        return percent === null ? '—' : `${percent.toFixed(0)}%`;
                      })()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400/60"
                      style={{
                        width: `${(() => {
                          const percent = clampPercentage(entry.percentage);
                          return percent === null ? 0 : percent;
                        })()}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {feedback.sentimentNarrative ? (
            <p className="mt-4 text-xs text-slate-300">{feedback.sentimentNarrative}</p>
          ) : null}
          {feedback.reviewUrl ? (
            <a
              href={feedback.reviewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-sky-200 transition hover:text-sky-100"
            >
              Review full insights
              <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}
        </section>
      ) : null}

      <footer className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onViewIncidents}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/15"
        >
          Incident room
        </button>
        <button
          type="button"
          onClick={onViewRunbook}
          className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sky-100 transition hover:bg-sky-500/30"
        >
          Runbook
        </button>
        <button
          type="button"
          onClick={onAcknowledge}
          disabled={Boolean(status.acknowledgedAt)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            status.acknowledgedAt
              ? 'cursor-not-allowed bg-emerald-500/20 text-emerald-100'
              : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
          }`}
        >
          <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
          {status.acknowledgedAt ? 'Acknowledged' : 'Acknowledge'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:text-white"
        >
          Dismiss
        </button>
      </footer>
    </aside>
  );
}

SystemStatusToast.propTypes = {
  status: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(Object.keys(severityTokens)),
    impactSurface: PropTypes.string.isRequired,
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    acknowledgedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    acknowledgedBy: PropTypes.string,
    metrics: PropTypes.shape({
      uptime: PropTypes.number,
      latencyP95: PropTypes.number,
      errorRate: PropTypes.number,
      activeIncidents: PropTypes.number,
    }),
    incidents: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        startedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        summary: PropTypes.string,
        link: PropTypes.string,
      }),
    ),
    channels: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          id: PropTypes.string,
          label: PropTypes.string.isRequired,
        }),
      ]),
    ),
    lastBroadcast: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      fingerprint: PropTypes.string,
      subject: PropTypes.string,
      audience: PropTypes.string,
      channels: PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            id: PropTypes.string,
            label: PropTypes.string,
          }),
        ]),
      ),
      dispatchedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      dispatchedBy: PropTypes.string,
    }),
    window: PropTypes.shape({
      label: PropTypes.string,
      phase: PropTypes.string,
      startAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      endAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      timezone: PropTypes.string,
    }),
    warnings: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          id: PropTypes.string,
          message: PropTypes.string,
          actionLabel: PropTypes.string,
          actionLink: PropTypes.string,
        }),
      ]),
    ),
    escalations: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string.isRequired,
        owner: PropTypes.string,
        dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        link: PropTypes.string,
        summary: PropTypes.string,
      }),
    ),
    feedback: PropTypes.shape({
      experienceScore: PropTypes.number,
      trendDelta: PropTypes.number,
      queueDepth: PropTypes.number,
      queueTarget: PropTypes.number,
      medianResponseMinutes: PropTypes.number,
      lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      reviewUrl: PropTypes.string,
      alerts: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          message: PropTypes.string,
        }),
      ),
      responseBreakdown: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          label: PropTypes.string.isRequired,
          percentage: PropTypes.number,
        }),
      ),
      sentimentNarrative: PropTypes.string,
    }),
  }).isRequired,
  onAcknowledge: PropTypes.func,
  onViewIncidents: PropTypes.func,
  onViewRunbook: PropTypes.func,
  onDismiss: PropTypes.func,
};

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-white">{value}</dd>
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

function WindowMeta({ label, value }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}

WindowMeta.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

function FeedbackMetric({ label, value = '—', delta, target }) {
  const deltaValue = typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : null;
  const hasTarget = typeof target === 'number';
  let loadColour = 'text-white';
  if (hasTarget && typeof value === 'string') {
    const numeric = Number.parseFloat(value);
    if (!Number.isNaN(numeric)) {
      loadColour = numeric > target ? 'text-amber-200' : 'text-emerald-200';
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/50">{label}</dt>
      <dd className={`mt-1 flex items-baseline gap-2 text-lg font-semibold ${loadColour}`}>
        <span>{value ?? '—'}</span>
        {deltaValue ? <span className="text-sm text-emerald-200">{deltaValue}</span> : null}
        {hasTarget ? (
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/40">Target {target}</span>
        ) : null}
      </dd>
    </div>
  );
}

FeedbackMetric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  delta: PropTypes.number,
  target: PropTypes.number,
};

