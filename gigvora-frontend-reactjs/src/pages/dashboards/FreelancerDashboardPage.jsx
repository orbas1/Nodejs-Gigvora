import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  PhoneArrowDownLeftIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import {
  fetchFreelancerOrderPipeline,
  createFreelancerOrder,
  updateFreelancerOrder,
  updateOrderRequirement,
  updateOrderRevision,
  updateEscrowCheckpoint,
} from '../../services/orderPipeline.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const BASE_MENU_SECTIONS = [
  {
    label: 'Service delivery',
    items: [
      {
        name: 'Project workspace dashboard',
        key: 'overview',
        description: 'Unified workspace for briefs, assets, conversations, and approvals.',
        tags: ['whiteboards', 'files'],
      },
      {
        name: 'Project management',
        description: 'Detailed plan with sprints, dependencies, risk logs, and billing checkpoints.',
      },
      {
        name: 'Client portals',
        description: 'Shared timelines, scope controls, and decision logs with your clients.',
      },
    ],
  },
  {
    label: 'Gig commerce',
    items: [
      {
        name: 'Gig manager',
        description: 'Monitor gigs, delivery milestones, bundled services, and upsells.',
        tags: ['gig catalog'],
      },
      {
        name: 'Order pipeline',
        key: 'order-pipeline',
        description: 'Automate intake forms, kickoff prep, delivery, revisions, and escrow releases.',
        tags: ['workflow', 'escrow'],
      },
      {
        name: 'Post a gig',
        description: 'Launch new services with pricing matrices, availability calendars, and banners.',
      },
      {
        name: 'Purchased gigs',
        description: 'Track incoming orders, requirements, revisions, and payouts.',
      },
    ],
  },
  {
    label: 'Growth & profile',
    items: [
      {
        name: 'Freelancer profile',
        description: 'Update expertise tags, success metrics, testimonials, and hero banners.',
      },
      {
        name: 'Agency collaborations',
        description: 'Manage invitations from agencies, share rate cards, and negotiate retainers.',
      },
      {
        name: 'Finance & insights',
        description: 'Revenue analytics, payout history, taxes, and profitability dashboards.',
      },
    ],
  },
];

