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

function buildInitialValues(favourite) {
  if (!favourite) {
    return {
      title: '',
      companyName: '',
      location: '',
      priority: 'watching',
      salaryMin: '',
      salaryMax: '',
      currencyCode: 'USD',
      sourceUrl: '',
      tags: '',
      notes: '',
      savedAt: '',
    };
  }
  return {
    title: favourite.title ?? '',
    companyName: favourite.companyName ?? '',
    location: favourite.location ?? '',
    priority: favourite.priority ?? 'watching',
    salaryMin: favourite.salaryMin ?? '',
    salaryMax: favourite.salaryMax ?? '',
    currencyCode: favourite.currencyCode ?? 'USD',
    sourceUrl: favourite.sourceUrl ?? '',
    tags: Array.isArray(favourite.tags) ? favourite.tags.join(', ') : '',
    notes: favourite.notes ?? '',
    savedAt: toInputDateTime(favourite.savedAt),
  };
}

function validate(values) {
  const errors = {};
  if (!values.title.trim()) {
    errors.title = 'Enter the role name';
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
    title: values.title.trim(),
    companyName: values.companyName.trim() || null,
    location: values.location.trim() || null,
    priority: values.priority,
    salaryMin: values.salaryMin === '' ? null : Number(values.salaryMin),
    salaryMax: values.salaryMax === '' ? null : Number(values.salaryMax),
    currencyCode: values.currencyCode ? values.currencyCode.toUpperCase() : null,
    sourceUrl: values.sourceUrl.trim() || null,
    tags: values.tags
      ? values.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
    notes: values.notes.trim() || null,
    savedAt: values.savedAt ? new Date(values.savedAt).toISOString() : undefined,
  };
}

export default function FavouriteForm({
  mode,
  priorityOptions,
  initialFavourite,
  busy,
  error,
  onSubmit,
  onCancel,
  onDelete,
}) {
  const [values, setValues] = useState(() => buildInitialValues(initialFavourite));
  const [touched, setTouched] = useState({});
  const errors = useMemo(() => validate(values), [values]);
  const showError = (name) => touched[name] && errors[name];

  useEffect(() => {
    setValues(buildInitialValues(initialFavourite));
    setTouched({});
  }, [initialFavourite]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched((prev) => ({ ...prev, title: true }));
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
            name="title"
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`rounded-xl border px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              showError('title') ? 'border-rose-300' : 'border-slate-200'
            }`}
            placeholder="Marketing Lead"
          />
          {showError('title') ? <span className="text-xs text-rose-500">{errors.title}</span> : null}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company</span>
            <input
              name="companyName"
              value={values.companyName}
              onChange={handleChange}
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
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Remote"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</span>
            <select
              name="priority"
              value={values.priority}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved</span>
            <input
              type="datetime-local"
              name="savedAt"
              value={values.savedAt}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
              placeholder="50000"
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
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Link</span>
          <input
            name="sourceUrl"
            value={values.sourceUrl}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="https://"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</span>
          <input
            name="tags"
            value={values.tags}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="leadership, seed"
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
            placeholder="Fit summary"
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">{error.message ?? 'Unable to save right now.'}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {mode === 'edit' && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              Delete
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
          {mode === 'edit' ? 'Save changes' : 'Save'}
        </button>
      </div>
    </form>
  );
}

FavouriteForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  priorityOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  initialFavourite: PropTypes.object,
  busy: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};

FavouriteForm.defaultProps = {
  initialFavourite: null,
  busy: false,
  error: null,
  onDelete: undefined,
};
