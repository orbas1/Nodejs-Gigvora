import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const EVENT_TYPE_OPTIONS = [
  { value: 'kickoff', label: 'Kickoff' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'check_in', label: 'Check-in' },
  { value: 'scope_change', label: 'Scope change' },
  { value: 'handoff', label: 'Handoff' },
  { value: 'qa', label: 'QA review' },
  { value: 'client_feedback', label: 'Client feedback' },
  { value: 'blocker', label: 'Blocker' },
];

const VISIBILITY_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'client', label: 'Client-visible' },
  { value: 'vendor', label: 'Vendor-visible' },
];

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    return '—';
  }
}

const INITIAL_FORM = {
  eventType: 'check_in',
  title: '',
  occurredAt: '',
  summary: '',
  visibility: 'internal',
};

export default function GigTimelineSection({ orderDetail, onAddEvent, loading, pending }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [feedback, setFeedback] = useState(null);

  const timeline = useMemo(() => orderDetail?.timeline ?? [], [orderDetail]);

  if (!orderDetail) {
    return (
      <section id="agency-gig-timeline" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Timeline</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Timeline</h2>
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
          Pick a gig to review milestones.
        </p>
      </section>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    if (!form.title.trim()) {
      setFeedback({ status: 'error', message: 'Add a title.' });
      return;
    }
    try {
      await onAddEvent?.({
        eventType: form.eventType,
        title: form.title,
        summary: form.summary || undefined,
        occurredAt: form.occurredAt || undefined,
        visibility: form.visibility,
      });
      setForm(INITIAL_FORM);
      setFeedback({ status: 'success', message: 'Logged.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message ?? 'Unable to add event.' });
    }
  };

  return (
    <section id="agency-gig-timeline" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Timeline</p>
          <h2 className="text-3xl font-semibold text-slate-900">{orderDetail.serviceName}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {timeline.length}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {timeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
              No entries yet.
            </div>
          ) : (
            <ol className="space-y-3">
              {timeline.map((event) => (
                <li key={event.id} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                    <span className="font-semibold text-slate-600">{event.eventType?.replace(/_/g, ' ')}</span>
                    <span>{formatDateTime(event.occurredAt)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{event.title}</p>
                  {event.summary ? <p className="mt-1 text-xs text-slate-500">{event.summary}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-sm font-semibold text-slate-900">Log event</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Type
              <select
                name="eventType"
                value={form.eventType}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Visibility
              <select
                name="visibility"
                value={form.visibility}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Title
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Kickoff call"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            When
            <input
              type="datetime-local"
              name="occurredAt"
              value={form.occurredAt}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Notes
            <textarea
              name="summary"
              value={form.summary}
              onChange={handleChange}
              rows={3}
              placeholder="Next steps"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          {feedback ? (
            <div
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                feedback.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

GigTimelineSection.propTypes = {
  orderDetail: PropTypes.shape({
    serviceName: PropTypes.string,
    timeline: PropTypes.arrayOf(PropTypes.object),
  }),
  onAddEvent: PropTypes.func,
  loading: PropTypes.bool,
  pending: PropTypes.bool,
};

GigTimelineSection.defaultProps = {
  orderDetail: null,
  onAddEvent: undefined,
  loading: false,
  pending: false,
};
