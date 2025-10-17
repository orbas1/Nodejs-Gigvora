import PropTypes from 'prop-types';
import { STATUS_OPTIONS, VISIBILITY_OPTIONS, FORMAT_OPTIONS, CREATION_TYPES } from '../../config.js';
import ChipInput from '../components/ChipInput.jsx';

export default function OverviewStep({ draft, onChange }) {
  const type = CREATION_TYPES.find((entry) => entry.id === draft.type);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{type?.name ?? draft.type}</p>
        <p className="text-sm text-slate-500">{type?.tagline}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="creation-title">
            Title
          </label>
          <input
            id="creation-title"
            type="text"
            value={draft.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Name it clearly"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="creation-summary">
            Summary
          </label>
          <textarea
            id="creation-summary"
            rows={4}
            value={draft.summary}
            onChange={(event) => onChange({ summary: event.target.value })}
            placeholder="One-line pitch"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            value={draft.status}
            onChange={(event) => onChange({ status: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Visibility
          <select
            value={draft.visibility}
            onChange={(event) => onChange({ visibility: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Format
          <select
            value={draft.format}
            onChange={(event) => onChange({ format: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {FORMAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ChipInput
        label="Tags"
        values={draft.tags ?? []}
        placeholder="Add tag and hit enter"
        onChange={(values) => onChange({ tags: values })}
      />
      <ChipInput
        label="Audience"
        values={draft.audienceSegments ?? []}
        placeholder="Add audience"
        onChange={(values) => onChange({ audienceSegments: values })}
      />
    </div>
  );
}

OverviewStep.propTypes = {
  draft: PropTypes.shape({
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    summary: PropTypes.string,
    status: PropTypes.string,
    visibility: PropTypes.string,
    format: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    audienceSegments: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
