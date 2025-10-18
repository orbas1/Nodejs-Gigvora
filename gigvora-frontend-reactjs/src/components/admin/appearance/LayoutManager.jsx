import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CursorArrowRaysIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const PAGE_OPTIONS = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'auth', label: 'Auth' },
  { value: 'admin', label: 'Admin' },
  { value: 'support', label: 'Support' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const ROLE_OPTIONS = ['admin', 'manager', 'editor', 'viewer'];

function buildLayoutDraft(layout) {
  return {
    id: layout?.id ?? '',
    name: layout?.name ?? '',
    slug: layout?.slug ?? '',
    page: layout?.page ?? 'marketing',
    status: layout?.status ?? 'draft',
    themeId: layout?.themeId ?? '',
    version: layout?.version ?? 1,
    allowedRoles: Array.isArray(layout?.allowedRoles) ? layout.allowedRoles : [],
    config: JSON.stringify(layout?.config ?? { sections: [] }, null, 2),
    releaseNotes: layout?.releaseNotes ?? '',
  };
}

function LayoutWizard({ open, onClose, onSubmit, initialLayout, themes, saving }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => buildLayoutDraft(initialLayout));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(buildLayoutDraft(initialLayout));
    setStep(0);
    setError('');
  }, [initialLayout, open]);

  const toggleRole = (role) => {
    setDraft((current) => {
      const currentRoles = current.allowedRoles ?? [];
      if (currentRoles.includes(role)) {
        return { ...current, allowedRoles: currentRoles.filter((item) => item !== role) };
      }
      return { ...current, allowedRoles: [...currentRoles, role] };
    });
  };

  const handleNext = () => {
    if (!draft.name || !draft.slug) {
      setError('Name and key are required.');
      return;
    }
    setError('');
    setStep(1);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    try {
      const parsedConfig = JSON.parse(draft.config || '{}');
      onSubmit({
        ...draft,
        config: parsedConfig,
        version: Number(draft.version) || 1,
      });
    } catch (err) {
      setError('Layout config must be valid JSON.');
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={saving ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6 p-8">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-slate-900">
                      {draft.id ? 'Edit layout' : 'New layout'}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <span className={`rounded-full px-3 py-1 ${step === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      Details
                    </span>
                    <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      Layout JSON
                    </span>
                  </div>

                  {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

                  {step === 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Name</span>
                        <input
                          type="text"
                          required
                          value={draft.name}
                          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Key</span>
                        <input
                          type="text"
                          required
                          value={draft.slug}
                          onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Page</span>
                        <select
                          value={draft.page}
                          onChange={(event) => setDraft((current) => ({ ...current, page: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          {PAGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Theme</span>
                        <select
                          value={draft.themeId}
                          onChange={(event) => setDraft((current) => ({ ...current, themeId: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          <option value="">None</option>
                          {themes.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                              {theme.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Status</span>
                        <select
                          value={draft.status}
                          onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Version</span>
                        <input
                          type="number"
                          min="1"
                          value={draft.version}
                          onChange={(event) => setDraft((current) => ({ ...current, version: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-sm font-medium text-slate-700">Release notes</span>
                        <textarea
                          rows={3}
                          value={draft.releaseNotes}
                          onChange={(event) => setDraft((current) => ({ ...current, releaseNotes: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-slate-700">Roles</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ROLE_OPTIONS.map((role) => {
                            const active = draft.allowedRoles.includes(role);
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(role)}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                  active
                                    ? 'border-sky-500 bg-sky-100 text-sky-700'
                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                }`}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="space-y-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Layout config</span>
                        <textarea
                          rows={12}
                          value={draft.config}
                          onChange={(event) => setDraft((current) => ({ ...current, config: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={step === 0 ? onClose : () => setStep(0)}
                      disabled={saving}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    >
                      {step === 0 ? 'Cancel' : 'Back'}
                    </button>
                    {step === 0 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                      >
                        <CursorArrowRaysIcon className="h-4 w-4" />
                        <span>Next</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:cursor-wait disabled:bg-sky-400"
                      >
                        {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                        <span>Save</span>
                      </button>
                    )}
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

function LayoutRow({ layout, onEdit, onPublish, onRemove, disabled }) {
  return (
    <tr className="border-b border-slate-100 last:border-none">
      <td className="px-4 py-4">
        <div className="font-semibold text-slate-900">{layout.name}</div>
        <div className="text-xs text-slate-500">{layout.slug}</div>
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">{layout.page}</td>
      <td className="px-4 py-4 text-sm text-slate-600">{layout.status}</td>
      <td className="px-4 py-4 text-sm text-slate-600">v{layout.version}</td>
      <td className="px-4 py-4 text-sm text-slate-600">{layout.theme?.name ?? '—'}</td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(layout)}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
          >
            <PencilSquareIcon className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onPublish(layout)}
            disabled={disabled || layout.status === 'published'}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50"
          >
            <CheckCircleIcon className="h-4 w-4" />
            <span>Publish</span>
          </button>
          <button
            type="button"
            onClick={() => onRemove(layout)}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600 hover:border-red-300 hover:text-red-700 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function LayoutManager({
  layouts = [],
  themes = [],
  isLoading,
  onCreateLayout,
  onUpdateLayout,
  onPublishLayout,
  onDeleteLayout,
  onNotify,
}) {
  const [open, setOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pageFilter, setPageFilter] = useState('all');

  const filteredLayouts = useMemo(() => {
    if (pageFilter === 'all') {
      return layouts;
    }
    return layouts.filter((layout) => layout.page === pageFilter);
  }, [layouts, pageFilter]);

  const handleOpenCreate = () => {
    setSelectedLayout(null);
    setOpen(true);
  };

  const handleOpenEdit = (layout) => {
    setSelectedLayout(layout);
    setOpen(true);
  };

  const handleSubmit = async (draft) => {
    setSaving(true);
    try {
      if (draft.id) {
        const payload = { ...draft };
        delete payload.id;
        await onUpdateLayout(selectedLayout.id, payload);
        onNotify?.('Layout saved', 'success');
      } else {
        await onCreateLayout(draft);
        onNotify?.('Layout created', 'success');
      }
      setOpen(false);
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to save layout', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (layout) => {
    try {
      await onPublishLayout(layout.id, { releaseNotes: layout.releaseNotes ?? '' });
      onNotify?.('Layout published', 'success');
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to publish layout', 'error');
    }
  };

  const handleDelete = async (layout) => {
    if (!window.confirm(`Delete layout ${layout.name}?`)) {
      return;
    }
    try {
      await onDeleteLayout(layout.id);
      onNotify?.('Layout removed', 'success');
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to delete layout', 'error');
    }
  };

  return (
    <section id="view-layouts" className="space-y-6 rounded-4xl border border-slate-200 bg-slate-50/80 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Layouts</h2>
          <p className="text-sm text-slate-500">Define presets for each page surface.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageFilter}
            onChange={(event) => setPageFilter(event.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All</option>
            {PAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">Loading layouts…</div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Page</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Version</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Theme</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLayouts.map((layout) => (
              <LayoutRow
                key={layout.id}
                layout={layout}
                onEdit={handleOpenEdit}
                onPublish={handlePublish}
                onRemove={handleDelete}
                disabled={saving}
              />
            ))}
          </tbody>
        </table>
        {filteredLayouts.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">No layouts yet</div>
        ) : null}
      </div>

      <LayoutWizard
        open={open}
        onClose={() => (saving ? null : setOpen(false))}
        onSubmit={handleSubmit}
        initialLayout={selectedLayout}
        themes={themes}
        saving={saving}
      />
    </section>
  );
}
