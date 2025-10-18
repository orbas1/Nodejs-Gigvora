import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const PRIORITY_OPTIONS = ['urgent', 'high', 'medium', 'low'];

export default function DisputeCreateModal({ open, onClose, onSubmit, templates }) {
  const [formState, setFormState] = useState({
    escrowTransactionId: '',
    openedById: '',
    assignedToId: '',
    priority: 'medium',
    reasonCode: '',
    summary: '',
    customerDeadlineAt: '',
    providerDeadlineAt: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormState({
        escrowTransactionId: '',
        openedById: '',
        assignedToId: '',
        priority: 'medium',
        reasonCode: '',
        summary: '',
        customerDeadlineAt: '',
        providerDeadlineAt: '',
      });
    }
  }, [open]);

  const templateLookup = useMemo(() => {
    const map = new Map();
    (templates ?? []).forEach((template) => {
      map.set(template.id, template);
    });
    return map;
  }, [templates]);

  const handleTemplateApply = (event) => {
    const templateId = Number.parseInt(event.target.value, 10);
    if (!Number.isFinite(templateId)) {
      return;
    }
    const template = templateLookup.get(templateId);
    if (!template) return;
    setFormState((current) => ({
      ...current,
      priority: template.defaultPriority ?? current.priority,
      reasonCode: template.reasonCode ?? current.reasonCode,
      summary: template.guidance ?? current.summary,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const escrowTransactionId = Number(formState.escrowTransactionId);
      const openedById = Number(formState.openedById);
      const assignedToId = formState.assignedToId ? Number(formState.assignedToId) : undefined;

      if (!Number.isFinite(escrowTransactionId) || !Number.isFinite(openedById)) {
        throw new Error('Escrow transaction ID and opened by ID must be numeric');
      }

      await onSubmit?.({
        escrowTransactionId,
        openedById,
        assignedToId: Number.isFinite(assignedToId) ? assignedToId : undefined,
        priority: formState.priority,
        reasonCode: formState.reasonCode,
        summary: formState.summary,
        customerDeadlineAt: formState.customerDeadlineAt ? new Date(formState.customerDeadlineAt).toISOString() : undefined,
        providerDeadlineAt: formState.providerDeadlineAt ? new Date(formState.providerDeadlineAt).toISOString() : undefined,
      });
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Create dispute</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Escrow transaction ID</span>
              <input
                type="number"
                name="escrowTransactionId"
                value={formState.escrowTransactionId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Opened by (user ID)</span>
              <input
                type="number"
                name="openedById"
                value={formState.openedById}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Assign to (optional)</span>
              <input
                type="number"
                name="assignedToId"
                value={formState.assignedToId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Priority</span>
              <select
                name="priority"
                value={formState.priority}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Reason code</span>
            <input
              type="text"
              name="reasonCode"
              value={formState.reasonCode}
              onChange={handleChange}
              placeholder="e.g. scope_change"
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Summary</span>
            <textarea
              name="summary"
              value={formState.summary}
              onChange={handleChange}
              rows={3}
              required
              placeholder="Brief overview of the dispute context"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Customer deadline</span>
              <input
                type="datetime-local"
                name="customerDeadlineAt"
                value={formState.customerDeadlineAt}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Provider deadline</span>
              <input
                type="datetime-local"
                name="providerDeadlineAt"
                value={formState.providerDeadlineAt}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Apply template</span>
            <select
              defaultValue=""
              onChange={handleTemplateApply}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select template</option>
              {(templates ?? []).map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
