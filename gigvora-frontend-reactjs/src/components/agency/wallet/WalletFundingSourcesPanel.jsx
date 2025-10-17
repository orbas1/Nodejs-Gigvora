import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';

const FUNDING_TYPES = [
  { value: 'bank_account', label: 'Bank account' },
  { value: 'virtual_account', label: 'Virtual account' },
  { value: 'card', label: 'Card' },
  { value: 'wallet', label: 'Platform wallet' },
];

const FUNDING_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'pending_verification', label: 'Pending verification' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'disabled', label: 'Disabled' },
];

function parseMetadata(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error('Metadata must be valid JSON.');
  }
}

function FundingSourceForm({ open, onClose, onSubmit, initialValues, busy }) {
  const [formState, setFormState] = useState(() => ({
    workspaceId: initialValues?.workspaceId ?? '',
    label: initialValues?.label ?? '',
    type: initialValues?.type ?? 'bank_account',
    provider: initialValues?.provider ?? '',
    accountNumberLast4: initialValues?.accountNumberLast4 ?? '',
    currencyCode: initialValues?.currencyCode ?? 'USD',
    status: initialValues?.status ?? 'active',
    isPrimary: Boolean(initialValues?.isPrimary ?? false),
    metadata: initialValues?.metadata ? JSON.stringify(initialValues.metadata, null, 2) : '',
  }));
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = {
        ...formState,
        metadata: parseMetadata(formState.metadata),
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err?.message || 'Unable to save funding source. Please try again.';
      setError(message);
    }
  };

  const title = initialValues?.id ? 'Edit funding source' : 'Add funding source';

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
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
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl rounded-4xl bg-white p-8 shadow-2xl md:h-[80vh] md:overflow-y-auto">
                <Dialog.Title className="text-xl font-semibold text-slate-900">{title}</Dialog.Title>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700">{error}</div>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="workspaceId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Workspace ID
                    </label>
                    <input
                      id="workspaceId"
                      name="workspaceId"
                      value={formState.workspaceId}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="label" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Display label
                    </label>
                    <input
                      id="label"
                      name="label"
                      value={formState.label}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="type" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Funding type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formState.type}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {FUNDING_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="provider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Provider
                    </label>
                    <input
                      id="provider"
                      name="provider"
                      value={formState.provider}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="e.g. JP Morgan"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="accountNumberLast4"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Account last 4
                    </label>
                    <input
                      id="accountNumberLast4"
                      name="accountNumberLast4"
                      value={formState.accountNumberLast4}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="1234"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="currencyCode" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Currency
                    </label>
                    <input
                      id="currencyCode"
                      name="currencyCode"
                      value={formState.currencyCode}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formState.status}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {FUNDING_STATUSES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="isPrimary" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Primary source
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        id="isPrimary"
                        name="isPrimary"
                        type="checkbox"
                        checked={Boolean(formState.isPrimary)}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                      />
                      <label htmlFor="isPrimary" className="text-sm text-slate-700">
                        Use for automatic sweeps
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="metadata" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Metadata (JSON)
                    </label>
                    <textarea
                      id="metadata"
                      name="metadata"
                      rows={3}
                      value={formState.metadata}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder='{"routing":"123456"}'
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? 'Saving…' : 'Save funding source'}
                    </button>
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

function FundingSourceRow({ source, onEdit }) {
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-3">
        <div className="font-semibold text-slate-900">{source.label}</div>
        <div className="text-xs text-slate-500">{source.type}</div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">{source.provider || '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-700">{source.currencyCode}</td>
      <td className="px-4 py-3 text-sm text-slate-700">{source.status}</td>
      <td className="px-4 py-3 text-sm text-slate-700">{source.accountNumberLast4 || '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-700">{source.isPrimary ? 'Primary' : 'Secondary'}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onEdit?.(source)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
        >
          <PencilSquareIcon className="h-4 w-4" /> Edit
        </button>
      </td>
    </tr>
  );
}

export default function WalletFundingSourcesPanel({ resource, onCreateFundingSource, onUpdateFundingSource }) {
  const { data, loading, error } = resource;
  const sources = data ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [busy, setBusy] = useState(false);

  const openCreateDialog = () => {
    setEditingSource(null);
    setDialogOpen(true);
  };

  const openEditDialog = (source) => {
    setEditingSource(source);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!busy) {
      setDialogOpen(false);
      setEditingSource(null);
    }
  };

  const handleSubmit = async (payload) => {
    setBusy(true);
    try {
      if (editingSource?.id) {
        await onUpdateFundingSource(editingSource.id, payload);
      } else {
        await onCreateFundingSource(payload);
      }
    } finally {
      setBusy(false);
    }
  };

  const stats = useMemo(() => {
    const total = sources.length;
    const primary = sources.filter((source) => source.isPrimary).length;
    return { total, primary };
  }, [sources]);

  return (
    <section id="wallet-funding-sources" className="space-y-6" aria-labelledby="wallet-funding-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="wallet-funding-title" className="text-2xl font-semibold text-slate-900">Funds</h2>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" /> Add funding source
        </button>
      </div>

      <div className="flex gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
          Total: {stats.total}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
          Primary: {stats.primary}
        </span>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">Funding sources unavailable.</div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  Loading funding sources…
                </td>
              </tr>
            ) : sources.length ? (
              sources.map((source) => <FundingSourceRow key={source.id} source={source} onEdit={openEditDialog} />)
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">No sources yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FundingSourceForm
        open={dialogOpen}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        initialValues={editingSource}
        busy={busy}
      />
    </section>
  );
}
