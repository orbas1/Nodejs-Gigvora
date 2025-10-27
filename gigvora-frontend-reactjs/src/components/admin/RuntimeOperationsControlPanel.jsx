import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  CpuChipIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat().format(Math.round(numeric));
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${(numeric * 100).toFixed(0)}%`;
}

function formatRelative(timestamp) {
  if (!timestamp) {
    return 'moments ago';
  }
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return 'moments ago';
  }
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) {
    return 'moments ago';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatDateTime(timestamp) {
  if (!timestamp) {
    return 'Not scheduled';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }
  return date.toLocaleString();
}

function StatCard({ icon: Icon, label, value, helper, tone = 'default' }) {
  const toneClasses = {
    default: 'border-slate-200 bg-white/70',
    success: 'border-emerald-200 bg-emerald-50/80',
    warning: 'border-amber-200 bg-amber-50/80',
  };

  return (
    <div className={classNames('rounded-2xl border p-4 shadow-sm backdrop-blur', toneClasses[tone] ?? toneClasses.default)}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-slate-700 shadow">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-lg font-semibold text-slate-900">{value}</p>
        </div>
      </div>
      {helper ? <p className="mt-3 text-xs text-slate-600">{helper}</p> : null}
    </div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  helper: PropTypes.node,
  tone: PropTypes.oneOf(['default', 'success', 'warning']),
};

function PersonaChipList({ chips }) {
  if (!chips?.length) {
    return <p className="text-xs text-slate-500">No persona chips configured yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span key={chip} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {chip}
        </span>
      ))}
    </div>
  );
}

PersonaChipList.propTypes = {
  chips: PropTypes.arrayOf(PropTypes.string),
};

function InsightList({ insights }) {
  if (!insights?.length) {
    return <p className="text-xs text-slate-500">Insight stats will appear once site settings publish metrics.</p>;
  }
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {insights.map((insight) => (
        <div key={insight.id ?? insight.label} className="rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm">
          <dt className="text-xs font-semibold text-slate-500">{insight.label}</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">{insight.value ?? '—'}</dd>
          {insight.helper ? <p className="mt-1 text-xs text-slate-500">{insight.helper}</p> : null}
        </div>
      ))}
    </dl>
  );
}

InsightList.propTypes = {
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      value: PropTypes.string,
      helper: PropTypes.string,
    }),
  ),
};

function BroadcastChannelList({ channels }) {
  if (!channels?.length) {
    return <p className="text-xs text-slate-500">No broadcast channels configured.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2 text-xs text-slate-600">
      {channels.map((channel) => (
        <li key={channel} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
          {channel}
        </li>
      ))}
    </ul>
  );
}

BroadcastChannelList.propTypes = {
  channels: PropTypes.arrayOf(PropTypes.string),
};

function AnnouncementCard({ announcement }) {
  if (!announcement?.enabled && !announcement?.message) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-500 shadow-sm">
        Announcement banner is currently disabled.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <MegaphoneIcon className="h-5 w-5 text-indigo-600" />
        <div>
          <p className="text-sm font-semibold text-indigo-900">Live announcement</p>
          <p className="mt-1 text-sm text-indigo-800">{announcement.message}</p>
          {announcement.linkLabel ? (
            <a
              href={announcement.linkUrl || '#'}
              className="mt-2 inline-flex items-center text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              {announcement.linkLabel}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

AnnouncementCard.propTypes = {
  announcement: PropTypes.shape({
    enabled: PropTypes.bool,
    message: PropTypes.string,
    linkLabel: PropTypes.string,
    linkUrl: PropTypes.string,
  }),
};

function OperationsSummaryList({ summary }) {
  const highlights = summary?.highlights ?? [];
  const metrics = summary?.metrics ?? [];
  if (!highlights.length && !metrics.length && !summary?.hero) {
    return <p className="text-xs text-slate-500">Operations summary will populate once site settings capture highlights.</p>;
  }
  return (
    <div className="space-y-3">
      {summary?.hero ? <p className="text-sm font-semibold text-slate-800">{summary.hero}</p> : null}
      {highlights.length ? (
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {metrics.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric} className="rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-600 shadow-sm">
              {metric}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

OperationsSummaryList.propTypes = {
  summary: PropTypes.shape({
    hero: PropTypes.string,
    highlights: PropTypes.arrayOf(PropTypes.string),
    metrics: PropTypes.arrayOf(PropTypes.string),
  }),
};

function RuntimeOperationsSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-lg">
      <div className="h-6 w-40 rounded bg-slate-200" />
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-slate-100/60 p-4" />
        ))}
      </div>
      <div className="mt-6 h-32 rounded-2xl bg-slate-100/60" />
    </div>
  );
}

export default function RuntimeOperationsControlPanel({ summary, loading, refreshing, error, onRefresh }) {
  if (loading) {
    return <RuntimeOperationsSkeleton />;
  }

  const stats = summary?.insights ?? {};
  const system = summary?.system ?? {};
  const site = summary?.site ?? {};
  const maintenanceWindow = stats.nextMaintenance;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 shadow-xl ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Runtime operations &amp; site settings</h2>
          <p className="mt-1 text-sm text-slate-600">
            Monitor runtime readiness, broadcast posture, and marketing hero settings powering first-touch experiences.
          </p>
          <p className="mt-2 text-xs text-slate-500">Refreshed {formatRelative(summary?.generatedAt)}</p>
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
          <ArrowPathIcon className={classNames('h-4 w-4', refreshing ? 'animate-spin' : '')} />
          Refresh
        </button>
      </div>

      <div className="grid gap-5 px-6 py-5 lg:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShieldCheckIcon}
          label="Runtime status"
          value={stats.runtimeStatus ? stats.runtimeStatus.toUpperCase() : 'UNKNOWN'}
          helper={`Readiness score ${formatPercent(stats.readinessScore ?? 0.82)}`}
          tone={stats.runtimeStatus === 'ready' ? 'success' : 'default'}
        />
        <StatCard
          icon={BoltIcon}
          label="Operations score"
          value={`${stats.operationsScore ?? 0}`}
          helper="Composite weighting of readiness, persona coverage, and hero metrics."
        />
        <StatCard
          icon={CpuChipIcon}
          label="Persona coverage"
          value={`${formatNumber(stats.personaChipCount)} chips`}
          helper="Premium hero chips published across site settings."
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Broadcast channels"
          value={`${formatNumber(stats.broadcastChannels?.length ?? 0)} active`}
          helper="Channels configured for runtime and maintenance messaging."
        />
      </div>

      <div className="grid gap-6 px-6 pb-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Persona chips</h3>
          <PersonaChipList chips={site.hero?.personaChips} />
          <h3 className="text-sm font-semibold text-slate-800">Hero insight stats</h3>
          <InsightList insights={site.hero?.insightStats} />
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Broadcast posture</h3>
            <div className="inline-flex items-center gap-2 text-xs text-slate-500">
              <MegaphoneIcon className="h-4 w-4" />
              {system.notifications?.emailProvider ? `Email via ${system.notifications.emailProvider}` : 'No email provider'}
            </div>
          </div>
          <BroadcastChannelList channels={system.notifications?.broadcastChannels} />
          <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldCheckIcon className="h-4 w-4" />
              Next maintenance window
            </h4>
            <p className="mt-2 text-xs text-slate-600">{formatDateTime(maintenanceWindow?.startAt)}</p>
            {maintenanceWindow?.summary ? (
              <p className="mt-1 text-xs text-slate-500">{maintenanceWindow.summary}</p>
            ) : null}
          </div>
          <AnnouncementCard announcement={site.announcement} />
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-800">Operations summary</h3>
          </div>
          <div className="mt-3">
            <OperationsSummaryList summary={site.operationsSummary} />
          </div>
        </div>
      </div>
    </section>
  );
}

RuntimeOperationsControlPanel.propTypes = {
  summary: PropTypes.shape({
    generatedAt: PropTypes.string,
    system: PropTypes.object,
    site: PropTypes.object,
    insights: PropTypes.object,
  }).isRequired,
  loading: PropTypes.bool,
  refreshing: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
};

RuntimeOperationsControlPanel.defaultProps = {
  loading: false,
  refreshing: false,
  error: '',
  onRefresh: () => {},
};
