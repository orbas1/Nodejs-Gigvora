import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

const DEFAULT_FORM = {
  name: '',
  description: '',
  heroImageUrl: '',
  layoutMode: 'inline',
  placementLimit: 3,
  defaultPosition: 'inline',
  isActive: true,
  supportsCoupons: true,
};

function formatTimestamp(value) {
  if (!value) return 'Never';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Never';
    }
    return date.toLocaleString();
  } catch (error) {
    return 'Never';
  }
}

AdsSurfaceConfigurator.propTypes = {
  surfaces: PropTypes.arrayOf(
    PropTypes.shape({
      surface: PropTypes.string.isRequired,
      name: PropTypes.string,
      description: PropTypes.string,
      heroImageUrl: PropTypes.string,
      layoutMode: PropTypes.string,
      placementLimit: PropTypes.number,
      defaultPosition: PropTypes.string,
      isActive: PropTypes.bool,
      supportsCoupons: PropTypes.bool,
      updatedAt: PropTypes.string,
    }),
  ),
  layoutModes: PropTypes.arrayOf(PropTypes.string),
  positions: PropTypes.arrayOf(PropTypes.string),
  onSave: PropTypes.func,
};

export default function AdsSurfaceConfigurator({
  surfaces = [],
  layoutModes = [],
  positions = [],
  onSave,
}) {
  const surfaceMap = useMemo(() => {
    const map = new Map();
    surfaces.forEach((surface) => {
      if (surface?.surface) {
        map.set(surface.surface, surface);
      }
    });
    return map;
  }, [surfaces]);

  const [selectedSurface, setSelectedSurface] = useState(() => surfaces[0]?.surface ?? null);
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!selectedSurface) {
      setFormState(DEFAULT_FORM);
      return;
    }
    const current = surfaceMap.get(selectedSurface);
    if (!current) {
      setFormState(DEFAULT_FORM);
      return;
    }
    setFormState({
      name: current.name ?? '',
      description: current.description ?? '',
      heroImageUrl: current.heroImageUrl ?? '',
      layoutMode: current.layoutMode ?? 'inline',
      placementLimit: current.placementLimit ?? 3,
      defaultPosition: current.defaultPosition ?? 'inline',
      isActive: current.isActive ?? true,
      supportsCoupons: current.supportsCoupons ?? true,
    });
  }, [selectedSurface, surfaceMap]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setStatusMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedSurface || typeof onSave !== 'function') {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        heroImageUrl: formState.heroImageUrl.trim() || undefined,
        layoutMode: formState.layoutMode,
        placementLimit: Number.parseInt(formState.placementLimit, 10) || 3,
        defaultPosition: formState.defaultPosition,
        isActive: Boolean(formState.isActive),
        supportsCoupons: Boolean(formState.supportsCoupons),
      };
      await onSave(selectedSurface, payload);
      setStatusMessage('Surface settings saved.');
    } catch (err) {
      setError(err?.message ?? 'Unable to save surface settings.');
    } finally {
      setSaving(false);
    }
  };

  const activeSurface = selectedSurface ? surfaceMap.get(selectedSurface) : null;
  const availableLayouts = layoutModes.length ? layoutModes : ['inline', 'hero', 'carousel', 'grid'];
  const availablePositions = positions.length ? positions : ['inline', 'hero', 'sidebar', 'footer'];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Surface configuration</h2>
          <p className="mt-1 text-sm text-slate-500">
            Control availability, layout, and placement capacity for every Gigvora surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {statusMessage ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" /> {statusMessage}
            </span>
          ) : null}
          {error ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">
              <ExclamationCircleIcon className="h-4 w-4" /> {error}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Surfaces</p>
            <div className="mt-3 space-y-2">
              {surfaces.map((surface) => {
                const isActiveSurface = surface.surface === selectedSurface;
                return (
                  <button
                    key={surface.surface}
                    type="button"
                    onClick={() => setSelectedSurface(surface.surface)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isActiveSurface
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-semibold">{surface.name}</span>
                      <span className={`text-xs font-medium uppercase tracking-wide ${surface.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {surface.isActive ? 'Active' : 'Paused'}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">{surface.description ?? 'No description yet.'}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 text-slate-500">
              <Squares2X2Icon className="h-4 w-4" />
              <span className="font-semibold uppercase tracking-wide">Summary</span>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <dt>Total surfaces</dt>
                <dd className="font-semibold text-slate-800">{surfaces.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Active</dt>
                <dd className="font-semibold text-emerald-600">
                  {surfaces.filter((surface) => surface.isActive !== false).length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Coupons enabled</dt>
                <dd className="font-semibold text-blue-600">
                  {surfaces.filter((surface) => surface.supportsCoupons !== false).length}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-inner"
        >
          {activeSurface ? (
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{activeSurface.name}</h3>
                <p className="text-xs text-slate-500">
                  Last updated {formatTimestamp(activeSurface.updatedAt)}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                activeSurface.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
              }`}
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                {activeSurface.isActive ? 'Serving' : 'Paused'}
              </span>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Display name</span>
              <input
                type="text"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                required
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Layout mode</span>
              <select
                name="layoutMode"
                value={formState.layoutMode}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {availableLayouts.map((layout) => (
                  <option key={layout} value={layout}>
                    {layout.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Placement capacity</span>
              <input
                type="number"
                name="placementLimit"
                min={1}
                max={20}
                value={formState.placementLimit}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Default position</span>
              <select
                name="defaultPosition"
                value={formState.defaultPosition}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {availablePositions.map((position) => (
                  <option key={position} value={position}>
                    {position.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Explain where this surface appears in the product."
            />
          </label>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Hero image URL</span>
            <input
              type="url"
              name="heroImageUrl"
              value={formState.heroImageUrl}
              onChange={handleInputChange}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="https://..."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="isActive"
                checked={formState.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-slate-700">Surface is active</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="supportsCoupons"
                checked={formState.supportsCoupons}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-slate-700">Allow coupons on placements</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : null}
              <span>{saving ? 'Saving…' : 'Save surface'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
