import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

function toInputDateTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function coerceNumber(value) {
  if (value === '' || value == null) return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : '';
}

function normaliseCurrency(value) {
  if (!value) return '';
  return value.toUpperCase().slice(0, 3);
}

function buildInitialValues(application) {
  if (!application) {
    return {
      jobTitle: '',
      companyName: '',
      location: '',
      status: 'submitted',
      submittedAt: '',
      jobUrl: '',
      source: '',
      salaryMin: '',
      salaryMax: '',
      currencyCode: 'USD',
      tags: '',
      notes: '',
    };
  }
  const detail = application.detail ?? {};
  const salary = detail.salary ?? {};
  const tags = Array.isArray(detail.tags) ? detail.tags.join(', ') : '';
  return {
    jobTitle: detail.title ?? '',
    companyName: detail.companyName ?? '',
    location: detail.location ?? '',
    status: application.status ?? 'submitted',
    submittedAt: toInputDateTime(application.submittedAt),
    jobUrl: detail.jobUrl ?? '',
    source: detail.source ?? application.sourceChannel ?? '',
    salaryMin: salary.min ?? '',
    salaryMax: salary.max ?? '',
    currencyCode: salary.currency ?? application.currencyCode ?? 'USD',
    tags,
    notes: detail.notes ?? '',
  };
}

function validate(values) {
  const errors = {};
  if (!values.jobTitle.trim()) {
    errors.jobTitle = 'Enter the role name';
  }
  if (values.salaryMin !== '' && Number.isNaN(Number(values.salaryMin))) {
    errors.salaryMin = 'Use a number';
  }
  if (values.salaryMax !== '' && Number.isNaN(Number(values.salaryMax))) {
    errors.salaryMax = 'Use a number';
  }
  if (values.currencyCode && values.currencyCode.length !== 3) {
    errors.currencyCode = '3 letter code';
  }
  return errors;
}

function preparePayload(values) {
  return {
    jobTitle: values.jobTitle.trim(),
    companyName: values.companyName.trim() || null,
    location: values.location.trim() || null,
    status: values.status,
    submittedAt: values.submittedAt ? new Date(values.submittedAt).toISOString() : undefined,
    jobUrl: values.jobUrl.trim() || null,
    source: values.source.trim() || null,
    salaryMin: values.salaryMin === '' ? null : Number(values.salaryMin),
    salaryMax: values.salaryMax === '' ? null : Number(values.salaryMax),
    currencyCode: values.currencyCode ? values.currencyCode.toUpperCase() : null,
    tags: values.tags
      ? values.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
    notes: values.notes.trim() || null,
  };
}

export default function ApplicationForm({
  mode,
  initialApplication,
  statusOptions,
  busy,
  error,
  onSubmit,
  onCancel,
  onArchive,
}) {
  const [values, setValues] = useState(() => buildInitialValues(initialApplication));
  const [touched, setTouched] = useState({});
  const errors = useMemo(() => validate(values), [values]);
  const showError = (name) => touched[name] && errors[name];

  useEffect(() => {
    setValues(buildInitialValues(initialApplication));
    setTouched({});
  }, [initialApplication]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'salaryMin' || name === 'salaryMax') {
      setValues((prev) => ({ ...prev, [name]: coerceNumber(value) }));
      return;
    }
    if (name === 'currencyCode') {
      setValues((prev) => ({ ...prev, [name]: normaliseCurrency(value) }));
      return;
    }
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched((prev) => ({ ...prev, jobTitle: true }));
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit(preparePayload(values));
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
          <input
            required
            name="jobTitle"
            value={values.jobTitle}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`rounded-xl border px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              showError('jobTitle') ? 'border-rose-300' : 'border-slate-200'
            }`}
            placeholder="Product Designer"
          />
          {showError('jobTitle') ? <span className="text-xs text-rose-500">{errors.jobTitle}</span> : null}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company</span>
            <input
              name="companyName"
              value={values.companyName}
              onChange={handleChange}
              onBlur={handleBlur}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Acme"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</span>
            <input
              name="location"
              value={values.location}
              onChange={handleChange}
              onBlur={handleBlur}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Remote"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select
              name="status"
              value={values.status}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applied</span>
            <input
              type="datetime-local"
              name="submittedAt"
              value={values.submittedAt}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</span>
            <input
              name="source"
              value={values.source}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Referral"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Job link</span>
            <input
              name="jobUrl"
              value={values.jobUrl}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="https://"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Salary min</span>
            <input
              name="salaryMin"
              value={values.salaryMin}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`rounded-xl border px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                showError('salaryMin') ? 'border-rose-300' : 'border-slate-200'
              }`}
              placeholder="60000"
            />
            {showError('salaryMin') ? <span className="text-xs text-rose-500">{errors.salaryMin}</span> : null}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Salary max</span>
            <input
              name="salaryMax"
              value={values.salaryMax}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`rounded-xl border px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                showError('salaryMax') ? 'border-rose-300' : 'border-slate-200'
              }`}
              placeholder="90000"
            />
            {showError('salaryMax') ? <span className="text-xs text-rose-500">{errors.salaryMax}</span> : null}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</span>
            <input
              name="currencyCode"
              value={values.currencyCode}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`rounded-xl border px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                showError('currencyCode') ? 'border-rose-300' : 'border-slate-200'
              }`}
              placeholder="USD"
            />
            {showError('currencyCode') ? <span className="text-xs text-rose-500">{errors.currencyCode}</span> : null}
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</span>
          <input
            name="tags"
            value={values.tags}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="frontend, leadership"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
          <textarea
            name="notes"
            rows={4}
            value={values.notes}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Key follow ups"
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">{error.message ?? 'Unable to save right now.'}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {mode === 'edit' && onArchive ? (
            <button
              type="button"
              onClick={onArchive}
              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              Archive
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {mode === 'edit' ? 'Save changes' : 'Create'}
        </button>
      </div>
    </form>
  );
}

ApplicationForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialApplication: PropTypes.object,
  statusOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  busy: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onArchive: PropTypes.func,
};

ApplicationForm.defaultProps = {
  initialApplication: null,
  busy: false,
  error: null,
  onArchive: undefined,
};
