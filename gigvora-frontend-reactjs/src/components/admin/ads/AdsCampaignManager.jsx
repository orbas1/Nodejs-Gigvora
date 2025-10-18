import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_CAMPAIGN_FORM = {
  name: '',
  objective: '',
  status: 'draft',
  budgetCents: '',
  currencyCode: 'USD',
  startDate: '',
  endDate: '',
};

function formatCurrency(value, currency = 'USD') {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(numeric / 100);
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString();
  } catch (error) {
    return '—';
  }
}

export default function AdsCampaignManager({
  campaigns = [],
  objectives = [],
  statuses = [],
  onCreate,
  onUpdate,
  onDelete,
}) {
  const objectiveOptions = objectives.length ? objectives : ['brand', 'acquisition', 'retention', 'cross_sell'];
  const statusOptions = statuses.length ? statuses : ['draft', 'scheduled', 'active', 'paused'];
  const defaultObjective = objectiveOptions[0] ?? 'brand';

  const [mode, setMode] = useState('create');
  const [form, setForm] = useState({ ...DEFAULT_CAMPAIGN_FORM, objective: defaultObjective });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  const campaignMap = useMemo(() => {
    const map = new Map();
    campaigns.forEach((campaign) => {
      map.set(campaign.id, campaign);
    });
    return map;
  }, [campaigns]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setStatusMessage(''), 3500);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (mode === 'create') {
      setForm({ ...DEFAULT_CAMPAIGN_FORM, objective: defaultObjective, status: 'draft' });
      return;
    }
    const campaign = campaignMap.get(mode);
    if (!campaign) {
      setForm({ ...DEFAULT_CAMPAIGN_FORM, objective: defaultObjective, status: 'draft' });
      return;
    }
    setForm({
      name: campaign.name ?? '',
      objective: campaign.objective ?? defaultObjective,
      status: campaign.status ?? 'draft',
      budgetCents: campaign.budgetCents != null ? String(campaign.budgetCents) : '',
      currencyCode: campaign.currencyCode ?? 'USD',
      startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : '',
      endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : '',
    });
  }, [mode, campaignMap, defaultObjective]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      objective: form.objective,
      status: form.status,
      budgetCents: form.budgetCents ? Number.parseInt(form.budgetCents, 10) : undefined,
      currencyCode: form.currencyCode?.trim().toUpperCase() || undefined,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    };

    try {
      setSaving(true);
      setError('');
      if (mode === 'create') {
        if (typeof onCreate === 'function') {
          await onCreate(payload);
        }
        setStatusMessage('Campaign created.');
        setForm({ ...DEFAULT_CAMPAIGN_FORM, objective: defaultObjective });
      } else if (typeof onUpdate === 'function') {
        await onUpdate(mode, payload);
        setStatusMessage('Campaign updated.');
      }
    } catch (err) {
      setError(err?.message ?? 'Unable to save campaign.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode === 'create' || typeof onDelete !== 'function') {
      return;
    }
    if (!window.confirm('Delete this campaign? Creatives attached will need to be reassigned.')) {
      return;
    }
    try {
      setDeleting(true);
      setError('');
      await onDelete(mode);
      setStatusMessage('Campaign deleted.');
      setMode('create');
    } catch (err) {
      setError(err?.message ?? 'Unable to delete campaign.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Campaigns</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage Gigvora Ads campaigns, objectives, and spending readiness.
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Objective</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.length ? (
                campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className={`cursor-pointer transition hover:bg-blue-50 ${mode === campaign.id ? 'bg-blue-50/70' : 'bg-white'}`}
                    onClick={() => setMode(campaign.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <MegaphoneIcon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{campaign.name}</p>
                          <p className="text-xs text-slate-500">Updated {formatDate(campaign.updatedAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{campaign.objective ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                        {campaign.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatCurrency(campaign.budgetCents, campaign.currencyCode ?? 'USD')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-5 text-sm text-slate-500" colSpan={5}>
                    Campaigns will appear here once you create them.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            {mode === 'create' ? 'Create campaign' : 'Edit campaign'}
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
                New campaign
              </button>
            ) : null}
          </div>
        </div>

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
              <span className="font-medium text-slate-700">Objective</span>
              <select
                name="objective"
                value={form.objective}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {objectiveOptions.map((objective) => (
                  <option key={objective} value={objective}>
                    {objective.replace(/_/g, ' ')}
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Budget (cents)</span>
              <input
                type="number"
                name="budgetCents"
                min={0}
                value={form.budgetCents}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Currency</span>
              <input
                type="text"
                name="currencyCode"
                value={form.currencyCode}
                onChange={handleInputChange}
                maxLength={8}
                className="mt-2 uppercase tracking-wide rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">Start date</span>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-600">
              <span className="font-medium text-slate-700">End date</span>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleInputChange}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
            <span>{mode === 'create' ? 'Create campaign' : 'Save changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

AdsCampaignManager.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string,
      objective: PropTypes.string,
      status: PropTypes.string,
      budgetCents: PropTypes.number,
      currencyCode: PropTypes.string,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      updatedAt: PropTypes.string,
    }),
  ),
  objectives: PropTypes.arrayOf(PropTypes.string),
  statuses: PropTypes.arrayOf(PropTypes.string),
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};
