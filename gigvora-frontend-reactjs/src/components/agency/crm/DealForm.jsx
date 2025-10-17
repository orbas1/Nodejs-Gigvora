import PropTypes from 'prop-types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function DealForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  saving,
  stages,
  currency,
  editingDeal,
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-accent/40 bg-white p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-slate-900">
        {editingDeal ? `Edit ${editingDeal.title}` : 'Create new deal'}
      </h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Deal title
          <input
            required
            value={value.title}
            onChange={(event) => onChange('title', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Retainer opportunity"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Client name
          <input
            required
            value={value.clientName}
            onChange={(event) => onChange('clientName', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Acme Co"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Pipeline value ({currency})
          <input
            type="number"
            min="0"
            step="0.01"
            value={value.pipelineValue}
            onChange={(event) => onChange('pipelineValue', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="25000"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Stage
          <select
            value={value.stageId}
            onChange={(event) => onChange('stageId', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Win probability (%)
          <input
            type="number"
            min="0"
            max="100"
            value={value.winProbability}
            onChange={(event) => onChange('winProbability', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="65"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Expected close date
          <input
            type="date"
            value={value.expectedCloseDate}
            onChange={(event) => onChange('expectedCloseDate', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
          Source
          <input
            value={value.source}
            onChange={(event) => onChange('source', event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Referral, outbound, marketing"
          />
        </label>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:opacity-60"
          disabled={saving}
        >
          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
          {editingDeal ? 'Update deal' : 'Create deal'}
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

DealForm.propTypes = {
  value: PropTypes.shape({
    title: PropTypes.string,
    clientName: PropTypes.string,
    pipelineValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stageId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    winProbability: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    expectedCloseDate: PropTypes.string,
    source: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  stages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  currency: PropTypes.string,
  editingDeal: PropTypes.shape({ title: PropTypes.string }),
};

DealForm.defaultProps = {
  saving: false,
  currency: 'USD',
  editingDeal: null,
};
