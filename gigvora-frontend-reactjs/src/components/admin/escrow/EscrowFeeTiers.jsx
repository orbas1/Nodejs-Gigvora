import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/outline';

const STATUS_BADGES = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
};

function formatCurrency(value, currency = 'USD') {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function TierEditor({ open, initialValue, onClose, onSubmit, saving }) {
  const fallback =
    initialValue ??
    {
      provider: 'stripe',
      status: 'active',
      currencyCode: 'USD',
      minimumAmount: 0,
      maximumAmount: '',
      percentFee: 0,
      flatFee: 0,
    };
  const [draft, setDraft] = useState(fallback);

  useEffect(() => {
    setDraft(
      initialValue ?? {
        provider: 'stripe',
        status: 'active',
        currencyCode: 'USD',
        minimumAmount: 0,
        maximumAmount: '',
        percentFee: 0,
        flatFee: 0,
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
      minimumAmount:
        draft.minimumAmount === '' || draft.minimumAmount == null
          ? null
          : Number(draft.minimumAmount),
      maximumAmount:
        draft.maximumAmount === '' || draft.maximumAmount == null
          ? null
          : Number(draft.maximumAmount),
      percentFee:
        draft.percentFee === '' || draft.percentFee == null ? null : Number(draft.percentFee),
      flatFee: draft.flatFee === '' || draft.flatFee == null ? null : Number(draft.flatFee),
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
              <Dialog.Panel className="w-full max-w-xl transform rounded-3xl bg-white p-6 shadow-2xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {initialValue?.id ? 'Edit fee tier' : 'Create fee tier'}
                </Dialog.Title>
                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="tier-provider">
                        Provider
                      </label>
                      <select
                        id="tier-provider"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.provider}
                        onChange={(event) => handleChange('provider', event.target.value)}
                      >
                        <option value="stripe">Stripe</option>
                        <option value="escrow_com">Escrow.com</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="tier-status">
                        Status
                      </label>
                      <select
                        id="tier-status"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.status}
                        onChange={(event) => handleChange('status', event.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="tier-currency">
                        Currency
                      </label>
                      <input
                        id="tier-currency"
                        type="text"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.currencyCode}
                        onChange={(event) => handleChange('currencyCode', event.target.value.toUpperCase())}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="tier-label">
                        Label
                      </label>
                      <input
                        id="tier-label"
                        type="text"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.label ?? ''}
                        onChange={(event) => handleChange('label', event.target.value)}
                        placeholder="High value"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="tier-min">
                        Minimum amount
                      </label>
                      <input
                        id="tier-min"
                        type="number"
                        min={0}
                        step="0.01"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.minimumAmount ?? ''}
                        onChange={(event) => handleChange('minimumAmount', event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="tier-max">
                        Maximum amount
                      </label>
                      <input
                        id="tier-max"
                        type="number"
                        min={0}
                        step="0.01"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.maximumAmount ?? ''}
                        onChange={(event) => handleChange('maximumAmount', event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="tier-percent">
                        Percent fee (%)
                      </label>
                      <input
                        id="tier-percent"
                        type="number"
                        min={0}
                        step="0.01"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.percentFee ?? ''}
                        onChange={(event) => handleChange('percentFee', event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="tier-flat">
                        Flat fee
                      </label>
                      <input
                        id="tier-flat"
                        type="number"
                        min={0}
                        step="0.01"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={draft.flatFee ?? ''}
                        onChange={(event) => handleChange('flatFee', event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
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
                      {saving ? 'Saving…' : 'Save tier'}
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

export default function EscrowFeeTiers({ tiers = [], currency = 'USD', onCreate, onUpdate, onDelete }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorValue, setEditorValue] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditorValue({
      provider: 'stripe',
      status: 'active',
      currencyCode: currency,
      minimumAmount: 0,
      maximumAmount: '',
      percentFee: 2.5,
      flatFee: 0,
    });
    setEditorOpen(true);
  };

  const openEdit = (tier) => {
    setEditorValue({ ...tier });
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

  const handleDelete = async (tier) => {
    if (!window.confirm(`Remove fee tier "${tier.label ?? tier.id}"?`)) {
      return;
    }
    await onDelete?.(tier.id);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Fee tiers</h3>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <PlusIcon className="h-4 w-4" /> New tier
        </button>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Provider</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Range</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Percent</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Flat</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {tiers.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                  No tiers yet.
                </td>
              </tr>
            )}
            {tiers.map((tier) => (
              <tr key={tier.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-slate-900">{tier.provider}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatCurrency(tier.minimumAmount, tier.currencyCode)} –{' '}
                  {tier.maximumAmount != null
                    ? formatCurrency(tier.maximumAmount, tier.currencyCode)
                    : 'No cap'}
                </td>
                <td className="px-4 py-3 text-slate-600">{Number(tier.percentFee ?? 0).toFixed(2)}%</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(tier.flatFee, tier.currencyCode)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_BADGES[tier.status] ?? STATUS_BADGES.inactive
                    }`}
                  >
                    {tier.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(tier)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tier)}
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
      <TierEditor
        open={editorOpen}
        initialValue={editorValue}
        onClose={() => {
          if (!saving) {
            setEditorOpen(false);
            setEditorValue(null);
          }
        }}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </section>
  );
}
