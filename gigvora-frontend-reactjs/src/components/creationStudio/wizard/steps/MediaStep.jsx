import { useState } from 'react';
import PropTypes from 'prop-types';

export default function MediaStep({ draft, onChange }) {
  const [assetDraft, setAssetDraft] = useState({ label: '', url: '', type: 'image' });

  const handleAddAsset = () => {
    if (!assetDraft.label.trim() || !assetDraft.url.trim()) {
      return;
    }
    const newAsset = {
      id: `asset-${Date.now()}`,
      label: assetDraft.label.trim(),
      url: assetDraft.url.trim(),
      type: assetDraft.type,
      isPrimary: false,
      orderIndex: (draft.assets?.length ?? 0) + 1,
    };
    onChange({ assets: [...(draft.assets ?? []), newAsset] });
    setAssetDraft({ label: '', url: '', type: 'image' });
  };

  const handleAssetRemove = (assetId) => {
    onChange({ assets: (draft.assets ?? []).filter((asset) => asset.id !== assetId) });
  };

  const handleAssetPrimary = (assetId) => {
    const nextAssets = (draft.assets ?? []).map((asset) => ({
      ...asset,
      isPrimary: asset.id === assetId,
    }));
    onChange({ assets: nextAssets });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hero-image">
            Hero image
          </label>
          <input
            id="hero-image"
            type="url"
            value={draft.heroImageUrl ?? ''}
            onChange={(event) => onChange({ heroImageUrl: event.target.value })}
            placeholder="https://image"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hero-video">
            Hero video
          </label>
          <input
            id="hero-video"
            type="url"
            value={draft.heroVideoUrl ?? ''}
            onChange={(event) => onChange({ heroVideoUrl: event.target.value })}
            placeholder="https://video"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="thumbnail">
          Thumbnail
        </label>
        <input
          id="thumbnail"
          type="url"
          value={draft.thumbnailUrl ?? ''}
          onChange={(event) => onChange({ thumbnailUrl: event.target.value })}
          placeholder="https://thumb"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Asset gallery</p>
        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="text"
            value={assetDraft.label}
            onChange={(event) => setAssetDraft((previous) => ({ ...previous, label: event.target.value }))}
            placeholder="Label"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            type="url"
            value={assetDraft.url}
            onChange={(event) => setAssetDraft((previous) => ({ ...previous, url: event.target.value }))}
            placeholder="https://asset"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <select
            value={assetDraft.type}
            onChange={(event) => setAssetDraft((previous) => ({ ...previous, type: event.target.value }))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleAddAsset}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Add asset
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(draft.assets ?? []).map((asset) => (
          <div key={asset.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{asset.label}</p>
              <span className="text-xs font-medium uppercase text-slate-500">{asset.type}</span>
            </div>
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-xs font-medium text-blue-600 hover:underline"
            >
              {asset.url}
            </a>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAssetPrimary(asset.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  asset.isPrimary
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                Primary
              </button>
              <button
                type="button"
                onClick={() => handleAssetRemove(asset.id)}
                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

MediaStep.propTypes = {
  draft: PropTypes.shape({
    heroImageUrl: PropTypes.string,
    heroVideoUrl: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    assets: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string,
        url: PropTypes.string,
        type: PropTypes.string,
        isPrimary: PropTypes.bool,
      }),
    ),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
