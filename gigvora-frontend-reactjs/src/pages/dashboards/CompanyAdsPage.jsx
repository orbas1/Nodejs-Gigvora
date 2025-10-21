import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useCompanyAds } from '../../hooks/useCompanyAds.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const MENU_SECTIONS = COMPANY_DASHBOARD_MENU_SECTIONS;
const AVAILABLE_DASHBOARDS = ['company', 'agency', 'headhunter', 'user'];
const AD_OBJECTIVES = ['brand', 'acquisition', 'retention', 'cross_sell'];
const AD_STATUSES = ['draft', 'scheduled', 'active', 'paused', 'expired'];
const AD_TYPES = ['display', 'video', 'text'];
const AD_SURFACES = [
  'company_dashboard',
  'global_dashboard',
  'agency_dashboard',
  'freelancer_dashboard',
  'user_dashboard',
  'headhunter_dashboard',
  'admin_dashboard',
  'pipeline_dashboard',
];
const AD_POSITIONS = ['hero', 'sidebar', 'inline', 'footer'];
const AD_PACING_MODES = ['even', 'accelerated', 'asap'];
const AD_OPPORTUNITY_TYPES = ['awareness', 'acquisition', 'retention', 'upsell'];

function formatCurrency(value, currency = 'USD', { maximumFractionDigits = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${value}`;
  }
}

function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Math.round(numeric));
}

function formatPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${numeric.toFixed(1)}%`;
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return value;
  }
}

function toDateInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateTimeInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromDateInput(value) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function fromDateTimeInput(value) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}
function buildCampaignDraft(campaign) {
  return {
    name: campaign?.name ?? '',
    objective: campaign?.objective ?? 'brand',
    status: campaign?.status ?? 'draft',
    budget: campaign?.budgetCents != null ? (Number(campaign.budgetCents) / 100).toFixed(2) : '',
    currencyCode: campaign?.currencyCode ?? 'USD',
    startDate: toDateInput(campaign?.startDate),
    endDate: toDateInput(campaign?.endDate),
  };
}

function buildCreativeDraft(creative) {
  return {
    name: creative?.name ?? '',
    type: creative?.type ?? 'display',
    status: creative?.status ?? 'active',
    headline: creative?.headline ?? '',
    subheadline: creative?.subheadline ?? '',
    body: creative?.body ?? '',
    callToAction: creative?.callToAction ?? '',
    ctaUrl: creative?.ctaUrl ?? '',
    mediaUrl: creative?.mediaUrl ?? '',
  };
}

