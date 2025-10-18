import { useEffect, useState } from 'react';

const ACCOUNT_TYPES = ['user', 'freelancer', 'company', 'agency'];
const STATUSES = ['active', 'pending', 'suspended', 'closed'];
const PROVIDERS = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'escrow_com', label: 'Escrow' },
];

const DEFAULT_FORM = {
  userId: '',
  profileId: '',
  accountType: 'user',
  status: 'active',
  custodyProvider: 'stripe',
  currencyCode: 'USD',
  providerAccountId: '',
};

export default function WalletAccountCreateForm({
  onSubmit,
  loading,
  error,
  onCancel,
  variant = 'card',
  resetKey,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [localError, setLocalError] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    setForm(DEFAULT_FORM);
    setLocalError('');
    setStep(1);
  }, [resetKey]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleNext = (event) => {
    event.preventDefault();
    setLocalError('');
    if (!form.userId || !form.profileId) {
      setLocalError('Owner info required');
      return;
    }
    setStep(2);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError('');
    if (typeof onSubmit === 'function') {
      onSubmit({
        userId: Number(form.userId),
        profileId: Number(form.profileId),
        accountType: form.accountType,
        status: form.status,
        custodyProvider: form.custodyProvider,
        currencyCode: form.currencyCode,
        providerAccountId: form.providerAccountId?.trim() || undefined,
      });
    }
  };

  const containerClass =
    variant === 'drawer'
      ? 'flex h-full flex-col gap-6 px-6 py-6'
      : 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm';

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">New wallet</h3>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Step {step} of 2</p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        ) : null}
      </div>

      {step === 1 ? (
        <form className="grid gap-4" onSubmit={handleNext}>
          <div>
            <label htmlFor="userId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              User ID
            </label>
            <input
              id="userId"
              name="userId"
              type="number"
              min="1"
              value={form.userId}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              placeholder="123"
              required
            />
          </div>

          <div>
            <label htmlFor="profileId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Profile ID
            </label>
            <input
              id="profileId"
              name="profileId"
              type="number"
              min="1"
              value={form.profileId}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              placeholder="456"
              required
            />
          </div>

          {(error || localError) && <p className="text-sm text-rose-600">{error ?? localError}</p>}

          <div className="flex justify-end gap-2">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="submit"
              className="rounded-full border border-blue-500 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Next
            </button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="accountType" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
            </label>
            <select
              id="accountType"
              name="accountType"
              value={form.accountType}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="custodyProvider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Provider
            </label>
            <select
              id="custodyProvider"
              name="custodyProvider"
              value={form.custodyProvider}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              {PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="currencyCode" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Currency
            </label>
            <input
              id="currencyCode"
              name="currencyCode"
              value={form.currencyCode}
              onChange={handleChange}
              maxLength={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="providerAccountId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Provider ID (optional)
            </label>
            <input
              id="providerAccountId"
              name="providerAccountId"
              value={form.providerAccountId}
              onChange={handleChange}
              maxLength={160}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              placeholder="acct_1234"
            />
          </div>

          {(error || localError) && <p className="sm:col-span-2 text-sm text-rose-600">{error ?? localError}</p>}

          <div className="sm:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full border border-blue-500 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
