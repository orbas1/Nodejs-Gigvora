import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEscrow } from './EscrowContext.jsx';
import { formatCurrency } from './formatters.js';

const TYPES = [
  { value: 'project', label: 'Project' },
  { value: 'gig', label: 'Gig' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'expense', label: 'Expense' },
];

export default function TransactionWizard() {
  const {
    state,
    DEFAULT_TRANSACTION_DRAFT,
    saveTransaction,
    closeTransactionWizard,
    triggerToast,
  } = useEscrow();
  const { transactionWizard, accounts } = state;
  const [draft, setDraft] = useState(DEFAULT_TRANSACTION_DRAFT);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transactionWizard.open) {
      const base = transactionWizard.transaction
        ? {
            ...DEFAULT_TRANSACTION_DRAFT,
            ...transactionWizard.transaction,
          }
        : { ...DEFAULT_TRANSACTION_DRAFT };
      setDraft({ ...base });
      setStep(0);
    }
  }, [DEFAULT_TRANSACTION_DRAFT, transactionWizard]);

  useEffect(() => {
    if (!transactionWizard.open || transactionWizard.transaction) {
      return;
    }
    if (!draft.accountId && accountOptions[0]) {
      setDraft((previous) => ({ ...previous, accountId: accountOptions[0].value }));
    }
  }, [accountOptions, draft.accountId, transactionWizard.open, transactionWizard.transaction]);

  const accountOptions = useMemo(
    () =>
      accounts.list.map((account) => ({
        value: String(account.id),
        label: `${account.label || account.provider} • ${account.currencyCode}`,
      })),
    [accounts.list],
  );

  const currentStep = useMemo(() => {
    if (step === 0) {
      return (
        <div className="space-y-4 text-sm">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Account</span>
            <select
              value={draft.accountId}
              onChange={(event) => setDraft((prev) => ({ ...prev, accountId: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
              required
            >
              <option value="">Select</option>
              {accountOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                onChange={(event) => setDraft((prev) => ({ ...prev, amount: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fee</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.feeAmount}
                onChange={(event) => setDraft((prev) => ({ ...prev, feeAmount: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</span>
              <select
                value={draft.type}
                onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
              >
                {TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reference</span>
              <input
                value={draft.reference}
                onChange={(event) => setDraft((prev) => ({ ...prev, reference: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                placeholder="Invoice #2023"
                required
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Milestone</span>
            <input
              value={draft.milestoneLabel}
              onChange={(event) => setDraft((prev) => ({ ...prev, milestoneLabel: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
              placeholder="Design sprint"
            />
          </label>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-sm">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Schedule</span>
          <input
            type="datetime-local"
            value={draft.scheduledReleaseAt}
            onChange={(event) => setDraft((prev) => ({ ...prev, scheduledReleaseAt: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Metadata</span>
          <textarea
            value={draft.metadata}
            onChange={(event) => setDraft((prev) => ({ ...prev, metadata: event.target.value }))}
            className="mt-2 h-32 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 focus:border-accent focus:outline-none"
            placeholder='{"projectId":1}'
          />
        </label>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Review</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Amount</span>
              <span className="font-semibold">{formatCurrency(draft.amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Fee</span>
              <span className="font-semibold">{formatCurrency(draft.feeAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Type</span>
              <span className="font-semibold capitalize">{draft.type}</span>
            </div>
            <div className="flex justify-between">
              <span>Reference</span>
              <span className="font-semibold">{draft.reference || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [accountOptions, draft, step]);

  const handleNext = () => {
    if (step === 0) {
      if (!draft.accountId || !draft.amount || !draft.reference) {
        triggerToast('Account, amount, and reference are required', 'error');
        return;
      }
      setStep(1);
      return;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveTransaction({ ...draft, id: transactionWizard.transaction?.id });
      closeTransactionWizard();
    } catch (error) {
      triggerToast(error.message || 'Unable to save move', 'error');
    } finally {
      setSaving(false);
    }
  };

  const title = transactionWizard.transaction ? 'Edit move' : 'New move';
  const progress = ((step + 1) / 2) * 100;

  return (
    <Transition show={transactionWizard.open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeTransactionWizard}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex max-w-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-screen max-w-2xl bg-white shadow-2xl">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <Dialog.Title className="text-base font-semibold text-slate-900">{title}</Dialog.Title>
                    <button
                      type="button"
                      onClick={closeTransactionWizard}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      <span className="sr-only">Close wizard</span>
                    </button>
                  </div>
                  <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <span className={step === 0 ? 'text-slate-900' : ''}>Details</span>
                      <ChevronRightIcon className="h-4 w-4" />
                      <span className={step === 1 ? 'text-slate-900' : ''}>Schedule</span>
                    </div>
                    <div className="mt-3 h-1 w-full rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-6">{currentStep}</div>
                  <div className="border-t border-slate-200 px-6 py-5">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={step === 0 ? closeTransactionWizard : () => setStep(step - 1)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        {step === 0 ? 'Cancel' : 'Back'}
                      </button>
                      {step === 0 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? 'Saving…' : 'Save move'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
