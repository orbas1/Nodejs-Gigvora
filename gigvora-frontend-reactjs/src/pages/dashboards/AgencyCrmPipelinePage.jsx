import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useSession from '../../hooks/useSession.js';
import { fetchAgencyDashboard } from '../../services/agency.js';
import {
  fetchPipelineDashboard,
  createPipelineDeal,
  updatePipelineDeal,
  deletePipelineDeal,
  createPipelineFollowUp,
  updatePipelineFollowUp,
  deletePipelineFollowUp,
  createPipelineProposal,
  deletePipelineProposal,
  createPipelineCampaign,
  deletePipelineCampaign,
} from '../../services/pipeline.js';
import { AGENCY_CRM_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import DealColumn from '../../components/agency/crm/DealColumn.jsx';
import DealForm from '../../components/agency/crm/DealForm.jsx';
import FollowUpForm from '../../components/agency/crm/FollowUpForm.jsx';
import ProposalForm from '../../components/agency/crm/ProposalForm.jsx';
import CampaignForm from '../../components/agency/crm/CampaignForm.jsx';
import FollowUpList from '../../components/agency/crm/FollowUpList.jsx';
import ProposalList from '../../components/agency/crm/ProposalList.jsx';
import CampaignList from '../../components/agency/crm/CampaignList.jsx';
import SummaryCard from '../../components/agency/crm/SummaryCard.jsx';
import CrmDrawer from '../../components/agency/crm/CrmDrawer.jsx';
import DealPreview from '../../components/agency/crm/DealPreview.jsx';
import FollowUpPreview from '../../components/agency/crm/FollowUpPreview.jsx';
import ProposalPreview from '../../components/agency/crm/ProposalPreview.jsx';
import CampaignPreview from '../../components/agency/crm/CampaignPreview.jsx';

const ownerType = 'agency';
const viewLabelMap = {
  stage: 'Stages',
  industry: 'Industries',
  retainer_size: 'Retainers',
  probability: 'Chance',
};

const currencyFormatter = (value, currency = 'USD') => {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: Number(value) < 1000 ? 2 : 0,
  }).format(Number(value));
};

const percentFormatter = (value, { decimals = 0, fallback = '—' } = {}) => {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  return `${(Number(value) * 100).toFixed(decimals)}%`;
};

