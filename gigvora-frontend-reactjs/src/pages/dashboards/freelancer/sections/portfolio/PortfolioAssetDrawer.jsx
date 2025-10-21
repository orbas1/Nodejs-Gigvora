import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowUturnLeftIcon, PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const EMPTY_ASSET = Object.freeze({
  label: '',
  url: '',
  description: '',
  assetType: 'image',
  thumbnailUrl: '',
  sortOrder: 0,
  isPrimary: false,
});

function sanitizeNumber(value) {
  if (value == null || value === '') {
    return 0;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function validateUrl(value) {
  if (!value) {
    return false;
  }
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

function sanitizeAssetPayload(asset) {
  return {
    label: asset.label?.trim() ?? '',
    url: asset.url?.trim() ?? '',
    description: asset.description?.trim() || null,
    assetType: asset.assetType || 'image',
    thumbnailUrl: asset.thumbnailUrl?.trim() || null,
    sortOrder: sanitizeNumber(asset.sortOrder),
    isPrimary: Boolean(asset.isPrimary),
  };
}

function isAssetValid(asset) {
  if (!asset.label?.trim()) {
    return { valid: false, message: 'Enter a descriptive label for the asset.' };
  }
  if (!validateUrl(asset.url)) {
    return { valid: false, message: 'Provide a valid HTTPS link to the asset.' };
  }
  if (asset.thumbnailUrl && !validateUrl(asset.thumbnailUrl)) {
    return { valid: false, message: 'Thumbnail URL must be a valid HTTPS link.' };
  }
  return { valid: true };
}

export default function PortfolioAssetDrawer({
  open,
  item,
  canEdit,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [assets, setAssets] = useState([]);
  const [newAsset, setNewAsset] = useState(EMPTY_ASSET);
  const [savingAssetIds, setSavingAssetIds] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const portfolioId = item?.id;
  const existingAssets = useMemo(() => (Array.isArray(item?.assets) ? item.assets : []), [item]);

  useEffect(() => {
    if (open && existingAssets.length) {
      setAssets(existingAssets.map((asset) => ({ ...asset, sortOrder: asset.sortOrder ?? 0 })));
    } else if (open) {
      setAssets([]);
    }
    if (!open) {
      setAssets([]);
      setNewAsset(EMPTY_ASSET);
      setError(null);
      setSavingAssetIds(new Set());
      setCreating(false);
    }
  }, [open, existingAssets]);

  const handleAssetFieldChange = useCallback((assetId, key, value) => {
    setAssets((previous) =>
      previous.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              [key]: key === 'sortOrder' ? sanitizeNumber(value) : value,
            }
          : asset,
      ),
    );
  }, []);

  const handleSaveAsset = useCallback(
    async (asset) => {
      if (!canEdit || !portfolioId || !onUpdate) {
        return;
      }
      const validation = isAssetValid(asset);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
      setSavingAssetIds((previous) => {
        const next = new Set(previous);
        next.add(asset.id);
        return next;
      });
      setError(null);
      try {
        await onUpdate(portfolioId, asset.id, sanitizeAssetPayload(asset));
      } catch (err) {
        console.error('Failed to update portfolio asset', err);
        setError(err?.message || 'Unable to update asset.');
      } finally {
        setSavingAssetIds((previous) => {
          const next = new Set(previous);
          next.delete(asset.id);
          return next;
        });
      }
    },
    [canEdit, onUpdate, portfolioId],
  );

  const handleDeleteAsset = useCallback(
    async (asset) => {
      if (!canEdit || !portfolioId || !onDelete) {
        return;
      }
      const confirmed = window.confirm(
        `Remove “${asset.label || 'untitled asset'}” from this case study?`,
      );
      if (!confirmed) {
        return;
      }
      setSavingAssetIds((previous) => {
        const next = new Set(previous);
        next.add(asset.id);
        return next;
      });
      setError(null);
      try {
        await onDelete(portfolioId, asset.id);
      } catch (err) {
        console.error('Failed to delete portfolio asset', err);
        setError(err?.message || 'Unable to delete asset.');
      } finally {
        setSavingAssetIds((previous) => {
          const next = new Set(previous);
          next.delete(asset.id);
          return next;
        });
      }
    },
    [canEdit, onDelete, portfolioId],
  );

  const handleCreateAsset = async (event) => {
    event.preventDefault();
    if (!canEdit || !portfolioId) {
      return;
    }
    const validation = isAssetValid(newAsset);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await onCreate?.(portfolioId, sanitizeAssetPayload(newAsset));
      setNewAsset(EMPTY_ASSET);
    } catch (err) {
      console.error('Failed to create portfolio asset', err);
      setError(err?.message || 'Unable to add asset.');
    } finally {
      setCreating(false);
    }
  };

  const disableClose = creating || savingAssetIds.size > 0;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={disableClose ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">Media</Dialog.Title>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disableClose}
                      >
                        <ArrowUturnLeftIcon className="h-4 w-4" /> Close
                      </button>
                    </div>

                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                      {assets.length ? (
                        <ul className="space-y-4">
                          {assets.map((asset) => {
                            const saving = savingAssetIds.has(asset.id);
                            return (
                              <li key={asset.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start gap-4">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500">
                                    <PhotoIcon className="h-6 w-6" />
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600" htmlFor={`asset-${asset.id}-label`}>
                                          Label
                                        </label>
                                        <input
                                          id={`asset-${asset.id}-label`}
                                          type="text"
                                          value={asset.label}
                                          onChange={(event) => handleAssetFieldChange(asset.id, 'label', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600" htmlFor={`asset-${asset.id}-type`}>
                                          Asset type
                                        </label>
                                        <select
                                          id={`asset-${asset.id}-type`}
                                          value={asset.assetType}
                                          onChange={(event) => handleAssetFieldChange(asset.id, 'assetType', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                                        >
                                          <option value="image">Image</option>
                                          <option value="video">Video</option>
                                          <option value="document">Document</option>
                                          <option value="link">Link</option>
                                          <option value="embed">Embed</option>
                                        </select>
                                      </div>
                                      <div className="md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600" htmlFor={`asset-${asset.id}-url`}>
                                          URL
                                        </label>
                                        <input
                                          id={`asset-${asset.id}-url`}
                                          type="url"
                                          value={asset.url}
                                          onChange={(event) => handleAssetFieldChange(asset.id, 'url', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                                          placeholder="https://"
                                        />
                                      </div>
                                      <div className="md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600" htmlFor={`asset-${asset.id}-description`}>
                                          Description
                                        </label>
                                        <textarea
                                          id={`asset-${asset.id}-description`}
                                          rows={2}
                                          value={asset.description ?? ''}
                                          onChange={(event) => handleAssetFieldChange(asset.id, 'description', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600" htmlFor={`asset-${asset.id}-thumb`}>
                                          Thumbnail URL
                                        </label>
                                        <input
                                          id={`asset-${asset.id}-thumb`}
                                          type="url"
                                          value={asset.thumbnailUrl ?? ''}
                                          onChange={(event) => handleAssetFieldChange(asset.id, 'thumbnailUrl', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                                          placeholder="Optional"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600" htmlFor={`asset-${asset.id}-order`}>
                                          Sort order
                                        </label>
                                        <input
                                          id={`asset-${asset.id}-order`}
                                          type="number"
                                          value={asset.sortOrder ?? 0}
                                          onChange={(event) => handleAssetFieldChange(asset.id, 'sortOrder', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          id={`asset-${asset.id}-primary`}
                                          type="checkbox"
                                          checked={Boolean(asset.isPrimary)}
                                          onChange={(event) => handleAssetFieldChange(asset.id, 'isPrimary', event.target.checked)}
                                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label className="text-xs font-semibold text-slate-600" htmlFor={`asset-${asset.id}-primary`}>
                                          Mark as primary
                                        </label>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveAsset(asset)}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {saving ? 'Saving…' : 'Save changes'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAsset(asset)}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <TrashIcon className={saving ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} /> Remove
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
                          No assets yet.
                        </div>
                      )}

                      <form onSubmit={handleCreateAsset} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm font-semibold text-slate-700">New asset</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold text-slate-600" htmlFor="new-asset-label">
                              Label
                            </label>
                            <input
                              id="new-asset-label"
                              type="text"
                              required
                              value={newAsset.label}
                              onChange={(event) => setNewAsset((previous) => ({ ...previous, label: event.target.value }))}
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600" htmlFor="new-asset-type">
                              Asset type
                            </label>
                            <select
                              id="new-asset-type"
                              value={newAsset.assetType}
                              onChange={(event) => setNewAsset((previous) => ({ ...previous, assetType: event.target.value }))}
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                            >
                              <option value="image">Image</option>
                              <option value="video">Video</option>
                              <option value="document">Document</option>
                              <option value="link">Link</option>
                              <option value="embed">Embed</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-600" htmlFor="new-asset-url">
                              URL
                            </label>
                            <input
                              id="new-asset-url"
                              type="url"
                              required
                              value={newAsset.url}
                              onChange={(event) => setNewAsset((previous) => ({ ...previous, url: event.target.value }))}
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                              placeholder="https://"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-600" htmlFor="new-asset-description">
                              Description
                            </label>
                            <textarea
                              id="new-asset-description"
                              rows={2}
                              value={newAsset.description}
                              onChange={(event) => setNewAsset((previous) => ({ ...previous, description: event.target.value }))}
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600" htmlFor="new-asset-thumb">
                              Thumbnail URL
                            </label>
                            <input
                              id="new-asset-thumb"
                              type="url"
                              value={newAsset.thumbnailUrl}
                              onChange={(event) => setNewAsset((previous) => ({ ...previous, thumbnailUrl: event.target.value }))}
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600" htmlFor="new-asset-order">
                              Sort order
                            </label>
                            <input
                              id="new-asset-order"
                              type="number"
                              value={newAsset.sortOrder}
                              onChange={(event) => setNewAsset((previous) => ({ ...previous, sortOrder: sanitizeNumber(event.target.value) }))}
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              id="new-asset-primary"
                              type="checkbox"
                              checked={newAsset.isPrimary}
                              onChange={(event) => setNewAsset((previous) => ({ ...previous, isPrimary: event.target.checked }))}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label className="text-xs font-semibold text-slate-600" htmlFor="new-asset-primary">
                              Mark as primary
                            </label>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={creating}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <PlusIcon className={creating ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                          {creating ? 'Saving…' : 'Add asset'}
                        </button>
                      </form>

                      {error ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
                      ) : null}
                    </div>

                    <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
                      Supported links include secure storage, external docs, and media embeds. Primary assets are highlighted across your public profile.
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

PortfolioAssetDrawer.propTypes = {
  open: PropTypes.bool,
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    assets: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string,
        url: PropTypes.string,
        description: PropTypes.string,
        assetType: PropTypes.string,
        thumbnailUrl: PropTypes.string,
        sortOrder: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        isPrimary: PropTypes.bool,
      }),
    ),
  }),
  canEdit: PropTypes.bool,
  onClose: PropTypes.func,
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};

PortfolioAssetDrawer.defaultProps = {
  open: false,
  item: null,
  canEdit: false,
  onClose: () => {},
  onCreate: null,
  onUpdate: null,
  onDelete: null,
};
