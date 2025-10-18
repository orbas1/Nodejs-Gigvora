import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DEFAULT_CONTRACT, formatCurrency, formatDate, formatHours, toDateInput } from './helpers.js';

function ContractFormModal({ open, mode, metadata, applications, initialValue, submitting, onClose, onSubmit }) {
  const [form, setForm] = useState(DEFAULT_CONTRACT);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({
        ...DEFAULT_CONTRACT,
        ...initialValue,
        applicationId: initialValue?.applicationId ?? '',
        startDate: toDateInput(initialValue?.startDate),
        endDate: toDateInput(initialValue?.endDate),
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
    setError(null);
    try {
      await onSubmit({
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        expectedHours: form.expectedHours || null,
        hoursCommitted: form.hoursCommitted || null,
        financialValue: form.financialValue || null,
      });
      onClose();
    } catch (err) {
      const message = err?.message ?? 'Unable to save contract.';
      setError(message);
    }
  };

  const title = mode === 'edit' ? 'Edit contract' : 'New contract';

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={submitting ? () => {} : onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                  <button type="button" onClick={onClose} disabled={submitting} className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                    Close
                  </button>
                </div>
                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Title</span>
                      <input
                        required
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Organisation</span>
                      <input
                        required
                        name="organizationName"
                        value={form.organizationName}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Status</span>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      >
                        {(metadata?.contractStatusOptions ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Start</span>
                      <input
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">End</span>
                      <input
                        type="date"
                        name="endDate"
                        value={form.endDate}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Expected hours</span>
                      <input
                        type="number"
                        name="expectedHours"
                        value={form.expectedHours}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Booked hours</span>
                      <input
                        type="number"
                        name="hoursCommitted"
                        value={form.hoursCommitted}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Value</span>
                      <input
                        type="number"
                        name="financialValue"
                        value={form.financialValue}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Currency</span>
                      <input
                        name="currencyCode"
                        value={form.currencyCode}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Linked application</span>
                      <select
                        name="applicationId"
                        value={form.applicationId ?? ''}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">None</option>
                        {applications.map((application) => (
                          <option key={application.id} value={application.id}>
                            {application.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Impact</span>
                    <textarea
                      name="impactNotes"
                      value={form.impactNotes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Agreement</span>
                    <input
                      name="agreementUrl"
                      value={form.agreementUrl}
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

function ContractDetailModal({ open, record, onClose, onEdit, onOpenSpend }) {
  if (!record) {
    return null;
  }
  const spendEntries = record.spendEntries ?? [];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{record.title}</Dialog.Title>
                  <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                    Close
                  </button>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organisation</p>
                    <p className="mt-1 text-base font-medium text-slate-900">{record.organizationName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                    <p className="mt-1 text-slate-700">{record.status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
                    <p className="mt-1 text-slate-700">
                      {formatDate(record.startDate)} – {formatDate(record.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hours</p>
                    <p className="mt-1 text-slate-700">{formatHours(record.hoursCommitted)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Value</p>
                    <p className="mt-1 text-slate-700">{formatCurrency(record.financialValue, record.currencyCode)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application</p>
                    <p className="mt-1 text-slate-700">{record.application?.title ?? '—'}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact</p>
                    <p className="mt-1 text-slate-700">{record.impactNotes || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agreement</p>
                    {record.agreementUrl ? (
                      <a
                        href={record.agreementUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        View file
                      </a>
                    ) : (
                      <p className="mt-1 text-slate-500">No link</p>
                    )}
                  </div>
                </div>
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Spend</p>
                    <button
                      type="button"
                      onClick={() => onOpenSpend?.(record)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                    >
                      Manage
                    </button>
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    {spendEntries.length === 0 ? (
                      <li>No spend recorded.</li>
                    ) : (
                      spendEntries.map((entry) => (
                        <li key={entry.id} className="flex justify-between rounded-2xl bg-emerald-50/60 px-4 py-2">
                          <span className="font-medium text-emerald-700">{entry.description}</span>
                          <span className="text-emerald-600">{formatCurrency(entry.amount, entry.currencyCode)}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(record)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function ContractsPanel({
  contracts = [],
  applications = [],
  metadata,
  mutating,
  onCreate,
  onUpdate,
  onDelete,
  onOpenSpend,
}) {
  const [formState, setFormState] = useState({ open: false, mode: 'create', record: DEFAULT_CONTRACT });
  const [detail, setDetail] = useState({ open: false, record: null });
  const [statusFilter, setStatusFilter] = useState('all');

  const orderedContracts = useMemo(() => {
    const list = [...contracts];
    return list.sort((a, b) => {
      const aTime = new Date(b.startDate ?? b.createdAt ?? 0).getTime();
      const bTime = new Date(a.startDate ?? a.createdAt ?? 0).getTime();
      return aTime - bTime;
    });
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    if (statusFilter === 'all') {
      return orderedContracts;
    }
    return orderedContracts.filter((contract) => contract.status === statusFilter);
  }, [orderedContracts, statusFilter]);

  const openCreate = () => {
    setFormState({ open: true, mode: 'create', record: DEFAULT_CONTRACT });
  };

  const openEdit = (record) => {
    setFormState({ open: true, mode: 'edit', record });
  };

  const closeForm = () => setFormState((state) => ({ ...state, open: false }));

  const closeDetail = () => setDetail({ open: false, record: null });

  const handleSubmit = async (payload) => {
    if (formState.mode === 'edit' && formState.record?.id) {
      await onUpdate(formState.record.id, payload);
    } else {
      await onCreate(payload);
    }
  };

  const handleDelete = async (record) => {
    if (!record?.id) return;
    const confirmDelete = window.confirm('Delete this contract?');
    if (!confirmDelete) return;
    await onDelete(record.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Contracts</h3>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 px-3 py-1 text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All</option>
            {(metadata?.contractStatusOptions ?? []).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          New
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredContracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-slate-900">{contract.title}</td>
                <td className="px-4 py-3 text-slate-600">{contract.status}</td>
                <td className="px-4 py-3 text-slate-600">{formatHours(contract.hoursCommitted)}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(contract.financialValue, contract.currencyCode)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDetail({ open: true, record: contract })}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(contract)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(contract)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      disabled={mutating}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredContracts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                  No contracts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <ContractFormModal
        open={formState.open}
        mode={formState.mode}
        metadata={metadata}
        applications={applications}
        initialValue={formState.record}
        submitting={mutating}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
      <ContractDetailModal
        open={detail.open}
        record={detail.record}
        onClose={closeDetail}
        onEdit={openEdit}
        onOpenSpend={onOpenSpend}
      />
    </div>
  );
}
