import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'requirements', label: 'Requirements' },
  { value: 'in_delivery', label: 'In delivery' },
  { value: 'in_revision', label: 'In revision' },
  { value: 'completed', label: 'Completed' },
];

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_FORM = {
  vendorName: '',
  serviceName: '',
  orderNumber: '',
  status: 'requirements',
  amount: '',
  currency: 'USD',
  kickoffAt: '',
  dueAt: '',
  metadataNotes: '',
  requirements: [],
};

export default function NewGigOrderModal({ open, onClose, onSubmit, preset }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const base = {
      ...DEFAULT_FORM,
      vendorName: preset?.vendorName ?? '',
      serviceName: preset?.serviceName ?? preset?.name ?? '',
      amount: preset?.amount ? String(preset.amount) : '',
      currency: preset?.currency ?? 'USD',
      requirements: Array.isArray(preset?.requirements)
        ? preset.requirements.map((requirement) => ({
            id: generateId(),
            title: requirement.title ?? '',
            status: requirement.status ?? 'pending',
            dueAt: requirement.dueAt ?? '',
            notes: requirement.notes ?? '',
          }))
        : [],
    };
    setForm(base);
    setSaving(false);
  }, [open, preset]);

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const addRequirement = () => {
    setForm((previous) => ({
      ...previous,
      requirements: [
        ...previous.requirements,
        { id: generateId(), title: '', status: 'pending', dueAt: '', notes: '' },
      ],
    }));
  };

  const updateRequirement = (id, changes) => {
    setForm((previous) => ({
      ...previous,
      requirements: previous.requirements.map((requirement) =>
        requirement.id === id ? { ...requirement, ...changes } : requirement,
      ),
    }));
  };

  const removeRequirement = (id) => {
    setForm((previous) => ({
      ...previous,
      requirements: previous.requirements.filter((requirement) => requirement.id !== id),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await onSubmit({
        vendorName: form.vendorName.trim(),
        serviceName: form.serviceName.trim(),
        orderNumber: form.orderNumber ? form.orderNumber.trim() : undefined,
        status: form.status,
        amount: form.amount ? Number(form.amount) : 0,
        currency: form.currency || 'USD',
        kickoffAt: form.kickoffAt || new Date().toISOString(),
        dueAt: form.dueAt || null,
        metadata: form.metadataNotes ? { notes: form.metadataNotes } : undefined,
        requirements: form.requirements
          .filter((requirement) => requirement.title.trim().length > 0)
          .map((requirement) => ({
            title: requirement.title.trim(),
            status: requirement.status,
            dueAt: requirement.dueAt || null,
            notes: requirement.notes || null,
          })),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="transform transition ease-in duration-150"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">New order</Dialog.Title>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Vendor workflow</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="px-6 py-6 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Vendor
                        <input
                          value={form.vendorName}
                          onChange={(event) => updateField('vendorName', event.target.value)}
                          required
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Service
                        <input
                          value={form.serviceName}
                          onChange={(event) => updateField('serviceName', event.target.value)}
                          required
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Order ID
                        <input
                          value={form.orderNumber}
                          onChange={(event) => updateField('orderNumber', event.target.value)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                        <select
                          value={form.status}
                          onChange={(event) => updateField('status', event.target.value)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                        <input
                          type="number"
                          min="0"
                          value={form.amount}
                          onChange={(event) => updateField('amount', event.target.value)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Currency
                        <input
                          value={form.currency}
                          onChange={(event) => updateField('currency', event.target.value.toUpperCase())}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Kickoff
                        <input
                          type="date"
                          value={form.kickoffAt}
                          onChange={(event) => updateField('kickoffAt', event.target.value)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Due
                        <input
                          type="date"
                          value={form.dueAt}
                          onChange={(event) => updateField('dueAt', event.target.value)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notes
                      <textarea
                        value={form.metadataNotes}
                        onChange={(event) => updateField('metadataNotes', event.target.value)}
                        rows={3}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </label>

                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requirements</p>
                        <button
                          type="button"
                          onClick={addRequirement}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                      <div className="mt-3 space-y-3">
        {form.requirements.map((requirement, index) => (
          <div
            key={requirement.id}
            className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 sm:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <input
              value={requirement.title}
              onChange={(event) => updateRequirement(requirement.id, { title: event.target.value })}
              placeholder="Requirement"
              aria-label="Requirement title"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <select
              value={requirement.status}
              onChange={(event) => updateRequirement(requirement.id, { status: event.target.value })}
              aria-label="Requirement status"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="approved">Approved</option>
            </select>
            <input
              type="date"
              value={requirement.dueAt}
              onChange={(event) => updateRequirement(requirement.id, { dueAt: event.target.value })}
              aria-label="Requirement due date"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => removeRequirement(requirement.id)}
                aria-label={`Remove requirement ${requirement.title || `#${index + 1}`}`}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={requirement.notes}
              onChange={(event) => updateRequirement(requirement.id, { notes: event.target.value })}
              rows={2}
              placeholder="Notes"
              aria-label="Requirement notes"
              className="sm:col-span-4 mt-3 rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-600 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 px-6 py-5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Create
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

NewGigOrderModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  preset: PropTypes.shape({
    name: PropTypes.string,
    vendorName: PropTypes.string,
    serviceName: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    requirements: PropTypes.array,
  }),
};

NewGigOrderModal.defaultProps = {
  preset: null,
};