function buildPlacementDraft(placement) {
  return {
    surface: placement?.surface ?? 'company_dashboard',
    position: placement?.position ?? 'inline',
    status: placement?.status ?? 'scheduled',
    pacingMode: placement?.pacingMode ?? 'even',
    weight: placement?.weight != null ? String(placement.weight) : '1',
    maxImpressionsPerHour:
      placement?.maxImpressionsPerHour != null ? String(placement.maxImpressionsPerHour) : '',
    priority: placement?.priority != null ? String(placement.priority) : '0',
    startAt: toDateTimeInput(placement?.startAt),
    endAt: toDateTimeInput(placement?.endAt),
    opportunityType: placement?.opportunityType ?? 'awareness',
  };
}
function CampaignCard({
  campaign,
  permissions,
  onUpdateCampaign,
  onDeleteCampaign,
  onCreateCreative,
  onUpdateCreative,
  onDeleteCreative,
  onCreatePlacement,
  onUpdatePlacement,
  onDeletePlacement,
  onTogglePlacement,
}) {
  const creatives = campaign?.creatives ?? [];
  const [campaignDraft, setCampaignDraft] = useState(() => buildCampaignDraft(campaign));
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignMessage, setCampaignMessage] = useState(null);
  const [creativeDraft, setCreativeDraft] = useState(() => buildCreativeDraft());
  const [creativeSaving, setCreativeSaving] = useState(false);
  const [creativeMessage, setCreativeMessage] = useState(null);
  const [creativeEdits, setCreativeEdits] = useState({});
  const [placementDrafts, setPlacementDrafts] = useState({});
  const [placementEdits, setPlacementEdits] = useState({});
  const [placementMessages, setPlacementMessages] = useState({});

  useEffect(() => {
    setCampaignDraft(buildCampaignDraft(campaign));
  }, [campaign]);

  useEffect(() => {
    setCreativeEdits((current) => {
      const next = { ...current };
      creatives.forEach((creative) => {
        if (!next[creative.id]) {
          next[creative.id] = buildCreativeDraft(creative);
        }
      });
      return next;
    });
  }, [creatives]);

  useEffect(() => {
    setPlacementEdits((current) => {
      const next = { ...current };
      creatives.forEach((creative) => {
        (creative.placements ?? []).forEach((placement) => {
          if (!next[placement.id]) {
            next[placement.id] = buildPlacementDraft(placement);
          }
        });
      });
      return next;
    });
  }, [creatives]);
  const handleCampaignChange = (field, value) => {
    setCampaignDraft((current) => ({ ...current, [field]: value }));
  };

  const handleCampaignSubmit = async (event) => {
    event.preventDefault();
    if (!permissions?.canManageCampaigns) {
      return;
    }
    setCampaignSaving(true);
    setCampaignMessage(null);
    try {
      const payload = {
        name: campaignDraft.name,
        objective: campaignDraft.objective,
        status: campaignDraft.status,
        currencyCode: campaignDraft.currencyCode || undefined,
      };
      if (campaignDraft.budget !== '') {
        payload.budgetCents = Math.round(Number.parseFloat(campaignDraft.budget) * 100);
      }
      if (campaignDraft.startDate === '') {
        payload.startDate = null;
      } else if (campaignDraft.startDate) {
        payload.startDate = fromDateInput(campaignDraft.startDate);
      }
      if (campaignDraft.endDate === '') {
        payload.endDate = null;
      } else if (campaignDraft.endDate) {
        payload.endDate = fromDateInput(campaignDraft.endDate);
      }
      await onUpdateCampaign(campaign.id, payload);
      setCampaignMessage({ type: 'success', text: 'Campaign updated.' });
    } catch (error) {
      setCampaignMessage({ type: 'error', text: error?.message ?? 'Unable to update campaign.' });
    } finally {
      setCampaignSaving(false);
    }
  };

  const handleCampaignDelete = async () => {
    if (!permissions?.canManageCampaigns) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Archive this campaign? Placements and creatives will be removed.')) {
      return;
    }
    setCampaignMessage(null);
    try {
      await onDeleteCampaign(campaign.id);
    } catch (error) {
      setCampaignMessage({ type: 'error', text: error?.message ?? 'Unable to delete campaign.' });
    }
  };
  const handleCreativeDraftChange = (field, value) => {
    setCreativeDraft((current) => ({ ...current, [field]: value }));
  };

  const resetCreativeDraft = () => {
    setCreativeDraft(buildCreativeDraft());
  };

  const handleCreateCreative = async (event) => {
    event.preventDefault();
    if (!permissions?.canManageCreatives) {
      return;
    }
    setCreativeSaving(true);
    setCreativeMessage(null);
    try {
      const payload = {
        name: creativeDraft.name,
        type: creativeDraft.type,
        status: creativeDraft.status,
        headline: creativeDraft.headline || undefined,
        subheadline: creativeDraft.subheadline || undefined,
        body: creativeDraft.body || undefined,
        callToAction: creativeDraft.callToAction || undefined,
        ctaUrl: creativeDraft.ctaUrl || undefined,
        mediaUrl: creativeDraft.mediaUrl || undefined,
      };
      await onCreateCreative(campaign.id, payload);
      setCreativeMessage({ type: 'success', text: 'Creative added.' });
      resetCreativeDraft();
    } catch (error) {
      setCreativeMessage({ type: 'error', text: error?.message ?? 'Unable to add creative.' });
    } finally {
      setCreativeSaving(false);
    }
  };

  const handleCreativeEditChange = (creativeId, field, value) => {
    setCreativeEdits((current) => ({
      ...current,
      [creativeId]: {
        ...(current[creativeId] ?? buildCreativeDraft(creatives.find((item) => item.id === creativeId))),
        [field]: value,
      },
    }));
  };

  const handleCreativeUpdate = async (creative) => {
    if (!permissions?.canManageCreatives) {
      return;
    }
    const draft = creativeEdits[creative.id] ?? buildCreativeDraft(creative);
    setCreativeMessage(null);
    try {
      const payload = {
        name: draft.name,
        type: draft.type,
        status: draft.status,
        headline: draft.headline || undefined,
        subheadline: draft.subheadline || undefined,
        body: draft.body || undefined,
        callToAction: draft.callToAction || undefined,
        ctaUrl: draft.ctaUrl || undefined,
        mediaUrl: draft.mediaUrl || undefined,
      };
      await onUpdateCreative(creative.id, payload);
      setCreativeMessage({ type: 'success', text: 'Creative updated.' });
    } catch (error) {
      setCreativeMessage({ type: 'error', text: error?.message ?? 'Unable to update creative.' });
    }
  };

  const handleCreativeDelete = async (creative) => {
    if (!permissions?.canManageCreatives) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this creative and its placements?')) {
      return;
    }
    setCreativeMessage(null);
    try {
      await onDeleteCreative(creative.id);
    } catch (error) {
      setCreativeMessage({ type: 'error', text: error?.message ?? 'Unable to delete creative.' });
    }
  };
  const handlePlacementDraftChange = (creativeId, field, value) => {
    setPlacementDrafts((current) => ({
      ...current,
      [creativeId]: {
        ...(current[creativeId] ?? buildPlacementDraft()),
        [field]: value,
      },
    }));
  };

  const resetPlacementDraft = (creativeId) => {
    setPlacementDrafts((current) => ({ ...current, [creativeId]: buildPlacementDraft() }));
  };

  const handleCreatePlacement = async (event, creative) => {
    event.preventDefault();
    if (!permissions?.canManagePlacements) {
      return;
    }
    const draft = placementDrafts[creative.id] ?? buildPlacementDraft();
    setPlacementMessages((current) => ({ ...current, [creative.id]: null }));
    try {
      const payload = {
        surface: draft.surface,
        position: draft.position,
        status: draft.status,
        pacingMode: draft.pacingMode,
        weight: draft.weight ? Number(draft.weight) : undefined,
        maxImpressionsPerHour: draft.maxImpressionsPerHour ? Number(draft.maxImpressionsPerHour) : undefined,
        priority: draft.priority ? Number(draft.priority) : undefined,
        startAt: draft.startAt ? fromDateTimeInput(draft.startAt) : undefined,
        endAt: draft.endAt ? fromDateTimeInput(draft.endAt) : undefined,
        opportunityType: draft.opportunityType,
      };
      await onCreatePlacement(creative.id, payload);
      setPlacementMessages((current) => ({ ...current, [creative.id]: { type: 'success', text: 'Placement created.' } }));
      resetPlacementDraft(creative.id);
    } catch (error) {
      setPlacementMessages((current) => ({
        ...current,
        [creative.id]: { type: 'error', text: error?.message ?? 'Unable to create placement.' },
      }));
    }
  };

  const handlePlacementEditChange = (placementId, field, value) => {
    setPlacementEdits((current) => ({
      ...current,
      [placementId]: {
        ...(current[placementId] ?? buildPlacementDraft()),
        [field]: value,
      },
    }));
  };

  const handlePlacementUpdate = async (placement) => {
    if (!permissions?.canManagePlacements) {
      return;
    }
    const draft = placementEdits[placement.id] ?? buildPlacementDraft(placement);
    setPlacementMessages((current) => ({ ...current, [placement.id]: null }));
    try {
      const payload = {
        surface: draft.surface,
        position: draft.position,
        status: draft.status,
        pacingMode: draft.pacingMode,
        weight: draft.weight ? Number(draft.weight) : undefined,
        maxImpressionsPerHour: draft.maxImpressionsPerHour ? Number(draft.maxImpressionsPerHour) : undefined,
        priority: draft.priority ? Number(draft.priority) : undefined,
        startAt: draft.startAt === '' ? null : draft.startAt ? fromDateTimeInput(draft.startAt) : undefined,
        endAt: draft.endAt === '' ? null : draft.endAt ? fromDateTimeInput(draft.endAt) : undefined,
        opportunityType: draft.opportunityType,
      };
      await onUpdatePlacement(placement.id, payload);
      setPlacementMessages((current) => ({
        ...current,
        [placement.id]: { type: 'success', text: 'Placement updated.' },
      }));
    } catch (error) {
      setPlacementMessages((current) => ({
        ...current,
        [placement.id]: { type: 'error', text: error?.message ?? 'Unable to update placement.' },
      }));
    }
  };

  const handlePlacementDelete = async (placement) => {
    if (!permissions?.canManagePlacements) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this placement?')) {
      return;
    }
    setPlacementMessages((current) => ({ ...current, [placement.id]: null }));
    try {
      await onDeletePlacement(placement.id);
    } catch (error) {
      setPlacementMessages((current) => ({
        ...current,
        [placement.id]: { type: 'error', text: error?.message ?? 'Unable to delete placement.' },
      }));
    }
  };

  const handlePlacementToggle = async (placement) => {
    if (!permissions?.canManagePlacements) {
      return;
    }
    try {
      await onTogglePlacement(placement.id);
    } catch (error) {
      setPlacementMessages((current) => ({
        ...current,
        [placement.id]: { type: 'error', text: error?.message ?? 'Unable to toggle placement status.' },
      }));
    }
  };
  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{campaign.name}</h3>
          <p className="text-sm text-slate-500">Objective: {campaign.objective} · Status: {campaign.status}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleCampaignDelete}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!permissions?.canManageCampaigns}
          >
            Remove campaign
          </button>
          {campaignMessage ? (
            <span className={`text-xs font-medium ${campaignMessage.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {campaignMessage.text}
            </span>
          ) : null}
        </div>
      </div>
      <form className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 md:grid-cols-2" onSubmit={handleCampaignSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`campaign-name-${campaign.id}`}>
            Campaign name
          </label>
          <input
            id={`campaign-name-${campaign.id}`}
            type="text"
            value={campaignDraft.name}
            onChange={(event) => handleCampaignChange('name', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</label>
          <select
            value={campaignDraft.objective}
            onChange={(event) => handleCampaignChange('objective', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {AD_OBJECTIVES.map((objective) => (
              <option key={objective} value={objective}>
                {objective.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <select
            value={campaignDraft.status}
            onChange={(event) => handleCampaignChange('status', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {AD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget (USD)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={campaignDraft.budget}
            onChange={(event) => handleCampaignChange('budget', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="2500"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</label>
          <input
            type="date"
            value={campaignDraft.startDate}
            onChange={(event) => handleCampaignChange('startDate', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</label>
          <input
            type="date"
            value={campaignDraft.endDate}
            onChange={(event) => handleCampaignChange('endDate', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={campaignSaving || !permissions?.canManageCampaigns}
          >
            {campaignSaving ? 'Saving…' : 'Save campaign settings'}
          </button>
        </div>
      </form>
      <section className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">Creatives</h4>
            <p className="text-sm text-slate-500">Design rich storytelling assets and launch placements in minutes.</p>
          </div>
          {creativeMessage ? (
            <span className={`text-xs font-medium ${creativeMessage.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {creativeMessage.text}
            </span>
          ) : null}
        </header>

        <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2" onSubmit={handleCreateCreative}>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`creative-name-${campaign.id}`}>
              Creative name
            </label>
            <input
              id={`creative-name-${campaign.id}`}
              type="text"
              value={creativeDraft.name}
              onChange={(event) => handleCreativeDraftChange('name', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Creative type</label>
            <select
              value={creativeDraft.type}
              onChange={(event) => handleCreativeDraftChange('type', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {AD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select
              value={creativeDraft.status}
              onChange={(event) => handleCreativeDraftChange('status', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {AD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</label>
            <input
              type="text"
              value={creativeDraft.headline}
              onChange={(event) => handleCreativeDraftChange('headline', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Capture attention fast"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subheadline</label>
            <input
              type="text"
              value={creativeDraft.subheadline}
              onChange={(event) => handleCreativeDraftChange('subheadline', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Add context or a supporting benefit"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Body copy</label>
            <textarea
              value={creativeDraft.body}
              onChange={(event) => handleCreativeDraftChange('body', event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Tell the story behind the offer, highlight value, and call audiences to act."
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Call to action</label>
            <input
              type="text"
              value={creativeDraft.callToAction}
              onChange={(event) => handleCreativeDraftChange('callToAction', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Book demo"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">CTA URL</label>
            <input
              type="url"
              value={creativeDraft.ctaUrl}
              onChange={(event) => handleCreativeDraftChange('ctaUrl', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="https://example.com/demo"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Media URL</label>
            <input
              type="url"
              value={creativeDraft.mediaUrl}
              onChange={(event) => handleCreativeDraftChange('mediaUrl', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="https://cdn.gigvora.com/creative.jpg"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={creativeSaving || !permissions?.canManageCreatives}
            >
              {creativeSaving ? 'Saving…' : 'Add creative'}
            </button>
          </div>
        </form>
        <div className="space-y-4">
          {creatives.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
              No creatives yet. Launch an asset above to activate placements.
            </div>
          ) : (
            creatives.map((creative) => {
              const editDraft = creativeEdits[creative.id] ?? buildCreativeDraft(creative);
              const creativePlacements = creative.placements ?? [];
              return (
                <div key={creative.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h5 className="text-lg font-semibold text-slate-900">{creative.name}</h5>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{creative.type} · {creative.status}</p>
                      {creative.headline ? <p className="mt-1 text-sm text-slate-600">{creative.headline}</p> : null}
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => handleCreativeUpdate(creative)}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!permissions?.canManageCreatives}
                      >
                        Save creative
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreativeDelete(creative)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!permissions?.canManageCreatives}
                      >
                        Delete creative
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
                      <input
                        type="text"
                        value={editDraft.name}
                        onChange={(event) => handleCreativeEditChange(creative.id, 'name', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                      <select
                        value={editDraft.status}
                        onChange={(event) => handleCreativeEditChange(creative.id, 'status', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {AD_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</label>
                      <input
                        type="text"
                        value={editDraft.headline}
                        onChange={(event) => handleCreativeEditChange(creative.id, 'headline', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">CTA label</label>
                      <input
                        type="text"
                        value={editDraft.callToAction}
                        onChange={(event) => handleCreativeEditChange(creative.id, 'callToAction', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">CTA URL</label>
                      <input
                        type="url"
                        value={editDraft.ctaUrl}
                        onChange={(event) => handleCreativeEditChange(creative.id, 'ctaUrl', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                  <section className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h6 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Placements</h6>
                      {placementMessages[creative.id] ? (
                        <span
                          className={`text-xs font-medium ${
                            placementMessages[creative.id].type === 'error' ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {placementMessages[creative.id].text}
                        </span>
                      ) : null}
                    </div>

                    <form
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-2"
                      onSubmit={(event) => handleCreatePlacement(event, creative)}
                    >
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Surface</label>
                        <select
                          value={(placementDrafts[creative.id] ?? buildPlacementDraft()).surface}
                          onChange={(event) => handlePlacementDraftChange(creative.id, 'surface', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          {AD_SURFACES.map((surface) => (
                            <option key={surface} value={surface}>
                              {surface.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Position</label>
                        <select
                          value={(placementDrafts[creative.id] ?? buildPlacementDraft()).position}
                          onChange={(event) => handlePlacementDraftChange(creative.id, 'position', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          {AD_POSITIONS.map((position) => (
                            <option key={position} value={position}>
                              {position}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                        <select
                          value={(placementDrafts[creative.id] ?? buildPlacementDraft()).status}
                          onChange={(event) => handlePlacementDraftChange(creative.id, 'status', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          {AD_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pacing mode</label>
                        <select
                          value={(placementDrafts[creative.id] ?? buildPlacementDraft()).pacingMode}
                          onChange={(event) => handlePlacementDraftChange(creative.id, 'pacingMode', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          {AD_PACING_MODES.map((mode) => (
                            <option key={mode} value={mode}>
                              {mode}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weight</label>
                        <input
                          type="number"
                          min="1"
                          value={(placementDrafts[creative.id] ?? buildPlacementDraft()).weight}
                          onChange={(event) => handlePlacementDraftChange(creative.id, 'weight', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max impressions / hour</label>
                        <input
                          type="number"
                          min="0"
                          value={(placementDrafts[creative.id] ?? buildPlacementDraft()).maxImpressionsPerHour}
                          onChange={(event) => handlePlacementDraftChange(creative.id, 'maxImpressionsPerHour', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
                        <input
                          type="number"
                          min="0"
                          value={(placementDrafts[creative.id] ?? buildPlacementDraft()).priority}
                          onChange={(event) => handlePlacementDraftChange(creative.id, 'priority', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start at</label>
                        <input
                          type="datetime-local"
                          value={(placementDrafts[creative.id] ?? buildPlacementDraft()).startAt}
                          onChange={(event) => handlePlacementDraftChange(creative.id, 'startAt', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End at</label>
                        <input
                          type="datetime-local"
                          value={(placementDrafts[creative.id] ?? buildPlacementDraft()).endAt}
                          onChange={(event) => handlePlacementDraftChange(creative.id, 'endAt', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opportunity type</label>
                        <select
                          value={(placementDrafts[creative.id] ?? buildPlacementDraft()).opportunityType}
                          onChange={(event) => handlePlacementDraftChange(creative.id, 'opportunityType', event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          {AD_OPPORTUNITY_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!permissions?.canManagePlacements}
                        >
                          Add placement
                        </button>
                      </div>
                    </form>
                    {creativePlacements.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 text-xs text-slate-500">
                        No placements yet. Configure a surface and go live instantly.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {creativePlacements.map((placement) => {
                          const placementDraft = placementEdits[placement.id] ?? buildPlacementDraft(placement);
                          const placementMessage = placementMessages[placement.id];
                          return (
                            <div
                              key={placement.id}
                              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {placement.surface.replace('_', ' ')} · {placement.position}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {placement.status} · Starts {formatDateTime(placement.startAt)} · Ends {formatDateTime(placement.endAt)}
                                  </p>
                                </div>
                                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                                  <button
                                    type="button"
                                    onClick={() => handlePlacementToggle(placement)}
                                    className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-amber-600 transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={!permissions?.canManagePlacements}
                                  >
                                    {placement.status === 'active' ? 'Pause' : 'Activate'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePlacementDelete(placement)}
                                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={!permissions?.canManagePlacements}
                                  >
                                    Delete
                                  </button>
                                  {placementMessage ? (
                                    <span
                                      className={`text-xs font-medium ${
                                        placementMessage.type === 'error' ? 'text-rose-600' : 'text-emerald-600'
                                      }`}
                                    >
                                      {placementMessage.text}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                  <select
                                    value={placementDraft.status}
                                    onChange={(event) => handlePlacementEditChange(placement.id, 'status', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  >
                                    {AD_STATUSES.map((status) => (
                                      <option key={status} value={status}>
                                        {status}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pacing mode</label>
                                  <select
                                    value={placementDraft.pacingMode}
                                    onChange={(event) => handlePlacementEditChange(placement.id, 'pacingMode', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  >
                                    {AD_PACING_MODES.map((mode) => (
                                      <option key={mode} value={mode}>
                                        {mode}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={placementDraft.priority}
                                    onChange={(event) => handlePlacementEditChange(placement.id, 'priority', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weight</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={placementDraft.weight}
                                    onChange={(event) => handlePlacementEditChange(placement.id, 'weight', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start at</label>
                                  <input
                                    type="datetime-local"
                                    value={placementDraft.startAt ?? ''}
                                    onChange={(event) => handlePlacementEditChange(placement.id, 'startAt', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End at</label>
                                  <input
                                    type="datetime-local"
                                    value={placementDraft.endAt ?? ''}
                                    onChange={(event) => handlePlacementEditChange(placement.id, 'endAt', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handlePlacementUpdate(placement)}
                                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  disabled={!permissions?.canManagePlacements}
                                >
                                  Save placement
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
const INITIAL_CAMPAIGN_FORM = {
  name: '',
  objective: 'brand',
  status: 'draft',
  budget: '',
  currencyCode: 'USD',
  startDate: '',
  endDate: '',
};

export default function CompanyAdsPage() {
  const { session, isAuthenticated } = useSession();
  const memberships = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && memberships.includes('company');

  const {
    campaigns,
    insights,
    metrics,
    permissions,
    loading,
    error,
    refresh,
    fromCache,
    lastUpdated,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    createCreative,
    updateCreative,
    deleteCreative,
    createPlacement,
    updatePlacement,
    deletePlacement,
    togglePlacement,
  } = useCompanyAds({ enabled: isAuthenticated && isCompanyMember });

  const [newCampaign, setNewCampaign] = useState(INITIAL_CAMPAIGN_FORM);
  const [newCampaignSaving, setNewCampaignSaving] = useState(false);
  const [newCampaignMessage, setNewCampaignMessage] = useState(null);

  const summaryCards = useMemo(() => {
    const totals = metrics?.campaignTotals ?? { total: 0, active: 0, paused: 0, scheduled: 0 };
    const placementTotals = metrics?.placementTotals ?? { total: 0, active: 0, upcoming: 0 };
    return [
      { label: 'Campaigns', value: formatNumber(totals.total), helper: `${formatNumber(totals.active)} active` },
      { label: 'Scheduled', value: formatNumber(totals.scheduled), helper: `${formatNumber(totals.paused)} paused` },
      { label: 'Placements live', value: formatNumber(placementTotals.active), helper: `${formatNumber(placementTotals.total)} total` },
      { label: 'Upcoming launches', value: formatNumber(placementTotals.upcoming), helper: 'Future-dated placements' },
    ];
  }, [metrics?.campaignTotals, metrics?.placementTotals]);

  const performanceCards = useMemo(() => {
    const perf = metrics?.performance ?? { impressions: 0, clicks: 0, spend: 0, ctr: 0 };
    return [
      { label: 'Impressions', value: formatNumber(perf.impressions) },
      { label: 'Clicks', value: formatNumber(perf.clicks), helper: `CTR ${formatPercent(perf.ctr)}` },
      { label: 'Spend', value: formatCurrency(perf.spend, newCampaign.currencyCode || 'USD', { maximumFractionDigits: 2 }) },
    ];
  }, [metrics?.performance, newCampaign.currencyCode]);

  const surfaces = insights?.surfaces ?? [];

  const handleNewCampaignChange = (field, value) => {
    setNewCampaign((current) => ({ ...current, [field]: value }));
  };

  const handleNewCampaignSubmit = async (event) => {
    event.preventDefault();
    if (!permissions?.canManageCampaigns) {
      return;
    }
    setNewCampaignSaving(true);
    setNewCampaignMessage(null);
    try {
      const payload = {
        name: newCampaign.name,
        objective: newCampaign.objective,
        status: newCampaign.status,
        currencyCode: newCampaign.currencyCode || undefined,
      };
      if (newCampaign.budget !== '') {
        payload.budgetCents = Math.round(Number.parseFloat(newCampaign.budget) * 100);
      }
      if (newCampaign.startDate) {
        payload.startDate = fromDateInput(newCampaign.startDate);
      }
      if (newCampaign.endDate) {
        payload.endDate = fromDateInput(newCampaign.endDate);
      }
      await createCampaign(payload);
      setNewCampaign(INITIAL_CAMPAIGN_FORM);
      setNewCampaignMessage({ type: 'success', text: 'Campaign created.' });
    } catch (creationError) {
      setNewCampaignMessage({
        type: 'error',
        text: creationError?.message ?? 'Unable to create campaign.',
      });
    } finally {
      setNewCampaignSaving(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/ads' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Gigvora Ads"
        subtitle="Premium placements for talent acquisition and brand growth"
        menuSections={MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
      >
        <AccessDeniedPanel
          role="company"
          availableDashboards={memberships.filter((membership) => membership !== 'company')}
        />
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout
      currentDashboard="company"
      title="Gigvora Ads"
      subtitle="Full-funnel campaigns tailored for talent engagement"
      description="Launch, optimise, and govern Gigvora Ads placements with production-ready controls, insights, and creative tooling."
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Ads operations workspace</h1>
            <p className="text-sm text-slate-600">
              Forecast reach, balance spend, and orchestrate campaign assets from a single dashboard.
            </p>
          </div>
          <DataStatus
            loading={loading}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
          />
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-sm text-rose-700">
            {error.message || 'Unable to load the Gigvora Ads workspace.'}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {performanceCards.map((card) => (
            <SummaryCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
          ))}
        </section>

        {surfaces.length ? (
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Surface readiness</h2>
                <p className="text-sm text-slate-500">
                  Monitor placement health across every Gigvora Ads surface and identify optimisation opportunities.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    <th className="px-4 py-3">Surface</th>
                    <th className="px-4 py-3">Placements</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3">Upcoming</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {surfaces.map((surface) => (
                    <tr key={surface.surface} className="text-sm text-slate-700">
                      <td className="px-4 py-3 font-medium text-slate-900">{surface.label ?? surface.surface}</td>
                      <td className="px-4 py-3">{formatNumber(surface.totalPlacements)}</td>
                      <td className="px-4 py-3">{formatNumber(surface.activePlacements ?? 0)}</td>
                      <td className="px-4 py-3">{formatNumber(surface.upcomingPlacements ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create new campaign</h2>
              <p className="text-sm text-slate-500">Kick off a new Gigvora Ads campaign with full control over objective, pacing, and spend.</p>
            </div>
            {newCampaignMessage ? (
              <span className={`text-xs font-medium ${newCampaignMessage.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {newCampaignMessage.text}
              </span>
            ) : null}
          </header>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleNewCampaignSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campaign name</label>
              <input
                type="text"
                value={newCampaign.name}
                onChange={(event) => handleNewCampaignChange('name', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</label>
              <select
                value={newCampaign.objective}
                onChange={(event) => handleNewCampaignChange('objective', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {AD_OBJECTIVES.map((objective) => (
                  <option key={objective} value={objective}>
                    {objective.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
              <select
                value={newCampaign.status}
                onChange={(event) => handleNewCampaignChange('status', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {AD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newCampaign.budget}
                onChange={(event) => handleNewCampaignChange('budget', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="5000"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</label>
              <input
                type="text"
                value={newCampaign.currencyCode}
                onChange={(event) => handleNewCampaignChange('currencyCode', event.target.value.toUpperCase())}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                maxLength={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</label>
              <input
                type="date"
                value={newCampaign.startDate}
                onChange={(event) => handleNewCampaignChange('startDate', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</label>
              <input
                type="date"
                value={newCampaign.endDate}
                onChange={(event) => handleNewCampaignChange('endDate', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={newCampaignSaving || !permissions?.canManageCampaigns}
              >
                {newCampaignSaving ? 'Creating…' : 'Create campaign'}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-6">
          {campaigns.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
              No campaigns yet. Use the form above to launch your first Gigvora Ads activation.
            </div>
          ) : (
            campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                permissions={permissions}
                onUpdateCampaign={updateCampaign}
                onDeleteCampaign={deleteCampaign}
                onCreateCreative={createCreative}
                onUpdateCreative={updateCreative}
                onDeleteCreative={deleteCreative}
                onCreatePlacement={createPlacement}
                onUpdatePlacement={updatePlacement}
                onDeletePlacement={deletePlacement}
                onTogglePlacement={togglePlacement}
              />
            ))
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
