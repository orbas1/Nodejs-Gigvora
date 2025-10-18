import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_PLACEMENT_FORM = {
  creativeId: '',
  surface: '',
  position: 'inline',
  status: 'scheduled',
  weight: 1,
  pacingMode: 'even',
  maxImpressionsPerHour: '',
  startAt: '',
  endAt: '',
  opportunityType: '',
  priority: 0,
  couponIds: [],
};

function formatDateTime(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString();
  } catch (error) {
    return '—';
  }
}

AdsPlacementManager.propTypes = {
  placements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      creativeId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      surface: PropTypes.string,
      surfaceLabel: PropTypes.string,
      position: PropTypes.string,
      status: PropTypes.string,
      weight: PropTypes.number,
      pacingMode: PropTypes.string,
      maxImpressionsPerHour: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      startAt: PropTypes.string,
      endAt: PropTypes.string,
      opportunityType: PropTypes.string,
      priority: PropTypes.number,
      coupons: PropTypes.array,
      creative: PropTypes.object,
    }),
  ),
  surfaces: PropTypes.arrayOf(
    PropTypes.shape({
      surface: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  ),
  creatives: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string,
    }),
  ),
  statuses: PropTypes.arrayOf(PropTypes.string),
  positions: PropTypes.arrayOf(PropTypes.string),
  pacingModes: PropTypes.arrayOf(PropTypes.string),
  opportunityTypes: PropTypes.arrayOf(PropTypes.string),
  coupons: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      code: PropTypes.string,
      name: PropTypes.string,
    }),
  ),
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};

