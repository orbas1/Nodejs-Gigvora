import PropTypes from 'prop-types';

function Metric({ label, value, tone = 'default' }) {
  const tones = {
    default: 'bg-white/90 text-slate-900 border-slate-200',
    accent: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
  };
  return (
    <div className={`rounded-3xl border px-5 py-6 shadow-sm ${tones[tone]}`}> 
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['default', 'accent', 'success', 'warning']),
};

function Reminder({ item }) {
  const label = item.type === 'delivery_due' ? 'Delivery' : 'Requirement';
  const status = item.status ? item.status.replace(/_/g, ' ') : null;
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm">
      <div>
        <p className="font-semibold text-slate-900">{item.orderNumber}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <div className="text-right text-xs text-slate-500">
        {item.dueAt ? new Date(item.dueAt).toLocaleDateString() : 'No date'}
        {status ? <p className="mt-1 capitalize text-slate-400">{status}</p> : null}
      </div>
    </div>
  );
}

Reminder.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    orderNumber: PropTypes.string,
    dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    status: PropTypes.string,
  }).isRequired,
};

export default function WorkspaceOverview({ summary, boardMetrics, vendorStats, reminders, storytelling }) {
  const summaryMetrics = [
    { label: 'Projects', value: summary.totalProjects },
    { label: 'Active', value: summary.activeProjects, tone: 'accent' },
    {
      label: 'Budget',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
        summary.budgetInPlay ?? 0,
      ),
    },
    { label: 'Orders', value: summary.gigsInDelivery, tone: 'success' },
    { label: 'Assets', value: summary.assetsSecured },
  ];

  const boardCards = [
    { label: 'Progress', value: `${Math.round(boardMetrics.averageProgress ?? 0)}%` },
    { label: 'At risk', value: boardMetrics.atRisk, tone: 'warning' },
    { label: 'Completed', value: boardMetrics.completed, tone: 'success' },
  ];

  const vendorCards = [
    { label: 'Orders total', value: vendorStats.totalOrders },
    { label: 'Active', value: vendorStats.active, tone: 'accent' },
    { label: 'Completed', value: vendorStats.completed, tone: 'success' },
    { label: 'Progress avg', value: `${Math.round(vendorStats.averageProgress ?? 0)}%` },
  ];

  const achievements = storytelling?.achievements ?? [];
  const quickExports = storytelling?.quickExports ?? {};

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryMetrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Board</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {boardCards.map((metric) => (
              <Metric key={metric.label} {...metric} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendors</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {vendorCards.map((metric) => (
              <Metric key={metric.label} {...metric} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reminders</p>
          <div className="mt-4 space-y-3">
            {reminders.length ? reminders.slice(0, 5).map((reminder) => <Reminder key={`${reminder.type}-${reminder.orderId}-${reminder.dueAt}`} item={reminder} />) : <p className="text-sm text-slate-500">None</p>}
          </div>
        </div>
      </section>

      {achievements.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {achievements.slice(0, 6).map((item) => (
              <div key={`${item.title}-${item.type}`} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-xs text-slate-500">{item.bullet}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {Object.entries(quickExports).map(([key, lines]) => (
              <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600">
                <p className="font-semibold uppercase tracking-wide text-slate-500">{key}</p>
                <ul className="mt-2 space-y-1">
                  {lines.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

WorkspaceOverview.propTypes = {
  summary: PropTypes.shape({
    totalProjects: PropTypes.number,
    activeProjects: PropTypes.number,
    budgetInPlay: PropTypes.number,
    gigsInDelivery: PropTypes.number,
    assetsSecured: PropTypes.number,
  }).isRequired,
  boardMetrics: PropTypes.shape({
    averageProgress: PropTypes.number,
    atRisk: PropTypes.number,
    completed: PropTypes.number,
  }).isRequired,
  vendorStats: PropTypes.shape({
    totalOrders: PropTypes.number,
    active: PropTypes.number,
    completed: PropTypes.number,
    averageProgress: PropTypes.number,
  }).isRequired,
  reminders: PropTypes.arrayOf(PropTypes.object).isRequired,
  storytelling: PropTypes.shape({
    achievements: PropTypes.array,
    quickExports: PropTypes.object,
  }),
};
