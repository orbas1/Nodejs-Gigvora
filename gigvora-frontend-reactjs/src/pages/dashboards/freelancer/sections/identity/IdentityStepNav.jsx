import StatusBadge from './StatusBadge.jsx';
import { IDENTITY_STEPS } from './constants.js';

export default function IdentityStepNav({ activeStep, onSelect, status, nextActions = [], onOpenHistory }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Compliance</p>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">Identity</h2>
            <StatusBadge status={status} />
          </div>
        </div>
        <nav className="space-y-2" aria-label="Identity steps">
          {IDENTITY_STEPS.map((step, index) => {
            const isActive = step.id === activeStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelect?.(step.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white focus:ring-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900 focus:ring-slate-300'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span>{step.label}</span>
                  <span className="text-xs font-semibold text-slate-400">{index + 1}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="space-y-3">
        {nextActions.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Next</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {nextActions.map((action) => (
                <span
                  key={action.id}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    action.priority === 'high'
                      ? 'bg-emerald-100 text-emerald-700'
                      : action.priority === 'medium'
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {action.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => onOpenHistory?.()}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          History
        </button>
      </div>
    </div>
  );
}
