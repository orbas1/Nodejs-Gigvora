import { useState } from 'react';

const DEFAULT_FORM = {
  title: '',
  clientName: '',
  employmentType: 'full_time',
  seniority: '',
  status: 'draft',
  location: '',
  remoteAvailable: true,
  compensationMin: '',
  compensationMax: '',
  compensationCurrency: 'USD',
  summary: '',
  responsibilities: '',
  requirements: '',
  hiringManagerName: '',
  hiringManagerEmail: '',
  closesAt: '',
};

export default function JobCreationForm({ metadata, onSubmit, isSubmitting = false, workspaceId, onCancel }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [showDetails, setShowDetails] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title) {
      return;
    }
    onSubmit?.({
      ...form,
      workspaceId,
      compensationMin: form.compensationMin ? Number(form.compensationMin) : undefined,
      compensationMax: form.compensationMax ? Number(form.compensationMax) : undefined,
    });
    setForm(DEFAULT_FORM);
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">New role</h2>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Workspace {workspaceId || '—'}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDetails((previous) => !previous)}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            {showDetails ? 'Basics' : 'Details'}
          </button>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Job title
            <input
              required
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none"
              placeholder="Lead product designer"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Client or workspace
            <input
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none"
              placeholder="Northwind Labs"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Employment type
            <select
              name="employmentType"
              value={form.employmentType}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
            >
              {(metadata?.employmentTypes ?? ['full_time']).map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Seniority
            <select
              name="seniority"
              value={form.seniority}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
            >
              <option value="">Select</option>
              {(metadata?.seniorities ?? []).map((level) => (
                <option key={level} value={level}>
                  {level.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
            >
              {(metadata?.jobStatuses ?? ['draft']).map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Primary location
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none"
              placeholder="Remote - North America"
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="remoteAvailable"
              checked={Boolean(form.remoteAvailable)}
              onChange={handleChange}
              className="h-4 w-4 rounded border border-slate-300 text-accent focus:ring-accent"
            />
            Remote friendly
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Target close date
            <input
              type="date"
              name="closesAt"
              value={form.closesAt}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Min compensation
            <input
              name="compensationMin"
              value={form.compensationMin}
              onChange={handleChange}
              type="number"
              min="0"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              placeholder="90000"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Max compensation
            <input
              name="compensationMax"
              value={form.compensationMax}
              onChange={handleChange}
              type="number"
              min="0"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              placeholder="140000"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Currency
            <input
              name="compensationCurrency"
              value={form.compensationCurrency}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              placeholder="USD"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Summary
          <textarea
            name="summary"
            value={form.summary}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
            placeholder="Why this engagement matters and what success looks like."
          />
        </label>
        {showDetails ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 lg:col-span-1">
              Responsibilities
              <textarea
                name="responsibilities"
                value={form.responsibilities}
                onChange={handleChange}
                rows={5}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                placeholder="Outline the core responsibilities for the role."
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 lg:col-span-1">
              Requirements
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                rows={5}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                placeholder="Highlight the must-have experience and tooling."
              />
            </label>
            <div className="flex flex-col gap-4 lg:col-span-1">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Hiring manager name
                <input
                  name="hiringManagerName"
                  value={form.hiringManagerName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                  placeholder="Alex Patel"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Hiring manager email
                <input
                  type="email"
                  name="hiringManagerEmail"
                  value={form.hiringManagerEmail}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                  placeholder="alex@gigvora.com"
                />
              </label>
            </div>
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting || !form.title}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Create job'}
          </button>
        </div>
      </form>
    </div>
  );
}
