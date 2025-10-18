import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const TYPE_OPTIONS = [
  { value: 'logo_light', label: 'Logo light' },
  { value: 'logo_dark', label: 'Logo dark' },
  { value: 'favicon', label: 'Favicon' },
  { value: 'hero', label: 'Hero' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'background', label: 'Background' },
  { value: 'icon', label: 'Icon' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const ROLE_OPTIONS = ['admin', 'manager', 'editor', 'viewer'];

function buildAssetDraft(asset) {
  return {
    id: asset?.id ?? '',
    themeId: asset?.themeId ?? '',
    type: asset?.type ?? 'logo_light',
    label: asset?.label ?? '',
    url: asset?.url ?? '',
    altText: asset?.altText ?? '',
    status: asset?.status ?? 'active',
    isPrimary: Boolean(asset?.isPrimary),
    allowedRoles: Array.isArray(asset?.allowedRoles) ? asset.allowedRoles : [],
  };
}

function AssetForm({ open, onClose, onSubmit, initialAsset, themes, saving }) {
  const [draft, setDraft] = useState(() => buildAssetDraft(initialAsset));

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(buildAssetDraft(initialAsset));
  }, [initialAsset, open]);

  const toggleRole = (role) => {
    setDraft((current) => {
      const currentRoles = current.allowedRoles ?? [];
      if (currentRoles.includes(role)) {
        return { ...current, allowedRoles: currentRoles.filter((item) => item !== role) };
      }
      return { ...current, allowedRoles: [...currentRoles, role] };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ ...draft });
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6 p-8">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-slate-900">
                      {draft.id ? 'Edit asset' : 'New asset'}
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Label</span>
                      <input
                        type="text"
                        required
                        value={draft.label}
                        onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Type</span>
                      <select
                        value={draft.type}
                        onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      >
                        {TYPE_OPTIONS.map((option) => (
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

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-medium text-slate-700">Image URL</span>
                      <input
                        type="url"
                        required
                        value={draft.url}
                        onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </label>

                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-sm font-medium text-slate-700">Alt text</span>
                      <input
                        type="text"
                        value={draft.altText}
                        onChange={(event) => setDraft((current) => ({ ...current, altText: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">Roles</p>
                    <div className="flex flex-wrap gap-2">
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

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={draft.isPrimary}
                      onChange={(event) => setDraft((current) => ({ ...current, isPrimary: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Primary asset</span>
                  </label>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:cursor-wait disabled:bg-sky-400"
                    >
                      {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                      <span>Save</span>
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

function AssetCard({ asset, onEdit, onRemove, disabled }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-video w-full bg-slate-100">
        {asset.url ? (
          <img src={asset.url} alt={asset.altText || asset.label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <PhotoIcon className="h-10 w-10" />
          </div>
        )}
        {asset.isPrimary ? (
          <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Primary
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <p className="text-lg font-semibold text-slate-900">{asset.label}</p>
          <p className="text-sm text-slate-500">{asset.type}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{asset.status}</span>
          {asset.allowedRoles?.map((role) => (
            <span key={role} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              {role}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => onEdit(asset)}
            disabled={disabled}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onRemove(asset)}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:border-red-300 hover:text-red-700 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssetLibrary({
  assets = [],
  themes = [],
  isLoading,
  onCreateAsset,
  onUpdateAsset,
  onDeleteAsset,
  onNotify,
}) {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const filteredAssets = useMemo(() => {
    if (filter === 'all') {
      return assets;
    }
    return assets.filter((asset) => asset.type === filter);
  }, [assets, filter]);

  const handleOpenCreate = () => {
    setSelectedAsset(null);
    setOpen(true);
  };

  const handleOpenEdit = (asset) => {
    setSelectedAsset(asset);
    setOpen(true);
  };

  const handleSubmit = async (draft) => {
    setSaving(true);
    try {
      if (draft.id) {
        await onUpdateAsset(draft.id, draft);
        onNotify?.('Asset saved', 'success');
      } else {
        await onCreateAsset(draft);
        onNotify?.('Asset added', 'success');
      }
      setOpen(false);
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to save asset', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (asset) => {
    if (!window.confirm(`Delete asset ${asset.label}?`)) {
      return;
    }
    try {
      await onDeleteAsset(asset.id);
      onNotify?.('Asset removed', 'success');
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to delete asset', 'error');
    }
  };

  return (
    <section id="view-media" className="space-y-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Media</h2>
          <p className="text-sm text-slate-500">Manage logos and imagery for every surface.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All</option>
            {TYPE_OPTIONS.map((option) => (
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
            <span>Upload</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">Loading assets…</div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onEdit={handleOpenEdit}
            onRemove={handleDelete}
            disabled={saving}
          />
        ))}
        {filteredAssets.length === 0 && !isLoading ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center">
            <p className="text-sm font-medium text-slate-500">No media yet</p>
            <p className="text-xs text-slate-400">Upload an asset to see it here.</p>
          </div>
        ) : null}
      </div>

      <AssetForm
        open={open}
        onClose={() => (saving ? null : setOpen(false))}
        onSubmit={handleSubmit}
        initialAsset={selectedAsset}
        themes={themes}
        saving={saving}
      />
    </section>
  );
}
