import PropTypes from 'prop-types';
import {
  APPLICATION_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  PAYOUT_OPTIONS,
  CURRENCY_OPTIONS,
} from '../../config.js';
import ChipInput from '../components/ChipInput.jsx';

export default function DetailsStep({ draft, onChange }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="creation-description">
          Description
        </label>
        <textarea
          id="creation-description"
          rows={8}
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Describe the offer"
          className="w-full rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <ChipInput
        label="Deliverables"
        values={draft.deliverables ?? []}
        placeholder="Add deliverable"
        onChange={(values) => onChange({ deliverables: values })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Application type
          <select
            value={draft.applicationType}
            onChange={(event) => onChange({ applicationType: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {APPLICATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="application-url">
            Application link
          </label>
          <input
            id="application-url"
            type="url"
            value={draft.applicationUrl ?? ''}
            onChange={(event) => onChange({ applicationUrl: event.target.value })}
            placeholder="https://"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="application-deadline">
            Apply by
          </label>
          <input
            id="application-deadline"
            type="date"
            value={draft.applicationDeadline ?? ''}
            onChange={(event) => onChange({ applicationDeadline: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="start-at">
            Start
          </label>
          <input
            id="start-at"
            type="date"
            value={draft.startAt ?? ''}
            onChange={(event) => onChange({ startAt: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="end-at">
            Wrap
          </label>
          <input
            id="end-at"
            type="date"
            value={draft.endAt ?? ''}
            onChange={(event) => onChange({ endAt: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Experience
          <select
            value={draft.experienceLevel ?? ''}
            onChange={(event) => onChange({ experienceLevel: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Select</option>
            {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="commitment-hours">
            Weekly hours
          </label>
          <input
            id="commitment-hours"
            type="number"
            min="0"
            step="0.5"
            value={draft.commitmentHours ?? ''}
            onChange={(event) => onChange({ commitmentHours: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Payout type
          <select
            value={draft.payoutType}
            onChange={(event) => onChange({ payoutType: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {PAYOUT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Currency
          <select
            value={draft.compensationCurrency ?? 'USD'}
            onChange={(event) => onChange({ compensationCurrency: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="comp-min">
            Min
          </label>
          <input
            id="comp-min"
            type="number"
            min="0"
            value={draft.compensationMin ?? ''}
            onChange={(event) => onChange({ compensationMin: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="comp-max">
            Max
          </label>
          <input
            id="comp-max"
            type="number"
            min="0"
            value={draft.compensationMax ?? ''}
            onChange={(event) => onChange({ compensationMax: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="cta-label">
            CTA label
          </label>
          <input
            id="cta-label"
            type="text"
            value={draft.ctaLabel ?? ''}
            onChange={(event) => onChange({ ctaLabel: event.target.value })}
            placeholder="Apply now"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            type="url"
            value={draft.ctaUrl ?? ''}
            onChange={(event) => onChange({ ctaUrl: event.target.value })}
            placeholder="Link"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
    </div>
  );
}

DetailsStep.propTypes = {
  draft: PropTypes.shape({
    description: PropTypes.string,
    deliverables: PropTypes.arrayOf(PropTypes.string),
    applicationType: PropTypes.string,
    applicationUrl: PropTypes.string,
    applicationDeadline: PropTypes.string,
    startAt: PropTypes.string,
    endAt: PropTypes.string,
    experienceLevel: PropTypes.string,
    commitmentHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    payoutType: PropTypes.string,
    compensationCurrency: PropTypes.string,
    compensationMin: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    compensationMax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ctaLabel: PropTypes.string,
    ctaUrl: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
