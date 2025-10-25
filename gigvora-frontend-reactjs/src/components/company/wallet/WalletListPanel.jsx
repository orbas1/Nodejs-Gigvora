import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from '../../common/StatusBadge.jsx';

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    return `${Number(value).toFixed(2)} ${currency || 'USD'}`;
  }
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toLocaleString();
}

const SUMMARY_FIELDS = [
  { key: 'walletCount', label: 'Wallets', formatter: formatNumber },
  { key: 'totalBalance', label: 'Total balance', formatter: formatCurrency },
  { key: 'totalAvailable', label: 'Available cash', formatter: formatCurrency },
  { key: 'totalHold', label: 'On hold', formatter: formatCurrency },
  { key: 'monthlyDebits', label: '30-day spend', formatter: formatCurrency },
  { key: 'pendingPayouts', label: 'Pending payouts', formatter: formatCurrency },
];

const CREATE_WALLET_DEFAULTS = Object.freeze({
  name: '',
  currencyCode: 'USD',
  spendingLimitAmount: '',
  autoTopUpEnabled: false,
  autoTopUpAmount: '',
  autoTopUpThreshold: '',
  restrictedCategories: '',
  complianceNotes: '',
});

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
  return 'We could not complete that request. Please try again.';
}

export default function WalletListPanel({
  summary,
  wallets,
  currencyCode = 'USD',
  selectedWalletId,
  onSelect,
  onRefresh,
  includeInactive = false,
  onToggleIncludeInactive,
  onCreateWallet,
  busy = false,
  error = null,
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [formState, setFormState] = useState(CREATE_WALLET_DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const resolvedSummary = useMemo(() => summary ?? {}, [summary]);

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!onCreateWallet) {
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: formState.name.trim(),
        currencyCode: formState.currencyCode?.trim() || undefined,
        spendingLimitAmount:
          formState.spendingLimitAmount !== '' ? Number.parseFloat(formState.spendingLimitAmount) : undefined,
        autoTopUpEnabled: Boolean(formState.autoTopUpEnabled),
        autoTopUpAmount:
          formState.autoTopUpAmount !== '' ? Number.parseFloat(formState.autoTopUpAmount) : undefined,
        autoTopUpThreshold:
          formState.autoTopUpThreshold !== '' ? Number.parseFloat(formState.autoTopUpThreshold) : undefined,
        restrictedCategories: formState.restrictedCategories
          ? formState.restrictedCategories
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        complianceNotes: formState.complianceNotes?.trim() || undefined,
      };
      if (!payload.name) {
        setFormError('Wallet name is required.');
        setSubmitting(false);
        return;
      }
      await onCreateWallet(payload);
      setCreateOpen(false);
      setFormState(CREATE_WALLET_DEFAULTS);
    } catch (err) {
      setFormError(resolveErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setCreateOpen(false);
    setFormState(CREATE_WALLET_DEFAULTS);
    setFormError(null);
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Wallets</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              checked={includeInactive}
              onChange={(event) => onToggleIncludeInactive?.(event.target.checked)}
            />
            Inactive
          </label>
          <button
            type="button"
            onClick={() => onRefresh?.()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            New
          </button>
        </div>
      </div>

      {error ? (
        <div className="inline-flex w-full items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">We couldn&apos;t load the wallet list</p>
            <p className="mt-1 text-xs text-rose-600/80">{resolveErrorMessage(error)}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SUMMARY_FIELDS.map((field) => {
          const value = resolvedSummary?.[field.key];
          const formatted = field.formatter(value, currencyCode);
          const Icon = field.key === 'walletCount' ? CheckCircleIcon : BanknotesIcon;
          return (
            <div key={field.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{formatted}</p>
              </div>
              <span className="rounded-full bg-white p-3 text-accent shadow">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(wallets ?? []).map((wallet) => {
          const isSelected = Number(selectedWalletId) === Number(wallet.id);
          return (
            <button
              key={wallet.id}
              type="button"
              onClick={() => onSelect?.(wallet)}
              className={`group flex flex-col gap-4 rounded-3xl border px-5 py-5 text-left transition focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                isSelected
                  ? 'border-accent bg-accent/5 shadow-lg'
                  : 'border-slate-200 bg-white shadow-sm hover:border-accent/60 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{wallet.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Wallet ID #{wallet.id}</p>
                </div>
                <StatusBadge
                  status={wallet.status}
                  category="walletAccount"
                  uppercase={false}
                  size="xs"
                  icon={ShieldCheckIcon}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Balance</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {formatCurrency(wallet.balances?.current, wallet.balances?.currencyCode)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-600">
                    {formatCurrency(wallet.balances?.available, wallet.balances?.currencyCode)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">30-day</p>
                  <p className="mt-1 text-lg font-semibold text-amber-600">
                    {formatCurrency(wallet.metrics?.monthlyDebits, wallet.balances?.currencyCode)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                  Members: {wallet.memberSummary?.total ?? 0}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                  Funding: {wallet.fundingSourceCount ?? 0}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                  Policies: {wallet.activePolicyCount ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Updated {wallet.metrics?.lastActivityAt ? new Date(wallet.metrics.lastActivityAt).toLocaleString() : 'recently'}</span>
                <span className="font-semibold text-accent">{isSelected ? 'Active' : 'Open'}</span>
              </div>
            </button>
          );
        })}
        {!wallets?.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-600">
            <p className="font-semibold text-slate-700">No wallets</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              Add
            </button>
          </div>
        ) : null}
      </div>

      <Transition.Root show={createOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-2xl rounded-4xl bg-white p-6 shadow-2xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">New wallet</Dialog.Title>
                  <p className="mt-1 text-sm text-slate-600">
                    Provision a wallet with automatic funding controls and compliance notes. You can adjust settings anytime.
                  </p>

                  {formError ? (
                    <div className="mt-4 inline-flex w-full items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
                      <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">We couldn&apos;t create the wallet</p>
                        <p className="mt-1 text-xs text-rose-600/80">{formError}</p>
                      </div>
                    </div>
                  ) : null}

                  <form className="mt-6 space-y-5" onSubmit={handleCreateSubmit}>
                    <div>
                      <label htmlFor="wallet-name" className="text-sm font-semibold text-slate-700">
                        Wallet name
                      </label>
                      <input
                        id="wallet-name"
                        type="text"
                        required
                        value={formState.name}
                        onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Operating wallet"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="wallet-currency" className="text-sm font-semibold text-slate-700">
                          Currency
                        </label>
                        <input
                          id="wallet-currency"
                          type="text"
                          maxLength={3}
                          value={formState.currencyCode}
                          onChange={(event) =>
                            setFormState((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm uppercase text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div>
                        <label htmlFor="wallet-limit" className="text-sm font-semibold text-slate-700">
                          Spending limit (optional)
                        </label>
                        <input
                          id="wallet-limit"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formState.spendingLimitAmount}
                          onChange={(event) =>
                            setFormState((prev) => ({ ...prev, spendingLimitAmount: event.target.value }))
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          placeholder="50000"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          id="wallet-autotopup"
                          type="checkbox"
                          checked={formState.autoTopUpEnabled}
                          onChange={(event) =>
                            setFormState((prev) => ({ ...prev, autoTopUpEnabled: event.target.checked }))
                          }
                          className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                        />
                        <label htmlFor="wallet-autotopup" className="text-sm font-semibold text-slate-700">
                          Enable auto top-up
                        </label>
                      </div>
                    </div>

                    {formState.autoTopUpEnabled ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="wallet-topup-amount" className="text-sm font-semibold text-slate-700">
                            Top-up amount
                          </label>
                          <input
                            id="wallet-topup-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formState.autoTopUpAmount}
                            onChange={(event) =>
                              setFormState((prev) => ({ ...prev, autoTopUpAmount: event.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                            placeholder="10000"
                          />
                        </div>
                        <div>
                          <label htmlFor="wallet-topup-threshold" className="text-sm font-semibold text-slate-700">
                            Trigger threshold
                          </label>
                          <input
                            id="wallet-topup-threshold"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formState.autoTopUpThreshold}
                            onChange={(event) =>
                              setFormState((prev) => ({ ...prev, autoTopUpThreshold: event.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                            placeholder="5000"
                          />
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <label htmlFor="wallet-categories" className="text-sm font-semibold text-slate-700">
                        Restricted categories (comma separated)
                      </label>
                      <textarea
                        id="wallet-categories"
                        rows={2}
                        value={formState.restrictedCategories}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, restrictedCategories: event.target.value }))
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="travel, hardware, gift_cards"
                      />
                    </div>

                    <div>
                      <label htmlFor="wallet-notes" className="text-sm font-semibold text-slate-700">
                        Compliance notes
                      </label>
                      <textarea
                        id="wallet-notes"
                        rows={3}
                        value={formState.complianceNotes}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, complianceNotes: event.target.value }))
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Outline policy guardrails, documentation links, or audit considerations."
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <PlusIcon className="h-4 w-4" aria-hidden="true" />
                        )}
                        Create wallet
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </section>
  );
}
