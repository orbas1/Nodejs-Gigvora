import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEscrow } from './EscrowContext.jsx';

const PROVIDERS = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'mangopay', label: 'Mangopay' },
  { value: 'payoneer', label: 'Payoneer' },
  { value: 'adyen', label: 'Adyen' },
];

export default function AccountDrawer() {
  const { state, DEFAULT_ACCOUNT_DRAFT, saveAccount, closeAccountDrawer, triggerToast } = useEscrow();
  const { accountDrawer } = state;
  const [draft, setDraft] = useState(DEFAULT_ACCOUNT_DRAFT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (accountDrawer.open && accountDrawer.account) {
      setDraft({
        ...DEFAULT_ACCOUNT_DRAFT,
        ...accountDrawer.account,
        metadata: accountDrawer.account.metadata ?? '',
      });
    } else if (accountDrawer.open) {
      setDraft({ ...DEFAULT_ACCOUNT_DRAFT });
    }
  }, [accountDrawer, DEFAULT_ACCOUNT_DRAFT]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveAccount({ ...draft, id: accountDrawer.account?.id });
      closeAccountDrawer();
    } catch (error) {
      triggerToast(error.message || 'Unable to save account', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition show={accountDrawer.open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeAccountDrawer}>
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
              <Dialog.Panel className="w-screen max-w-lg bg-white shadow-2xl">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <Dialog.Title className="text-base font-semibold text-slate-900">
                      {accountDrawer.account ? 'Edit account' : 'New account'}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={closeAccountDrawer}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      <span className="sr-only">Close panel</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-4 text-sm">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Provider</span>
                        <select
                          value={draft.provider}
                          onChange={(event) => setDraft((prev) => ({ ...prev, provider: event.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          required
                        >
                          {PROVIDERS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Currency</span>
                        <input
                          value={draft.currencyCode}
                          onChange={(event) =>
                            setDraft((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 uppercase text-sm text-slate-800 focus:border-accent focus:outline-none"
                          maxLength={3}
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Label</span>
                        <input
                          value={draft.label}
                          onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          placeholder="Client funds"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bank reference</span>
                        <input
                          value={draft.bankReference}
                          onChange={(event) => setDraft((prev) => ({ ...prev, bankReference: event.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          placeholder="Settlement ID"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Metadata</span>
                        <textarea
                          value={draft.metadata}
                          onChange={(event) => setDraft((prev) => ({ ...prev, metadata: event.target.value }))}
                          className="mt-2 h-32 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 focus:border-accent focus:outline-none"
                          placeholder='{"region":"US"}'
                        />
                      </label>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 px-6 py-5">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={closeAccountDrawer}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Save account'}
                      </button>
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
