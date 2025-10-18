import PropTypes from 'prop-types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const PROPOSAL_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
];

export default function ProposalForm({ value, deals, templates, onChange, onSubmit, onCancel, saving }) {
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
          Title
          <input
            required
            value={value.title}
            onChange={(event) => onChange('title', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="New proposal"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            value={value.status}
            onChange={(event) => onChange('status', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          >
            {PROPOSAL_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Template
          <select
            value={value.templateId}
            onChange={(event) => onChange('templateId', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Blank</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sent date
          <input
            type="date"
            value={value.sentAt}
            onChange={(event) => onChange('sentAt', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:opacity-60"
          disabled={saving}
        >
          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Save proposal
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

ProposalForm.propTypes = {
  value: PropTypes.shape({
    dealId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
    status: PropTypes.string,
    templateId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    sentAt: PropTypes.string,
  }).isRequired,
  deals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string.isRequired,
      clientName: PropTypes.string,
    }),
  ).isRequired,
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

ProposalForm.defaultProps = {
  saving: false,
};
