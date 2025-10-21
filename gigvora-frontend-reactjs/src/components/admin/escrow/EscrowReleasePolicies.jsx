import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/outline';

const POLICY_OPTIONS = [
  { value: 'auto_release_after_hours', label: 'Auto release after hours' },
  { value: 'client_confirmation', label: 'Client confirmation required' },
  { value: 'milestone_approval', label: 'Milestone approval' },
  { value: 'manual_review', label: 'Manual review only' },
];

const STATUS_CLASSES = {
  draft: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  disabled: 'bg-slate-100 text-slate-600',
};

function PolicyEditor({ open, initialValue, onSubmit, onClose, saving }) {
  const fallback =
    initialValue ?? {
      name: '',
      policyType: 'auto_release_after_hours',
      status: 'draft',
      thresholdAmount: '',
      thresholdHours: '',
      requiresComplianceHold: false,
      requiresManualApproval: false,
      notifyEmails: '',
      description: '',
      orderIndex: 1,
    };
  const [draft, setDraft] = useState(fallback);

  useEffect(() => {
    setDraft(
      initialValue ?? {
        name: '',
        policyType: 'auto_release_after_hours',
        status: 'draft',
        thresholdAmount: '',
        thresholdHours: '',
        requiresComplianceHold: false,
        requiresManualApproval: false,
        notifyEmails: '',
        description: '',
        orderIndex: 1,
      },
    );
  }, [initialValue]);

  const handleChange = (field, value) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...draft,
      thresholdAmount:
        draft.thresholdAmount === '' || draft.thresholdAmount == null
          ? null
          : Number(draft.thresholdAmount),
      thresholdHours:
        draft.thresholdHours === '' || draft.thresholdHours == null
          ? null
          : Number(draft.thresholdHours),
      orderIndex:
        draft.orderIndex === '' || draft.orderIndex == null ? null : Number(draft.orderIndex),
      notifyEmails: draft.notifyEmails
        ? draft.notifyEmails.split(/\n|,/).map((email) => email.trim()).filter(Boolean)
        : [],
    };
    onSubmit?.(payload);
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={saving ? () => {} : onClose}>
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
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform rounded-3xl bg-white p-6 shadow-2xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {initialValue?.id ? 'Edit release policy' : 'Create release policy'}
                </Dialog.Title>
                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="policy-name">
                        Name
                      </label>
                      <input
                        id="policy-name"
                        type="text"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.name}
                        onChange={(event) => handleChange('name', event.target.value)}
                        placeholder="High-value review"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="policy-order">
                        Order
                      </label>
                      <input
                        id="policy-order"
                        type="number"
                        min={1}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.orderIndex}
                        onChange={(event) => handleChange('orderIndex', event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="policy-type">
                        Policy type
                      </label>
                      <select
                        id="policy-type"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.policyType}
                        onChange={(event) => handleChange('policyType', event.target.value)}
                      >
                        {POLICY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="policy-status">
                        Status
                      </label>
                      <select
                        id="policy-status"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.status}
                        onChange={(event) => handleChange('status', event.target.value)}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="threshold-amount">
                        Threshold amount
                      </label>
                      <input
                        id="threshold-amount"
                        type="number"
                        min={0}
                        step="0.01"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.thresholdAmount ?? ''}
                        onChange={(event) => handleChange('thresholdAmount', event.target.value)}
                        placeholder="25000"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="threshold-hours">
                        Threshold hours
                      </label>
                      <input
                        id="threshold-hours"
                        type="number"
                        min={0}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.thresholdHours ?? ''}
                        onChange={(event) => handleChange('thresholdHours', event.target.value)}
                        placeholder="48"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={Boolean(draft.requiresManualApproval)}
                        onChange={(event) => handleChange('requiresManualApproval', event.target.checked)}
                      />
                      Require manual approval
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={Boolean(draft.requiresComplianceHold)}
                        onChange={(event) => handleChange('requiresComplianceHold', event.target.checked)}
                      />
                      Block releases pending compliance
                    </label>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="policy-emails">
                      Notification emails
                    </label>
                    <textarea
                      id="policy-emails"
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={draft.notifyEmails}
                      onChange={(event) => handleChange('notifyEmails', event.target.value)}
                      placeholder="compliance@gigvora.com\nfinance@gigvora.com"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Separate multiple email addresses with commas or new lines.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="policy-description">
                      Description
                    </label>
                    <textarea
                      id="policy-description"
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={draft.description}
                      onChange={(event) => handleChange('description', event.target.value)}
                      placeholder="Escrows over £25k require manual review by treasury."
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {saving ? 'Saving…' : 'Save policy'}
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

export default function EscrowReleasePolicies({ policies = [], onCreate, onUpdate, onDelete }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorValue, setEditorValue] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditorValue(null);
    setEditorOpen(true);
  };

  const openEdit = (policy) => {
    setEditorValue({
      ...policy,
      notifyEmails: Array.isArray(policy.notifyEmails) ? policy.notifyEmails.join('\n') : '',
    });
    setEditorOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      if (payload.id) {
        await onUpdate?.(payload.id, payload);
      } else {
        await onCreate?.(payload);
      }
      setEditorOpen(false);
      setEditorValue(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (policy) => {
    if (!window.confirm(`Delete release policy "${policy.name}"?`)) {
      return;
    }
    await onDelete?.(policy.id);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Release policies</h3>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <PlusIcon className="h-4 w-4" /> New policy
        </button>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Thresholds</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {policies.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                  No policies yet.
                </td>
              </tr>
            )}
            {policies.map((policy) => (
              <tr key={policy.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-slate-900">{policy.name}</td>
                <td className="px-4 py-3 text-slate-600">{policy.policyType.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-slate-600">
                  {policy.thresholdAmount != null ? `≥ ${policy.thresholdAmount}` : '—'} |
                  {policy.thresholdHours != null ? ` ${policy.thresholdHours} hrs` : ' no delay'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_CLASSES[policy.status] ?? STATUS_CLASSES.disabled
                    }`}
                  >
                    {policy.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(policy)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(policy)}
                      className="text-sm font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PolicyEditor
        open={editorOpen}
        initialValue={editorValue}
        onSubmit={handleSubmit}
        onClose={() => {
          if (!saving) {
            setEditorOpen(false);
            setEditorValue(null);
          }
        }}
        saving={saving}
      />
    </section>
  );
}

EscrowReleasePolicies.propTypes = {
  policies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      policyType: PropTypes.string,
      status: PropTypes.string,
      thresholdAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      thresholdHours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      requiresComplianceHold: PropTypes.bool,
      requiresManualApproval: PropTypes.bool,
      notifyEmails: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.string,
      ]),
      description: PropTypes.string,
      orderIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ),
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};

EscrowReleasePolicies.defaultProps = {
  policies: [],
  onCreate: undefined,
  onUpdate: undefined,
  onDelete: undefined,
};
