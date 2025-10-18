import { ArrowPathIcon, ClockIcon, ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const numberFormatter = new Intl.NumberFormat('en-US');

const STATUS_DESCRIPTORS = {
  pending: { label: 'Pending intake', tone: 'bg-sky-100 text-sky-700' },
  submitted: { label: 'Submitted', tone: 'bg-blue-100 text-blue-700' },
  in_review: { label: 'In review', tone: 'bg-indigo-100 text-indigo-700' },
  verified: { label: 'Verified', tone: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', tone: 'bg-rose-100 text-rose-700' },
  expired: { label: 'Expired', tone: 'bg-slate-100 text-slate-600' },
};

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(Math.round(numeric));
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) {
    return '—';
  }
  if (seconds < 60) {
    return `${Math.max(1, Math.round(seconds))} sec`;
  }
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  }
  const hours = seconds / 3600;
  if (hours < 24) {
    return `${hours.toFixed(hours >= 10 ? 0 : 1)} hr`;
  }
  const days = hours / 24;
  return `${days.toFixed(days >= 10 ? 0 : 1)} d`;
}

function formatTimestamp(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function relativeTime(value) {
  if (!value) {
    return 'Unknown';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, 'minute');
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) {
    return rtf.format(hours, 'hour');
  }
  const days = Math.round(hours / 24);
  return rtf.format(days, 'day');
}

function buildStatusSummary(totals) {
  const statusCounts = totals?.byStatus ?? [];
  const summary = {
    pending: 0,
    submitted: 0,
    in_review: 0,
    verified: 0,
    rejected: 0,
    expired: 0,
  };
  statusCounts.forEach((item) => {
    if (!item || !item.status) return;
    const key = String(item.status).toLowerCase();
    if (summary[key] == null) {
      summary[key] = Number(item.count ?? 0) || 0;
    } else {
      summary[key] = Number(item.count ?? summary[key]) || 0;
    }
  });
  return summary;
}

