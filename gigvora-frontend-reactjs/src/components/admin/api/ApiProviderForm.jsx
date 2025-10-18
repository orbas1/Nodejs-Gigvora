import { useMemo, useState } from 'react';

const PROVIDER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'planned', label: 'Planned' },
];

function normaliseInitial(initial) {
  if (!initial) {
    return {
      name: '',
      slug: '',
      status: 'active',
      baseUrl: '',
      sandboxBaseUrl: '',
      docsUrl: '',
      iconUrl: '',
      contactEmail: '',
      description: '',
      callPrice: '',
    };
  }
  return {
    name: initial.name ?? '',
    slug: initial.slug ?? '',
    status: initial.status ?? 'active',
    baseUrl: initial.baseUrl ?? '',
    sandboxBaseUrl: initial.sandboxBaseUrl ?? '',
    docsUrl: initial.docsUrl ?? '',
    iconUrl: initial.iconUrl ?? '',
    contactEmail: initial.contactEmail ?? '',
    description: initial.description ?? '',
    callPrice:
      initial.callPriceCents != null
        ? (Number(initial.callPriceCents) / 100).toFixed(2)
        : '',
  };
}

export default function ApiProviderForm({
  initialValue,
  onSubmit,
  onCancel,
  submitting = false,
  title = 'Create API provider',
  submitLabel = 'Save provider',
}) {
  const defaults = useMemo(() => normaliseInitial(initialValue), [initialValue]);
  const [form, setForm] = useState(defaults);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    const payload = {
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      callPrice: form.callPrice ? Number(form.callPrice) : undefined,
      baseUrl: form.baseUrl.trim() || undefined,
      sandboxBaseUrl: form.sandboxBaseUrl.trim() || undefined,
      docsUrl: form.docsUrl.trim() || undefined,
      iconUrl: form.iconUrl.trim() || undefined,
      description: form.description.trim() || undefined,
    };

    if (!payload.name) {
      setErrors({ name: 'Provider name is required.' });
      return;
    }

    try {
      await onSubmit?.(payload);
    } catch (error) {
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error?.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else if (error instanceof Error) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: 'Unable to save provider.' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>

      {errors.general ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errors.general}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Provider name</span>
          <input
            value={form.name}
            onChange={handleChange('name')}
            required
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {errors.name ? <span className="text-xs text-rose-600">{errors.name}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Slug</span>
          <input
            value={form.slug}
            onChange={handleChange('slug')}
            placeholder="Optional unique identifier"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select
            value={form.status}
            onChange={handleChange('status')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {PROVIDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Contact email</span>
          <input
            type="email"
            value={form.contactEmail}
            onChange={handleChange('contactEmail')}
            placeholder="ops@gigvora.com"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {errors.contactEmail ? <span className="text-xs text-rose-600">{errors.contactEmail}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Price per call ($)</span>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={form.callPrice}
            onChange={handleChange('callPrice')}
            placeholder="0.25"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Production base URL</span>
          <input
            value={form.baseUrl}
            onChange={handleChange('baseUrl')}
            placeholder="https://api.partner.com"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Sandbox base URL</span>
          <input
            value={form.sandboxBaseUrl}
            onChange={handleChange('sandboxBaseUrl')}
            placeholder="https://sandbox.partner.com"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Docs URL</span>
          <input
            value={form.docsUrl}
            onChange={handleChange('docsUrl')}
            placeholder="https://partner.com/docs"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Icon URL</span>
          <input
            value={form.iconUrl}
            onChange={handleChange('iconUrl')}
            placeholder="https://cdn.partner.com/icon.svg"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Description</span>
        <textarea
          value={form.description}
          onChange={handleChange('description')}
          rows={4}
          placeholder="What does this integration unlock for Gigvora teams?"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </label>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
