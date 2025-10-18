import { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

function resolveErrorMessage(error) {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.body?.message) {
    return error.body.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'We could not update the wallet settings. Please try again.';
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

export default function WalletSettingsCard({ wallet, onUpdate, onRefresh }) {
  const [formState, setFormState] = useState({
    name: '',
    status: 'active',
    spendingLimitAmount: '',
    autoTopUpEnabled: false,
    autoTopUpAmount: '',
    autoTopUpThreshold: '',
    restrictedCategories: '',
    complianceNotes: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!wallet) {
      setFormState({
        name: '',
        status: 'active',
        spendingLimitAmount: '',
        autoTopUpEnabled: false,
        autoTopUpAmount: '',
        autoTopUpThreshold: '',
        restrictedCategories: '',
        complianceNotes: '',
      });
      setSavedAt(null);
      setError(null);
      return;
    }
    setFormState({
      name: wallet.name ?? '',
      status: wallet.status ?? 'active',
      spendingLimitAmount: wallet.spendingLimitAmount != null ? `${wallet.spendingLimitAmount}` : '',
      autoTopUpEnabled: Boolean(wallet.autoTopUpEnabled),
      autoTopUpAmount: wallet.autoTopUpAmount != null ? `${wallet.autoTopUpAmount}` : '',
      autoTopUpThreshold: wallet.autoTopUpThreshold != null ? `${wallet.autoTopUpThreshold}` : '',
      restrictedCategories: Array.isArray(wallet.restrictedCategories)
        ? wallet.restrictedCategories.join(', ')
        : '',
      complianceNotes: wallet.complianceNotes ?? '',
    });
    setSavedAt(wallet.updatedAt ? new Date(wallet.updatedAt) : null);
    setError(null);
  }, [wallet]);

  const restrictedCategoriesList = useMemo(() => {
    if (!formState.restrictedCategories) {
      return [];
    }
    return formState.restrictedCategories
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [formState.restrictedCategories]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!wallet || !onUpdate) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: formState.name.trim() || undefined,
        status: formState.status || undefined,
        spendingLimitAmount:
          formState.spendingLimitAmount !== '' ? Number.parseFloat(formState.spendingLimitAmount) : undefined,
        autoTopUpEnabled: formState.autoTopUpEnabled,
        autoTopUpAmount:
          formState.autoTopUpAmount !== '' ? Number.parseFloat(formState.autoTopUpAmount) : undefined,
        autoTopUpThreshold:
          formState.autoTopUpThreshold !== '' ? Number.parseFloat(formState.autoTopUpThreshold) : undefined,
        restrictedCategories: restrictedCategoriesList.length ? restrictedCategoriesList : [],
        complianceNotes: formState.complianceNotes.trim() || undefined,
      };
      await onUpdate(payload);
      setSavedAt(new Date());
      onRefresh?.();
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Settings</h3>
        {savedAt ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
            Saved {savedAt.toLocaleTimeString()}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 inline-flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Update failed</p>
            <p className="mt-1 text-xs text-rose-600/80">{error}</p>
          </div>
        </div>
      ) : null}

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wallet-settings-name" className="text-sm font-semibold text-slate-700">
              Wallet name
            </label>
            <input
              id="wallet-settings-name"
              type="text"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
          <div>
            <label htmlFor="wallet-settings-status" className="text-sm font-semibold text-slate-700">
              Status
            </label>
            <select
              id="wallet-settings-status"
              value={formState.status}
              onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="wallet-settings-limit" className="text-sm font-semibold text-slate-700">
              Spending limit
            </label>
            <input
              id="wallet-settings-limit"
              type="number"
              step="0.01"
              min="0"
              value={formState.spendingLimitAmount}
              onChange={(event) => setFormState((prev) => ({ ...prev, spendingLimitAmount: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Unlimited"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="wallet-settings-autotopup"
              type="checkbox"
              checked={formState.autoTopUpEnabled}
              onChange={(event) => setFormState((prev) => ({ ...prev, autoTopUpEnabled: event.target.checked }))}
              className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
            />
            <label htmlFor="wallet-settings-autotopup" className="text-sm font-semibold text-slate-700">
              Auto top-up
            </label>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Currency</label>
            <input
              type="text"
              readOnly
              value={wallet?.currencyCode ?? 'USD'}
              className="mt-2 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold uppercase text-slate-600"
            />
          </div>
        </div>

        {formState.autoTopUpEnabled ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="wallet-settings-autotopup-amount" className="text-sm font-semibold text-slate-700">
                Top-up amount
              </label>
              <input
                id="wallet-settings-autotopup-amount"
                type="number"
                step="0.01"
                min="0"
                value={formState.autoTopUpAmount}
                onChange={(event) => setFormState((prev) => ({ ...prev, autoTopUpAmount: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="10000"
              />
            </div>
            <div>
              <label htmlFor="wallet-settings-autotopup-threshold" className="text-sm font-semibold text-slate-700">
                Trigger threshold
              </label>
              <input
                id="wallet-settings-autotopup-threshold"
                type="number"
                step="0.01"
                min="0"
                value={formState.autoTopUpThreshold}
                onChange={(event) => setFormState((prev) => ({ ...prev, autoTopUpThreshold: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="5000"
              />
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="wallet-settings-categories" className="text-sm font-semibold text-slate-700">
            Restricted categories
          </label>
          <textarea
            id="wallet-settings-categories"
            rows={2}
            value={formState.restrictedCategories}
            onChange={(event) => setFormState((prev) => ({ ...prev, restrictedCategories: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="travel, corporate_card, gift_cards"
          />
        </div>

        <div>
          <label htmlFor="wallet-settings-notes" className="text-sm font-semibold text-slate-700">
            Compliance notes
          </label>
          <textarea
            id="wallet-settings-notes"
            rows={3}
            value={formState.complianceNotes}
            onChange={(event) => setFormState((prev) => ({ ...prev, complianceNotes: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Document approvals, reconciliation procedures, or audit requirements."
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onRefresh?.()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Save settings
          </button>
        </div>
      </form>
    </section>
  );
}
