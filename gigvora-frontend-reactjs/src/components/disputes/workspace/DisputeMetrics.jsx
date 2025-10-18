import { ArrowTrendingUpIcon, ClockIcon, ExclamationTriangleIcon, FolderOpenIcon } from '@heroicons/react/24/outline';

function MetricCard({ label, value, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-white text-slate-900 border-slate-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    accent: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <div className={`flex items-center justify-between rounded-3xl border px-4 py-3 shadow-sm ${toneClasses[tone]}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </div>
      <div className="rounded-2xl bg-white/70 p-2">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function DisputeMetrics({ summary }) {
  const metrics = [
    {
      key: 'openCount',
      label: 'Open',
      value: summary.openCount ?? 0,
      icon: FolderOpenIcon,
      tone: 'neutral',
    },
    {
      key: 'awaitingCustomerAction',
      label: 'Waiting on you',
      value: summary.awaitingCustomerAction ?? 0,
      icon: ClockIcon,
      tone: 'warning',
    },
    {
      key: 'escalatedCount',
      label: 'Escalated',
      value: summary.escalatedCount ?? 0,
      icon: ArrowTrendingUpIcon,
      tone: 'accent',
    },
    {
      key: 'total',
      label: 'History',
      value: summary.total ?? 0,
      icon: ExclamationTriangleIcon,
      tone: 'neutral',
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.key} {...metric} value={new Intl.NumberFormat('en-GB').format(metric.value ?? 0)} />
      ))}
    </section>
  );
}
