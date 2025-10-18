import PropTypes from 'prop-types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function FollowUpForm({ value, deals, onChange, onSubmit, onCancel, saving }) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-accent/40 bg-white p-6 shadow-soft">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Deal
          <select
            value={value.dealId}
            onChange={(event) => onChange('dealId', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          >
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.title} · {deal.clientName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Due date
          <input
            type="date"
            required
            value={value.dueAt}
            onChange={(event) => onChange('dueAt', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Channel
          <input
            value={value.channel}
            onChange={(event) => onChange('channel', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Email, call, Slack"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
          Notes
          <textarea
            value={value.note}
            onChange={(event) => onChange('note', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            rows={3}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:opacity-60"
          disabled={saving}
        >
          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Schedule
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

FollowUpForm.propTypes = {
  value: PropTypes.shape({
    dealId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    dueAt: PropTypes.string,
    channel: PropTypes.string,
    note: PropTypes.string,
  }).isRequired,
  deals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string.isRequired,
      clientName: PropTypes.string,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

FollowUpForm.defaultProps = {
  saving: false,
};
