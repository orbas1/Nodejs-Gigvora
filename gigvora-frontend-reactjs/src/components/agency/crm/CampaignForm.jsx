import PropTypes from 'prop-types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const CAMPAIGN_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

export default function CampaignForm({ value, onChange, onSubmit, onCancel, saving }) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-accent/40 bg-white p-6 shadow-soft">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Name
          <input
            required
            value={value.name}
            onChange={(event) => onChange('name', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Enterprise outbound sprint"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            value={value.status}
            onChange={(event) => onChange('status', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          >
            {CAMPAIGN_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Target service
          <input
            value={value.targetService}
            onChange={(event) => onChange('targetService', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Fractional CMO"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Launch date
          <input
            type="date"
            value={value.launchDate}
            onChange={(event) => onChange('launchDate', event.target.value)}
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
          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Save campaign
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

CampaignForm.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string,
    status: PropTypes.string,
    targetService: PropTypes.string,
    launchDate: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

CampaignForm.defaultProps = {
  saving: false,
};
