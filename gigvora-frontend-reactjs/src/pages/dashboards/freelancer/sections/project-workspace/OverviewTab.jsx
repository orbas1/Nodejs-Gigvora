import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatCurrency, formatDate, formatNumber, formatPercent } from './helpers.js';

const metricCards = [
  { key: 'plannedBudgetCents', label: 'Planned budget', formatter: (value, metrics) => formatCurrency(value, metrics.currency) },
  { key: 'actualBudgetCents', label: 'Actual spend', formatter: (value, metrics) => formatCurrency(value, metrics.currency) },
  { key: 'totalWorkloadHours', label: 'Planned workload (hrs)', formatter: (value) => formatNumber(value, { maximumFractionDigits: 1 }) },
  { key: 'totalLoggedHours', label: 'Logged hours', formatter: (value) => formatNumber(value, { maximumFractionDigits: 1 }) },
  { key: 'openTasks', label: 'Open tasks', formatter: (value) => formatNumber(value) },
  { key: 'upcomingMeetings', label: 'Upcoming meetings', formatter: (value) => formatNumber(value) },
  { key: 'upcomingTimelineEvents', label: 'Upcoming events', formatter: (value) => formatNumber(value) },
  { key: 'activeTargets', label: 'Active targets', formatter: (value) => formatNumber(value) },
];

export default function OverviewTab({ operations, onUpdateTimeline, disabled = false }) {
  const metrics = operations?.metrics ?? {};
  const timeline = operations?.timeline ?? null;
  const [timelineDraft, setTimelineDraft] = useState(() => ({
    name: timeline?.name ?? '',
    ownerName: timeline?.ownerName ?? '',
    timezone: timeline?.timezone ?? 'UTC',
    startDate: timeline?.startDate ? timeline.startDate.slice(0, 10) : '',
    endDate: timeline?.endDate ? timeline.endDate.slice(0, 10) : '',
    baselineStartDate: timeline?.baselineStartDate ? timeline.baselineStartDate.slice(0, 10) : '',
    baselineEndDate: timeline?.baselineEndDate ? timeline.baselineEndDate.slice(0, 10) : '',
  }));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const projectMetrics = useMemo(() => {
    return metricCards.map((card) => {
      const value = metrics?.[card.key];
      const payload = { ...metrics, currency: operations?.project?.budgetCurrency ?? 'USD' };
      return {
        label: card.label,
        value: card.formatter(value ?? 0, payload),
      };
    });
  }, [metrics, operations?.project?.budgetCurrency]);

  const handleChange = (key, value) => {
    setTimelineDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await onUpdateTimeline({
        timeline: {
          name: timelineDraft.name || undefined,
          ownerName: timelineDraft.ownerName || undefined,
          timezone: timelineDraft.timezone || 'UTC',
          startDate: timelineDraft.startDate || undefined,
          endDate: timelineDraft.endDate || undefined,
          baselineStartDate: timelineDraft.baselineStartDate || undefined,
          baselineEndDate: timelineDraft.baselineEndDate || undefined,
        },
      });
      setFeedback({ type: 'success', message: 'Timeline saved.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message ?? 'Unable to update timeline.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {projectMetrics.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Timeline</h3>
              <p className="text-xs text-slate-500">Keep the schedule aligned across every view.</p>
            </div>
            {feedback ? (
              <span
                className={`text-xs font-semibold ${
                  feedback.type === 'error' ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {feedback.message}
              </span>
            ) : null}
          </div>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
            <div className="space-y-1">
              <label htmlFor="timelineName" className="text-sm font-medium text-slate-700">
                Timeline name
              </label>
              <input
                id="timelineName"
                value={timelineDraft.name}
                onChange={(event) => handleChange('name', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="timelineOwner" className="text-sm font-medium text-slate-700">
                Timeline owner
              </label>
              <input
                id="timelineOwner"
                value={timelineDraft.ownerName}
                onChange={(event) => handleChange('ownerName', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="timelineTimezone" className="text-sm font-medium text-slate-700">
                Timezone
              </label>
              <input
                id="timelineTimezone"
                value={timelineDraft.timezone}
                onChange={(event) => handleChange('timezone', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="timelineStart" className="text-sm font-medium text-slate-700">
                  Start date
                </label>
                <input
                  id="timelineStart"
                  type="date"
                  value={timelineDraft.startDate}
                  onChange={(event) => handleChange('startDate', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="timelineEnd" className="text-sm font-medium text-slate-700">
                  End date
                </label>
                <input
                  id="timelineEnd"
                  type="date"
                  value={timelineDraft.endDate}
                  onChange={(event) => handleChange('endDate', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="baselineStart" className="text-sm font-medium text-slate-700">
                  Baseline start
                </label>
                <input
                  id="baselineStart"
                  type="date"
                  value={timelineDraft.baselineStartDate}
                  onChange={(event) => handleChange('baselineStartDate', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="baselineEnd" className="text-sm font-medium text-slate-700">
                  Baseline end
                </label>
                <input
                  id="baselineEnd"
                  type="date"
                  value={timelineDraft.baselineEndDate}
                  onChange={(event) => handleChange('baselineEndDate', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving…' : 'Save timeline'}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Snapshot</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <dt className="text-slate-500">Start</dt>
              <dd className="font-medium text-slate-800">{formatDate(timeline?.startDate)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <dt className="text-slate-500">End</dt>
              <dd className="font-medium text-slate-800">{formatDate(timeline?.endDate)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <dt className="text-slate-500">Baseline start</dt>
              <dd className="font-medium text-slate-800">{formatDate(timeline?.baselineStartDate)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <dt className="text-slate-500">Baseline end</dt>
              <dd className="font-medium text-slate-800">{formatDate(timeline?.baselineEndDate)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <dt className="text-slate-500">Owner</dt>
              <dd className="font-medium text-slate-800">{timeline?.ownerName || '—'}</dd>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <dt className="text-slate-500">Timezone</dt>
              <dd className="font-medium text-slate-800">{timeline?.timezone || 'UTC'}</dd>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <dt className="text-slate-500">Progress</dt>
              <dd className="font-medium text-slate-800">
                {operations?.tasks?.length ? formatPercent((operations.tasks.filter((task) => task.status === 'completed').length / operations.tasks.length) * 100) : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

OverviewTab.propTypes = {
  operations: PropTypes.object,
  onUpdateTimeline: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
