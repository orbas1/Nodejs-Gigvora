import {
  ArrowPathIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  InboxArrowDownIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';

function formatNumber(value, fractionDigits = 0) {
  if (value == null) {
    return '0';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: fractionDigits }).format(numeric);
}

function formatPercent(value) {
  if (value == null) {
    return '0%';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${(numeric * 100).toFixed(1)}%`;
}

function formatDateTime(timestamp) {
  if (!timestamp) {
    return '—';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

const INCIDENT_STYLES = {
  critical: 'border-red-200 bg-red-50 text-red-700',
  elevated: 'border-amber-200 bg-amber-50 text-amber-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  normal: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function IncidentBanner({ incidentSignals, refreshing }) {
  const severity = incidentSignals?.severity ?? 'normal';
  const notes = Array.isArray(incidentSignals?.notes) ? incidentSignals.notes : [];
  const style = INCIDENT_STYLES[severity] ?? INCIDENT_STYLES.normal;

  return (
    <div className={classNames('rounded-3xl border p-5 shadow-sm transition', style)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SignalIcon className="h-5 w-5" />
          <span>Incident posture</span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide">
          {refreshing ? 'Refreshing…' : severity.toUpperCase()}
        </span>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {notes.length === 0 ? <li>No active alerts. Live services are performing within thresholds.</li> : null}
        {notes.map((note) => (
          <li key={note} className="leading-snug">
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <Icon className="h-5 w-5 text-slate-500" />
        {title}
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function TrendList({ title, items, emptyLabel = 'No data available.' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {items?.length ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {items.map((item) => (
            <li key={`${item.eventName}-${item.count}`} className="flex items-center justify-between">
              <span className="truncate pr-3">{item.eventName}</span>
              <span className="font-semibold text-slate-900">{formatNumber(item.count)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{emptyLabel}</p>
      )}
    </div>
  );
}

function ChannelTable({ channels }) {
  if (!channels?.length) {
    return <p className="text-sm text-slate-500">No channel activity captured in the selected window.</p>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-2 text-left font-semibold">
              Channel
            </th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">
              Messages
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {channels.slice(0, 6).map((channel) => (
            <tr key={`${channel.threadId}-${channel.channelSlug ?? channel.channelName}`}>
              <td className="px-4 py-2">
                <p className="font-semibold text-slate-700">{channel.channelName}</p>
                {channel.channelSlug ? (
                  <p className="text-xs text-slate-500">#{channel.channelSlug}</p>
                ) : null}
              </td>
              <td className="px-4 py-2 text-right font-semibold text-slate-700">{formatNumber(channel.messageCount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpcomingEvents({ events }) {
  if (!events?.length) {
    return <p className="text-sm text-slate-500">No upcoming events scheduled within the sampling window.</p>;
  }
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">{event.title}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {event.status?.replaceAll('_', ' ')} · {event.format}
              </p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>{formatDateTime(event.startAt)}</p>
              <p className="text-xs text-slate-500">Commitment {formatPercent(event.commitmentRate)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RunbookList({ runbooks }) {
  if (!runbooks?.length) {
    return <p className="text-sm text-slate-500">No runbooks tagged to live services yet.</p>;
  }
  return (
    <div className="space-y-3">
      {runbooks.map((runbook) => (
        <a
          key={runbook.slug}
          href={runbook.url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:border-accent hover:bg-accent/5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">{runbook.title}</p>
              <p className="mt-1 text-sm text-slate-600">{runbook.summary}</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {runbook.channel}
            </span>
          </div>
          {runbook.csatImpact ? (
            <p className="mt-2 text-xs text-slate-500">Impact: {runbook.csatImpact}</p>
          ) : null}
        </a>
      ))}
    </div>
  );
}

export default function LiveServiceTelemetryPanel({ telemetry, loading, error, refreshing, lastUpdated, onRefresh }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Live service telemetry</h2>
          <p className="mt-1 text-sm text-slate-600">
            Aggregated visibility across timeline publishing, community chat, inbox operations, and live events.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {lastUpdated ? <span>Updated {formatDateTime(lastUpdated)}</span> : null}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowPathIcon className={classNames('h-4 w-4', refreshing ? 'animate-spin' : '')} /> Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {!loading && telemetry ? (
        <div className="mt-6 space-y-6">
          <IncidentBanner incidentSignals={telemetry.incidentSignals} refreshing={refreshing} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Timeline"
              value={formatNumber(telemetry.timeline?.windowPublished ?? 0)}
              description={`${formatNumber(telemetry.timeline?.scheduledNextHour ?? 0)} scheduled in the next hour`}
              icon={BoltIcon}
            />
            <SummaryCard
              title="Community chat"
              value={formatNumber(telemetry.chat?.totalMessages ?? 0)}
              description={`${formatPercent(telemetry.chat?.flaggedRatio ?? 0)} flagged for moderation`}
              icon={ChatBubbleBottomCenterTextIcon}
            />
            <SummaryCard
              title="Support inbox"
              value={formatNumber(telemetry.inbox?.openCases ?? 0)}
              description={`${formatNumber(telemetry.inbox?.awaitingFirstResponse ?? 0)} awaiting first response`}
              icon={InboxArrowDownIcon}
            />
            <SummaryCard
              title="Events & sessions"
              value={formatNumber(telemetry.events?.liveNow ?? 0)}
              description={`${formatNumber(telemetry.events?.startingSoon ?? 0)} starting shortly`}
              icon={CalendarDaysIcon}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TrendList title="Trending timeline events" items={telemetry.timeline?.trendingEvents ?? []} />
            <TrendList
              title="Top telemetry events"
              items={telemetry.analytics?.topEvents ?? []}
              emptyLabel="Analytics exporter has not recorded events in this window."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                Channel load
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Sampling {formatNumber(telemetry.chat?.sampleSize ?? 0)} of {formatNumber(telemetry.chat?.totalMessages ?? 0)}
                messages to keep dashboards responsive.
              </p>
              <div className="mt-4">
                <ChannelTable channels={telemetry.chat?.busiestChannels ?? []} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <InboxArrowDownIcon className="h-5 w-5" />
                Support backlog
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {Object.entries(telemetry.inbox?.backlogByPriority ?? {}).map(([priority, count]) => (
                  <div key={priority} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{priority}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(count)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Median first response: {formatNumber(telemetry.inbox?.medianFirstResponseMinutes ?? 0, 1)} minutes. Escalations in
                window: {formatNumber(telemetry.inbox?.escalationsLastWindow ?? 0)}.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarDaysIcon className="h-5 w-5" />
                Upcoming sessions
              </div>
              <div className="mt-4">
                <UpcomingEvents events={telemetry.events?.upcoming ?? []} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ClipboardDocumentListIcon className="h-5 w-5" />
                Runbook alignment
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Reference the linked playbooks when telemetry flags escalate beyond comfort thresholds.
              </p>
              <div className="mt-4">
                <RunbookList runbooks={telemetry.runbooks ?? []} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