const CAPABILITY_SECTIONS = [
  {
    title: 'Project workspace excellence',
    description:
      'Deliver projects with structure. Each workspace combines real-time messaging, documents, tasks, billing, and client approvals.',
    features: [
      {
        name: 'Workspace templates',
        description:
          'Kickstart delivery with industry-specific playbooks, requirement questionnaires, and automated onboarding flows.',
        bulletPoints: [
          'Standard operating procedures and checklists for repeat work.',
          'Client welcome sequences and kickoff survey automation.',
        ],
      },
      {
        name: 'Task & sprint manager',
        description:
          'Run sprints, Kanban boards, and timeline views with burn charts, dependencies, and backlog grooming.',
        bulletPoints: [
          'Time tracking per task with billable vs. non-billable flags.',
          'Risk registers and change request approvals with e-signatures.',
        ],
      },
      {
        name: 'Collaboration cockpit',
        description:
          'Host video rooms, creative proofing, code repositories, and AI assistants for documentation and QA.',
        bulletPoints: [
          'Inline annotations on files, prototypes, and project demos.',
          'Client-specific permissions with comment-only or edit access.',
        ],
      },
      {
        name: 'Deliverable vault',
        description:
          'Secure storage with version history, watermarking, NDA controls, and automated delivery packages.',
        bulletPoints: [
          'Auto-generate delivery summaries with success metrics.',
          'Long-term archiving and compliance exports.',
        ],
      },
    ],
  },
  {
    title: 'Gig marketplace operations',
    description:
      'Manage the full gig lifecycle from publishing listings to fulfillment, upsells, and post-delivery reviews.',
    features: [
      {
        name: 'Gig builder',
        description:
          'Design irresistible gig pages with tiered pricing, add-ons, gallery media, and conversion-tested copy.',
        bulletPoints: [
          'Freelancer banner creator with dynamic call-to-actions.',
          'Preview modes for desktop, tablet, and mobile experiences.',
        ],
      },
      {
        name: 'Order pipeline',
        description:
          'Monitor incoming orders, qualification forms, kickoff calls, and delivery status from inquiry to completion.',
        bulletPoints: [
          'Centralized command board tracking inquiries through qualification, kickoff scheduling, production, delivery, and wrap-up stages.',
          'Automated requirement forms, intake questionnaires, and dynamic revision workflows that plug directly into each order.',
          'Escrow release checkpoints gated by milestone approvals, client CSAT scores, and delivery confirmation receipts.',
        ],
      },
      {
        name: 'Client success automation',
        description:
          'Trigger onboarding sequences, educational drip emails, testimonials, and referral programs automatically.',
        bulletPoints: [
          'Smart nudges for review requests post-delivery.',
          'Affiliate and referral tracking per gig.',
        ],
      },
      {
        name: 'Catalog insights',
        description:
          'See conversion rates, top-performing gig bundles, repeat clients, and cross-sell opportunities at a glance.',
        bulletPoints: [
          'Margin calculator factoring software costs and subcontractors.',
          'Heatmaps of search keywords driving gig impressions.',
        ],
      },
    ],
  },
  {
    title: 'Finance, compliance, & reputation',
    description:
      'Get paid fast while staying compliant. Monitor cash flow, taxes, contracts, and reputation programs across clients.',
    features: [
      {
        name: 'Finance control tower',
        description:
          'Revenue breakdowns, tax-ready exports, expense tracking, and smart savings goals for benefits or downtime.',
        bulletPoints: [
          'Split payouts between teammates or subcontractors instantly.',
          'Predictive forecasts for retainers vs. one-off gigs.',
        ],
      },
      {
        name: 'Contract & compliance locker',
        description:
          'Store MSAs, NDAs, intellectual property agreements, and compliance attestations with e-sign audit logs.',
        bulletPoints: [
          'Automated reminders for renewals and insurance certificates.',
          'Localization for GDPR, SOC2, and freelancer classifications.',
        ],
      },
      {
        name: 'Reputation engine',
        description:
          'Capture testimonials, publish success stories, and display verified metrics such as on-time delivery and CSAT.',
        bulletPoints: [
          'Custom badges and banners for featured freelancer programs.',
          'Shareable review widgets for external websites.',
        ],
      },
      {
        name: 'Support & dispute desk',
        description:
          'Resolve client concerns, manage escalations, and collaborate with Gigvora support for smooth resolutions.',
        bulletPoints: [
          'Conversation transcripts linked back to gig orders.',
          'Resolution playbooks to keep satisfaction high.',
        ],
      },
    ],
  },
  {
    title: 'Growth, partnerships, & skills',
    description:
      'Scale your business with targeted marketing, agency partnerships, continuous learning, and community mentoring.',
    features: [
      {
        name: 'Pipeline CRM',
        description:
          'Track leads, proposals, follow-ups, and cross-selling campaigns separate from gig orders.',
        bulletPoints: [
          'Kanban views by industry, retainer size, or probability.',
          'Proposal templates with case studies and ROI calculators.',
        ],
      },
      {
        name: 'Agency alliance manager',
        description:
          'Collaborate with agencies, share resource calendars, negotiate revenue splits, and join pods for large engagements.',
        bulletPoints: [
          'Rate card sharing with version history and approvals.',
          'Resource heatmaps showing bandwidth across weeks.',
        ],
      },
      {
        name: 'Learning and certification hub',
        description:
          'Access curated courses, peer mentoring sessions, and skill gap diagnostics tied to your service lines.',
        bulletPoints: [
          'Certification tracker with renewal reminders.',
          'AI recommendations for new service offerings.',
        ],
      },
      {
        name: 'Community spotlight',
        description:
          'Showcase contributions, speaking engagements, and open-source work with branded banners and social share kits.',
        bulletPoints: [
          'Automated newsletter features for top-performing freelancers.',
          'Personalized marketing assets ready for social channels.',
        ],
      },
    ],
  },
];

const DEFAULT_FREELANCER_ID = 101;
const DEFAULT_LOOKBACK_DAYS = 120;

