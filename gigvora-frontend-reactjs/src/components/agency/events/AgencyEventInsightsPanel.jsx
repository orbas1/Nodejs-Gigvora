import PropTypes from 'prop-types';
import { BoltIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function formatPercent(value) {
  if (!Number.isFinite(Number(value))) {
    return '0%';
  }
  return `${Math.round(Number(value))}%`;
}

function formatCurrency(value, currency = 'USD') {
  if (!Number.isFinite(Number(value))) {
    return `${currency} 0`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
}

const SEVERITY_TONES = {
  high: 'border-rose-200 bg-rose-50 text-rose-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export default function AgencyEventInsightsPanel({ overview, recommendations }) {
  const metrics = [
    {
      id: 'tasks',
      label: 'Task completion',
      value: formatPercent(overview?.tasksCompletionRate ?? 0),
      caption: `${overview?.tasksCompleted ?? 0} of ${overview?.tasksTotal ?? 0}`,
    },
    {
      id: 'checklist',
      label: 'Checklist progress',
      value: formatPercent(overview?.checklistCompletionRate ?? 0),
      caption: `${overview?.checklistsCompleted ?? 0} of ${overview?.checklistsTotal ?? 0}`,
    },
    {
      id: 'budget',
      label: 'Budget variance',
      value: formatCurrency(overview?.budgetVariance ?? 0, overview?.budgetCurrency ?? 'USD'),
      caption: 'Actual - planned',
    },
  ];

  return (
    <section className="flex flex-col gap-5 rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="flex items-center gap-2">
        <BoltIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Programme health</h2>
          <p className="text-sm text-slate-500">A quick pulse on pacing metrics and suggested next actions.</p>
        </div>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
            <p className="text-xs text-slate-500">{metric.caption}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Recommended actions</h3>
        {recommendations?.length ? (
          <ul className="flex flex-col gap-3">
            {recommendations.map((item) => {
              const tone = SEVERITY_TONES[item.severity] ?? SEVERITY_TONES.medium;
              const Icon = item.severity === 'low' ? CheckCircleIcon : ExclamationTriangleIcon;
              return (
                <li key={item.id} className={`flex items-start gap-3 rounded-3xl border px-4 py-3 text-sm ${tone}`}>
                  <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-current/80">{item.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            All clear. Keep capturing feedback as events progress.
          </p>
        )}
      </div>
    </section>
  );
}

AgencyEventInsightsPanel.propTypes = {
  overview: PropTypes.object,
  recommendations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      message: PropTypes.string,
      severity: PropTypes.string,
    }),
  ),
};

AgencyEventInsightsPanel.defaultProps = {
  overview: null,
  recommendations: [],
};