export default function IdVerificationOverview({ overview, loading = false, onRefresh, onSelectVerification }) {
  const totals = overview?.totals ?? {};
  const statusSummary = buildStatusSummary(totals);
  const backlogCount = totals?.backlog ?? 0;
  const averageSeconds = overview?.metrics?.averageReviewSeconds ?? null;
  const providerTotals = Array.isArray(totals?.byProvider) ? totals.byProvider : [];
  const reviewerBreakdown = Array.isArray(overview?.reviewerBreakdown) ? overview.reviewerBreakdown : [];
  const recentActivity = Array.isArray(overview?.recentActivity) ? overview.recentActivity : [];
  const openQueue = Array.isArray(overview?.openQueue) ? overview.openQueue : [];

  return (
    <section id="idv-overview" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Overview</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={ShieldCheckIcon}
          tone="bg-sky-50"
          label="Pending intake"
          value={formatNumber(statusSummary.pending + statusSummary.submitted)}
          caption={`${formatNumber(totals?.openQueue ?? 0)} open in queue`}
        />
        <SummaryCard
          icon={ClockIcon}
          tone="bg-indigo-50"
          label="In review"
          value={formatNumber(statusSummary.in_review)}
          caption={`Avg review ${formatDuration(averageSeconds)}`}
        />
        <SummaryCard
          icon={ShieldCheckIcon}
          tone="bg-emerald-50"
          label="Verified in window"
          value={formatNumber(statusSummary.verified)}
          caption={`${formatNumber(totals?.autoApproved ?? 0)} auto-approved`}
        />
        <SummaryCard
          icon={ExclamationTriangleIcon}
          tone="bg-amber-50"
          label="Breaching SLA"
          value={formatNumber(backlogCount)}
          caption={`SLA ${overview?.metrics?.slaThresholdHours ?? 48} hrs`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
            <h3 className="text-sm font-semibold text-slate-700">Provider mix</h3>
            <ProviderBreakdown providers={providerTotals} total={totals?.total ?? 0} />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
            <h3 className="text-sm font-semibold text-slate-700">Reviewer capacity</h3>
            <ReviewerBreakdown reviewers={reviewerBreakdown} />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
            <h3 className="text-sm font-semibold text-slate-700">Recent activity</h3>
            <RecentActivityList
              events={recentActivity}
              onSelect={onSelectVerification}
            />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
            <h3 className="text-sm font-semibold text-slate-700">Oldest in queue</h3>
            <QueuePreview items={openQueue} onSelect={onSelectVerification} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ icon: Icon, label, value, caption, tone }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {caption ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{caption}</p> : null}
        </div>
        {Icon ? (
          <div className={`rounded-2xl ${tone ?? 'bg-slate-100'} p-3 text-slate-700`}>
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProviderBreakdown({ providers, total }) {
  if (!providers?.length) {
    return <p className="mt-3 text-sm text-slate-500">No identity verification activity yet.</p>;
  }
  return (
    <div className="mt-3 space-y-3">
      {providers.map((provider) => {
        const providerName = provider.provider || 'manual_review';
        const count = Number(provider.count ?? 0) || 0;
        const percent = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={providerName} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>{providerName.replace(/_/g, ' ')}</span>
              <span>{formatNumber(count)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
            <p className="text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">{percent}% share</p>
          </div>
        );
      })}
    </div>
  );
}

function ReviewerBreakdown({ reviewers }) {
  if (!reviewers?.length) {
    return <p className="mt-3 text-sm text-slate-500">No reviewers assigned yet.</p>;
  }
  return (
    <div className="mt-3 space-y-3">
      {reviewers.slice(0, 6).map((item) => {
        const reviewer = item.reviewer ?? {};
        const name = reviewer.name || reviewer.email || `Reviewer #${item.reviewerId}`;
        return (
          <div key={item.reviewerId ?? name} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-700">{name}</p>
              {reviewer.email ? <p className="text-xs text-slate-500">{reviewer.email}</p> : null}
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {formatNumber(item.count ?? 0)} cases
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentActivityList({ events, onSelect }) {
  if (!events?.length) {
    return <p className="mt-3 text-sm text-slate-500">No recent events recorded.</p>;
  }
  return (
    <ul className="mt-3 space-y-3">
      {events.slice(0, 8).map((event) => {
        const reviewer = event.actor;
        const verification = event.verification;
        const statusTone = STATUS_DESCRIPTORS[event.toStatus ?? event.verification?.status]?.tone ?? 'bg-slate-100 text-slate-600';
        const readableStatus = event.toStatus ? event.toStatus.replace(/_/g, ' ') : event.eventType;
        return (
          <li key={event.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {event.eventType.replace(/_/g, ' ')}
                  {verification?.fullName ? ` • ${verification.fullName}` : ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {reviewer?.name || reviewer?.email || 'System'} • {formatTimestamp(event.createdAt)} ({relativeTime(event.createdAt)})
                </p>
                {event.note ? <p className="mt-2 text-sm text-slate-600">{event.note}</p> : null}
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
                {readableStatus}
              </span>
            </div>
            {verification?.id && (
              <button
                type="button"
                onClick={() => onSelect?.(verification.id)}
                className="mt-3 text-xs font-semibold text-sky-600 transition hover:text-sky-800"
              >
                Open verification
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function QueuePreview({ items, onSelect }) {
  if (!items?.length) {
    return <p className="mt-3 text-sm text-slate-500">Queue is clear.</p>;
  }
  return (
    <ul className="mt-3 space-y-3">
      {items.slice(0, 5).map((item) => {
        const descriptor = STATUS_DESCRIPTORS[item.status] ?? STATUS_DESCRIPTORS.pending;
        return (
          <li key={item.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-700">{item.fullName}</p>
              <p className="text-xs text-slate-500">Submitted {relativeTime(item.submittedAt)}</p>
              {item.verificationProvider ? (
                <p className="text-xs text-slate-400">{item.verificationProvider.replace(/_/g, ' ')}</p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${descriptor.tone}`}>
                {descriptor.label}
              </span>
              <button
                type="button"
                onClick={() => onSelect?.(item.id)}
                className="text-xs font-semibold text-sky-600 transition hover:text-sky-800"
              >
                Review
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