export default function AdsPlacementManager({
  placements = [],
  surfaces = [],
  creatives = [],
  statuses = [],
  positions = [],
  pacingModes = [],
  opportunityTypes = [],
  coupons = [],
  onCreate,
  onUpdate,
  onDelete,
}) {
  const statusOptions = statuses.length ? statuses : ['scheduled', 'active', 'paused'];
  const positionOptions = positions.length ? positions : ['inline', 'hero', 'sidebar', 'footer'];
  const pacingOptions = pacingModes.length ? pacingModes : ['even', 'accelerated', 'asap'];
  const opportunityOptions = opportunityTypes.length ? opportunityTypes : ['awareness', 'acquisition'];

  const defaultSurface = surfaces[0]?.surface ?? 'global_dashboard';
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState({ ...DEFAULT_PLACEMENT_FORM, surface: defaultSurface });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  const placementMap = useMemo(() => {
    const map = new Map();
    placements.forEach((placement) => {
      map.set(placement.id, placement);
    });
    return map;
  }, [placements]);

  const surfaceOptions = useMemo(() => {
    if (surfaces.length) {
      return surfaces.map((surface) => ({ value: surface.surface, label: surface.name ?? surface.surface }));
    }
    return [
      { value: 'global_dashboard', label: 'Gigvora network' },
      { value: 'company_dashboard', label: 'Company dashboard' },
    ];
  }, [surfaces]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setStatusMessage(''), 3500);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (mode === 'create') {
      setForm({ ...DEFAULT_PLACEMENT_FORM, surface: defaultSurface });
      return;
    }
    const placement = placementMap.get(mode);
    if (!placement) {
      setForm({ ...DEFAULT_PLACEMENT_FORM, surface: defaultSurface });
      return;
    }
    setForm({
      creativeId: placement.creativeId ? String(placement.creativeId) : '',
      surface: placement.surface ?? defaultSurface,
      position: placement.position ?? 'inline',
      status: placement.status ?? 'scheduled',
      weight: placement.weight ?? 1,
      pacingMode: placement.pacingMode ?? 'even',
      maxImpressionsPerHour:
        placement.maxImpressionsPerHour != null ? String(placement.maxImpressionsPerHour) : '',
      startAt: placement.startAt ? placement.startAt.slice(0, 16) : '',
      endAt: placement.endAt ? placement.endAt.slice(0, 16) : '',
      opportunityType: placement.opportunityType ?? '',
      priority: placement.priority ?? 0,
      couponIds: Array.isArray(placement.coupons)
        ? placement.coupons.map((coupon) => String(coupon.couponId))
        : [],
    });
  }, [mode, placementMap, defaultSurface]);

  const handleInputChange = (event) => {
    const { name, value, type, selectedOptions } = event.target;
    if (type === 'select-multiple') {
      const values = Array.from(selectedOptions, (option) => option.value);
      setForm((previous) => ({ ...previous, [name]: values }));
      return;
    }
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      creativeId: form.creativeId ? Number.parseInt(form.creativeId, 10) : undefined,
      surface: form.surface,
      position: form.position,
      status: form.status,
      weight: Number.parseInt(form.weight, 10) || 1,
      pacingMode: form.pacingMode,
      maxImpressionsPerHour: form.maxImpressionsPerHour
        ? Number.parseInt(form.maxImpressionsPerHour, 10)
        : undefined,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
      opportunityType: form.opportunityType || undefined,
      priority: Number.parseInt(form.priority, 10) || 0,
      couponIds: Array.isArray(form.couponIds)
        ? form.couponIds.map((value) => Number.parseInt(value, 10)).filter((id) => Number.isInteger(id))
        : undefined,
    };

    try {
      setSaving(true);
      setError('');
      if (mode === 'create') {
        if (typeof onCreate === 'function') {
          await onCreate(payload);
        }
        setStatusMessage('Placement created.');
        setForm({ ...DEFAULT_PLACEMENT_FORM, surface: defaultSurface });
      } else if (typeof onUpdate === 'function') {
        await onUpdate(mode, payload);
        setStatusMessage('Placement updated.');
      }
    } catch (err) {
      setError(err?.message ?? 'Unable to save placement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode === 'create' || typeof onDelete !== 'function') {
      return;
    }
    if (!window.confirm('Delete this placement? It will stop serving immediately.')) {
      return;
    }
    try {
      setDeleting(true);
      setError('');
      await onDelete(mode);
      setStatusMessage('Placement removed.');
      setMode('create');
    } catch (err) {
      setError(err?.message ?? 'Unable to delete placement.');
    } finally {
      setDeleting(false);
    }
  };

  const creativeOptions = creatives.length
    ? creatives.map((creative) => ({ value: creative.id, label: creative.name }))
    : [{ value: '', label: 'No creatives available' }];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Placements</h2>
          <p className="mt-1 text-sm text-slate-500">
            Schedule where and when creatives appear, including coupons and pacing limits.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {statusMessage ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" /> {statusMessage}
            </span>
          ) : null}
          {error ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
              <ExclamationCircleIcon className="h-4 w-4" /> {error}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)]">
        <div className="space-y-4">
          {placements.length ? (
            placements.map((placement) => (
              <button
                key={placement.id}
                type="button"
                onClick={() => setMode(placement.id)}
                className={`flex w-full items-start justify-between rounded-2xl border px-4 py-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mode === placement.id
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{placement.surfaceLabel ?? placement.surface}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {placement.position} • {placement.status}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Starts {formatDateTime(placement.startAt)}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">{placement.creative?.name ?? 'Untitled creative'}</p>
                  <p>Weight {placement.weight}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Once placements are configured they will appear here.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            {mode === 'create' ? 'Create placement' : 'Edit placement'}
          </p>
          <div className="flex items-center gap-3">
            {mode !== 'create' ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-semibold text-rose-600 hover:text-rose-500 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            ) : null}
            {mode !== 'create' ? (
              <button
                type="button"
                onClick={() => setMode('create')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-500"
              >
                New placement
              </button>
            ) : null}
          </div>
        </div>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Creative</span>
            <select
              name="creativeId"
              value={form.creativeId}
              onChange={handleInputChange}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">Select creative</option>
              {creativeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Surface</span>
              <select
                name="surface"
                value={form.surface}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {surfaceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Position</span>
              <select
                name="position"
                value={form.position}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {positionOptions.map((position) => (
                  <option key={position} value={position}>
                    {position.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Pacing</span>
              <select
                name="pacingMode"
                value={form.pacingMode}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {pacingOptions.map((pacing) => (
                  <option key={pacing} value={pacing}>
                    {pacing.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Weight</span>
              <input
                type="number"
                name="weight"
                min={1}
                max={100}
                value={form.weight}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Max impressions / hour</span>
              <input
                type="number"
                name="maxImpressionsPerHour"
                min={0}
                value={form.maxImpressionsPerHour}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Start time</span>
              <input
                type="datetime-local"
                name="startAt"
                value={form.startAt}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">End time</span>
              <input
                type="datetime-local"
                name="endAt"
                value={form.endAt}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Opportunity type</span>
            <select
              name="opportunityType"
              value={form.opportunityType}
              onChange={handleInputChange}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Not set</option>
              {opportunityOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Priority</span>
            <input
              type="number"
              name="priority"
              min={0}
              max={1000}
              value={form.priority}
              onChange={handleInputChange}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Coupons</span>
            <select
              name="couponIds"
              value={form.couponIds}
              multiple
              onChange={handleInputChange}
              className="mt-2 h-28 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {coupons.length ? (
                coupons.map((coupon) => (
                  <option key={coupon.id} value={coupon.id}>
                    {coupon.code} — {coupon.name}
                  </option>
                ))
              ) : (
                <option value="">No coupons available</option>
              )}
            </select>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
            <span>{mode === 'create' ? 'Create placement' : 'Save changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
