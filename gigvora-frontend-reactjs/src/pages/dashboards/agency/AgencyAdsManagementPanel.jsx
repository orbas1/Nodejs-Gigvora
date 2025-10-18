import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Tab, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  ChartBarIcon,
  MegaphoneIcon,
  PencilSquareIcon,
  PlusIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import DataStatus from '../../../components/DataStatus.jsx';
import {
  createAgencyAdCampaign,
  createAgencyAdCreative,
  createAgencyAdPlacement,
  getAgencyAdCampaign,
  getAgencyAdReferenceData,
  listAgencyAdCampaigns,
  updateAgencyAdCampaign,
  updateAgencyAdCreative,
  updateAgencyAdPlacement,
} from '../../../services/ads.js';

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});
const currencyCache = new Map();

const INPUT_CLASSES =
  'mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

const INITIAL_CAMPAIGN_FORM = {
  name: '',
  objective: 'brand',
  status: 'draft',
  budgetAmount: '',
  currencyCode: 'USD',
  startDate: '',
  endDate: '',
  keywordHints: '',
};

const INITIAL_CREATIVE_FORM = {
  name: '',
  type: 'display',
  status: 'active',
  headline: '',
  subheadline: '',
  body: '',
  callToAction: '',
  ctaUrl: '',
  mediaUrl: '',
};

const INITIAL_PLACEMENT_FORM = {
  creativeId: '',
  surface: 'agency_dashboard',
  position: 'hero',
  status: 'scheduled',
  pacingMode: 'even',
  weight: 1,
  priority: 0,
  startAt: '',
  endAt: '',
  opportunityType: '',
  maxImpressionsPerHour: '',
};

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'creatives', label: 'Creatives' },
  { id: 'placements', label: 'Placements' },
  { id: 'settings', label: 'Settings' },
];

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(numeric);
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return percentFormatter.format(numeric);
}

function getCurrencyFormatter(currency) {
  const key = currency || 'USD';
  if (!currencyCache.has(key)) {
    currencyCache.set(
      key,
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: key,
        maximumFractionDigits: 0,
      }),
    );
  }
  return currencyCache.get(key);
}

function formatCurrency(value, currency) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return `${currency ?? 'USD'} 0`;
  }
  return getCurrencyFormatter(currency).format(numeric);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

function StatusBadge({ status }) {
  const tone = String(status ?? 'draft').toLowerCase();
  const tones = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    scheduled: 'bg-sky-100 text-sky-700 border-sky-200',
    paused: 'bg-amber-100 text-amber-700 border-amber-200',
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    expired: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  const label = tone
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
        tones[tone] ?? tones.draft,
      )}
    >
      {label}
    </span>
  );
}

