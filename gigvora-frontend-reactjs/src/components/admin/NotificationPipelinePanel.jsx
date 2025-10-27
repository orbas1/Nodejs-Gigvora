import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  BellAlertIcon,
  EnvelopeOpenIcon,
  PaperAirplaneIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat().format(Math.round(numeric));
}

function formatSeconds(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  if (numeric < 60) {
    return `${numeric.toFixed(0)}s`;
  }
  return `${(numeric / 60).toFixed(1)}m`;
}

function PipelineStat({ label, value, tone = 'default' }) {
  const toneClasses = {
    default: 'border-slate-200 bg-white/70',
    alert: 'border-amber-200 bg-amber-50/80',
    success: 'border-emerald-200 bg-emerald-50/80',
  };
  return (
    <div className={classNames('rounded-2xl border p-4 text-center shadow-sm', toneClasses[tone] ?? toneClasses.default)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

PipelineStat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['default', 'alert', 'success']),
};

function ChannelProgress({ label, value, total }) {
  const safeTotal = total > 0 ? total : 1;
  const ratio = Math.min(100, Math.round((value / safeTotal) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span>
          {formatNumber(value)} / {formatNumber(total)}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}

ChannelProgress.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

function DigestBreakdown({ digest = {} }) {
  const entries = Object.entries(digest);
  if (!entries.length) {
    return <p className="text-xs text-slate-500">Digest preferences not configured.</p>;
  }
  return (
    <ul className="space-y-2 text-xs text-slate-600">
      {entries.map(([key, count]) => (
        <li key={key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/70 px-3 py-2">
          <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}</span>
          <span>{formatNumber(count)}</span>
        </li>
      ))}
    </ul>
  );
}

DigestBreakdown.propTypes = {
  digest: PropTypes.object,
};

function RecentNotificationList({ notifications }) {
  if (!notifications?.length) {
    return <p className="text-xs text-slate-500">No notifications sent in the latest snapshot window.</p>;
  }
  return (
    <ul className="space-y-2">
      {notifications.slice(0, 5).map((notification) => (
        <li
          key={notification.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm"
        >
          <div>
            <p className="font-semibold text-slate-800">{notification.title}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{notification.status?.toUpperCase?.() ?? '—'}</p>
          </div>
          <span className="text-[11px] text-slate-500">
            {notification.createdAt ? new Date(notification.createdAt).toLocaleTimeString() : '—'}
          </span>
        </li>
      ))}
    </ul>
  );
}

RecentNotificationList.propTypes = {
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      title: PropTypes.string,
      status: PropTypes.string,
      createdAt: PropTypes.string,
    }),
  ),
};

function CampaignList({ campaigns }) {
  if (!campaigns?.length) {
    return <p className="text-xs text-slate-500">No campaigns detected in the recent notification window.</p>;
  }
  return (
    <ul className="space-y-2 text-xs text-slate-600">
      {campaigns.slice(0, 5).map((campaign) => (
        <li key={campaign.campaignId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 shadow-sm">
          <div>
            <p className="font-semibold text-slate-800">{campaign.campaignId}</p>
            <p className="mt-1 text-[11px] text-slate-500">{campaign.total} sent · {campaign.delivered} delivered</p>
          </div>
          <span className="text-[11px] text-slate-500">{campaign.lastSentAt ? new Date(campaign.lastSentAt).toLocaleString() : '—'}</span>
        </li>
      ))}
    </ul>
  );
}

CampaignList.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      campaignId: PropTypes.string,
      total: PropTypes.number,
      delivered: PropTypes.number,
      lastSentAt: PropTypes.string,
    }),
  ),
};

function NotificationPipelineSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-lg">
      <div className="h-6 w-48 rounded bg-slate-200" />
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-slate-100/60 p-4" />
        ))}
      </div>
      <div className="mt-6 h-32 rounded-2xl bg-slate-100/60" />
    </div>
  );
}

export default function NotificationPipelinePanel({ snapshot, loading, refreshing, error, onRefresh }) {
  if (loading) {
    return <NotificationPipelineSkeleton />;
  }

  const totals = snapshot?.totals ?? {};
  const channels = snapshot?.channels ?? {};

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 shadow-xl ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Notification pipelines</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track outbound deliverability, preference adoption, and campaign readiness across channels.
          </p>
          <p className="mt-2 text-xs text-slate-500">Snapshot captured {snapshot?.generatedAt ? new Date(snapshot.generatedAt).toLocaleString() : 'recently'}.</p>
          {error ? <p className="mt-2 text-xs font-semibold text-amber-600">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className={classNames(
            'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
            refreshing ? 'cursor-wait opacity-70' : '',
          )}
          disabled={refreshing}
        >
          <ArrowPathIcon className={classNames('h-4 w-4', refreshing ? 'animate-spin' : '')} /> Refresh
        </button>
      </div>

      <div className="grid gap-5 px-6 py-5 lg:grid-cols-2 xl:grid-cols-4">
        <PipelineStat label="Total notifications" value={formatNumber(totals.total)} />
        <PipelineStat label="Pending" value={formatNumber(totals.pending)} tone={totals.pending > 0 ? 'alert' : 'default'} />
        <PipelineStat label="Unread" value={formatNumber(totals.unread)} tone={totals.unread > 0 ? 'alert' : 'default'} />
        <PipelineStat label="Critical open" value={formatNumber(totals.criticalOpen)} tone={totals.criticalOpen ? 'alert' : 'default'} />
      </div>

      <div className="grid gap-6 px-6 pb-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BellAlertIcon className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800">Channel opt-in</h3>
          </div>
          <ChannelProgress label="Email" value={channels.emailEnabled ?? 0} total={channels.totalPreferences ?? 0} />
          <ChannelProgress label="Push" value={channels.pushEnabled ?? 0} total={channels.totalPreferences ?? 0} />
          <ChannelProgress label="SMS" value={channels.smsEnabled ?? 0} total={channels.totalPreferences ?? 0} />
          <ChannelProgress label="In-app" value={channels.inAppEnabled ?? 0} total={channels.totalPreferences ?? 0} />
          <div className="rounded-xl border border-slate-200 bg-white/60 p-3 text-xs text-slate-600 shadow-sm">
            Quiet hours configured for {formatNumber(channels.quietHoursConfigured ?? 0)} members.
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <EnvelopeOpenIcon className="h-5 w-5 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-800">Digest cadence</h3>
          </div>
          <DigestBreakdown digest={channels.digest} />
          <div className="rounded-xl border border-slate-200 bg-white/60 p-3 text-xs text-slate-600 shadow-sm">
            Average delivery {formatSeconds(snapshot?.averages?.deliverySeconds)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 pb-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <SignalIcon className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-800">Recent notifications</h3>
          </div>
          <RecentNotificationList notifications={snapshot.recent} />
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <PaperAirplaneIcon className="h-5 w-5 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-800">Campaign activity</h3>
          </div>
          <CampaignList campaigns={snapshot.campaigns} />
        </div>
      </div>
    </section>
  );
}

NotificationPipelinePanel.propTypes = {
  snapshot: PropTypes.shape({
    generatedAt: PropTypes.string,
    totals: PropTypes.object,
    averages: PropTypes.object,
    channels: PropTypes.object,
    recent: PropTypes.array,
    campaigns: PropTypes.array,
  }).isRequired,
  loading: PropTypes.bool,
  refreshing: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
};

NotificationPipelinePanel.defaultProps = {
  loading: false,
  refreshing: false,
  error: '',
  onRefresh: () => {},
};
