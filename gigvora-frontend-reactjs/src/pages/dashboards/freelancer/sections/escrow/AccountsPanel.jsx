import { useMemo, useState } from 'react';
import { ExclamationTriangleIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import SlideOver from './components/SlideOver.jsx';

const PROVIDERS = [
  { value: 'escrow_com', label: 'Escrow.com' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'trustshare', label: 'Trustshare' },
];

function AccountForm({ initialValue, onSubmit, submitting, error, onClose }) {
  const [form, setForm] = useState(() => ({
    provider: initialValue?.provider ?? 'escrow_com',
    currencyCode: initialValue?.currencyCode ?? 'USD',
    accountLabel: initialValue?.metadata?.accountLabel ?? '',
    settings: {
      autoReleaseOnApproval: Boolean(initialValue?.settings?.autoReleaseOnApproval ?? true),
      notifyOnDispute: Boolean(initialValue?.settings?.notifyOnDispute ?? true),
      manualHold: Boolean(initialValue?.settings?.manualHold ?? false),
    },
  }));

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateSetting = (key, value) => {
    setForm((prev) => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit({
        provider: form.provider,
        currencyCode: form.currencyCode,
        metadata: { accountLabel: form.accountLabel.trim() },
        settings: form.settings,
      });
    } catch (error_) {
      // Parent component surfaces the error message.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Provider
          <select
            value={form.provider}
            onChange={(event) => updateField('provider', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          >
            {PROVIDERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Currency
          <input
            type="text"
            value={form.currencyCode}
            onChange={(event) => updateField('currencyCode', event.target.value.toUpperCase())}
            maxLength={3}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm uppercase tracking-wide text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
      </div>
      <label className="flex flex-col text-sm font-medium text-slate-700">
        Name
        <input
          type="text"
          value={form.accountLabel}
          onChange={(event) => updateField('accountLabel', event.target.value)}
          placeholder="Primary escrow"
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          required
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.settings.autoReleaseOnApproval}
            onChange={(event) => updateSetting('autoReleaseOnApproval', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          Auto release
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.settings.notifyOnDispute}
            onChange={(event) => updateSetting('notifyOnDispute', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          Dispute alerts
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.settings.manualHold}
            onChange={(event) => updateSetting('manualHold', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          Manual hold
        </label>
      </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
          {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="ml-3 rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
    </form>
  );
}

function formatMoney(value, currencyCode = 'USD') {
  if (value == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    return Number(value).toFixed(2);
  }
}

export default function AccountsPanel({ accounts, onCreate, onUpdate, loading, actionState }) {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [mode, setMode] = useState('create');
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [drawerError, setDrawerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const safeAccounts = useMemo(() => (Array.isArray(accounts) ? accounts.filter(Boolean) : []), [accounts]);

  const orderedAccounts = useMemo(
    () =>
      [...safeAccounts].sort((a, b) => {
        const first = Number(b?.currentBalance ?? 0);
        const second = Number(a?.currentBalance ?? 0);
        return first - second;
      }),
    [safeAccounts],
  );

  const drawerBusy = submitting || actionState?.status === 'pending';

  const handleCreate = () => {
    setMode('create');
    setSelectedAccount(null);
    setDrawerError(null);
    setOpenDrawer(true);
  };

  const handleEdit = (account) => {
    setMode('edit');
    setSelectedAccount(account);
    setDrawerError(null);
    setOpenDrawer(true);
  };

  const handleSubmit = async (payload) => {
    setDrawerError(null);
    setSubmitting(true);
    try {
      if (mode === 'edit' && selectedAccount) {
        await onUpdate(selectedAccount.id, payload);
      } else {
        await onCreate(payload);
      }
      setOpenDrawer(false);
      setSelectedAccount(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save escrow account.';
      setDrawerError(message);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Accounts</h3>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        >
          <PlusIcon className="h-4 w-4" />
          New
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orderedAccounts.map((account) => (
          <div key={account.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{account.provider?.replace('_', ' ') ?? 'Account'}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {account.metadata?.accountLabel || 'Escrow account'}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {account.status ?? 'active'}
              </span>
            </div>
            <dl className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Balance</dt>
                <dd className="font-semibold text-slate-900">
                  {formatMoney(account.currentBalance, account.currencyCode)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Held</dt>
                <dd>{formatMoney(account.outstandingBalance, account.currencyCode)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Released</dt>
                <dd>{formatMoney(account.releasedVolume, account.currencyCode)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{account.openTransactions ?? 0} open</span>
              <span>{account.disputedTransactions ?? 0} disputes</span>
            </div>
            <button
              type="button"
              onClick={() => handleEdit(account)}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              disabled={drawerBusy}
            >
              <PencilSquareIcon className="h-4 w-4" />
              Manage
            </button>
          </div>
        ))}
        {!orderedAccounts.length && !loading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No accounts yet. Add one to route incoming payments into escrow.
          </div>
        ) : null}
      </div>

      <SlideOver
        open={openDrawer}
        onClose={() => {
          if (!drawerBusy) {
            setOpenDrawer(false);
            setDrawerError(null);
          }
        }}
        title={mode === 'edit' ? 'Edit account' : 'New account'}
        description="Configure the escrow account your projects will use."
      >
        <AccountForm
          initialValue={selectedAccount}
          onSubmit={handleSubmit}
          submitting={drawerBusy}
          error={drawerError}
          onClose={() => {
            if (!drawerBusy) {
              setOpenDrawer(false);
              setDrawerError(null);
              setSelectedAccount(null);
            }
          }}
        />
      </SlideOver>
    </div>
  );
}
