import { useState } from 'react';
import PropTypes from 'prop-types';

function parseMetadata(value) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error('Metadata must be valid JSON.');
  }
}

export default function EscrowAccountForm({
  mode,
  providers,
  statuses,
  defaultCurrency,
  account,
  onSubmit,
  submitting,
}) {
  const [form, setForm] = useState(() => ({
    provider: account?.provider ?? providers[0] ?? 'stripe',
    status: account?.status ?? 'pending',
    currencyCode: account?.currencyCode ?? defaultCurrency ?? 'USD',
    externalId: account?.externalId ?? '',
    walletAccountId: account?.walletAccountId ?? '',
    lastReconciledAt: account?.lastReconciledAt ? account.lastReconciledAt.slice(0, 16) : '',
    metadata: account?.metadata ? JSON.stringify(account.metadata, null, 2) : '',
  }));
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        provider: form.provider,
        status: form.status,
        currencyCode: form.currencyCode,
        externalId: form.externalId || undefined,
        walletAccountId: form.walletAccountId || undefined,
        lastReconciledAt: form.lastReconciledAt ? new Date(form.lastReconciledAt).toISOString() : undefined,
        metadata: form.metadata ? parseMetadata(form.metadata) : null,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err.message ?? 'Unable to save account.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Provider
          <select
            name="provider"
            value={form.provider}
            onChange={handleChange}
            disabled={mode === 'edit'}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Currency
          <input
            type="text"
            name="currencyCode"
            value={form.currencyCode}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          External ID
          <input
            type="text"
            name="externalId"
            value={form.externalId}
            onChange={handleChange}
            placeholder="Provider reference"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Wallet ID
          <input
            type="text"
            name="walletAccountId"
            value={form.walletAccountId}
            onChange={handleChange}
            placeholder="Internal wallet"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Last reconciled
          <input
            type="datetime-local"
            name="lastReconciledAt"
            value={form.lastReconciledAt}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        Metadata
        <textarea
          name="metadata"
          value={form.metadata}
          onChange={handleChange}
          rows={6}
          placeholder={`{\n  "notes": "Preferred provider"\n}`}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-2xl border border-blue-200 bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:border-blue-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Create account' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

EscrowAccountForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  providers: PropTypes.arrayOf(PropTypes.string),
  statuses: PropTypes.arrayOf(PropTypes.string),
  defaultCurrency: PropTypes.string,
  account: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

EscrowAccountForm.defaultProps = {
  providers: ['stripe'],
  statuses: ['pending', 'active'],
  defaultCurrency: 'USD',
  account: null,
  submitting: false,
};
