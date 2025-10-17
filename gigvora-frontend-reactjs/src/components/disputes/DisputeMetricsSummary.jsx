import { ChartBarIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
  DISPUTE_STAGE_OPTIONS,
  DISPUTE_STATUS_OPTIONS,
  DISPUTE_PRIORITY_OPTIONS,
  findDisputeOption,
} from '../../constants/disputes.js';

function SummaryCard({ icon: Icon, title, value, description, tone = 'default' }) {
  const toneClasses = {
    default: 'border-slate-200 bg-white text-slate-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  const badgeClasses = toneClasses[tone] ?? toneClasses.default;

  return (
    <div className={`rounded-3xl border p-5 shadow-soft transition ${badgeClasses}`}>
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/70">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
      </div>
      {description ? <p className="mt-3 text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}

function formatBreakdown(records = {}) {
  if (!records || typeof records !== 'object') {
    return [];
  }
  return Object.entries(records)
    .map(([key, value]) => ({ key, value: Number.parseInt(value, 10) || 0 }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function resolveLabel(options, key, fallback = '—') {
  if (!key) {
    return fallback;
  }
  return findDisputeOption(options, key)?.label ?? fallback;
}

function BreakdownList({ title, options, records }) {
  const items = formatBreakdown(records);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-4">
              <span className="font-medium text-slate-700">{resolveLabel(options, item.key, item.key)}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {item.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function determineTopPriorityLabel(priorities = {}) {
  const priorityOrder = ['urgent', 'high', 'medium', 'low'];
  const firstActive = priorityOrder.find((priority) => (priorities?.[priority] ?? 0) > 0);
  if (!firstActive) {
    return 'No active cases';
  }
  return resolveLabel(DISPUTE_PRIORITY_OPTIONS, firstActive, firstActive);
}

export default function DisputeMetricsSummary({ totals, loading }) {
  const openDisputes = loading ? '…' : totals?.openDisputes ?? 0;
  const overdue = loading ? '…' : totals?.overdue ?? 0;
  const dominantStage = loading
    ? '…'
    : resolveLabel(
        DISPUTE_STAGE_OPTIONS,
        formatBreakdown(totals?.byStage ?? {})?.[0]?.key,
        'No cases yet',
      );
  const highestPriority = loading ? '…' : determineTopPriorityLabel(totals?.byPriority ?? {});

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-soft">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            icon={ChartBarIcon}
            title="Open disputes"
            value={openDisputes}
            description="Active cases across all stages."
          />
          <SummaryCard
            icon={ClockIcon}
            title="Overdue SLAs"
            value={overdue}
            description="Cases past either customer or provider deadline."
            tone={Number(overdue) > 0 ? 'warning' : 'default'}
          />
          <SummaryCard
            icon={ExclamationTriangleIcon}
            title="Highest priority in queue"
            value={highestPriority}
            description={`Most urgent cases currently ${dominantStage.toString().toLowerCase()}.`}
            tone={highestPriority !== 'No active cases' ? 'danger' : 'default'}
          />
        </div>

        <div className="flex-1 space-y-4">
          <BreakdownList title="By stage" options={DISPUTE_STAGE_OPTIONS} records={totals?.byStage} />
          <BreakdownList title="By status" options={DISPUTE_STATUS_OPTIONS} records={totals?.byStatus} />
        </div>
      </div>
    </section>
  );
}
