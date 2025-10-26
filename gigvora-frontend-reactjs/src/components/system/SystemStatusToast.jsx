import PropTypes from 'prop-types';
import {
  BoltIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  SignalIcon,
  UserCircleIcon,
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

function formatTimestamp(value) {
  if (!value) return 'TBC';
  try {
    const date = typeof value === 'string' ? parseISO(value) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'TBC';
    }
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    return 'TBC';
  }
}

function formatWindowRange(windowDetails) {
  if (!windowDetails) return null;
  const { startAt, endAt, region } = windowDetails;
  const start = formatTimestamp(startAt);
  const end = formatTimestamp(endAt);
  const label = region ? `${region} · ${start} → ${end}` : `${start} → ${end}`;
  return label;
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
  const channels = Array.isArray(status.channels) ? status.channels : [];
  const metrics = status.metrics ?? {};
  const broadcasts = Array.isArray(status.broadcasts) ? status.broadcasts : [];
  const escalationContacts = Array.isArray(status.escalationContacts) ? status.escalationContacts : [];
  const nextSteps = Array.isArray(status.nextSteps) ? status.nextSteps : [];
  const maintenanceWindow = status.window ?? null;
  const nextUpdate = status.nextUpdateDue ?? status.nextUpdateAt ?? null;

  return (
    <aside
      className="pointer-events-auto w-full max-w-xl rounded-3xl border border-white/20 bg-slate-900/95 p-6 shadow-[0_25px_65px_-30px_rgba(15,23,42,0.75)] backdrop-blur-xl"
      role="status"
      aria-live="polite"
    >
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
        <MetricCard
          label="SLO target"
          value={metrics.sloTarget ? `${metrics.sloTarget.toFixed(2)}%` : '99.95%'}
        />
        <MetricCard
          label="Users impacted"
          value={typeof metrics.usersImpacted === 'number' ? metrics.usersImpacted.toLocaleString() : 'Minimal'}
        />
        <MetricCard
          label="Next update"
          value={nextUpdate ? formatDuration(nextUpdate) : 'Within 15 minutes'}
        />
        <MetricCard
          label="Escalations open"
          value={typeof metrics.escalationsOpen === 'number' ? metrics.escalationsOpen : escalationContacts.length}
        />
      </dl>

      {maintenanceWindow ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
          <p className="flex items-center gap-2 font-semibold uppercase tracking-wide text-slate-300">
            <CalendarDaysIcon className="h-4 w-4 text-slate-200" aria-hidden="true" />
            Scheduled window
          </p>
          <p className="mt-2 text-sm text-white">{maintenanceWindow.title}</p>
          <p className="mt-1 text-slate-300">{formatWindowRange(maintenanceWindow)}</p>
          {maintenanceWindow.owner ? (
            <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-200">
              <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
              {maintenanceWindow.owner}
            </p>
          ) : null}
          {maintenanceWindow.summary ? (
            <p className="mt-2 text-slate-300">{maintenanceWindow.summary}</p>
          ) : null}
        </div>
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

      {channels.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Broadcast channels</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {channels.map((channel) => (
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

      {broadcasts.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Broadcast log</p>
          <ul className="mt-2 space-y-2">
            {broadcasts.map((broadcast) => (
              <li
                key={broadcast.id || broadcast.channel}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
              >
                <MegaphoneIcon className="mt-0.5 h-4 w-4 text-slate-300" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">{broadcast.channel}</p>
                  <p className="text-slate-300">
                    {broadcast.status || 'Ready'} · Sent {formatDuration(broadcast.sentAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {escalationContacts.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Escalation contacts</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {escalationContacts.map((contact) => (
              <div
                key={contact.id || contact.team || contact.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200"
              >
                <p className="flex items-center gap-2 font-semibold text-white">
                  <UserCircleIcon className="h-4 w-4 text-slate-200" aria-hidden="true" />
                  {contact.name || contact.team}
                </p>
                {contact.team ? (
                  <p className="mt-1 text-slate-300">{contact.team}</p>
                ) : null}
                {contact.channel ? (
                  <p className="mt-1 text-slate-300">{contact.channel}</p>
                ) : null}
                {contact.onCall ? (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-200">
                    <CheckBadgeIcon className="h-4 w-4" aria-hidden="true" /> On call
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {nextSteps.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next actions</p>
          <ul className="mt-3 space-y-2">
            {nextSteps.map((step) => (
              <li
                key={step.id || step.label}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-200"
              >
                <ClockIcon className="mt-0.5 h-4 w-4 text-slate-300" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">{step.label}</p>
                  {step.description ? <p className="text-slate-300">{step.description}</p> : null}
                  {step.href ? (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-sky-200 transition hover:text-sky-100"
                    >
                      Open detail
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
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
      sloTarget: PropTypes.number,
      usersImpacted: PropTypes.number,
      escalationsOpen: PropTypes.number,
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
    broadcasts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        channel: PropTypes.string.isRequired,
        status: PropTypes.string,
        sentAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      }),
    ),
    escalationContacts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        team: PropTypes.string,
        channel: PropTypes.string,
        onCall: PropTypes.bool,
      }),
    ),
    nextSteps: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string.isRequired,
        description: PropTypes.string,
        href: PropTypes.string,
      }),
    ),
    window: PropTypes.shape({
      title: PropTypes.string,
      startAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      endAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      region: PropTypes.string,
      owner: PropTypes.string,
      summary: PropTypes.string,
    }),
    nextUpdateDue: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    nextUpdateAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }).isRequired,
  onAcknowledge: PropTypes.func,
  onViewIncidents: PropTypes.func,
  onViewRunbook: PropTypes.func,
  onDismiss: PropTypes.func,
};

SystemStatusToast.defaultProps = {
  onAcknowledge: undefined,
  onViewIncidents: undefined,
  onViewRunbook: undefined,
  onDismiss: undefined,
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
