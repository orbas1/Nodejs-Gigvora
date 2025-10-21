import { useEffect, useMemo, useState } from 'react';

const DEFAULT_JOB = {
  title: '',
  description: '',
  location: '',
  employmentType: '',
  remoteType: 'remote',
  openings: 1,
  currencyCode: 'USD',
  compensationMin: '',
  compensationMax: '',
  status: 'draft',
  keywords: [],
};

const sanitiseCurrencyCode = (value) => {
  if (!value) {
    return '';
  }
  return value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
};

const parseNumberField = (value) => {
  if (value === '' || value == null) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

function toKeywordString(keywords) {
  if (!Array.isArray(keywords) || !keywords.length) {
    return '';
  }
  return keywords
    .map((entry) => (typeof entry === 'string' ? entry : entry?.keyword))
    .filter(Boolean)
    .join(', ');
}

function parseKeywordString(value) {
  if (!value || !`${value}`.trim()) {
    return [];
  }
  return `${value}`
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .map((keyword) => ({ keyword, weight: 1 }));
}

export default function JobAdvertForm({
  initialJob = null,
  lookups,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Save job',
}) {
  const jobStatuses = lookups?.jobStatuses ?? [];
  const remoteTypes = lookups?.remoteTypes ?? [];

  const initialState = useMemo(() => {
    if (!initialJob) {
      return { ...DEFAULT_JOB };
    }
    const job = initialJob.job ?? initialJob;
    const advert = initialJob.advert ?? initialJob;
    return {
      title: job.title ?? '',
      description: job.description ?? '',
      location: job.location ?? '',
      employmentType: job.employmentType ?? '',
      remoteType: advert.remoteType ?? 'remote',
      openings: advert.openings ?? 1,
      currencyCode: sanitiseCurrencyCode(advert.currencyCode ?? 'USD') || 'USD',
      compensationMin: advert.compensationMin ?? advert.salaryMin ?? '',
      compensationMax: advert.compensationMax ?? advert.salaryMax ?? '',
      status: advert.status ?? 'draft',
      keywords: toKeywordString(initialJob.keywords ?? advert.keywords ?? []),
      department: advert.metadata?.department ?? '',
    };
  }, [initialJob]);

  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(initialState);
    setErrors({});
  }, [initialState]);

  const clearError = (field) => {
    if (!field) {
      return;
    }
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleNumberChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    clearError(name);
    if (name === 'compensationMin' || name === 'compensationMax') {
      clearError('compensationMin');
      clearError('compensationMax');
    }
  };

  const handleCurrencyChange = (event) => {
    const sanitised = sanitiseCurrencyCode(event.target.value);
    setValues((prev) => ({ ...prev, currencyCode: sanitised }));
    clearError('currencyCode');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!values.title.trim()) {
      nextErrors.title = 'Title is required';
    }
    if (!values.description.trim()) {
      nextErrors.description = 'Description is required';
    }
    const openingsValue = Number.parseInt(values.openings, 10);
    if (!Number.isInteger(openingsValue) || openingsValue < 1) {
      nextErrors.openings = 'Openings must be at least 1';
    }
    const minComp = parseNumberField(values.compensationMin);
    const maxComp = parseNumberField(values.compensationMax);
    if (values.compensationMin !== '' && minComp === null) {
      nextErrors.compensationMin = 'Enter a valid number';
    }
    if (values.compensationMax !== '' && maxComp === null) {
      nextErrors.compensationMax = 'Enter a valid number';
    }
    if (minComp != null && minComp < 0) {
      nextErrors.compensationMin = 'Minimum cannot be negative';
    }
    if (maxComp != null && maxComp < 0) {
      nextErrors.compensationMax = 'Maximum cannot be negative';
    }
    if (
      minComp != null &&
      maxComp != null &&
      values.compensationMin !== '' &&
      values.compensationMax !== '' &&
      minComp > maxComp
    ) {
      nextErrors.compensationMax = 'Maximum must be greater than minimum';
    }
    const currencyCode = sanitiseCurrencyCode(values.currencyCode);
    if (!currencyCode) {
      nextErrors.currencyCode = 'Currency is required';
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    if (currencyCode !== values.currencyCode) {
      setValues((prev) => ({ ...prev, currencyCode }));
    }
    const payload = {
      title: values.title,
      description: values.description,
      location: values.location,
      employmentType: values.employmentType,
      remoteType: values.remoteType,
      openings: Number.isInteger(openingsValue) && openingsValue > 0 ? openingsValue : 1,
      currencyCode,
      compensationMin: minComp,
      compensationMax: maxComp,
      status: values.status,
      department: values.department,
    };
    const keywords = parseKeywordString(values.keywords);
    onSubmit?.({ payload, keywords });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Job title</span>
          <input
            name="title"
            value={values.title}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Senior Product Manager"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'job-title-error' : undefined}
            autoComplete="off"
            required
          />
          {errors.title ? (
            <span id="job-title-error" role="alert" className="text-xs text-rose-600">
              {errors.title}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Location</span>
          <input
            name="location"
            value={values.location}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Remote or city"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Employment type</span>
          <input
            name="employmentType"
            value={values.employmentType}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Full-time, contract, temporary"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Remote policy</span>
          <select
            name="remoteType"
            value={values.remoteType}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {remoteTypes.length
              ? remoteTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              : ['onsite', 'hybrid', 'remote'].map((value) => (
                  <option key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Openings</span>
          <input
            name="openings"
            value={values.openings}
            onChange={handleNumberChange}
            type="number"
            min="1"
            inputMode="numeric"
            aria-invalid={Boolean(errors.openings)}
            aria-describedby={errors.openings ? 'job-openings-error' : undefined}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {errors.openings ? (
            <span id="job-openings-error" role="alert" className="text-xs text-rose-600">
              {errors.openings}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Currency</span>
          <input
            name="currencyCode"
            value={values.currencyCode}
            onChange={handleCurrencyChange}
            className="uppercase rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            maxLength={3}
            inputMode="text"
            aria-invalid={Boolean(errors.currencyCode)}
            aria-describedby={errors.currencyCode ? 'job-currency-error' : undefined}
          />
          {errors.currencyCode ? (
            <span id="job-currency-error" role="alert" className="text-xs text-rose-600">
              {errors.currencyCode}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Compensation minimum</span>
          <input
            name="compensationMin"
            value={values.compensationMin}
            onChange={handleNumberChange}
            type="number"
            step="0.01"
            inputMode="decimal"
            aria-invalid={Boolean(errors.compensationMin)}
            aria-describedby={errors.compensationMin ? 'job-compensation-min-error' : undefined}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {errors.compensationMin ? (
            <span id="job-compensation-min-error" role="alert" className="text-xs text-rose-600">
              {errors.compensationMin}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Compensation maximum</span>
          <input
            name="compensationMax"
            value={values.compensationMax}
            onChange={handleNumberChange}
            type="number"
            step="0.01"
            inputMode="decimal"
            aria-invalid={Boolean(errors.compensationMax)}
            aria-describedby={errors.compensationMax ? 'job-compensation-max-error' : undefined}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {errors.compensationMax ? (
            <span id="job-compensation-max-error" role="alert" className="text-xs text-rose-600">
              {errors.compensationMax}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Hiring status</span>
          <select
            name="status"
            value={values.status}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {(jobStatuses.length ? jobStatuses : [{ value: 'draft', label: 'Draft' }]).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label ?? option.value}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Hiring department</span>
          <input
            name="department"
            value={values.department ?? ''}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Product, Engineering, Operations"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Job description</span>
        <textarea
          name="description"
          value={values.description}
          onChange={handleChange}
          rows={6}
          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Outline responsibilities, impact, and success criteria."
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'job-description-error' : undefined}
          required
        />
        {errors.description ? (
          <span id="job-description-error" role="alert" className="text-xs text-rose-600">
            {errors.description}
          </span>
        ) : null}
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Keywords</span>
        <input
          name="keywords"
          value={values.keywords}
          onChange={handleChange}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Product discovery, B2B SaaS, Agile"
        />
      </label>
      <div className="flex items-center justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