const numberFormatter = (value, { decimals = 0, fallback = '—' } = {}) => {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const initialDealForm = (stages) => ({
  title: '',
  clientName: '',
  pipelineValue: '',
  stageId: stages?.[0]?.id ?? '',
  winProbability: '',
  expectedCloseDate: '',
  source: '',
});

const initialFollowUpForm = (deals) => ({
  dealId: deals?.[0]?.id ?? '',
  dueAt: '',
  channel: '',
  note: '',
});

const initialProposalForm = (deals, templates) => ({
  dealId: deals?.[0]?.id ?? '',
  title: '',
  status: 'draft',
  templateId: templates?.[0]?.id ?? '',
  sentAt: '',
});

const initialCampaignForm = () => ({
  name: '',
  status: 'draft',
  targetService: '',
  launchDate: '',
});

export default function AgencyCrmPipelinePage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Agency team';
  const [workspace, setWorkspace] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [saving, setSaving] = useState(false);
  const [boardView, setBoardView] = useState('stage');

  const [dealFormState, setDealFormState] = useState(initialDealForm());
  const [dealEditing, setDealEditing] = useState(null);
  const [followUpFormState, setFollowUpFormState] = useState(initialFollowUpForm());
  const [proposalFormState, setProposalFormState] = useState(initialProposalForm());
  const [campaignFormState, setCampaignFormState] = useState(initialCampaignForm());

  const [drawer, setDrawer] = useState({ type: null, payload: null });

  const currency = workspace?.defaultCurrency ?? 'USD';

  const closeDrawer = useCallback(() => {
    setDrawer({ type: null, payload: null });
    setDealEditing(null);
  }, []);

  const updateDealForm = (field, value) => {
    setDealFormState((state) => ({ ...state, [field]: value }));
  };
  const updateFollowUpForm = (field, value) => {
    setFollowUpFormState((state) => ({ ...state, [field]: value }));
  };
  const updateProposalForm = (field, value) => {
    setProposalFormState((state) => ({ ...state, [field]: value }));
  };
  const updateCampaignForm = (field, value) => {
    setCampaignFormState((state) => ({ ...state, [field]: value }));
  };

  const refreshPipeline = useCallback(
    async ({ useLoading = false, signal, workspaceIdOverride, viewOverride } = {}) => {
      const workspaceId = workspaceIdOverride ?? workspace?.id;
      if (!workspaceId) {
        return;
      }
      const view = viewOverride ?? boardView ?? 'stage';
      if (useLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      try {
        const result = await fetchPipelineDashboard(workspaceId, {
          ownerType,
          view,
          signal,
        });
        if (signal?.aborted) {
          return;
        }
        setPipeline(result);
        setBoardView(result?.grouping?.type ?? view);
        setLastUpdated(new Date());
        setError(null);
        setDealFormState((previous) => initialDealForm(result?.stages ?? []) ?? previous);
        setFollowUpFormState((previous) => initialFollowUpForm(result?.deals ?? []) ?? previous);
        setProposalFormState((previous) => initialProposalForm(result?.deals ?? [], result?.templates ?? []) ?? previous);
      } catch (err) {
        if (signal?.aborted) {
          return;
        }
        setError(err);
      } finally {
        if (signal?.aborted) {
          return;
        }
        if (useLoading) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [workspace?.id, boardView],
  );

  useEffect(() => {
    const controller = new AbortController();
    async function bootstrap() {
      try {
        setLoading(true);
        const dashboard = await fetchAgencyDashboard({}, { signal: controller.signal });
        if (controller.signal.aborted) {
          return;
        }
        if (!dashboard.workspace) {
          throw new Error('No agency workspace is linked to your account yet.');
        }
        setWorkspace(dashboard.workspace);
        await refreshPipeline({ useLoading: true, signal: controller.signal, workspaceIdOverride: dashboard.workspace.id });
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err);
          setLoading(false);
        }
      }
    }
    bootstrap();
    return () => controller.abort();
  }, [refreshPipeline]);

  useEffect(() => {
    if (pipeline?.grouping?.type && pipeline.grouping.type !== boardView) {
      setBoardView(pipeline.grouping.type);
    }
  }, [pipeline?.grouping?.type]);

  const summaryCards = useMemo(() => {
    if (!pipeline?.summary) {
      return [];
    }
    const summary = pipeline.summary;
    return [
      {
        label: 'Deals',
        value: numberFormatter(summary.openDeals),
        helper: `${numberFormatter(summary.totalDeals)} total`,
      },
      {
        label: 'Value',
        value: currencyFormatter(summary.pipelineValue, currency),
        helper: `Weighted ${currencyFormatter(summary.weightedPipelineValue, currency)}`,
      },
      {
        label: 'Wins',
        value: percentFormatter(summary.winRate ?? 0),
        helper: `${numberFormatter(summary.wonDeals)} won / ${numberFormatter(summary.lostDeals)} lost`,
      },
      {
        label: 'Momentum',
        value: percentFormatter(summary.pipelineMomentum ?? 0, { decimals: 1 }),
        helper: `${numberFormatter(summary.nextFollowUps)} next touches`,
      },
    ];
  }, [pipeline?.summary, currency]);

  const enterpriseSignals = useMemo(() => {
    if (!pipeline?.enterprise) {
      return [];
    }
    const conversion = pipeline.enterprise.conversionRates ?? {};
    const velocity = pipeline.enterprise.velocity ?? {};
    const health = pipeline.enterprise.health ?? {};
    return [
      {
        label: 'Convert',
        value: percentFormatter(conversion.discoveryConversionRate ?? 0),
        helper: `${percentFormatter(conversion.negotiationRate ?? 0)} reach negotiation`,
      },
      {
        label: 'Cycle',
        value: `${numberFormatter(velocity.averageOpenDays ?? 0, { decimals: 1 })} days`,
        helper: `${numberFormatter(velocity.averageClosedWonDays ?? 0, { decimals: 1 })} to win`,
      },
      {
        label: 'Health',
        value: health.label ?? 'Monitoring',
        helper: health.description ?? 'Scorecard refreshed hourly.',
      },
    ];
  }, [pipeline?.enterprise]);

  const dealsForForms = pipeline?.deals ?? [];
  const stages = pipeline?.stages ?? [];
  const templates = pipeline?.templates ?? [];
  const followUps = pipeline?.followUps ?? [];
  const proposals = pipeline?.proposals ?? [];
  const campaigns = pipeline?.campaigns ?? [];
  const groupingColumns = pipeline?.grouping?.columns ?? [];
  const upcomingFollowUps = followUps.filter((item) => item.status === 'scheduled');
  const viewOptions = (pipeline?.viewDefinitions ?? []).map((definition) => ({
    key: definition.key,
    label: viewLabelMap[definition.key] ?? definition.label ?? definition.key,
  }));

  const openDealForm = (deal = null) => {
    if (deal) {
      setDealEditing(deal);
      setDealFormState({
        title: deal.title ?? '',
        clientName: deal.clientName ?? '',
        pipelineValue: deal.pipelineValue ?? '',
        stageId: deal.stageId ?? stages?.[0]?.id ?? '',
        winProbability: deal.winProbability ?? '',
        expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.split('T')[0] : '',
        source: deal.source ?? '',
      });
    } else {
      setDealEditing(null);
      setDealFormState(initialDealForm(stages));
    }
    setDrawer({ type: 'deal-form', payload: deal });
  };

  const handleDealFormSubmit = async (event) => {
    event.preventDefault();
    if (!workspace?.id) {
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: dealFormState.title,
        clientName: dealFormState.clientName,
        pipelineValue: dealFormState.pipelineValue ? Number(dealFormState.pipelineValue) : undefined,
        stageId: dealFormState.stageId ? Number(dealFormState.stageId) : undefined,
        winProbability: dealFormState.winProbability ? Number(dealFormState.winProbability) : undefined,
        expectedCloseDate: dealFormState.expectedCloseDate || undefined,
        source: dealFormState.source || undefined,
      };
      if (dealEditing) {
        await updatePipelineDeal(workspace.id, dealEditing.id, payload, { ownerType });
      } else {
        await createPipelineDeal(workspace.id, payload, { ownerType });
      }
      await refreshPipeline({ workspaceIdOverride: workspace.id });
      closeDrawer();
      setDealFormState(initialDealForm(stages));
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFollowUpSubmit = async (event) => {
    event.preventDefault();
    if (!workspace?.id) {
      return;
    }
    try {
      setSaving(true);
      const payload = {
        dealId: Number(followUpFormState.dealId),
        dueAt: followUpFormState.dueAt,
        channel: followUpFormState.channel || undefined,
        note: followUpFormState.note || undefined,
      };
      await createPipelineFollowUp(workspace.id, payload, { ownerType });
      await refreshPipeline({ workspaceIdOverride: workspace.id });
      closeDrawer();
      setFollowUpFormState(initialFollowUpForm(dealsForForms));
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFollowUpComplete = async (followUp) => {
    if (!workspace?.id || !followUp?.id) {
      return;
    }
    try {
      await updatePipelineFollowUp(
        workspace.id,
        followUp.id,
        { status: 'completed', completedAt: new Date().toISOString() },
        { ownerType },
      );
      await refreshPipeline({ workspaceIdOverride: workspace.id });
      closeDrawer();
    } catch (err) {
      setError(err);
    }
  };

  const handleProposalSubmit = async (event) => {
    event.preventDefault();
    if (!workspace?.id) {
      return;
    }
    try {
      setSaving(true);
      const payload = {
        dealId: Number(proposalFormState.dealId),
        title: proposalFormState.title || undefined,
        status: proposalFormState.status,
        templateId: proposalFormState.templateId ? Number(proposalFormState.templateId) : undefined,
        sentAt: proposalFormState.sentAt || undefined,
      };
      await createPipelineProposal(workspace.id, payload, { ownerType });
      await refreshPipeline({ workspaceIdOverride: workspace.id });
      closeDrawer();
      setProposalFormState(initialProposalForm(dealsForForms, templates));
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCampaignSubmit = async (event) => {
    event.preventDefault();
    if (!workspace?.id) {
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: campaignFormState.name,
        status: campaignFormState.status,
        targetService: campaignFormState.targetService || undefined,
        launchDate: campaignFormState.launchDate || undefined,
      };
      await createPipelineCampaign(workspace.id, payload, { ownerType });
      await refreshPipeline({ workspaceIdOverride: workspace.id });
      closeDrawer();
      setCampaignFormState(initialCampaignForm());
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDealDelete = async (deal) => {
    if (!workspace?.id || !deal?.id) {
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm('Delete this deal?')) {
      return;
    }
    try {
      setSaving(true);
      await deletePipelineDeal(workspace.id, deal.id, { ownerType });
      await refreshPipeline({ workspaceIdOverride: workspace.id });
      closeDrawer();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFollowUpDelete = async (followUp) => {
    if (!workspace?.id || !followUp?.id) {
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm('Delete this follow-up?')) {
      return;
    }
    try {
      setSaving(true);
      await deletePipelineFollowUp(workspace.id, followUp.id, { ownerType });
      await refreshPipeline({ workspaceIdOverride: workspace.id });
      closeDrawer();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleProposalDelete = async (proposal) => {
    if (!workspace?.id || !proposal?.id) {
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm('Delete this proposal?')) {
      return;
    }
    try {
      setSaving(true);
      await deletePipelineProposal(workspace.id, proposal.id, { ownerType });
      await refreshPipeline({ workspaceIdOverride: workspace.id });
      closeDrawer();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCampaignDelete = async (campaign) => {
    if (!workspace?.id || !campaign?.id) {
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm('Delete this campaign?')) {
      return;
    }
    try {
      setSaving(true);
      await deletePipelineCampaign(workspace.id, campaign.id, { ownerType });
      await refreshPipeline({ workspaceIdOverride: workspace.id });
      closeDrawer();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      currentDashboard="agency-pipeline"
      title="Pipeline"
      subtitle={`Hi ${displayName}`}
      description=""
      menuSections={AGENCY_CRM_MENU_SECTIONS}
      availableDashboards={[
        { id: 'agency-home', label: 'Home', href: '/dashboard/agency' },
        { id: 'agency-pipeline', label: 'Pipeline', href: '/dashboard/agency/crm' },
        'freelancer',
        'company',
        'user',
      ]}
      activeMenuItem="agency-pipeline"
      adSurface="pipeline_dashboard"
    >
      <div className="space-y-12">
        <section id="crm-stats" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <DataStatus
              loading={loading || refreshing}
              lastUpdated={lastUpdated}
              onRefresh={() => refreshPipeline({ workspaceIdOverride: workspace?.id })}
              error={error}
            />
            <button
              type="button"
              onClick={() => refreshPipeline({ workspaceIdOverride: workspace?.id })}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} {...card} />
            ))}
          </div>
          {enterpriseSignals.length ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {enterpriseSignals.map((card) => (
                <SummaryCard key={card.label} {...card} />
              ))}
            </div>
          ) : null}
        </section>

        <section id="crm-deals" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">Deals</h2>
            <div className="flex flex-wrap items-center gap-2">
              {viewOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setBoardView(option.key);
                    refreshPipeline({ workspaceIdOverride: workspace?.id, viewOverride: option.key });
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    option.key === boardView
                      ? 'bg-accent text-white shadow'
                      : 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => openDealForm(null)}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" /> New deal
              </button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {groupingColumns.map((column) => (
              <DealColumn
                key={column.id ?? column.name}
                column={column}
                currencyFormatter={(value) => currencyFormatter(value, currency)}
                percentFormatter={percentFormatter}
                onInspectDeal={(deal) => setDrawer({ type: 'deal-preview', payload: deal })}
                onEditDeal={(deal) => openDealForm(deal)}
                onDeleteDeal={handleDealDelete}
              />
            ))}
            {!groupingColumns.length && !loading ? (
              <p className="text-sm text-slate-500">No deals yet. Add the first one to get rolling.</p>
            ) : null}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-3">
          <section id="crm-tasks" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Tasks</h3>
              <button
                type="button"
                onClick={() => {
                  if (!dealsForForms.length) {
                    return;
                  }
                  setFollowUpFormState(initialFollowUpForm(dealsForForms));
                  setDrawer({ type: 'follow-form', payload: null });
                }}
                disabled={!dealsForForms.length}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  dealsForForms.length
                    ? 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                    : 'cursor-not-allowed border border-slate-100 text-slate-400'
                }`}
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" /> New task
              </button>
            </div>
            <FollowUpList
              followUps={upcomingFollowUps}
              onInspect={(followUp) => setDrawer({ type: 'follow-preview', payload: followUp })}
              onComplete={handleFollowUpComplete}
              onDelete={handleFollowUpDelete}
            />
          </section>

          <section id="crm-docs" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Docs</h3>
              <button
                type="button"
                onClick={() => {
                  if (!dealsForForms.length) {
                    return;
                  }
                  setProposalFormState(initialProposalForm(dealsForForms, templates));
                  setDrawer({ type: 'proposal-form', payload: null });
                }}
                disabled={!dealsForForms.length}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  dealsForForms.length
                    ? 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                    : 'cursor-not-allowed border border-slate-100 text-slate-400'
                }`}
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" /> New doc
              </button>
            </div>
            <ProposalList
              proposals={proposals}
              onInspect={(proposal) => setDrawer({ type: 'proposal-preview', payload: proposal })}
              onDelete={handleProposalDelete}
            />
          </section>

          <section id="crm-campaigns" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Campaigns</h3>
              <button
                type="button"
                onClick={() => {
                  setCampaignFormState(initialCampaignForm());
                  setDrawer({ type: 'campaign-form', payload: null });
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" /> New launch
              </button>
            </div>
            <CampaignList
              campaigns={campaigns}
              onInspect={(campaign) => setDrawer({ type: 'campaign-preview', payload: campaign })}
              onDelete={handleCampaignDelete}
            />
          </section>
        </div>
      </div>

      <CrmDrawer
        open={drawer.type === 'deal-form'}
        onClose={closeDrawer}
        title={dealEditing ? 'Edit deal' : 'New deal'}
        subtitle="Update pipeline details"
      >
        <DealForm
          value={dealFormState}
          onChange={updateDealForm}
          onSubmit={handleDealFormSubmit}
          onCancel={closeDrawer}
          saving={saving}
          stages={stages}
          currency={currency}
          editingDeal={dealEditing}
        />
      </CrmDrawer>

      <CrmDrawer
        open={drawer.type === 'follow-form'}
        onClose={closeDrawer}
        title="New task"
        subtitle="Schedule the next touch"
      >
        <FollowUpForm
          value={followUpFormState}
          deals={dealsForForms}
          onChange={updateFollowUpForm}
          onSubmit={handleFollowUpSubmit}
          onCancel={closeDrawer}
          saving={saving}
        />
      </CrmDrawer>

      <CrmDrawer
        open={drawer.type === 'proposal-form'}
        onClose={closeDrawer}
        title="New doc"
        subtitle="Send a proposal in one place"
      >
        <ProposalForm
          value={proposalFormState}
          deals={dealsForForms}
          templates={templates}
          onChange={updateProposalForm}
          onSubmit={handleProposalSubmit}
          onCancel={closeDrawer}
          saving={saving}
        />
      </CrmDrawer>

      <CrmDrawer
        open={drawer.type === 'campaign-form'}
        onClose={closeDrawer}
        title="New launch"
        subtitle="Plan the next program"
      >
        <CampaignForm
          value={campaignFormState}
          onChange={updateCampaignForm}
          onSubmit={handleCampaignSubmit}
          onCancel={closeDrawer}
          saving={saving}
        />
      </CrmDrawer>

      <CrmDrawer
        open={drawer.type === 'deal-preview'}
        onClose={closeDrawer}
        title="Deal details"
        subtitle="Full screen view"
      >
        <DealPreview
          deal={drawer.payload}
          currencyFormatter={(value) => currencyFormatter(value, currency)}
          percentFormatter={percentFormatter}
          onEdit={(deal) => openDealForm(deal)}
          onDelete={handleDealDelete}
        />
      </CrmDrawer>

      <CrmDrawer
        open={drawer.type === 'follow-preview'}
        onClose={closeDrawer}
        title="Task details"
        subtitle="Keep pace"
      >
        <FollowUpPreview
          followUp={drawer.payload}
          onComplete={handleFollowUpComplete}
          onDelete={handleFollowUpDelete}
        />
      </CrmDrawer>

      <CrmDrawer
        open={drawer.type === 'proposal-preview'}
        onClose={closeDrawer}
        title="Doc details"
        subtitle="Share-ready files"
      >
        <ProposalPreview proposal={drawer.payload} onDelete={handleProposalDelete} />
      </CrmDrawer>

      <CrmDrawer
        open={drawer.type === 'campaign-preview'}
        onClose={closeDrawer}
        title="Campaign details"
        subtitle="Launch prep"
      >
        <CampaignPreview campaign={drawer.payload} onDelete={handleCampaignDelete} />
      </CrmDrawer>
    </DashboardLayout>
  );
}
