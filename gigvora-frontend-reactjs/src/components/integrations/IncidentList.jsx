import { useCallback, useMemo, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

const SEVERITY_CLASSES = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function IncidentList({
  incidents = [],
  onResolve,
  onCreate,
  severityOptions = ['low', 'medium', 'high', 'critical'],
}) {
  const [formState, setFormState] = useState({ severity: 'low', summary: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const sortedIncidents = useMemo(
    () => [...incidents].sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt)),
    [incidents],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!onCreate || !formState.summary.trim()) {
        return;
      }
      setSubmitting(true);
      try {
        await onCreate({
          severity: formState.severity,
          summary: formState.summary,
          description: formState.description,
        });
        setFormState({ severity: formState.severity, summary: '', description: '' });
      } finally {
        setSubmitting(false);
      }
    },
    [formState, onCreate],
  );

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Severity</label>
            <select
              value={formState.severity}
              onChange={(event) => setFormState((previous) => ({ ...previous, severity: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {severityOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</label>
            <input
              type="text"
              value={formState.summary}
              onChange={(event) => setFormState((previous) => ({ ...previous, summary: event.target.value }))}
              placeholder="Short description"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              required
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Details</label>
          <textarea
            rows={3}
            value={formState.description}
            onChange={(event) => setFormState((previous) => ({ ...previous, description: event.target.value }))}
            placeholder="Additional context"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
          >
            Log incident
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {sortedIncidents.map((incident) => {
          const tone = SEVERITY_CLASSES[incident.severity] ?? 'bg-slate-100 text-slate-700 border-slate-200';
          const openedDescription = incident.openedAt
            ? `${formatRelativeTime(incident.openedAt)} · ${formatAbsolute(incident.openedAt)}`
            : null;
          const resolvedDescription = incident.resolvedAt
            ? `${formatRelativeTime(incident.resolvedAt)} · ${formatAbsolute(incident.resolvedAt)}`
            : null;
          const isResolved = incident.status === 'resolved';

          return (
            <div key={incident.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={classNames('inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold', tone)}>
                    <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                    {incident.severity}
                  </span>
                  <p className="text-sm font-semibold text-slate-900">{incident.summary}</p>
                </div>
                {isResolved ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Resolved
                  </span>
                ) : null}
              </div>
              {incident.description ? (
                <p className="mt-2 text-sm text-slate-600">{incident.description}</p>
              ) : null}
              <div className="mt-2 text-xs text-slate-500">
                {openedDescription ? <p>Opened {openedDescription}</p> : null}
                {resolvedDescription ? <p>Resolved {resolvedDescription}</p> : null}
              </div>
              {!isResolved && onResolve ? (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onResolve(incident.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-400 hover:text-amber-800"
                  >
                    <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                    Mark resolved
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
        {!sortedIncidents.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No incidents recorded.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}
