import { SparklesIcon, BoltIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';

const CARDS = [
  {
    id: 'autoReplies',
    label: 'Auto replies (7d)',
    icon: SparklesIcon,
    formatter: (value) => `${value ?? 0}`,
    accessor: (analytics) => analytics?.autoRepliesLast7Days ?? 0,
  },
  {
    id: 'bidWinRate',
    label: 'Bid win rate',
    icon: ChartBarIcon,
    formatter: (value) => `${Math.round((value ?? 0) * 10) / 10}%`,
    accessor: (analytics) => analytics?.bidWinRate ?? 0,
  },
  {
    id: 'bidsSubmitted',
    label: 'Bids submitted (30d)',
    icon: BoltIcon,
    formatter: (value) => `${value ?? 0}`,
    accessor: (analytics) => analytics?.bidsSubmittedLast30Days ?? 0,
  },
  {
    id: 'turnaround',
    label: 'Avg. turnaround',
    icon: ClockIcon,
    formatter: (value) => `${value ?? 0} min`,
    accessor: (analytics) => analytics?.avgBidTurnaroundMinutes ?? 0,
  },
];

export default function AgencyAiOverview({ analytics, workspaceName, loading, fromCache, lastUpdated, onRefresh }) {
  return (
    <section id="ai-overview" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Automation snapshot</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{workspaceName ?? 'Agency workspace'}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={onRefresh} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const rawValue = card.accessor(analytics);
          const displayValue = card.formatter(rawValue);
          return (
            <div
              key={card.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{displayValue}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
