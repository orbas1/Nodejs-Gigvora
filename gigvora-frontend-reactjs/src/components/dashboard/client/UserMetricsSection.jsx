import PropTypes from 'prop-types';

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

export default function UserMetricsSection({ metrics, quickMetrics, activity, currency }) {
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

  const timelineItems = Array.isArray(activity) ? activity.slice(0, 8) : [];

  return (
    <section
      id="client-metrics"
      className="space-y-6 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Metrics</p>
          <h2 className="text-3xl font-semibold text-slate-900">Operational intelligence</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Keep an eye on production health, response velocity, and commercial signals without leaving the dashboard.
          </p>
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
};

UserMetricsSection.defaultProps = {
  metrics: null,
  quickMetrics: {},
  activity: [],
  currency: 'USD',
};
