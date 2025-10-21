import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../DataStatus.jsx';

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
};

MetricCard.defaultProps = {
  hint: null,
};

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
  } catch (error) {
    return `${currency} ${formatNumber(value)}`;
  }
}

function normaliseLabel(label) {
  if (!label) {
    return 'Metric';
  }
  return String(label)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractNumericMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') {
    return [];
  }
  return Object.entries(metrics)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({ label: normaliseLabel(key), value }));
}

function ActivityItem({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">{item.title ?? item.type ?? 'Activity'}</p>
        {item.date ? (
          <span className="text-xs text-slate-500" title={new Date(item.date).toLocaleString()}>
            {new Date(item.date).toLocaleDateString()}
          </span>
        ) : null}
      </div>
      {item.description ? <p className="mt-2 text-sm text-slate-600">{item.description}</p> : null}
    </div>
  );
}

ActivityItem.propTypes = {
  item: PropTypes.object.isRequired,
};

function filterActivityByRange(items, days) {
  if (!Array.isArray(items) || !days) {
    return Array.isArray(items) ? items : [];
  }
  const horizon = Date.now() - Number(days) * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    if (!item?.date) {
      return true;
    }
    const timestamp = new Date(item.date).getTime();
    return Number.isFinite(timestamp) ? timestamp >= horizon : true;
  });
}

export default function UserMetricsSection({
  metrics,
  quickMetrics,
  activity,
  currency,
  loading,
  error,
  lastUpdated,
  fromCache,
  onRefresh,
}) {
  const metricEntries = [
    {
      label: 'Active projects',
      value: formatNumber(quickMetrics.projectsActive ?? metrics?.projectsActive ?? 0),
      hint: 'Currently in delivery.',
    },
    {
      label: 'Open gig orders',
      value: formatNumber(quickMetrics.gigOrdersOpen ?? metrics?.gigOrdersOpen ?? 0),
      hint: 'Awaiting submissions or review.',
    },
    {
      label: 'Escrow milestones',
      value: formatNumber(quickMetrics.escrowInFlight ?? metrics?.escrowInFlight ?? 0),
      hint: 'Milestones in progress.',
    },
    {
      label: 'Wallet balance',
      value: formatCurrency(quickMetrics.walletBalance ?? metrics?.walletBalance ?? 0, currency),
      hint: 'Primary operating currency.',
    },
  ];

  const numericMetrics = extractNumericMetrics(metrics ?? {});
  numericMetrics.forEach((entry) => {
    if (!metricEntries.some((existing) => existing.label === entry.label)) {
      metricEntries.push({
        label: entry.label,
        value: formatNumber(entry.value),
      });
    }
  });

  const [range, setRange] = useState('30');

  const filteredActivity = useMemo(() => filterActivityByRange(activity, Number(range)), [activity, range]);
  const timelineItems = filteredActivity.slice(0, 8);

  const handleDownload = () => {
    if (typeof window === 'undefined') {
      return;
    }
    const snapshot = {
      generatedAt: new Date().toISOString(),
      rangeDays: Number(range),
      quickMetrics,
      metrics,
      activity: filteredActivity,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gigvora-metrics-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="client-metrics"
      className="space-y-6 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Metrics</p>
          <h2 className="text-3xl font-semibold text-slate-900">Operational intelligence</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Keep an eye on production health, response velocity, and commercial signals without leaving the dashboard.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <DataStatus
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            fromCache={fromCache}
            onRefresh={onRefresh}
            statusLabel="Metrics refresh"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Range
              <select
                value={range}
                onChange={(event) => setRange(event.target.value)}
                className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
            >
              Download snapshot
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricEntries.map((entry) => (
          <MetricCard key={entry.label} label={entry.label} value={entry.value} hint={entry.hint} />
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent activity</h3>
        {timelineItems.length ? (
          <div className="mt-3 space-y-3">
            {timelineItems.map((item, index) => (
              <ActivityItem key={item.id ?? `${item.title ?? item.type}-${index}`} item={item} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Activity updates will appear here once stakeholders engage with your projects, gigs, and support workflows.
          </p>
        )}
      </div>
    </section>
  );
}

UserMetricsSection.propTypes = {
  metrics: PropTypes.object,
  quickMetrics: PropTypes.shape({
    projectsActive: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gigOrdersOpen: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    escrowInFlight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    walletBalance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  activity: PropTypes.arrayOf(PropTypes.object),
  currency: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  fromCache: PropTypes.bool,
  onRefresh: PropTypes.func,
};

UserMetricsSection.defaultProps = {
  metrics: null,
  quickMetrics: {},
  activity: [],
  currency: 'USD',
  loading: false,
  error: null,
  lastUpdated: null,
  fromCache: false,
  onRefresh: null,
};
