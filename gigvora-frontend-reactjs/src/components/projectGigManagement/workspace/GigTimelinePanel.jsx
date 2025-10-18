import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { GIG_ACTIVITY_TYPES } from '../../../constants/gigOrders.js';
import { formatRelativeTime } from '../../../utils/date.js';

const ACTIVITY_OPTIONS = GIG_ACTIVITY_TYPES.map((item) => ({ value: item.value, label: item.label }));

export default function GigTimelinePanel({ timeline, canManage, onAddEvent }) {
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    activityType: 'note',
    title: '',
    occurredAt: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredTimeline = useMemo(() => {
    if (filter === 'all') {
      return timeline;
    }
    return timeline.filter((event) => event.activityType === filter || event.kind === filter);
  }, [timeline, filter]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) {
      nextErrors.title = 'Add a title';
    }
    if (form.occurredAt && Number.isNaN(new Date(form.occurredAt).getTime())) {
      nextErrors.occurredAt = 'Use a valid date/time';
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setFeedback({ tone: 'error', message: 'Fix highlighted fields.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await onAddEvent({
        activityType: form.activityType,
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        occurredAt: form.occurredAt || new Date().toISOString(),
      });
      setFeedback({ tone: 'success', message: 'Timeline event logged.' });
      setForm({ activityType: 'note', title: '', occurredAt: '', description: '' });
      setErrors({});
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Could not save event.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Timeline</h3>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="all">All</option>
          {ACTIVITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5">
        {filteredTimeline.length ? (
          filteredTimeline.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-900">{item.title}</span>
                <span>{item.occurredAt ? formatRelativeTime(item.occurredAt) : 'Just now'}</span>
              </div>
              {item.description ? <p className="mt-2 text-sm text-slate-600">{item.description}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">{item.activityType ?? item.kind}</span>
                {item.ownerName ? <span className="rounded-full bg-slate-100 px-3 py-1">{item.ownerName}</span> : null}
              </div>
            </article>
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
            No events yet.
          </div>
        )}
      </div>
      <form className="rounded-3xl border border-slate-200 bg-white p-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)_200px]">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Type
            <select
              name="activityType"
              value={form.activityType}
              onChange={updateField}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              disabled={!canManage || submitting}
            >
              {ACTIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Title
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                errors.title ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
              }`}
              placeholder="Kickoff"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            When
            <input
              type="datetime-local"
              name="occurredAt"
              value={form.occurredAt}
              onChange={updateField}
              className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                errors.occurredAt ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
              }`}
              disabled={!canManage || submitting}
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Notes
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            rows={3}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Share context"
            disabled={!canManage || submitting}
          />
        </label>
        {feedback ? (
          <p className={`mt-3 text-sm ${feedback.tone === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback.message}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={!canManage || submitting}
          >
            {submitting ? 'Saving…' : 'Log event'}
          </button>
        </div>
      </form>
    </div>
  );
}

GigTimelinePanel.propTypes = {
  timeline: PropTypes.arrayOf(PropTypes.object).isRequired,
  canManage: PropTypes.bool,
  onAddEvent: PropTypes.func.isRequired,
};

GigTimelinePanel.defaultProps = {
  canManage: false,
};
