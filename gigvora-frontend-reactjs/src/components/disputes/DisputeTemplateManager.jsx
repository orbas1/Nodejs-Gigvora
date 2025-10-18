import { useEffect, useState } from 'react';
import { PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

const STAGE_OPTIONS = ['intake', 'mediation', 'arbitration', 'resolved'];
const PRIORITY_OPTIONS = ['urgent', 'high', 'medium', 'low'];

function TemplateModal({ open, onClose, onSubmit, initialValue }) {
  const [formState, setFormState] = useState({
    name: '',
    reasonCode: '',
    defaultStage: 'intake',
    defaultPriority: 'medium',
    guidance: '',
    checklist: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setFormState({
        name: initialValue.name ?? '',
        reasonCode: initialValue.reasonCode ?? '',
        defaultStage: initialValue.defaultStage ?? 'intake',
        defaultPriority: initialValue.defaultPriority ?? 'medium',
        guidance: initialValue.guidance ?? '',
        checklist: (initialValue.checklist ?? []).join('\n'),
        active: initialValue.active ?? true,
      });
    } else {
      setFormState({
        name: '',
        reasonCode: '',
        defaultStage: 'intake',
        defaultPriority: 'medium',
        guidance: '',
        checklist: '',
        active: true,
      });
    }
  }, [initialValue]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit?.({
        ...formState,
        checklist: formState.checklist
          .split(/\n/)
          .map((item) => item.trim())
          .filter(Boolean),
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
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{initialValue ? 'Edit playbook' : 'New playbook'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Name</span>
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Reason code</span>
            <input
              type="text"
              name="reasonCode"
              value={formState.reasonCode}
              onChange={handleChange}
              placeholder="e.g. scope_change"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Default stage</span>
              <select
                name="defaultStage"
                value={formState.defaultStage}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {STAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Default priority</span>
              <select
                name="defaultPriority"
                value={formState.defaultPriority}
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
            <span className="font-medium text-slate-700">Guidance</span>
            <textarea
              name="guidance"
              value={formState.guidance}
              onChange={handleChange}
              rows={3}
              placeholder="Steps or notes"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Checklist items</span>
            <textarea
              name="checklist"
              value={formState.checklist}
              onChange={handleChange}
              rows={3}
              placeholder="Item per line"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="active"
              checked={formState.active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Active template
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
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DisputeTemplateManager({ templates, loading, onCreate, onUpdate, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setModalOpen(true);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editingTemplate) {
      await onUpdate?.(editingTemplate.id, payload);
    } else {
      await onCreate?.(payload);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Playbooks</h2>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
        >
          <PlusIcon className="h-4 w-4" />
          New
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : templates?.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>{template.defaultStage ? template.defaultStage.replace(/_/g, ' ') : '—'}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    template.active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {template.active ? 'Active' : 'Paused'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openEditModal(template)}
                className="mt-3 text-left"
              >
                <p className="text-lg font-semibold text-slate-900">{template.name}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {template.guidance ? `${template.guidance.slice(0, 140)}${template.guidance.length > 140 ? '…' : ''}` : 'No notes yet.'}
                </p>
              </button>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex flex-col gap-1 text-left">
                  <span className="capitalize">{template.defaultPriority ?? '—'}</span>
                  <span className="uppercase tracking-wide text-slate-400">{template.reasonCode ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(template)}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
                    aria-label="Edit playbook"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(template.id)}
                    className="rounded-full border border-slate-200 p-2 text-rose-600 transition hover:border-rose-400 hover:text-rose-700"
                    aria-label="Delete playbook"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">No playbooks yet.</p>
      )}

      <TemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialValue={editingTemplate}
      />
    </section>
  );
}