function EmptyState({ icon: Icon = MegaphoneIcon, title, body, actionLabel, onAction }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
        >
          <PlusIcon className="h-4 w-4" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function CampaignCard({ campaign, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(campaign.id)}
      className={classNames(
        'w-full rounded-3xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-accent',
        isActive ? 'border-accent bg-accent/5 text-accent-foreground shadow-soft' : 'border-slate-200 bg-white hover:border-slate-300',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{campaign.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatNumber(campaign.summary?.placements?.active)} live placements ·{' '}
            {campaign.summary?.placements?.surfaces?.length ?? 0} surfaces
          </p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
        <span>{campaign.objective}</span>
        <span>•</span>
        <span>{campaign.currencyCode ?? 'USD'}</span>
      </div>
    </button>
  );
}

export default function AgencyAdsManagementPanel({ workspace }) {
  const workspaceId = workspace?.id ?? null;
  const [referenceData, setReferenceData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [campaignWizardOpen, setCampaignWizardOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState(INITIAL_CAMPAIGN_FORM);
  const [campaignStep, setCampaignStep] = useState(0);
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignFormError, setCampaignFormError] = useState(null);

  const [creativeModalOpen, setCreativeModalOpen] = useState(false);
  const [creativeForm, setCreativeForm] = useState(INITIAL_CREATIVE_FORM);
  const [creativeSaving, setCreativeSaving] = useState(false);
  const [creativeError, setCreativeError] = useState(null);
  const [editingCreativeId, setEditingCreativeId] = useState(null);

  const [placementModalOpen, setPlacementModalOpen] = useState(false);
  const [placementForm, setPlacementForm] = useState(INITIAL_PLACEMENT_FORM);
  const [placementSaving, setPlacementSaving] = useState(false);
  const [placementError, setPlacementError] = useState(null);
  const [editingPlacementId, setEditingPlacementId] = useState(null);

  const [forecastOpen, setForecastOpen] = useState(false);

  const campaignStatusOptions = useMemo(() => referenceData?.statuses ?? [], [referenceData]);
  const objectiveOptions = useMemo(() => referenceData?.objectives ?? [], [referenceData]);
  const creativeTypeOptions = useMemo(() => referenceData?.creativeTypes ?? [], [referenceData]);
  const surfaceOptions = useMemo(() => referenceData?.surfaces ?? [], [referenceData]);
  const positionOptions = useMemo(() => referenceData?.positions ?? [], [referenceData]);
  const pacingOptions = useMemo(() => referenceData?.pacingModes ?? [], [referenceData]);
  const opportunityOptions = useMemo(() => referenceData?.opportunityTypes ?? [], [referenceData]);

  useEffect(() => {
    getAgencyAdReferenceData().then(setReferenceData).catch((error) => {
      console.warn('Unable to load ad reference data', error);
    });
  }, []);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }
    const timer = setTimeout(() => setFeedback(null), 6000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    setCampaignsError(null);
    try {
      const response = await listAgencyAdCampaigns({
        workspaceId: workspaceId ?? undefined,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        pageSize: 50,
      });
      const fetched = Array.isArray(response?.campaigns) ? response.campaigns : [];
      setCampaigns(fetched);
      if (fetched.length && !selectedCampaignId) {
        setSelectedCampaignId(fetched[0].id);
      }
      if (!fetched.length) {
        setSelectedCampaign(null);
        setSelectedCampaignId(null);
      }
    } catch (error) {
      console.error('Failed to load campaigns', error);
      setCampaignsError(error);
    } finally {
      setCampaignsLoading(false);
    }
  }, [workspaceId, statusFilter, searchTerm, selectedCampaignId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const loadCampaignDetail = useCallback(
    async (campaignId) => {
      if (!campaignId) {
        setSelectedCampaign(null);
        return;
      }
      setDetailLoading(true);
      setDetailError(null);
      try {
        const response = await getAgencyAdCampaign(campaignId, { workspaceId: workspaceId ?? undefined });
        const campaign = response?.campaign ?? null;
        const creatives = Array.isArray(response?.creatives) ? response.creatives : [];
        const placements = Array.isArray(response?.placements) ? response.placements : [];
        const performance = response?.performance ?? null;
        setSelectedCampaign({
          ...campaign,
          creatives,
          placements,
          performance,
          summary: campaign?.summary ?? null,
        });
      } catch (error) {
        console.error('Failed to load campaign detail', error);
        setDetailError(error);
      } finally {
        setDetailLoading(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    if (selectedCampaignId) {
      loadCampaignDetail(selectedCampaignId);
    }
  }, [selectedCampaignId, loadCampaignDetail]);

  const handleSelectCampaign = (campaignId) => {
    setSelectedCampaignId(campaignId);
  };

  const handleOpenCampaignWizard = () => {
    setCampaignForm(INITIAL_CAMPAIGN_FORM);
    setCampaignStep(0);
    setCampaignFormError(null);
    setCampaignWizardOpen(true);
  };

  const handleCampaignInputChange = (field, value) => {
    setCampaignForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCampaignNext = () => {
    if (!campaignForm.name.trim()) {
      setCampaignFormError('Name is required.');
      return;
    }
    if (campaignStep === 1 && campaignForm.startDate && campaignForm.endDate && campaignForm.endDate < campaignForm.startDate) {
      setCampaignFormError('End date must be after start date.');
      return;
    }
    setCampaignFormError(null);
    setCampaignStep((step) => Math.min(step + 1, 2));
  };

  const handleCampaignPrev = () => {
    setCampaignFormError(null);
    setCampaignStep((step) => Math.max(step - 1, 0));
  };

  const handleCreateCampaign = async () => {
    setCampaignFormError(null);
    setCampaignSaving(true);
    try {
      const payload = {
        name: campaignForm.name.trim(),
        objective: campaignForm.objective,
        status: campaignForm.status,
        currencyCode: campaignForm.currencyCode,
        budgetAmount:
          campaignForm.budgetAmount !== '' && campaignForm.budgetAmount != null
            ? Number(campaignForm.budgetAmount)
            : null,
        startDate: campaignForm.startDate || null,
        endDate: campaignForm.endDate || null,
        keywordHints: campaignForm.keywordHints
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        workspaceId: workspaceId ?? undefined,
      };
      const created = await createAgencyAdCampaign(payload);
      setCampaignWizardOpen(false);
      setCampaignForm(INITIAL_CAMPAIGN_FORM);
      setCampaignStep(0);
      setFeedback({ type: 'success', message: `Campaign “${created?.name ?? 'New campaign'}” created.` });
      await loadCampaigns();
      if (created?.id) {
        setSelectedCampaignId(created.id);
        await loadCampaignDetail(created.id);
      }
    } catch (error) {
      console.error('Failed to create campaign', error);
      const message = error?.response?.data?.message ?? error?.message ?? 'Unable to save campaign.';
      setCampaignFormError(message);
    } finally {
      setCampaignSaving(false);
    }
  };

  const handleSaveCreative = async () => {
    if (!selectedCampaignId) {
      return;
    }
    setCreativeError(null);
    setCreativeSaving(true);
    try {
      const payload = {
        name: creativeForm.name.trim(),
        type: creativeForm.type,
        status: creativeForm.status,
        headline: creativeForm.headline || null,
        subheadline: creativeForm.subheadline || null,
        body: creativeForm.body || null,
        callToAction: creativeForm.callToAction || null,
        ctaUrl: creativeForm.ctaUrl || null,
        mediaUrl: creativeForm.mediaUrl || null,
      };
      if (editingCreativeId) {
        await updateAgencyAdCreative(editingCreativeId, payload);
        setFeedback({ type: 'success', message: 'Creative updated.' });
      } else {
        await createAgencyAdCreative(selectedCampaignId, payload);
        setFeedback({ type: 'success', message: 'Creative added.' });
      }
      setCreativeModalOpen(false);
      setCreativeForm(INITIAL_CREATIVE_FORM);
      setEditingCreativeId(null);
      await loadCampaignDetail(selectedCampaignId);
    } catch (error) {
      console.error('Failed to save creative', error);
      const message = error?.response?.data?.message ?? error?.message ?? 'Unable to save creative.';
      setCreativeError(message);
    } finally {
      setCreativeSaving(false);
    }
  };

  const handleSavePlacement = async () => {
    if (!selectedCampaignId) {
      return;
    }
    setPlacementError(null);
    setPlacementSaving(true);
    try {
      const payload = {
        creativeId: placementForm.creativeId ? Number(placementForm.creativeId) : null,
        surface: placementForm.surface,
        position: placementForm.position,
        status: placementForm.status,
        pacingMode: placementForm.pacingMode,
        weight: placementForm.weight ? Number(placementForm.weight) : 1,
        priority:
          placementForm.priority === '' || placementForm.priority == null ? 0 : Number(placementForm.priority),
        startAt: placementForm.startAt || null,
        endAt: placementForm.endAt || null,
        opportunityType: placementForm.opportunityType || null,
        maxImpressionsPerHour:
          placementForm.maxImpressionsPerHour === '' || placementForm.maxImpressionsPerHour == null
            ? null
            : Number(placementForm.maxImpressionsPerHour),
      };
      if (!payload.creativeId) {
        throw new Error('Select a creative for the placement.');
      }
      if (editingPlacementId) {
        await updateAgencyAdPlacement(editingPlacementId, payload);
        setFeedback({ type: 'success', message: 'Placement updated.' });
      } else {
        await createAgencyAdPlacement(selectedCampaignId, payload);
        setFeedback({ type: 'success', message: 'Placement added.' });
      }
      setPlacementModalOpen(false);
      setPlacementForm(INITIAL_PLACEMENT_FORM);
      setEditingPlacementId(null);
      await loadCampaignDetail(selectedCampaignId);
    } catch (error) {
      console.error('Failed to save placement', error);
      const message = error?.response?.data?.message ?? error?.message ?? 'Unable to save placement.';
      setPlacementError(message);
    } finally {
      setPlacementSaving(false);
    }
  };

  const handleEditCreative = (creative) => {
    setEditingCreativeId(creative.id);
    setCreativeForm({
      name: creative.name ?? '',
      type: creative.type ?? 'display',
      status: creative.status ?? 'active',
      headline: creative.headline ?? '',
      subheadline: creative.subheadline ?? '',
      body: creative.body ?? '',
      callToAction: creative.callToAction ?? '',
      ctaUrl: creative.ctaUrl ?? '',
      mediaUrl: creative.mediaUrl ?? '',
    });
    setCreativeModalOpen(true);
  };

  const handleEditPlacement = (placement) => {
    setEditingPlacementId(placement.id);
    setPlacementForm({
      creativeId: placement.creativeId ?? '',
      surface: placement.surface ?? 'agency_dashboard',
      position: placement.position ?? 'hero',
      status: placement.status ?? 'scheduled',
      pacingMode: placement.pacingMode ?? 'even',
      weight: placement.weight ?? 1,
      priority: placement.priority ?? 0,
      startAt: placement.startAt ? placement.startAt.slice(0, 16) : '',
      endAt: placement.endAt ? placement.endAt.slice(0, 16) : '',
      opportunityType: placement.opportunityType ?? '',
      maxImpressionsPerHour: placement.maxImpressionsPerHour ?? '',
    });
    setPlacementModalOpen(true);
  };

  const handlePrepareNewPlacement = () => {
    const defaultCreativeId = selectedCampaign?.creatives?.[0]?.id ?? '';
    setEditingPlacementId(null);
    setPlacementForm({ ...INITIAL_PLACEMENT_FORM, creativeId: defaultCreativeId });
    setPlacementModalOpen(true);
  };

  const handleUpdateCampaignSettings = async (event) => {
    event.preventDefault();
    if (!selectedCampaignId) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name')?.toString().trim(),
      objective: formData.get('objective')?.toString(),
      status: formData.get('status')?.toString(),
      budgetAmount:
        formData.get('budgetAmount')?.toString() && formData.get('budgetAmount') !== ''
          ? Number(formData.get('budgetAmount'))
          : null,
      currencyCode: formData.get('currencyCode')?.toString(),
      startDate: formData.get('startDate') || null,
      endDate: formData.get('endDate') || null,
      keywordHints: formData
        .get('keywordHints')
        ?.toString()
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      workspaceId: workspaceId ?? undefined,
    };
    try {
      await updateAgencyAdCampaign(selectedCampaignId, payload);
      setFeedback({ type: 'success', message: 'Campaign settings saved.' });
      await Promise.all([loadCampaigns(), loadCampaignDetail(selectedCampaignId)]);
    } catch (error) {
      console.error('Failed to update campaign', error);
      const message = error?.response?.data?.message ?? error?.message ?? 'Unable to update campaign.';
      setFeedback({ type: 'error', message });
    }
  };

  const handleResetCreativeModal = () => {
    setCreativeModalOpen(false);
    setCreativeForm(INITIAL_CREATIVE_FORM);
    setEditingCreativeId(null);
    setCreativeError(null);
  };

  const handleResetPlacementModal = () => {
    setPlacementModalOpen(false);
    setPlacementForm(INITIAL_PLACEMENT_FORM);
    setEditingPlacementId(null);
    setPlacementError(null);
  };

  const summaryCards = useMemo(() => {
    if (!selectedCampaign) {
      return [];
    }
    const budgetAmount =
      selectedCampaign.budgetCents != null ? Number(selectedCampaign.budgetCents) / 100 : null;
    const overview = selectedCampaign.performance?.overview ?? {};
    const surfaceCount = overview.surfaces?.length ?? selectedCampaign.summary?.placements?.surfaces?.length ?? 0;
    return [
      {
        id: 'budget',
        label: 'Budget',
        value: budgetAmount != null ? formatCurrency(budgetAmount, selectedCampaign.currencyCode) : 'Not set',
        hint: selectedCampaign.status === 'active' ? 'Live' : 'Planning',
      },
      {
        id: 'activePlacements',
        label: 'Active placements',
        value: formatNumber(overview.activePlacements ?? selectedCampaign.summary?.placements?.active ?? 0),
        hint: `${formatNumber(overview.upcomingPlacements ?? selectedCampaign.summary?.placements?.upcoming ?? 0)} scheduled`,
      },
      {
        id: 'surfaces',
        label: 'Surfaces',
        value: formatNumber(surfaceCount),
        hint:
          surfaceCount > 0
            ? (overview.surfaces ?? selectedCampaign.summary?.placements?.surfaces ?? []).slice(0, 3).map((surface) => surface.label ?? surface).join(', ')
            : 'Add placements to expand reach',
      },
      {
        id: 'keywords',
        label: 'Keywords',
        value: formatNumber((overview.keywordHighlights ?? []).length),
        hint: 'Signals refresh hourly',
      },
    ];
  }, [selectedCampaign]);

  const creativeOptions = useMemo(() => {
    return (selectedCampaign?.creatives ?? []).map((creative) => ({ value: creative.id, label: creative.name }));
  }, [selectedCampaign]);

  return (
    <section id="agency-ads" className="space-y-6">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Ads</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Run campaigns across Gigvora</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Launch placements, manage creatives, and monitor delivery across agency dashboard surfaces.
          </p>
        </div>
        <DataStatus
          loading={campaignsLoading || detailLoading}
          error={campaignsError ?? detailError}
          onRefresh={() => {
            loadCampaigns();
            if (selectedCampaignId) {
              loadCampaignDetail(selectedCampaignId);
            }
          }}
          statusLabel="Ads data"
          lastUpdated={selectedCampaign?.updatedAt}
        />
      </header>

      {feedback ? (
        <div
          className={classNames(
            'rounded-3xl border px-4 py-3 text-sm font-medium',
            feedback.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700',
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Campaigns</h3>
              <button
                type="button"
                onClick={handleOpenCampaignWizard}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accentDark"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                New
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="search"
                placeholder="Search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className={INPUT_CLASSES}
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={INPUT_CLASSES}
              >
                <option value="">All statuses</option>
                {campaignStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {campaignsLoading ? (
              <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : campaigns.length ? (
              campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  isActive={campaign.id === selectedCampaignId}
                  onSelect={handleSelectCampaign}
                />
              ))
            ) : (
              <EmptyState
                title="No campaigns"
                body="Create a campaign to start placing ads."
                actionLabel="Create campaign"
                onAction={handleOpenCampaignWizard}
              />
            )}
          </div>
        </aside>

        <div className="space-y-4">
          {selectedCampaign ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold text-slate-900">{selectedCampaign.name}</h3>
                      <StatusBadge status={selectedCampaign.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Objective · {selectedCampaign.objective}</p>
                    <p className="mt-1 text-xs text-slate-400">Updated {formatDate(selectedCampaign.updatedAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setForecastOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <ChartBarIcon className="h-4 w-4" aria-hidden="true" /> Forecast
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCampaignForm({
                          name: selectedCampaign.name ?? '',
                          objective: selectedCampaign.objective ?? 'brand',
                          status: selectedCampaign.status ?? 'draft',
                          budgetAmount:
                            selectedCampaign.budgetCents != null
                              ? (Number(selectedCampaign.budgetCents) / 100).toString()
                              : '',
                          currencyCode: selectedCampaign.currencyCode ?? 'USD',
                          startDate: selectedCampaign.startDate ? selectedCampaign.startDate.slice(0, 10) : '',
                          endDate: selectedCampaign.endDate ? selectedCampaign.endDate.slice(0, 10) : '',
                          keywordHints: (selectedCampaign.metadata?.keywordHints ?? [])
                            .map((value) => value)
                            .join(', '),
                        });
                        setCampaignStep(0);
                        setCampaignFormError(null);
                        setCampaignWizardOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <PencilSquareIcon className="h-4 w-4" aria-hidden="true" /> Duplicate
                    </button>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {summaryCards.map((card) => (
                    <div key={card.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</p>
                      <p className="mt-2 text-xs text-slate-500">{card.hint}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Tab.Group>
                <Tab.List className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
                  {TABS.map((tab) => (
                    <Tab
                      key={tab.id}
                      className={({ selected }) =>
                        classNames(
                          'rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                          selected ? 'bg-accent text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100',
                        )
                      }
                    >
                      {tab.label}
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels className="mt-4">
                  <Tab.Panel className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900">Surface coverage</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          {(selectedCampaign.performance?.overview?.surfaces ?? []).map((surface) => (
                            <div key={surface.surface} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-900">{surface.label}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatNumber(surface.activePlacements)} live · {formatNumber(surface.upcomingPlacements)} scheduled
                              </p>
                            </div>
                          ))}
                          {!selectedCampaign.performance?.overview?.surfaces?.length ? (
                            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                              Add placements to see surface coverage.
                            </p>
                          ) : null}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                          {(selectedCampaign.performance?.overview?.keywordHighlights ?? []).map((entry) => (
                            <span
                              key={entry.keyword}
                              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                            >
                              {entry.keyword}
                            </span>
                          ))}
                          {!selectedCampaign.performance?.overview?.keywordHighlights?.length ? (
                            <p className="text-xs text-slate-500">Keywords appear after placements run.</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-900">Traffic</h3>
                          <button
                            type="button"
                            onClick={() => loadCampaignDetail(selectedCampaignId)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
                          </button>
                        </div>
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Sessions</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {formatNumber(selectedCampaign.performance?.traffic?.totalSessions ?? 0)}
                          </p>
                          <p className="text-xs text-slate-500">Lookback window {formatNumber(selectedCampaign.performance?.traffic?.lookbackDays ?? 0)} days</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Growth</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {formatPercent(selectedCampaign.performance?.traffic?.growthRate ?? 0)}
                          </p>
                          <p className="text-xs text-slate-500">Momentum vs prior window</p>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  <Tab.Panel className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Creatives</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCreativeId(null);
                          setCreativeForm(INITIAL_CREATIVE_FORM);
                          setCreativeModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accentDark"
                      >
                        <PlusIcon className="h-4 w-4" aria-hidden="true" /> New creative
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(selectedCampaign.creatives ?? []).map((creative) => (
                        <div key={creative.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{creative.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {creative.type} · {creative.status}
                            </p>
                            {creative.headline ? (
                              <p className="mt-2 text-sm text-slate-600">{creative.headline}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditCreative(creative)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                            >
                              <PencilSquareIcon className="h-4 w-4" aria-hidden="true" /> Edit
                            </button>
                            <div className="flex flex-wrap gap-2">
                              {(creative.placements ?? []).slice(0, 3).map((placement) => (
                                <span
                                  key={placement.id}
                                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                                >
                                  {placement.surface}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      {!selectedCampaign.creatives?.length ? (
                        <EmptyState
                          icon={Squares2X2Icon}
                          title="No creatives yet"
                          body="Add a creative to unlock placements."
                          actionLabel="Add creative"
                          onAction={() => {
                            setEditingCreativeId(null);
                            setCreativeForm(INITIAL_CREATIVE_FORM);
                            setCreativeModalOpen(true);
                          }}
                        />
                      ) : null}
                    </div>
                  </Tab.Panel>

                  <Tab.Panel className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Placements</h3>
                      <button
                        type="button"
                        onClick={handlePrepareNewPlacement}
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accentDark"
                      >
                        <PlusIcon className="h-4 w-4" aria-hidden="true" /> New placement
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(selectedCampaign.placements ?? []).map((placement) => (
                        <div key={placement.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {placement.surface} · {placement.position}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatDate(placement.startAt)} → {formatDate(placement.endAt)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge status={placement.status} />
                              <button
                                type="button"
                                onClick={() => handleEditPlacement(placement)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                              >
                                <PencilSquareIcon className="h-4 w-4" aria-hidden="true" /> Edit
                              </button>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-slate-500">Creative · {placement.creative?.name ?? '—'}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                            <span>Weight {placement.weight}</span>
                            <span>•</span>
                            <span>{placement.pacingMode} pacing</span>
                            {placement.opportunityType ? (
                              <>
                                <span>•</span>
                                <span>{placement.opportunityType}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {!selectedCampaign.placements?.length ? (
                        <EmptyState
                          icon={MegaphoneIcon}
                          title="No placements scheduled"
                          body="Schedule a placement to push the campaign live."
                          actionLabel="Create placement"
                          onAction={handlePrepareNewPlacement}
                        />
                      ) : null}
                    </div>
                  </Tab.Panel>

                  <Tab.Panel className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                    <form className="space-y-4" onSubmit={handleUpdateCampaignSettings}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">
                          Name
                          <input name="name" defaultValue={selectedCampaign.name} className={INPUT_CLASSES} required />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          Objective
                          <select name="objective" defaultValue={selectedCampaign.objective} className={INPUT_CLASSES}>
                            {objectiveOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          Status
                          <select name="status" defaultValue={selectedCampaign.status} className={INPUT_CLASSES}>
                            {campaignStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          Budget
                          <input
                            name="budgetAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={
                              selectedCampaign.budgetCents != null
                                ? Number(selectedCampaign.budgetCents) / 100
                                : ''
                            }
                            className={INPUT_CLASSES}
                          />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          Currency
                          <input name="currencyCode" defaultValue={selectedCampaign.currencyCode ?? 'USD'} className={INPUT_CLASSES} />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          Start date
                          <input
                            name="startDate"
                            type="date"
                            defaultValue={selectedCampaign.startDate ? selectedCampaign.startDate.slice(0, 10) : ''}
                            className={INPUT_CLASSES}
                          />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          End date
                          <input
                            name="endDate"
                            type="date"
                            defaultValue={selectedCampaign.endDate ? selectedCampaign.endDate.slice(0, 10) : ''}
                            className={INPUT_CLASSES}
                          />
                        </label>
                        <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                          Keywords
                          <input
                            name="keywordHints"
                            defaultValue={(selectedCampaign.metadata?.keywordHints ?? []).join(', ')}
                            placeholder="brand, agency, growth"
                            className={INPUT_CLASSES}
                          />
                        </label>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
                        >
                          Save changes
                        </button>
                      </div>
                    </form>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          ) : campaignsLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading…</div>
          ) : (
            <EmptyState
              icon={MegaphoneIcon}
              title="Select a campaign"
              body="Pick a campaign on the left to review performance."
              actionLabel={campaigns.length ? undefined : 'Create campaign'}
              onAction={campaigns.length ? undefined : handleOpenCampaignWizard}
            />
          )}
        </div>
      </div>

      <Transition appear show={campaignWizardOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setCampaignWizardOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">Campaign builder</Dialog.Title>
                  <p className="mt-1 text-sm text-slate-500">Work through basics, schedule, and review before launch.</p>

                  {campaignFormError ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {campaignFormError}
                    </div>
                  ) : null}

                  <div className="mt-6 space-y-4">
                    {campaignStep === 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                          Name
                          <input
                            value={campaignForm.name}
                            onChange={(event) => handleCampaignInputChange('name', event.target.value)}
                            className={INPUT_CLASSES}
                            required
                          />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          Objective
                          <select
                            value={campaignForm.objective}
                            onChange={(event) => handleCampaignInputChange('objective', event.target.value)}
                            className={INPUT_CLASSES}
                          >
                            {objectiveOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          Status
                          <select
                            value={campaignForm.status}
                            onChange={(event) => handleCampaignInputChange('status', event.target.value)}
                            className={INPUT_CLASSES}
                          >
                            {campaignStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                          Keywords
                          <input
                            value={campaignForm.keywordHints}
                            onChange={(event) => handleCampaignInputChange('keywordHints', event.target.value)}
                            placeholder="brand, finance, operations"
                            className={INPUT_CLASSES}
                          />
                        </label>
                      </div>
                    ) : null}

                    {campaignStep === 1 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">
                          Budget
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={campaignForm.budgetAmount}
                            onChange={(event) => handleCampaignInputChange('budgetAmount', event.target.value)}
                            className={INPUT_CLASSES}
                          />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          Currency
                          <input
                            value={campaignForm.currencyCode}
                            onChange={(event) => handleCampaignInputChange('currencyCode', event.target.value.toUpperCase())}
                            className={INPUT_CLASSES}
                          />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          Start date
                          <input
                            type="date"
                            value={campaignForm.startDate}
                            onChange={(event) => handleCampaignInputChange('startDate', event.target.value)}
                            className={INPUT_CLASSES}
                          />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                          End date
                          <input
                            type="date"
                            value={campaignForm.endDate}
                            onChange={(event) => handleCampaignInputChange('endDate', event.target.value)}
                            className={INPUT_CLASSES}
                          />
                        </label>
                      </div>
                    ) : null}

                    {campaignStep === 2 ? (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">{campaignForm.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {campaignForm.objective} · {campaignForm.status}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-600">
                          <p>Budget {campaignForm.budgetAmount || '—'} {campaignForm.currencyCode}</p>
                          <p className="mt-1">
                            {campaignForm.startDate || 'No start'} → {campaignForm.endDate || 'No end'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Keywords: {campaignForm.keywordHints || 'Add after launch'}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCampaignWizardOpen(false)}
                      className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <div className="flex items-center gap-3">
                      {campaignStep > 0 ? (
                        <button
                          type="button"
                          onClick={handleCampaignPrev}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                        >
                          Back
                        </button>
                      ) : null}
                      {campaignStep < 2 ? (
                        <button
                          type="button"
                          onClick={handleCampaignNext}
                          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCreateCampaign}
                          disabled={campaignSaving}
                          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:opacity-70"
                        >
                          {campaignSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                          Launch campaign
                        </button>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={creativeModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleResetCreativeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {editingCreativeId ? 'Edit creative' : 'New creative'}
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-slate-500">Update visuals and copy for the selected campaign.</p>
                  {creativeError ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {creativeError}
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                      Name
                      <input
                        value={creativeForm.name}
                        onChange={(event) => setCreativeForm((prev) => ({ ...prev, name: event.target.value }))}
                        className={INPUT_CLASSES}
                        required
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Type
                      <select
                        value={creativeForm.type}
                        onChange={(event) => setCreativeForm((prev) => ({ ...prev, type: event.target.value }))}
                        className={INPUT_CLASSES}
                      >
                        {creativeTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Status
                      <select
                        value={creativeForm.status}
                        onChange={(event) => setCreativeForm((prev) => ({ ...prev, status: event.target.value }))}
                        className={INPUT_CLASSES}
                      >
                        {campaignStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                      Headline
                      <input
                        value={creativeForm.headline}
                        onChange={(event) => setCreativeForm((prev) => ({ ...prev, headline: event.target.value }))}
                        className={INPUT_CLASSES}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                      Subheadline
                      <input
                        value={creativeForm.subheadline}
                        onChange={(event) => setCreativeForm((prev) => ({ ...prev, subheadline: event.target.value }))}
                        className={INPUT_CLASSES}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                      Body
                      <textarea
                        value={creativeForm.body}
                        onChange={(event) => setCreativeForm((prev) => ({ ...prev, body: event.target.value }))}
                        className={`${INPUT_CLASSES} min-h-[120px]`}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Call to action
                      <input
                        value={creativeForm.callToAction}
                        onChange={(event) => setCreativeForm((prev) => ({ ...prev, callToAction: event.target.value }))}
                        className={INPUT_CLASSES}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      CTA URL
                      <input
                        value={creativeForm.ctaUrl}
                        onChange={(event) => setCreativeForm((prev) => ({ ...prev, ctaUrl: event.target.value }))}
                        className={INPUT_CLASSES}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                      Media URL
                      <input
                        value={creativeForm.mediaUrl}
                        onChange={(event) => setCreativeForm((prev) => ({ ...prev, mediaUrl: event.target.value }))}
                        className={INPUT_CLASSES}
                      />
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleResetCreativeModal}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCreative}
                      disabled={creativeSaving}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:opacity-70"
                    >
                      {creativeSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      Save creative
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={placementModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleResetPlacementModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {editingPlacementId ? 'Edit placement' : 'New placement'}
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-slate-500">Select a creative, surface, and flight window.</p>
                  {placementError ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {placementError}
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                      Creative
                      <select
                        value={placementForm.creativeId}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, creativeId: event.target.value }))}
                        className={INPUT_CLASSES}
                      >
                        <option value="">Select creative</option>
                        {creativeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Surface
                      <select
                        value={placementForm.surface}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, surface: event.target.value }))}
                        className={INPUT_CLASSES}
                      >
                        {surfaceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Position
                      <select
                        value={placementForm.position}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, position: event.target.value }))}
                        className={INPUT_CLASSES}
                      >
                        {positionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Status
                      <select
                        value={placementForm.status}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, status: event.target.value }))}
                        className={INPUT_CLASSES}
                      >
                        {campaignStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Pacing
                      <select
                        value={placementForm.pacingMode}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, pacingMode: event.target.value }))}
                        className={INPUT_CLASSES}
                      >
                        {pacingOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Weight
                      <input
                        type="number"
                        min="1"
                        value={placementForm.weight}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, weight: event.target.value }))}
                        className={INPUT_CLASSES}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Priority
                      <input
                        type="number"
                        value={placementForm.priority}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, priority: event.target.value }))}
                        className={INPUT_CLASSES}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Start
                      <input
                        type="datetime-local"
                        value={placementForm.startAt}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, startAt: event.target.value }))}
                        className={INPUT_CLASSES}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      End
                      <input
                        type="datetime-local"
                        value={placementForm.endAt}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, endAt: event.target.value }))}
                        className={INPUT_CLASSES}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Opportunity
                      <select
                        value={placementForm.opportunityType}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, opportunityType: event.target.value }))}
                        className={INPUT_CLASSES}
                      >
                        <option value="">None</option>
                        {opportunityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Max impressions / hour
                      <input
                        type="number"
                        min="0"
                        value={placementForm.maxImpressionsPerHour}
                        onChange={(event) => setPlacementForm((prev) => ({ ...prev, maxImpressionsPerHour: event.target.value }))}
                        className={INPUT_CLASSES}
                      />
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleResetPlacementModal}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePlacement}
                      disabled={placementSaving}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:opacity-70"
                    >
                      {placementSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      Save placement
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={forecastOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => setForecastOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Forecast</Dialog.Title>
                  <p className="mt-1 text-sm text-slate-500">Projected reach and pacing for the next 14 days.</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Projected impressions</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatNumber(selectedCampaign.performance?.forecast?.projectedImpressions ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Projected clicks</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatNumber(selectedCampaign.performance?.forecast?.projectedClicks ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Fill rate</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatPercent(selectedCampaign.performance?.forecast?.expectedFillRate ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Available slots</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatNumber(selectedCampaign.performance?.forecast?.openSlots ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setForecastOpen(false)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </section>
  );
}
