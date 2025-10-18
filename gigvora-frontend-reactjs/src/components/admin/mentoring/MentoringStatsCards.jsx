import { ArrowUpRightIcon, ClockIcon, UserGroupIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  scheduled: 'border-sky-200 bg-sky-50 text-sky-700',
  requested: 'border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};

function MetricCard({ label, value, icon: Icon, accent }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-3xl border ${accent?.border ?? 'border-slate-200'} bg-white p-5 shadow-lg shadow-blue-100/20`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        {Icon ? (
          <span className={`inline-flex rounded-full ${accent?.iconBg ?? 'bg-blue-50'} p-2 text-slate-500`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function MentoringStatsCards({ metrics = {}, totalsByStatus = {} }) {
  const { upcomingCount = 0, followUpsDue = 0, averageFeedback = null, openActionItems = 0 } = metrics;

  const summaryCards = [
    {
      key: 'upcoming',
      label: 'Upcoming',
      value: upcomingCount,
      icon: ClockIcon,
      accent: { border: 'border-sky-200', iconBg: 'bg-sky-50' },
    },
    {
      key: 'follow-ups',
      label: 'Follow-ups',
      value: followUpsDue,
      icon: ClipboardDocumentCheckIcon,
      accent: { border: 'border-amber-200', iconBg: 'bg-amber-50' },
    },
    {
      key: 'feedback',
      label: 'Feedback',
      value: averageFeedback == null ? '—' : averageFeedback.toFixed(2),
      icon: ArrowUpRightIcon,
      accent: { border: 'border-emerald-200', iconBg: 'bg-emerald-50' },
    },
    {
      key: 'actions',
      label: 'Tasks',
      value: openActionItems,
      icon: UserGroupIcon,
      accent: { border: 'border-indigo-200', iconBg: 'bg-indigo-50' },
    },
  ];

  const statusEntries = Object.entries(totalsByStatus).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <MetricCard key={card.key} {...card} />
      ))}
      {statusEntries.map(({ status, count }) => (
        <div
          key={status}
          className={`flex flex-col gap-2 rounded-3xl border ${STATUS_COLORS[status] ?? 'border-slate-200 bg-slate-50 text-slate-700'} p-4 shadow-inner`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide">{status.replace(/_/g, ' ')}</p>
          <p className="text-3xl font-semibold">{count}</p>
        </div>
      ))}
    </div>
  );
}
