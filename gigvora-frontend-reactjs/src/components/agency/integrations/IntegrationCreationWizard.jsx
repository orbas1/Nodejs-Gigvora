import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

function toList(value) {
  if (!value) {
    return [];
  }
  const base = Array.isArray(value) ? value : `${value}`.split(',');
  return base
    .map((item) => `${item}`.trim())
    .filter((item, index, self) => item.length > 0 && self.indexOf(item) === index);
}

const STEP_KEYS = ['provider', 'details', 'review'];

export default function IntegrationCreationWizard({
  open,
  providers,
  submitting = false,
  onSubmit,
  onClose,
}) {
  const providerList = useMemo(() => providers ?? [], [providers]);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState(providerList[0]?.key ?? '');
  const [draft, setDraft] = useState({
    displayName: '',
    syncFrequency: 'daily',
    status: 'pending',
    owner: '',
    environment: '',
    regions: '',
    scopes: '',
    notes: '',
  });

  const step = STEP_KEYS[stepIndex] ?? STEP_KEYS[0];

  const provider = useMemo(
    () => providerList.find((item) => item.key === selectedKey) ?? null,
    [providerList, selectedKey],
  );

  useEffect(() => {
    if (provider) {
      setDraft((previous) => ({
        ...previous,
        displayName: previous.displayName || provider.name || '',
        syncFrequency: provider.defaultSyncFrequency || previous.syncFrequency || 'daily',
        scopes: (provider.requiredScopes ?? []).join(', '),
      }));
    }
  }, [provider]);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setSelectedKey(providerList[0]?.key ?? '');
      setDraft({
        displayName: '',
        syncFrequency: 'daily',
        status: 'pending',
        owner: '',
        environment: '',
        regions: '',
        scopes: '',
        notes: '',
      });
    }
  }, [open, providerList]);

  const canContinue = useMemo(() => {
    if (step === 'provider') {
      return Boolean(provider);
    }
    if (step === 'details') {
      return Boolean(draft.displayName && draft.syncFrequency && draft.status);
    }
    return true;
  }, [draft.displayName, draft.syncFrequency, draft.status, provider, step]);

  const goNext = () => {
    setStepIndex((index) => Math.min(index + 1, STEP_KEYS.length - 1));
  };

  const goBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!provider) {
      return;
    }
    onSubmit?.({
      providerKey: provider.key,
      displayName: draft.displayName || provider.name,
      status: draft.status,
      syncFrequency: draft.syncFrequency,
      metadata: {
        owner: draft.owner,
        environment: draft.environment,
        regions: toList(draft.regions),
        scopes: toList(draft.scopes),
        notes: draft.notes,
      },
    });
  };

  const StepIndicator = () => (
    <ol className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {STEP_KEYS.map((key, index) => {
        const active = index === stepIndex;
        const complete = index < stepIndex;
        return (
          <li key={key} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm ${
                complete
                  ? 'border-emerald-400 bg-emerald-400 text-white'
                  : active
                  ? 'border-accent bg-accent text-white'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {complete ? <CheckIcon className="h-4 w-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className={active ? 'text-slate-900' : 'text-slate-500'}>
              {key === 'provider' ? 'Provider' : key === 'details' ? 'Setup' : 'Review'}
            </span>
            {index < STEP_KEYS.length - 1 ? <ChevronRightIcon className="h-3 w-3 text-slate-300" /> : null}
          </li>
        );
      })}
    </ol>
  );

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={submitting ? () => {} : onClose}>
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
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-4xl bg-white p-6 shadow-2xl transition-all">
                <div className="flex items-center justify-between gap-4">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">New integration</Dialog.Title>
                  <StepIndicator />
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  {step === 'provider' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {providerList.map((item) => {
                        const active = item.key === selectedKey;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setSelectedKey(item.key)}
                            className={`flex h-full flex-col items-start gap-2 rounded-3xl border p-4 text-left transition ${
                              active
                                ? 'border-accent bg-accent/5 text-accentDark'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-sm font-semibold">{item.name}</span>
                            <span className="text-xs uppercase tracking-wide text-slate-400">{item.category}</span>
                            <span className="text-xs text-slate-500">{item.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {step === 'details' ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col text-sm font-medium text-slate-700">
                        Name
                        <input
                          className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 focus:border-accent focus:outline-none"
                          value={draft.displayName}
                          onChange={(event) => setDraft((prev) => ({ ...prev, displayName: event.target.value }))}
                        />
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-700">
                        Status
                        <select
                          className="mt-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-accent focus:outline-none"
                          value={draft.status}
                          onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                        >
                          <option value="pending">Pending</option>
                          <option value="connected">Connected</option>
                          <option value="disconnected">Disconnected</option>
                          <option value="error">Error</option>
                        </select>
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-700">
                        Sync
                        <select
                          className="mt-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 focus:border-accent focus:outline-none"
                          value={draft.syncFrequency}
                          onChange={(event) => setDraft((prev) => ({ ...prev, syncFrequency: event.target.value }))}
                        >
                          <option value="manual">Manual</option>
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-700">
                        Owner
                        <input
                          className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          value={draft.owner}
                          onChange={(event) => setDraft((prev) => ({ ...prev, owner: event.target.value }))}
                        />
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-700">
                        Environment
                        <input
                          className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          value={draft.environment}
                          onChange={(event) => setDraft((prev) => ({ ...prev, environment: event.target.value }))}
                        />
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-700">
                        Regions
                        <input
                          className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          value={draft.regions}
                          onChange={(event) => setDraft((prev) => ({ ...prev, regions: event.target.value }))}
                          placeholder="us-east-1, eu-west-1"
                        />
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-700 sm:col-span-2">
                        Scopes
                        <input
                          className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          value={draft.scopes}
                          onChange={(event) => setDraft((prev) => ({ ...prev, scopes: event.target.value }))}
                          placeholder="api, refresh_token"
                        />
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-700 sm:col-span-2">
                        Notes
                        <textarea
                          className="mt-1 min-h-[90px] rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          value={draft.notes}
                          onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 'review' && provider ? (
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">{provider.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{provider.category}</p>
                        <p className="mt-3 text-sm text-slate-600">Sync: {draft.syncFrequency}</p>
                        <p className="text-sm text-slate-600">Owner: {draft.owner || '—'}</p>
                        <p className="text-sm text-slate-600">Status: {draft.status}</p>
                      </div>
                      {provider.docsUrl ? (
                        <a
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accentDark"
                        >
                          <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
                          Provider docs
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stepIndex > 0 ? (
                        <button
                          type="button"
                          onClick={goBack}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                          disabled={submitting}
                        >
                          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                          Back
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onClose}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {step === 'review' ? (
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submitting}
                      >
                        {submitting ? 'Creating…' : 'Create integration'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canContinue}
                      >
                        Next
                      </button>
                    )}
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
