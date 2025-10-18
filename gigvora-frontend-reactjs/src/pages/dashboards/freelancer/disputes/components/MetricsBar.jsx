function formatTimestamp(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  });
}

export default function MetricsBar({ summary, refreshing }) {
  const metrics = [
    { id: 'total', label: 'Total', value: summary?.totalCases ?? 0 },
    { id: 'open', label: 'Open', value: summary?.openCases ?? 0 },
    { id: 'client', label: 'Client', value: summary?.awaitingCustomer ?? 0 },
    { id: 'urgent', label: 'Urgent', value: summary?.urgentCases ?? 0 },
    { id: 'due', label: 'Due <72h', value: summary?.dueWithin72h ?? 0 },
  ];

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-3">
        {metrics.map((metric) => (
          <div key={metric.id} className="min-w-[6rem] rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {refreshing ? 'Refreshing…' : `Updated ${formatTimestamp(summary?.lastUpdatedAt) || 'just now'}`}
      </p>
    </section>
  );
}
