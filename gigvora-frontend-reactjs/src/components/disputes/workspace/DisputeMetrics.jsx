import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

function MetricCard({ label, value, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-white text-slate-900 border-slate-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    accent: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const labelClasses = {
    default: 'text-slate-500',
    warning: 'text-amber-600',
    accent: 'text-blue-600',
    neutral: 'text-slate-500',
    danger: 'text-rose-600',
  };

  const displayValue =
    value === null || value === undefined
      ? '—'
      : typeof value === 'number'
        ? new Intl.NumberFormat('en-GB').format(value)
        : value;

  return (
    <div className={`flex items-center justify-between rounded-3xl border px-4 py-3 shadow-sm ${toneClasses[tone]}`}>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide ${labelClasses[tone] ?? labelClasses.default}`}>{label}</p>
        <p className="mt-2 text-2xl font-semibold">{displayValue}</p>
      </div>
      <div className="rounded-2xl bg-white/70 p-2">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function DisputeMetrics({ summary }) {
  const trustScore = typeof summary?.trustScore === 'number' ? Math.round(summary.trustScore) : null;
  const slaBreaches = typeof summary?.slaBreaches === 'number' ? summary.slaBreaches : null;

  const metrics = [
    {
      key: 'trustScore',
      label: 'Trust score',
      value: trustScore != null ? `${trustScore}/100` : '—',
      icon: ShieldCheckIcon,
      tone:
        trustScore == null
          ? 'neutral'
          : trustScore >= 85
            ? 'accent'
            : trustScore >= 70
              ? 'warning'
              : 'danger',
    },
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
      tone: summary.awaitingCustomerAction ? 'warning' : 'neutral',
    },
    {
      key: 'escalatedCount',
      label: 'Escalated',
      value: summary.escalatedCount ?? 0,
      icon: ArrowTrendingUpIcon,
      tone: summary.escalatedCount ? 'accent' : 'neutral',
    },
    {
      key: 'slaBreaches',
      label: 'SLA breaches',
      value: slaBreaches ?? 0,
      icon: ExclamationTriangleIcon,
      tone: slaBreaches ? 'danger' : 'neutral',
    },
    {
      key: 'total',
      label: 'History',
      value: summary.total ?? 0,
      icon: ChartBarIcon,
      tone: 'neutral',
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.key} {...metric} />
      ))}
    </section>
  );
}