const PIPELINE_STAGE_OPTIONS = [
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'kickoff_scheduled', label: 'Kickoff scheduled' },
  { value: 'production', label: 'Production' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PIPELINE_STAGE_LABELS = PIPELINE_STAGE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const PIPELINE_COLUMNS = [
  {
    key: 'inquiry',
    title: 'Inquiry intake',
    description: 'New inquiries awaiting qualification.',
    stages: ['inquiry'],
    accent: 'border-slate-200',
  },
  {
    key: 'qualification',
    title: 'Qualification',
    description: 'Requirement forms and scoping.',
    stages: ['qualification'],
    accent: 'border-amber-200',
  },
  {
    key: 'kickoff_scheduled',
    title: 'Kickoff prep',
    description: 'Kickoff calls and onboarding.',
    stages: ['kickoff_scheduled'],
    accent: 'border-blue-200',
  },
  {
    key: 'production',
    title: 'Production',
    description: 'Active delivery and collaboration.',
    stages: ['production'],
    accent: 'border-indigo-200',
  },
  {
    key: 'delivery',
    title: 'Delivery & approvals',
    description: 'Final assets, revisions, and sign-off.',
    stages: ['delivery'],
    accent: 'border-emerald-200',
  },
  {
    key: 'completed',
    title: 'Completed',
    description: 'Delivered and closed.',
    stages: ['completed'],
    accent: 'border-slate-200',
  },
  {
    key: 'on_hold',
    title: 'On hold / cancelled',
    description: 'Paused, on hold, or cancelled.',
    stages: ['on_hold', 'cancelled'],
    accent: 'border-rose-200',
  },
];

function formatCurrency(amount, currency = 'USD') {
  const numeric = Number(amount ?? 0);
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(numeric) >= 1000 ? 0 : 2,
  });
  return formatter.format(Number.isFinite(numeric) ? numeric : 0);
}

function requirementStatusLabel(status) {
  const labels = {
    draft: 'Draft',
    pending_client: 'Awaiting client',
    in_progress: 'Client in progress',
    submitted: 'Submitted',
    approved: 'Approved',
    needs_revision: 'Needs revision',
    archived: 'Archived',
  };
  return labels[status] ?? status;
}

