import { useEffect, useMemo, useState } from 'react';
import { PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DEFAULT_RULE = {
  name: '',
  appliesTo: '',
  percentageRate: '',
  flatAmount: '',
  currency: 'USD',
  minimumAmount: '',
  maximumAmount: '',
  description: '',
  tags: '',
  priority: 0,
  isActive: true,
  effectiveFrom: '',
  effectiveTo: '',
};

function RuleModal({ open, title, rule, onClose, onSubmit, saving, error }) {
  const [form, setForm] = useState(rule ?? DEFAULT_RULE);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      ...DEFAULT_RULE,
      ...rule,
      percentageRate: rule?.percentageRate ?? '',
      flatAmount: rule?.flatAmount ?? '',
      minimumAmount: rule?.minimumAmount ?? '',
      maximumAmount: rule?.maximumAmount ?? '',
      priority: rule?.priority ?? 0,
      tags: Array.isArray(rule?.tags) ? rule.tags.join(', ') : rule?.tags ?? '',
    });
  }, [open, rule]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      appliesTo: form.appliesTo.trim() || undefined,
      percentageRate: form.percentageRate === '' ? undefined : Number(form.percentageRate),
      flatAmount: form.flatAmount === '' ? undefined : Number(form.flatAmount),
      currency: form.currency.trim().toUpperCase(),
      minimumAmount: form.minimumAmount === '' ? undefined : Number(form.minimumAmount),
      maximumAmount: form.maximumAmount === '' ? undefined : Number(form.maximumAmount),
      description: form.description.trim() || undefined,
      tags: form.tags
        ? form.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined,
      priority: Number.isFinite(Number(form.priority)) ? Number(form.priority) : 0,
      isActive: Boolean(form.isActive),
      effectiveFrom: form.effectiveFrom || undefined,
      effectiveTo: form.effectiveTo || undefined,
    };
    onSubmit(payload);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">
              Define how fees are calculated across different transaction cohorts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:text-slate-700"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Rule name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Applies to</span>
              <input
                type="text"
                name="appliesTo"
                value={form.appliesTo}
                onChange={handleChange}
                placeholder="escrow_release, milestone"
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Percentage</span>
              <input
                type="number"
                name="percentageRate"
                value={form.percentageRate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g. 12"
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Flat amount</span>
              <input
                type="number"
                name="flatAmount"
                value={form.flatAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="e.g. 5"
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Currency</span>
              <input
                type="text"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                maxLength={3}
                className="mt-1 uppercase tracking-wide rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Minimum amount</span>
              <input
                type="number"
                name="minimumAmount"
                value={form.minimumAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Maximum amount</span>
              <input
                type="number"
                name="maximumAmount"
                value={form.maximumAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Tags</span>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="growth, escrow"
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Priority</span>
              <input
                type="number"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Effective from</span>
              <input
                type="date"
                name="effectiveFrom"
                value={form.effectiveFrom ?? ''}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Effective to</span>
              <input
                type="date"
                name="effectiveTo"
                value={form.effectiveTo ?? ''}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Rule is active
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? 'Saving…' : 'Save rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeeRuleManager({ feeRules, onCreate, onUpdate, onDelete, formatCurrency, formatPercent }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditingRule(null);
    setModalOpen(true);
    setError('');
  };

  const openEdit = (rule) => {
    setEditingRule(rule);
    setModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingRule(null);
    setError('');
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError('');
    try {
      if (editingRule) {
        await onUpdate(editingRule.id, payload);
      } else {
        await onCreate(payload);
      }
      setModalOpen(false);
      setEditingRule(null);
    } catch (err) {
      setError(err?.message ?? 'Unable to save fee rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Deactivate and archive this fee rule?');
      if (!confirmed) {
        return;
      }
    }
    setSaving(true);
    setError('');
    try {
      await onDelete(rule.id);
    } catch (err) {
      setError(err?.message ?? 'Unable to delete fee rule.');
    } finally {
      setSaving(false);
    }
  };

  const normalizedRules = useMemo(() => (Array.isArray(feeRules) ? feeRules : []), [feeRules]);

  return (
    <section id="finance-fee-rules" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Fee rule library</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Configure marketplace fees across products, currencies, and payout scenarios. All changes flow through the treasury ledger automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" /> New fee rule
        </button>
      </div>

      {error ? <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p> : null}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">Rule</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">Structure</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">Limits</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">Status</th>
              <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-xs text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {normalizedRules.length ? (
              normalizedRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{rule.name}</div>
                    <div className="text-xs text-slate-500">{rule.appliesTo || 'All transactions'}</div>
                    {rule.tags?.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rule.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-700">
                      {rule.percentageRate != null ? `${formatPercent(rule.percentageRate)} of gross` : null}
                      {rule.percentageRate != null && rule.flatAmount != null ? ' + ' : null}
                      {rule.flatAmount != null ? formatCurrency(rule.flatAmount, rule.currency) : null}
                    </div>
                    <div className="text-xs text-slate-500">{rule.currency}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">
                      {rule.minimumAmount != null ? `Min ${formatCurrency(rule.minimumAmount, rule.currency)}` : 'No minimum'}
                    </div>
                    <div className="text-xs text-slate-600">
                      {rule.maximumAmount != null ? `Max ${formatCurrency(rule.maximumAmount, rule.currency)}` : 'No cap'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="mt-1 text-xs text-slate-500">
                      {rule.effectiveFrom ? `From ${new Date(rule.effectiveFrom).toLocaleDateString()}` : 'Immediate'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(rule)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                      >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                        disabled={saving}
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" /> Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                  No fee rules configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RuleModal
        open={modalOpen}
        title={editingRule ? 'Edit fee rule' : 'Create fee rule'}
        rule={editingRule}
        onClose={closeModal}
        onSubmit={handleSubmit}
        saving={saving}
        error={error}
      />
    </section>
  );
}
