import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DEFAULT_SPEND, formatCurrency, formatDate, toDateInput } from './helpers.js';

function SpendFormModal({ open, mode, metadata, contracts, initialValue, submitting, onClose, onSubmit }) {
  const [form, setForm] = useState(DEFAULT_SPEND);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({
        ...DEFAULT_SPEND,
        ...initialValue,
        contractId: initialValue?.contractId ?? initialValue?.contract?.id ?? '',
        spentAt: toDateInput(initialValue?.spentAt),
      });
      setError(null);
    }
  }, [initialValue, open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.contractId) {
      setError('Select a contract.');
      return;
    }
    setError(null);
    try {
      await onSubmit({
        ...form,
        amount: form.amount || null,
        spentAt: form.spentAt || null,
      });
      onClose();
    } catch (err) {
      const message = err?.message ?? 'Unable to save spend entry.';
      setError(message);
    }
  };

  const title = mode === 'edit' ? 'Edit spend' : 'New spend';

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={submitting ? () => {} : onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                  <button type="button" onClick={onClose} disabled={submitting} className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                    Close
                  </button>
                </div>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Contract</span>
                    <select
                      name="contractId"
                      value={form.contractId}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select</option>
                      {contracts.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Description</span>
                      <input
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Category</span>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      >
                        {(metadata?.spendCategories ?? []).map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Amount</span>
                      <input
                        type="number"
                        name="amount"
                        value={form.amount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Currency</span>
                      <input
                        name="currencyCode"
                        value={form.currencyCode}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Date</span>
                    <input
                      type="date"
                      name="spentAt"
                      value={form.spentAt}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Receipt</span>
                    <input
                      name="receiptUrl"
                      value={form.receiptUrl}
                      onChange={handleChange}
                      placeholder="https://"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {submitting ? 'Saving…' : 'Save'}
                    </button>
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

export default function SpendPanel({
  spend,
  contracts = [],
  metadata,
  mutating,
  onCreate,
  onUpdate,
  onDelete,
  queuedContractId,
  onQueueConsumed,
}) {
  const [formState, setFormState] = useState({ open: false, mode: 'create', record: DEFAULT_SPEND });
  const [filterContractId, setFilterContractId] = useState('all');

  const spendEntries = spend?.entries ?? [];

  const orderedEntries = useMemo(() => {
    return [...spendEntries].sort((a, b) => {
      const aTime = new Date(b.spentAt ?? b.createdAt ?? 0).getTime();
      const bTime = new Date(a.spentAt ?? a.createdAt ?? 0).getTime();
      return aTime - bTime;
    });
  }, [spendEntries]);

  const filteredEntries = useMemo(() => {
    if (filterContractId === 'all') {
      return orderedEntries;
    }
    return orderedEntries.filter((entry) => `${entry.contractId}` === `${filterContractId}`);
  }, [filterContractId, orderedEntries]);

  const openCreate = (contractId) => {
    setFormState({ open: true, mode: 'create', record: { ...DEFAULT_SPEND, contractId: contractId ?? '' } });
  };

  useEffect(() => {
    if (queuedContractId) {
      openCreate(queuedContractId);
      onQueueConsumed?.();
    }
  }, [queuedContractId, onQueueConsumed]);

  const openEdit = (record) => {
    setFormState({ open: true, mode: 'edit', record });
  };

  const closeForm = () => setFormState((state) => ({ ...state, open: false }));

  const handleSubmit = async (payload) => {
    if (formState.mode === 'edit' && formState.record?.id) {
      await onUpdate(formState.record.id, payload);
    } else {
      await onCreate(payload.contractId, payload);
    }
  };

  const handleDelete = async (record) => {
    if (!record?.id) return;
    const confirmDelete = window.confirm('Delete this spend entry?');
    if (!confirmDelete) return;
    await onDelete(record.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Spend</h3>
          <select
            value={filterContractId}
            onChange={(event) => setFilterContractId(event.target.value)}
            className="rounded-2xl border border-slate-200 px-3 py-1 text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => openCreate(filterContractId === 'all' ? '' : filterContractId)}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          New
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Contract</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-slate-900">{entry.contract?.title ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{entry.description}</td>
                <td className="px-4 py-3 text-slate-600">{entry.category}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(entry.amount, entry.currencyCode)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(entry.spentAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      disabled={mutating}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredEntries.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                  No spend yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <SpendFormModal
        open={formState.open}
        mode={formState.mode}
        metadata={metadata}
        contracts={contracts}
        initialValue={formState.record}
        submitting={mutating}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
