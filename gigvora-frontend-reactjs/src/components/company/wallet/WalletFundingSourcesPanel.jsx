import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { BanknotesIcon, CreditCardIcon, ExclamationCircleIcon, PlusIcon } from '@heroicons/react/24/outline';

const TYPE_OPTIONS = [
  { value: 'bank_account', label: 'Bank account', icon: BanknotesIcon },
  { value: 'card', label: 'Corporate card', icon: CreditCardIcon },
  { value: 'internal_budget', label: 'Internal budget', icon: BanknotesIcon },
  { value: 'external_wallet', label: 'External wallet', icon: BanknotesIcon },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending verification' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
];

function resolveType(value) {
  const normalized = `${value || ''}`.toLowerCase();
  return TYPE_OPTIONS.find((option) => option.value === normalized) ?? TYPE_OPTIONS[0];
}

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
  return 'Unable to save the funding source. Please try again.';
}

function FundingSourceForm({ initialValue = {}, onSubmit, onCancel, busy, error }) {
  const [formState, setFormState] = useState({
    type: initialValue.type ?? 'bank_account',
    label: initialValue.label ?? '',
    status: initialValue.status ?? 'pending',
    accountNumberMasked: initialValue.accountNumberMasked ?? '',
    routingNumberMasked: initialValue.routingNumberMasked ?? '',
    provider: initialValue.provider ?? '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.label.trim()) {
      return;
    }
    onSubmit?.({
      type: formState.type,
      label: formState.label.trim(),
      status: formState.status,
      accountNumberMasked: formState.accountNumberMasked?.trim() || undefined,
      routingNumberMasked: formState.routingNumberMasked?.trim() || undefined,
      provider: formState.provider?.trim() || undefined,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="funding-type" className="text-sm font-semibold text-slate-700">
            Funding type
          </label>
          <select
            id="funding-type"
            value={formState.type}
            onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="funding-status" className="text-sm font-semibold text-slate-700">
            Status
          </label>
          <select
            id="funding-status"
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

      <div>
        <label htmlFor="funding-label" className="text-sm font-semibold text-slate-700">
          Display label
        </label>
        <input
          id="funding-label"
          type="text"
          required
          value={formState.label}
          onChange={(event) => setFormState((prev) => ({ ...prev, label: event.target.value }))}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          placeholder="Treasury operating account"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="funding-account" className="text-sm font-semibold text-slate-700">
            Masked account number
          </label>
          <input
            id="funding-account"
            type="text"
            value={formState.accountNumberMasked}
            onChange={(event) => setFormState((prev) => ({ ...prev, accountNumberMasked: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="•••• 6789"
          />
        </div>
        <div>
          <label htmlFor="funding-routing" className="text-sm font-semibold text-slate-700">
            Masked routing
          </label>
          <input
            id="funding-routing"
            type="text"
            value={formState.routingNumberMasked}
            onChange={(event) => setFormState((prev) => ({ ...prev, routingNumberMasked: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="•••• 123"
          />
        </div>
      </div>

      <div>
        <label htmlFor="funding-provider" className="text-sm font-semibold text-slate-700">
          Provider (optional)
        </label>
        <input
          id="funding-provider"
          type="text"
          value={formState.provider}
          onChange={(event) => setFormState((prev) => ({ ...prev, provider: event.target.value }))}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          placeholder="JPMC, Stripe, TreasuryOps"
        />
      </div>

      {error ? (
        <div className="inline-flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs text-rose-600/80">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => onCancel?.()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save source'}
        </button>
      </div>
    </form>
  );
}

export default function WalletFundingSourcesPanel({ fundingSources, onCreate, onUpdate }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editSource, setEditSource] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const sources = useMemo(() => fundingSources ?? [], [fundingSources]);

  const handleCreate = async (payload) => {
    if (!onCreate) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate(payload);
      setCreateOpen(false);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!onUpdate || !editSource) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUpdate(editSource.id, payload);
      setEditSource(null);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Sources</h3>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {sources.map((source) => {
          const typeMeta = resolveType(source.type);
          const Icon = typeMeta.icon;
          return (
            <div
              key={source.id ?? source.label}
              className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-white p-3 text-accent shadow">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{source.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{typeMeta.label}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    source.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : source.status === 'disabled'
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {source.status ? source.status.replace(/_/g, ' ') : 'pending'}
                </span>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2 text-xs text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-500">Account</dt>
                  <dd className="mt-1">{source.accountNumberMasked || '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Routing</dt>
                  <dd className="mt-1">{source.routingNumberMasked || '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Provider</dt>
                  <dd className="mt-1">{source.provider || '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Last verified</dt>
                  <dd className="mt-1">
                    {source.lastVerifiedAt ? new Date(source.lastVerifiedAt).toLocaleString() : 'Never verified'}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setEditSource(source);
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
        {!sources.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-600">
            <p className="font-semibold text-slate-700">No sources yet</p>
          </div>
        ) : null}
      </div>

      <Transition.Root show={createOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => (busy ? null : setCreateOpen(false))}>
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
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Add source</Dialog.Title>
                  <div className="mt-6">
                    <FundingSourceForm
                      onSubmit={handleCreate}
                      onCancel={() => setCreateOpen(false)}
                      busy={busy}
                      error={error}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={Boolean(editSource)} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => (busy ? null : setEditSource(null))}>
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
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Edit source</Dialog.Title>
                  <div className="mt-6">
                    <FundingSourceForm
                      initialValue={editSource}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditSource(null)}
                      busy={busy}
                      error={error}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </section>
  );
}
