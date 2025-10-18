import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const PERMISSION_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'public', label: 'Public' },
];

const DEFAULT_FORM = {
  projectId: '',
  label: '',
  category: '',
  storageUrl: '',
  thumbnailUrl: '',
  permissionLevel: 'internal',
  sizeBytes: '',
  watermarkEnabled: true,
  metadataNotes: '',
};

export default function AssetModal({ open, projects, onClose, onSubmit }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      ...DEFAULT_FORM,
      projectId: projects?.[0]?.id ? String(projects[0].id) : '',
    });
    setSaving(false);
  }, [open, projects]);

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.projectId) {
      return;
    }
    try {
      setSaving(true);
      await onSubmit(Number(form.projectId), {
        label: form.label.trim(),
        category: form.category || 'artifact',
        storageUrl: form.storageUrl.trim(),
        thumbnailUrl: form.thumbnailUrl || undefined,
        permissionLevel: form.permissionLevel,
        sizeBytes: form.sizeBytes ? Number(form.sizeBytes) : undefined,
        watermarkEnabled: Boolean(form.watermarkEnabled),
        metadata: form.metadataNotes ? { notes: form.metadataNotes } : undefined,
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
              <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">Add asset</Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="px-6 py-6 space-y-4">
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Project
                      <select
                        value={form.projectId}
                        onChange={(event) => updateField('projectId', event.target.value)}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      >
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.title ?? `Project ${project.id}`}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Label
                      <input
                        value={form.label}
                        onChange={(event) => updateField('label', event.target.value)}
                        required
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Category
                        <input
                          value={form.category}
                          onChange={(event) => updateField('category', event.target.value)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Permission
                        <select
                          value={form.permissionLevel}
                          onChange={(event) => updateField('permissionLevel', event.target.value)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                          {PERMISSION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Storage URL
                      <input
                        value={form.storageUrl}
                        onChange={(event) => updateField('storageUrl', event.target.value)}
                        required
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Thumbnail
                      <input
                        value={form.thumbnailUrl}
                        onChange={(event) => updateField('thumbnailUrl', event.target.value)}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Size (bytes)
                        <input
                          type="number"
                          min="0"
                          value={form.sizeBytes}
                          onChange={(event) => updateField('sizeBytes', event.target.value)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <input
                          type="checkbox"
                          checked={form.watermarkEnabled}
                          onChange={(event) => updateField('watermarkEnabled', event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        Watermark
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
                      Save
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

AssetModal.propTypes = {
  open: PropTypes.bool.isRequired,
  projects: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
  })).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
