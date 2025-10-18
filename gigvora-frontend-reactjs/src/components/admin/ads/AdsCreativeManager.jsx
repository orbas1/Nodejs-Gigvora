import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_CREATIVE_FORM = {
  campaignId: '',
  name: '',
  type: 'display',
  status: 'active',
  headline: '',
  subheadline: '',
  body: '',
  callToAction: '',
  ctaUrl: '',
  mediaUrl: '',
  durationSeconds: '',
};

export default function AdsCreativeManager({
  creatives = [],
  campaigns = [],
  adTypes = [],
  statuses = [],
  onCreate,
  onUpdate,
  onDelete,
}) {
  const typeOptions = useMemo(
    () => (adTypes.length ? adTypes : ['display', 'text', 'video']),
    [adTypes],
  );
  const statusOptions = useMemo(
    () => (statuses.length ? statuses : ['active', 'paused', 'draft']),
    [statuses],
  );
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState({ ...DEFAULT_CREATIVE_FORM, type: typeOptions[0] ?? 'display' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  const creativeMap = useMemo(() => {
    const map = new Map();
    creatives.forEach((creative) => {
      map.set(creative.id, creative);
    });
    return map;
  }, [creatives]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setStatusMessage(''), 3500);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (mode === 'create') {
      setForm({ ...DEFAULT_CREATIVE_FORM, type: typeOptions[0] ?? 'display', status: 'active' });
      return;
    }
    const creative = creativeMap.get(mode);
    if (!creative) {
      setForm({ ...DEFAULT_CREATIVE_FORM, type: typeOptions[0] ?? 'display', status: 'active' });
      return;
    }
    setForm({
      campaignId: creative.campaignId ?? '',
      name: creative.name ?? '',
      type: creative.type ?? (typeOptions[0] ?? 'display'),
      status: creative.status ?? 'active',
      headline: creative.headline ?? '',
      subheadline: creative.subheadline ?? '',
      body: creative.body ?? '',
      callToAction: creative.callToAction ?? '',
      ctaUrl: creative.ctaUrl ?? '',
      mediaUrl: creative.mediaUrl ?? '',
      durationSeconds: creative.durationSeconds != null ? String(creative.durationSeconds) : '',
    });
  }, [mode, creativeMap, typeOptions]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      campaignId: form.campaignId ? Number.parseInt(form.campaignId, 10) : undefined,
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      headline: form.headline.trim() || undefined,
      subheadline: form.subheadline.trim() || undefined,
      body: form.body.trim() || undefined,
      callToAction: form.callToAction.trim() || undefined,
      ctaUrl: form.ctaUrl.trim() || undefined,
      mediaUrl: form.mediaUrl.trim() || undefined,
      durationSeconds: form.durationSeconds ? Number.parseInt(form.durationSeconds, 10) : undefined,
    };

    try {
      setSaving(true);
      setError('');
      if (mode === 'create') {
        if (typeof onCreate === 'function') {
          await onCreate(payload);
        }
        setStatusMessage('Creative added.');
        setForm({ ...DEFAULT_CREATIVE_FORM, type: typeOptions[0] ?? 'display', status: 'active' });
      } else if (typeof onUpdate === 'function') {
        await onUpdate(mode, payload);
        setStatusMessage('Creative updated.');
      }
    } catch (err) {
      setError(err?.message ?? 'Unable to save creative.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode === 'create' || typeof onDelete !== 'function') {
      return;
    }
    if (!window.confirm('Delete this creative? Placements using it must be unscheduled first.')) {
      return;
    }
    try {
      setDeleting(true);
      setError('');
      await onDelete(mode);
      setStatusMessage('Creative removed.');
      setMode('create');
    } catch (err) {
      setError(err?.message ?? 'Unable to delete creative.');
    } finally {
      setDeleting(false);
    }
  };

  const campaignOptions = campaigns.length
    ? campaigns
    : [{ id: '', name: 'No campaigns', objective: '' }];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Creatives</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload creative metadata, copy, and calls to action for each campaign.
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          {creatives.length ? (
            creatives.map((creative) => (
              <button
                key={creative.id}
                type="button"
                onClick={() => setMode(creative.id)}
                className={`flex h-full flex-col justify-between rounded-2xl border px-4 py-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mode === creative.id
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <PhotoIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{creative.name}</p>
                    <p className="text-xs text-slate-500">
                      {creative.type} • {creative.status}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  <p>{creative.headline ?? 'No headline yet.'}</p>
                  <p className="mt-1">Campaign ID: {creative.campaignId ?? '—'}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Add your first creative to begin scheduling placements.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            {mode === 'create' ? 'Create creative' : 'Edit creative'}
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
                New creative
              </button>
            ) : null}
          </div>
        </div>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Campaign</span>
            <select
              name="campaignId"
              value={form.campaignId}
              onChange={handleInputChange}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">No campaign</option>
              {campaignOptions.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              required
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Type</span>
              <select
                name="type"
                value={form.type}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
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
          </div>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Headline</span>
            <input
              type="text"
              name="headline"
              value={form.headline}
              onChange={handleInputChange}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Subheadline</span>
            <input
              type="text"
              name="subheadline"
              value={form.subheadline}
              onChange={handleInputChange}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Body copy</span>
            <textarea
              name="body"
              value={form.body}
              onChange={handleInputChange}
              rows={3}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Call to action</span>
              <input
                type="text"
                name="callToAction"
                value={form.callToAction}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Destination URL</span>
              <input
                type="url"
                name="ctaUrl"
                value={form.ctaUrl}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="https://..."
              />
            </label>
          </div>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Media URL</span>
            <input
              type="url"
              name="mediaUrl"
              value={form.mediaUrl}
              onChange={handleInputChange}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="https://..."
            />
          </label>

          <label className="flex flex-col text-sm text-slate-600">
            <span className="font-medium text-slate-700">Duration (seconds)</span>
            <input
              type="number"
              name="durationSeconds"
              min={0}
              value={form.durationSeconds}
              onChange={handleInputChange}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
            <span>{mode === 'create' ? 'Create creative' : 'Save changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

AdsCreativeManager.propTypes = {
  creatives: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      campaignId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
      type: PropTypes.string,
      status: PropTypes.string,
      headline: PropTypes.string,
      subheadline: PropTypes.string,
      body: PropTypes.string,
      callToAction: PropTypes.string,
      ctaUrl: PropTypes.string,
      mediaUrl: PropTypes.string,
      durationSeconds: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ),
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string,
    }),
  ),
  adTypes: PropTypes.arrayOf(PropTypes.string),
  statuses: PropTypes.arrayOf(PropTypes.string),
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};
