import { useEffect, useMemo, useState } from 'react';
import WalletAccountPicker from './WalletAccountPicker.jsx';

const CLIENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'revoked', label: 'Revoked' },
];

const ACCESS_LEVELS = [
  { value: 'read', label: 'Read only' },
  { value: 'write', label: 'Read & write' },
  { value: 'admin', label: 'Admin' },
];

function normaliseInitial(initial) {
  if (!initial) {
    return {
      providerId: '',
      name: '',
      slug: '',
      status: 'active',
      accessLevel: 'read',
      contactEmail: '',
      description: '',
      rateLimitPerMinute: '',
      webhookUrl: '',
      ipAllowList: '',
      scopes: '',
      walletAccountId: '',
      callPrice: '',
    };
  }

  return {
    providerId: initial.providerId ?? '',
    name: initial.name ?? '',
    slug: initial.slug ?? '',
    status: initial.status ?? 'active',
    accessLevel: initial.accessLevel ?? 'read',
    contactEmail: initial.contactEmail ?? '',
    description: initial.description ?? '',
    rateLimitPerMinute: initial.rateLimitPerMinute ?? '',
    webhookUrl: initial.webhookUrl ?? '',
    ipAllowList: Array.isArray(initial.ipAllowList) ? initial.ipAllowList.join(', ') : '',
    scopes: Array.isArray(initial.scopes) ? initial.scopes.join(', ') : '',
    walletAccountId: initial.billing?.walletAccountId ?? initial.walletAccountId ?? '',
    callPrice:
      initial.billing?.callPriceCents != null
        ? (Number(initial.billing.callPriceCents) / 100).toFixed(2)
        : '',
  };
}

export default function ApiClientForm({
  providers = [],
  initialValue,
  onSubmit,
  onCancel,
  submitting = false,
  title = 'Provision API client',
  submitLabel = 'Save client',
}) {
  const defaults = useMemo(() => normaliseInitial(initialValue), [initialValue]);
  const [form, setForm] = useState(defaults);
  const [errors, setErrors] = useState({});
  const [selectedWallet, setSelectedWallet] = useState(initialValue?.billing?.walletAccount ?? null);

  useEffect(() => {
    setForm(defaults);
    setSelectedWallet(initialValue?.billing?.walletAccount ?? null);
  }, [defaults, initialValue]);

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    const payload = {
      providerId: form.providerId || undefined,
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      status: form.status,
      accessLevel: form.accessLevel,
      contactEmail: form.contactEmail.trim() || undefined,
      description: form.description.trim() || undefined,
      rateLimitPerMinute: form.rateLimitPerMinute ? Number(form.rateLimitPerMinute) : undefined,
      webhookUrl: form.webhookUrl.trim() || undefined,
      ipAllowList: form.ipAllowList
        ? form.ipAllowList
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
      scopes: form.scopes
        ? form.scopes
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
      walletAccountId: form.walletAccountId || undefined,
      callPrice: form.callPrice ? Number(form.callPrice) : undefined,
    };

    if (!payload.providerId) {
      setErrors({ providerId: 'Select a provider.' });
      return;
    }

    if (!payload.name) {
      setErrors({ name: 'Client name is required.' });
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
        setErrors({ general: 'Unable to save client.' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-6">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>

      {errors.general ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errors.general}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Provider</span>
          <select
            value={form.providerId}
            onChange={handleChange('providerId')}
            required
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Select provider…</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          {errors.providerId ? <span className="text-xs text-rose-600">{errors.providerId}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Client name</span>
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
            placeholder="Optional identifier"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Contact email</span>
          <input
            type="email"
            value={form.contactEmail}
            onChange={handleChange('contactEmail')}
            placeholder="integrations@gigvora.com"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {errors.contactEmail ? <span className="text-xs text-rose-600">{errors.contactEmail}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select
            value={form.status}
            onChange={handleChange('status')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {CLIENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Access level</span>
          <select
            value={form.accessLevel}
            onChange={handleChange('accessLevel')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {ACCESS_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Price per call ($)</span>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={form.callPrice}
            onChange={handleChange('callPrice')}
            placeholder="Inherited"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Rate limit (requests / minute)</span>
          <input
            type="number"
            min="0"
            value={form.rateLimitPerMinute}
            onChange={handleChange('rateLimitPerMinute')}
            placeholder="Optional"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {errors.rateLimitPerMinute ? (
            <span className="text-xs text-rose-600">{errors.rateLimitPerMinute}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Webhook callback URL</span>
          <input
            value={form.webhookUrl}
            onChange={handleChange('webhookUrl')}
            placeholder="https://api.gigvora.com/webhooks"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>

      <WalletAccountPicker
        value={form.walletAccountId}
        selectedAccount={selectedWallet}
        onChange={(id, account) => {
          setForm((previous) => ({ ...previous, walletAccountId: id ?? '' }));
          setSelectedWallet(account ?? null);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">IP allow list</span>
          <textarea
            value={form.ipAllowList}
            onChange={handleChange('ipAllowList')}
            rows={3}
            placeholder="Separate with commas — 203.0.113.2, 2001:db8::1"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Allowed scopes</span>
          <textarea
            value={form.scopes}
            onChange={handleChange('scopes')}
            rows={3}
            placeholder="Comma separated scopes — profiles.read, projects.write"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Description</span>
        <textarea
          value={form.description}
          onChange={handleChange('description')}
          rows={4}
          placeholder="How will this client use the Gigvora API?"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </label>

      <div className="mt-auto flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
