import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ChartBarIcon, MegaphoneIcon, PlayCircleIcon, PowerIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['Draft', 'Active', 'Paused', 'Completed'];
const OBJECTIVE_OPTIONS = ['Lead generation', 'Program awareness', 'Community growth', 'Waitlist'];

const STATUS_BADGE_STYLES = {
  Draft: 'border-slate-200 bg-slate-100 text-slate-600',
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Paused: 'border-amber-200 bg-amber-50 text-amber-700',
  Completed: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

const DEFAULT_CAMPAIGN = {
  name: '',
  objective: 'Lead generation',
  status: 'Draft',
  budget: '',
  spend: '',
  impressions: '',
  clicks: '',
  conversions: '',
  startDate: '',
  endDate: '',
  placements: '',
  cta: '',
  creativeUrl: '',
  thumbnail: '',
  audience: '',
};

function formatForDateInput(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const offset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  } catch (error) {
    console.warn('Unable to format campaign date for input', error);
    return '';
  }
}

function normaliseDate(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (error) {
    console.warn('Unable to normalise campaign date', error);
    return null;
  }
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
}

export default function MentorAdsSection({ campaigns, insights, saving, onCreateCampaign, onUpdateCampaign, onDeleteCampaign, onToggleCampaign }) {
  const [formState, setFormState] = useState(DEFAULT_CAMPAIGN);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [objectiveFilter, setObjectiveFilter] = useState('all');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [previewCampaignId, setPreviewCampaignId] = useState(null);

  const list = campaigns ?? [];

  const performance = useMemo(() => ({
    totalSpend: insights?.totalSpend ?? list.reduce((acc, campaign) => acc + Number(campaign.spend ?? 0), 0),
    leads: insights?.leads ?? list.reduce((acc, campaign) => acc + Number(campaign.conversions ?? 0), 0),
    roas: insights?.roas ?? 0,
    avgCpc: insights?.avgCpc ?? (list.reduce((acc, campaign) => acc + Number(campaign.spend ?? 0), 0) / (list.reduce((acc, campaign) => acc + Number(campaign.clicks ?? 0), 0) || 1)),
  }), [insights, list]);

  const handleReset = () => {
    setFormState(DEFAULT_CAMPAIGN);
    setEditingCampaignId(null);
  };

  useEffect(() => {
    if (!editingCampaignId) {
      return;
    }
    const activeCampaign = list.find((campaign) => campaign.id === editingCampaignId);
    if (!activeCampaign) {
      setEditingCampaignId(null);
      setFormState(DEFAULT_CAMPAIGN);
      return;
    }
    setFormState({
      ...DEFAULT_CAMPAIGN,
      ...activeCampaign,
      placements: (activeCampaign.placements ?? []).join(', '),
      startDate: formatForDateInput(activeCampaign.startDate),
      endDate: formatForDateInput(activeCampaign.endDate),
    });
  }, [editingCampaignId, list]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      ...formState,
      budget: toNumber(formState.budget),
      spend: toNumber(formState.spend),
      impressions: toNumber(formState.impressions),
      clicks: toNumber(formState.clicks),
      conversions: toNumber(formState.conversions),
      startDate: normaliseDate(formState.startDate),
      endDate: normaliseDate(formState.endDate),
      placements: Array.isArray(formState.placements)
        ? formState.placements
        : String(formState.placements ?? '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
    };
    try {
      if (editingCampaignId) {
        await onUpdateCampaign?.(editingCampaignId, payload);
      } else {
        await onCreateCampaign?.(payload);
      }
      setFeedback({ type: 'success', message: 'Campaign saved successfully.' });
      handleReset();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to save campaign.' });
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaignId(campaign.id);
    setFormState({
      ...DEFAULT_CAMPAIGN,
      ...campaign,
      placements: (campaign.placements ?? []).join(', '),
      startDate: formatForDateInput(campaign.startDate),
      endDate: formatForDateInput(campaign.endDate),
    });
  };

  const handleDelete = async (campaignId) => {
    setFeedback(null);
    try {
      await onDeleteCampaign?.(campaignId);
      setFeedback({ type: 'success', message: 'Campaign removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to delete campaign.' });
    }
  };

  const handleToggle = async (campaignId, status) => {
    setFeedback(null);
    try {
      await onToggleCampaign?.(campaignId, { status });
      setFeedback({ type: 'success', message: `Campaign ${status === 'Active' ? 'activated' : 'paused'}.` });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to update campaign status.' });
    }
  };

  const filteredCampaigns = useMemo(() => {
    return list
      .filter((campaign) => (statusFilter === 'all' ? true : campaign.status === statusFilter))
      .filter((campaign) => (objectiveFilter === 'all' ? true : campaign.objective === objectiveFilter))
      .filter((campaign) => {
        if (!campaignSearch) return true;
        const haystack = `${campaign.name ?? ''} ${campaign.audience ?? ''}`.toLowerCase();
        return haystack.includes(campaignSearch.toLowerCase());
      })
      .sort((a, b) => {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
        const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
        return bDate - aDate;
      });
  }, [campaignSearch, list, objectiveFilter, statusFilter]);

  const previewCampaign = useMemo(() => {
    if (!filteredCampaigns.length) return null;
    if (previewCampaignId) {
      return filteredCampaigns.find((campaign) => campaign.id === previewCampaignId) ?? filteredCampaigns[0];
    }
    return filteredCampaigns[0];
  }, [filteredCampaigns, previewCampaignId]);

  useEffect(() => {
    if (!filteredCampaigns.length) {
      if (previewCampaignId !== null) {
        setPreviewCampaignId(null);
      }
      return;
    }
    if (!filteredCampaigns.some((campaign) => campaign.id === previewCampaignId)) {
      setPreviewCampaignId(filteredCampaigns[0].id);
    }
  }, [filteredCampaigns, previewCampaignId]);

  return (
    <section className="space-y-10 rounded-3xl border border-slate-200 bg-slate-50/60 p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Gigvora ads</p>
          <h2 className="text-2xl font-semibold text-slate-900">Promote mentorship offerings with precision</h2>
          <p className="text-sm text-slate-600">
            Orchestrate multi-channel campaigns to boost Explorer visibility, nurture waitlists, and reach new mentee segments.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total spend</p>
          <p className="text-lg font-semibold text-slate-900">£{performance.totalSpend.toLocaleString?.() ?? performance.totalSpend}</p>
          <p className="text-xs">Leads generated: {performance.leads}</p>
        </div>
      </header>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-4">
        <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ROAS</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{performance.roas}</p>
          <p className="text-xs text-slate-500">Return on ad spend</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg CPC</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">£{performance.avgCpc.toFixed(2)}</p>
          <p className="text-xs text-slate-500">Cost per click across live campaigns</p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campaigns</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{list.length}</p>
          <p className="text-xs text-slate-500">Active & paused combined</p>
        </div>
        <div className="rounded-3xl border border-violet-100 bg-violet-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lead flow</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{performance.leads}</p>
          <p className="text-xs text-slate-500">Confirmed conversions</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {editingCampaignId ? 'Update campaign' : 'Launch campaign'}
          </h3>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Name
            <input
              type="text"
              required
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Objective
              <select
                value={formState.objective}
                onChange={(event) => setFormState((current) => ({ ...current, objective: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {OBJECTIVE_OPTIONS.map((objective) => (
                  <option key={objective}>{objective}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Status
              <select
                value={formState.status}
                onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Budget (£)
              <input
                type="number"
                value={formState.budget}
                onChange={(event) => setFormState((current) => ({ ...current, budget: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Spend (£)
              <input
                type="number"
                value={formState.spend}
                onChange={(event) => setFormState((current) => ({ ...current, spend: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Impressions
              <input
                type="number"
                value={formState.impressions}
                onChange={(event) => setFormState((current) => ({ ...current, impressions: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Clicks
              <input
                type="number"
                value={formState.clicks}
                onChange={(event) => setFormState((current) => ({ ...current, clicks: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Conversions
              <input
                type="number"
                value={formState.conversions}
                onChange={(event) => setFormState((current) => ({ ...current, conversions: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Start date
              <input
                type="date"
                value={formState.startDate}
                onChange={(event) => setFormState((current) => ({ ...current, startDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              End date
              <input
                type="date"
                value={formState.endDate}
                onChange={(event) => setFormState((current) => ({ ...current, endDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Placements (comma separated)
            <input
              type="text"
              value={formState.placements}
              onChange={(event) => setFormState((current) => ({ ...current, placements: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              CTA label
              <input
                type="text"
                value={formState.cta}
                onChange={(event) => setFormState((current) => ({ ...current, cta: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Audience
              <input
                type="text"
                value={formState.audience}
                onChange={(event) => setFormState((current) => ({ ...current, audience: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Creative video URL
            <input
              type="url"
              value={formState.creativeUrl}
              onChange={(event) => setFormState((current) => ({ ...current, creativeUrl: event.target.value }))}
              placeholder="https://www.youtube.com/embed/..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Thumbnail URL
            <input
              type="url"
              value={formState.thumbnail}
              onChange={(event) => setFormState((current) => ({ ...current, thumbnail: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
            >
              <MegaphoneIcon className="h-4 w-4" />
              {saving ? 'Saving…' : editingCampaignId ? 'Update campaign' : 'Create campaign'}
            </button>
            <button type="button" onClick={handleReset} className="text-xs font-semibold text-slate-500 hover:text-accent">
              Reset
            </button>
          </div>
        </form>

        <div className="lg:col-span-3">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2">
                    Status
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="rounded-full border border-slate-200 px-3 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                    >
                      <option value="all">All</option>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    Objective
                    <select
                      value={objectiveFilter}
                      onChange={(event) => setObjectiveFilter(event.target.value)}
                      className="rounded-full border border-slate-200 px-3 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                    >
                      <option value="all">All</option>
                      {OBJECTIVE_OPTIONS.map((objective) => (
                        <option key={objective} value={objective}>
                          {objective}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <input
                  type="search"
                  value={campaignSearch}
                  onChange={(event) => setCampaignSearch(event.target.value)}
                  placeholder="Search campaigns"
                  className="rounded-full border border-slate-200 px-3 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>
              {filteredCampaigns.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
                  {list.length
                    ? 'No campaigns match the filters. Adjust status or objective to reveal more.'
                    : 'No campaigns yet. Launch an Explorer spotlight or nurture sequence to get started.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCampaigns.map((campaign) => {
                    const isSelected = previewCampaign?.id === campaign.id;
                    return (
                      <article
                        key={campaign.id}
                        className={`space-y-4 rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                          isSelected ? 'border-accent/40 ring-1 ring-accent/30' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{campaign.name}</h3>
                            <p className="text-xs text-slate-500">{campaign.objective}</p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                              STATUS_BADGE_STYLES[campaign.status] ?? 'border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                          >
                            <ChartBarIcon className="h-4 w-4" />
                            {campaign.status}
                          </span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-4">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spend</p>
                            <p className="text-lg font-semibold text-slate-900">£{campaign.spend}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impressions</p>
                            <p className="text-lg font-semibold text-slate-900">{campaign.impressions}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clicks</p>
                            <p className="text-lg font-semibold text-slate-900">{campaign.clicks}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversions</p>
                            <p className="text-lg font-semibold text-slate-900">{campaign.conversions}</p>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Placements</p>
                            <p>{(campaign.placements ?? []).join(', ')}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
                            <p>
                              {campaign.startDate ? format(new Date(campaign.startDate), 'dd MMM yyyy') : '—'} –{' '}
                              {campaign.endDate ? format(new Date(campaign.endDate), 'dd MMM yyyy') : '—'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600">Audience: {campaign.audience || 'Not specified'}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                          <button type="button" onClick={() => handleEdit(campaign)} className="text-slate-500 hover:text-accent">
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(campaign.id, campaign.status === 'Active' ? 'Paused' : 'Active')}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                          >
                            <PowerIcon className="h-3.5 w-3.5" />
                            {campaign.status === 'Active' ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(campaign.id)}
                            className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewCampaignId(campaign.id)}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
                              isSelected
                                ? 'border-accent bg-accent/10 font-semibold text-accent'
                                : 'border-slate-200 font-semibold text-slate-500 hover:border-accent hover:text-accent'
                            }`}
                            aria-pressed={isSelected}
                          >
                            <PlayCircleIcon className="h-3.5 w-3.5" />
                            {isSelected ? 'Previewing' : 'Preview'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
            <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {previewCampaign ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Live preview</p>
                        <h3 className="text-xl font-semibold text-slate-900">{previewCampaign.name}</h3>
                        <p className="text-sm text-slate-500">{previewCampaign.objective}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                          STATUS_BADGE_STYLES[previewCampaign.status] ?? 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        <ChartBarIcon className="h-4 w-4" />
                        {previewCampaign.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Audience focus: {previewCampaign.audience || 'Add an audience description to tailor the message.'}
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5">
                    {previewCampaign.creativeUrl ? (
                      <iframe
                        title={`${previewCampaign.name} creative`}
                        src={previewCampaign.creativeUrl}
                        className="h-56 w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : previewCampaign.thumbnail ? (
                      <img
                        src={previewCampaign.thumbnail}
                        alt={`${previewCampaign.name} creative thumbnail`}
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center bg-slate-100 text-center text-sm text-slate-500">
                        Add a thumbnail or embed link to preview your creative.
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
                      <p>
                        {previewCampaign.startDate ? format(new Date(previewCampaign.startDate), 'dd MMM yyyy') : '—'} –{' '}
                        {previewCampaign.endDate ? format(new Date(previewCampaign.endDate), 'dd MMM yyyy') : '—'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
                      <p>£{previewCampaign.budget ?? '—'}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impressions</p>
                      <p>{previewCampaign.impressions ?? '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clicks</p>
                      <p>{previewCampaign.clicks ?? '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversions</p>
                      <p>{previewCampaign.conversions ?? '—'}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Placements</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {(previewCampaign.placements ?? []).length ? (
                        (previewCampaign.placements ?? []).map((placement) => (
                          <li key={placement} className="flex items-center justify-between gap-2">
                            <span>{placement}</span>
                            <span className="text-xs text-slate-400">Optimised</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400">Add placements to broadcast your offer.</li>
                      )}
                    </ul>
                  </div>
                  {previewCampaign.cta ? (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm"
                        disabled
                      >
                        <MegaphoneIcon className="h-4 w-4" />
                        {previewCampaign.cta}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-slate-500">
                  <MegaphoneIcon className="h-10 w-10 text-slate-300" />
                  <p>Select a campaign to see a live preview with creative and performance snapshots.</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

MentorAdsSection.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      objective: PropTypes.string,
      status: PropTypes.string,
      budget: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      spend: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      impressions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      clicks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      conversions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      placements: PropTypes.arrayOf(PropTypes.string),
      cta: PropTypes.string,
      creativeUrl: PropTypes.string,
      thumbnail: PropTypes.string,
      audience: PropTypes.string,
    }),
  ),
  insights: PropTypes.shape({
    totalSpend: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    leads: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    roas: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    avgCpc: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  saving: PropTypes.bool,
  onCreateCampaign: PropTypes.func,
  onUpdateCampaign: PropTypes.func,
  onDeleteCampaign: PropTypes.func,
  onToggleCampaign: PropTypes.func,
};

MentorAdsSection.defaultProps = {
  campaigns: [],
  insights: undefined,
  saving: false,
  onCreateCampaign: undefined,
  onUpdateCampaign: undefined,
  onDeleteCampaign: undefined,
  onToggleCampaign: undefined,
};