function revisionStatusLabel(status) {
  const labels = {
    open: 'Open',
    in_progress: 'In progress',
    submitted: 'Awaiting review',
    approved: 'Approved',
    declined: 'Declined',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}

function getPipelineCount(summary, stages) {
  if (!summary?.pipeline) {
    return 0;
  }
  return stages.reduce((total, stage) => total + (summary.pipeline?.[stage] ?? 0), 0);
}

function OrderCard({
  order,
  onStageChange,
  onRequirementAdvance,
  onRevisionResolve,
  onReleaseEscrow,
  actionLoading,
}) {
  const latestRequirement = order.requirementForms?.[0] ?? null;
  const activeRevision = order.revisions?.find((revision) =>
    ['open', 'in_progress', 'submitted', 'declined'].includes(revision.status),
  );
  const nextCheckpoint = order.escrowCheckpoints?.find((checkpoint) =>
    ['pending_release', 'funded', 'held'].includes(checkpoint.status),
  );

  const requirementKey = latestRequirement ? `${order.id}:${latestRequirement.id}` : null;
  const revisionKey = activeRevision ? `${order.id}:${activeRevision.id}` : null;
  const checkpointKey = nextCheckpoint ? `${order.id}:${nextCheckpoint.id}` : null;

  const loadingStage = actionLoading?.type === 'stage' && actionLoading.id === order.id;
  const loadingRequirement = actionLoading?.type === 'requirement' && actionLoading.id === requirementKey;
  const loadingRevision = actionLoading?.type === 'revision' && actionLoading.id === revisionKey;
  const loadingEscrow = actionLoading?.type === 'escrow' && actionLoading.id === checkpointKey;

  let requirementAction = null;
  if (latestRequirement) {
    if (['pending_client', 'in_progress', 'needs_revision'].includes(latestRequirement.status)) {
      requirementAction = { nextStatus: 'submitted', label: 'Mark requirements submitted' };
    } else if (latestRequirement.status === 'submitted') {
      requirementAction = { nextStatus: 'approved', label: 'Approve requirements' };
    }
  }

  let revisionAction = null;
  if (activeRevision && ['open', 'in_progress', 'submitted', 'declined'].includes(activeRevision.status)) {
    revisionAction = { nextStatus: 'approved', label: 'Mark revision approved' };
  }

  let escrowAction = null;
  if (nextCheckpoint) {
    escrowAction = {
      nextStatus: 'released',
      label: `Release ${formatCurrency(nextCheckpoint.amount, nextCheckpoint.currency)}`,
    };
  }

  const csatScore = order.csatScore != null ? Number(order.csatScore).toFixed(2) : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{order.gigTitle}</h3>
          <p className="text-xs text-slate-500">
            {order.clientName}
            {order.clientOrganization ? ` · ${order.clientOrganization}` : ''}
          </p>
          {order.orderNumber ? (
            <p className="text-[10px] uppercase tracking-wide text-slate-400">#{order.orderNumber}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">Value</p>
          <p className="text-sm font-semibold text-slate-800">
            {formatCurrency(order.valueAmount, order.valueCurrency)}
          </p>
          <p className="text-[11px] text-slate-500">
            {PIPELINE_STAGE_LABELS[order.pipelineStage] ?? order.pipelineStage}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {order.deliveryDueAt ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <ClockIcon className="h-4 w-4 text-blue-500" />
            {`Delivery ${formatRelativeTime(order.deliveryDueAt)}`}
          </span>
        ) : null}
        {order.kickoffStatus === 'scheduled' && order.kickoffScheduledAt ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">
            <PhoneArrowDownLeftIcon className="h-4 w-4" />
            {formatAbsolute(order.kickoffScheduledAt, { timeStyle: 'short' })}
          </span>
        ) : null}
        {order.metrics?.pendingRequirements ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
            <ExclamationCircleIcon className="h-4 w-4" />
            {`${order.metrics.pendingRequirements} requirement${order.metrics.pendingRequirements > 1 ? 's' : ''} pending`}
          </span>
        ) : null}
        {order.metrics?.openRevisions ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-2 py-0.5 text-fuchsia-700">
            <CheckCircleIcon className="h-4 w-4" />
            {`${order.metrics.openRevisions} revision${order.metrics.openRevisions > 1 ? 's' : ''} open`}
          </span>
        ) : null}
        {order.metrics?.outstandingEscrow ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
            <ShieldCheckIcon className="h-4 w-4" />
            {`${formatCurrency(order.metrics.outstandingEscrow, order.escrowCurrency)} in escrow`}
          </span>
        ) : null}
        {csatScore ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
            <CheckCircleIcon className="h-4 w-4" />
            {`CSAT ${csatScore}`}
          </span>
        ) : null}
      </div>

      <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Next action</p>
        <p className="mt-1 leading-relaxed">
          {order.metrics?.nextAction ?? 'Stay close to the client and keep milestones moving.'}
        </p>
      </div>

      {latestRequirement ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Requirement form</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {requirementStatusLabel(latestRequirement.status)}
            </span>
          </div>
          {latestRequirement.requestedAt ? (
            <p className="mt-1 text-[11px] text-slate-500">
              Requested {formatRelativeTime(latestRequirement.requestedAt)}
            </p>
          ) : null}
          {requirementAction ? (
            <button
              type="button"
              onClick={() => onRequirementAdvance(order.id, latestRequirement.id, requirementAction.nextStatus)}
              disabled={loadingRequirement}
              className="mt-2 inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingRequirement ? 'Updating…' : requirementAction.label}
            </button>
          ) : null}
        </div>
      ) : null}

      {activeRevision ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Revision #{activeRevision.revisionNumber}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {revisionStatusLabel(activeRevision.status)}
            </span>
          </div>
          {activeRevision.summary ? (
            <p className="mt-1 text-[11px] text-slate-500">{activeRevision.summary}</p>
          ) : null}
          {revisionAction ? (
            <button
              type="button"
              onClick={() => onRevisionResolve(order.id, activeRevision.id, revisionAction.nextStatus)}
              disabled={loadingRevision}
              className="mt-2 inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingRevision ? 'Updating…' : revisionAction.label}
            </button>
          ) : null}
        </div>
      ) : null}

      {nextCheckpoint ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">{nextCheckpoint.label}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {nextCheckpoint.status.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {formatCurrency(nextCheckpoint.amount, nextCheckpoint.currency)} gated by{' '}
            {nextCheckpoint.approvalRequirement ?? 'client approval'}
          </p>
          {escrowAction ? (
            <button
              type="button"
              onClick={() => onReleaseEscrow(order.id, nextCheckpoint.id, escrowAction.nextStatus)}
              disabled={loadingEscrow}
              className="mt-2 inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingEscrow ? 'Releasing…' : escrowAction.label}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2 text-xs text-slate-600">
        <label className="font-semibold uppercase tracking-wide text-slate-500">Pipeline stage</label>
        <select
          value={order.pipelineStage}
          onChange={(event) => {
            const nextStage = event.target.value;
            if (nextStage !== order.pipelineStage) {
              onStageChange(order.id, nextStage);
            }
          }}
          disabled={loadingStage}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {PIPELINE_STAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const profile = {
  name: 'Riley Morgan',
  role: 'Lead Brand & Product Designer',
  initials: 'RM',
  status: 'Top-rated freelancer',
  badges: ['Verified Pro', 'Gigvora Elite'],
  metrics: [
    { label: 'Active projects', value: '6' },
    { label: 'Gigs fulfilled', value: '148' },
    { label: 'Avg. CSAT', value: '4.9/5' },
    { label: 'Monthly revenue', value: '$18.4k' },
  ],
};

const availableDashboards = ['freelancer', 'user', 'agency'];

export default function FreelancerDashboardPage() {
  const [selectedMenuKey, setSelectedMenuKey] = useState('overview');
  const [pipelineState, setPipelineState] = useState({ data: null, loading: false, error: null });
  const [feedback, setFeedback] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [newOrderDraft, setNewOrderDraft] = useState({
    clientName: '',
    gigTitle: '',
    valueAmount: '',
    valueCurrency: 'USD',
    deliveryDueAt: '',
  });

  const isPipelineView = selectedMenuKey === 'order-pipeline';

  const loadPipeline = useCallback(async () => {
    setPipelineState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const data = await fetchFreelancerOrderPipeline({
        freelancerId: DEFAULT_FREELANCER_ID,
        lookbackDays: DEFAULT_LOOKBACK_DAYS,
      });
      setPipelineState({ data, loading: false, error: null });
    } catch (error) {
      setPipelineState((previous) => ({
        data: previous.data ?? null,
        loading: false,
        error: error.message ?? 'Unable to load order pipeline.',
      }));
    }
  }, []);

  useEffect(() => {
    if (isPipelineView) {
      loadPipeline();
    }
  }, [isPipelineView, loadPipeline]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }
    const timeout = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const summary = pipelineState.data?.summary ?? null;
  const orders = pipelineState.data?.orders ?? [];

  const menuSections = useMemo(() => {
    return BASE_MENU_SECTIONS.map((section) => {
      if (section.label !== 'Gig commerce') {
        return section;
      }
      return {
        ...section,
        items: section.items.map((item) => {
          if (item.key !== 'order-pipeline') {
            return item;
          }
          const openOrders = summary?.totals?.openOrders ?? 0;
          const pendingForms = summary?.requirementForms?.pending ?? 0;
          const outstandingEscrow = summary?.escrow?.amounts?.outstanding ?? 0;
          const currency = summary?.escrow?.amounts?.currency ?? summary?.totals?.currency ?? 'USD';
          return {
            ...item,
            description: `${openOrders} active orders · ${pendingForms} requirement forms pending · ${formatCurrency(outstandingEscrow, currency)} awaiting release`,
            tags: ['automations', 'escrow', 'revisions'],
          };
        }),
      };
    });
  }, [summary]);

  const capabilitySections = useMemo(() => CAPABILITY_SECTIONS, []);

  const handleRefresh = useCallback(() => {
    loadPipeline();
  }, [loadPipeline]);

  const handleCreateOrder = useCallback(
    async (event) => {
      event.preventDefault();
      if (!newOrderDraft.clientName || !newOrderDraft.gigTitle) {
        setFeedback({ type: 'error', message: 'Client name and gig title are required.' });
        return;
      }
      setActionLoading({ type: 'create' });
      try {
        await createFreelancerOrder({
          ...newOrderDraft,
          freelancerId: DEFAULT_FREELANCER_ID,
          valueAmount: newOrderDraft.valueAmount || 0,
          valueCurrency: newOrderDraft.valueCurrency || 'USD',
        });
        setFeedback({ type: 'success', message: 'Order created and added to the pipeline.' });
        setShowNewOrderForm(false);
        setNewOrderDraft({
          clientName: '',
          gigTitle: '',
          valueAmount: '',
          valueCurrency: 'USD',
          deliveryDueAt: '',
        });
        await loadPipeline();
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to create order.' });
      } finally {
        setActionLoading(null);
      }
    },
    [loadPipeline, newOrderDraft],
  );

  const handleStageChange = useCallback(
    async (orderId, pipelineStage) => {
      setActionLoading({ type: 'stage', id: orderId });
      try {
        await updateFreelancerOrder(orderId, { pipelineStage });
        setFeedback({ type: 'success', message: 'Pipeline stage updated.' });
        await loadPipeline();
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to update stage.' });
      } finally {
        setActionLoading(null);
      }
    },
    [loadPipeline],
  );

  const handleRequirementAdvance = useCallback(
    async (orderId, formId, status) => {
      const key = `${orderId}:${formId}`;
      setActionLoading({ type: 'requirement', id: key });
      try {
        await updateOrderRequirement(orderId, formId, { status });
        setFeedback({ type: 'success', message: 'Requirement workflow updated.' });
        await loadPipeline();
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to update requirement.' });
      } finally {
        setActionLoading(null);
      }
    },
    [loadPipeline],
  );

  const handleRevisionResolve = useCallback(
    async (orderId, revisionId, status) => {
      const key = `${orderId}:${revisionId}`;
      setActionLoading({ type: 'revision', id: key });
      try {
        await updateOrderRevision(orderId, revisionId, { status });
        setFeedback({ type: 'success', message: 'Revision updated.' });
        await loadPipeline();
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to update revision.' });
      } finally {
        setActionLoading(null);
      }
    },
    [loadPipeline],
  );

  const handleEscrowRelease = useCallback(
    async (orderId, checkpointId, status) => {
      const key = `${orderId}:${checkpointId}`;
      setActionLoading({ type: 'escrow', id: key });
      try {
        await updateEscrowCheckpoint(orderId, checkpointId, { status });
        setFeedback({ type: 'success', message: 'Escrow checkpoint updated.' });
        await loadPipeline();
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to update escrow checkpoint.' });
      } finally {
        setActionLoading(null);
      }
    },
    [loadPipeline],
  );

  const summaryCards = useMemo(() => {
    const currency = summary?.totals?.currency ?? 'USD';
    const escrowCurrency = summary?.escrow?.amounts?.currency ?? currency;
    return [
      {
        label: 'Active orders',
        value: summary?.totals?.openOrders ?? 0,
        sublabel: `${summary?.pipeline?.production ?? 0} in production`,
        icon: CurrencyDollarIcon,
      },
      {
        label: 'Pipeline value',
        value: formatCurrency(summary?.totals?.openValue ?? 0, currency),
        sublabel: `${formatCurrency(summary?.totals?.completedValue ?? 0, currency)} delivered YTD`,
        icon: CurrencyDollarIcon,
      },
      {
        label: 'Escrow outstanding',
        value: formatCurrency(summary?.escrow?.amounts?.outstanding ?? 0, escrowCurrency),
        sublabel: `${summary?.escrow?.counts?.pendingRelease ?? 0} checkpoints pending`,
        icon: ShieldCheckIcon,
      },
      {
        label: 'Requirements pending',
        value: summary?.requirementForms?.pending ?? 0,
        sublabel: `${summary?.revisions?.active ?? 0} active revisions`,
        icon: ExclamationCircleIcon,
      },
    ];
  }, [summary]);

  const renderedSections = isPipelineView ? [] : capabilitySections;

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer Operations HQ"
      subtitle="Service business cockpit"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      menuSections={menuSections}
      sections={renderedSections}
      profile={profile}
      availableDashboards={availableDashboards}
      onMenuItemSelect={(key) => setSelectedMenuKey(key)}
      activeMenuItemKey={selectedMenuKey}
    >
      {isPipelineView ? (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Order pipeline</h2>
              <p className="text-sm text-slate-600">
                Monitor requirements intake, kickoff prep, delivery workflows, revisions, and escrow releases from one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={pipelineState.loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowPathIcon className={`h-4 w-4 ${pipelineState.loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setShowNewOrderForm((previous) => !previous)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                {showNewOrderForm ? 'Cancel' : 'New order'}
              </button>
            </div>
          </div>

          {feedback ? (
            <div
              className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
                feedback.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              <div>{feedback.message}</div>
              <button type="button" onClick={() => setFeedback(null)} className="text-xs font-semibold uppercase tracking-wide">
                Dismiss
              </button>
            </div>
          ) : null}

          {pipelineState.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {pipelineState.error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{card.value}</p>
                      <p className="text-xs text-slate-500">{card.sublabel}</p>
                    </div>
                    <span className="rounded-2xl bg-blue-50 p-2 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {showNewOrderForm ? (
            <form
              onSubmit={handleCreateOrder}
              className="space-y-4 rounded-3xl border border-blue-200 bg-blue-50/60 p-6 shadow-sm"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  Client name
                  <input
                    type="text"
                    value={newOrderDraft.clientName}
                    onChange={(event) =>
                      setNewOrderDraft((previous) => ({ ...previous, clientName: event.target.value }))
                    }
                    className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  Gig or project title
                  <input
                    type="text"
                    value={newOrderDraft.gigTitle}
                    onChange={(event) =>
                      setNewOrderDraft((previous) => ({ ...previous, gigTitle: event.target.value }))
                    }
                    className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  Order value
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newOrderDraft.valueAmount}
                    onChange={(event) =>
                      setNewOrderDraft((previous) => ({ ...previous, valueAmount: event.target.value }))
                    }
                    className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  Currency
                  <input
                    type="text"
                    value={newOrderDraft.valueCurrency}
                    onChange={(event) =>
                      setNewOrderDraft((previous) => ({ ...previous, valueCurrency: event.target.value.toUpperCase() }))
                    }
                    className="mt-1 uppercase rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    maxLength={3}
                  />
                </label>
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  Delivery due date
                  <input
                    type="date"
                    value={newOrderDraft.deliveryDueAt}
                    onChange={(event) =>
                      setNewOrderDraft((previous) => ({ ...previous, deliveryDueAt: event.target.value }))
                    }
                    className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={actionLoading?.type === 'create'}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading?.type === 'create' ? 'Saving…' : 'Create order'}
                </button>
                <p className="text-xs text-slate-500">
                  Orders start at the inquiry stage with automated requirement forms ready to send to your client.
                </p>
              </div>
            </form>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {PIPELINE_COLUMNS.map((column) => {
              const columnOrders = orders.filter((order) => column.stages.includes(order.pipelineStage));
              const totalInColumn = getPipelineCount(summary, column.stages);
              return (
                <div
                  key={column.key}
                  className={`flex h-full flex-col rounded-3xl border ${column.accent} bg-white/80 shadow-sm`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{column.title}</p>
                      <p className="text-xs text-slate-500">{column.description}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {totalInColumn}
                    </span>
                  </div>
                  <div className="flex-1 space-y-3 overflow-auto px-5 py-4">
                    {columnOrders.length ? (
                      columnOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onStageChange={handleStageChange}
                          onRequirementAdvance={handleRequirementAdvance}
                          onRevisionResolve={handleRevisionResolve}
                          onReleaseEscrow={handleEscrowRelease}
                          actionLoading={actionLoading}
                        />
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                        No orders in this stage yet.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
