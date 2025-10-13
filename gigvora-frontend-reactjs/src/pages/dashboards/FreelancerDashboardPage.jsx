import { useMemo } from 'react';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import { fetchFreelancerFinanceInsights } from '../../services/finance.js';

const DEFAULT_FREELANCER_ID = 2;
import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AgencyCollaborationsPanel from '../../components/freelancer/AgencyCollaborationsPanel.jsx';
import { fetchFreelancerAgencyCollaborations } from '../../services/freelancerAgency.js';

const DEFAULT_FREELANCER_ID = Number.parseInt(import.meta.env.VITE_DEMO_FREELANCER_ID ?? '101', 10);

const baseMenuSections = [
import { useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import DataStatus from '../../components/DataStatus.jsx';
import TagInput from '../../components/TagInput.jsx';
import {
  fetchFreelancerProfileHub,
  saveFreelancerExpertiseAreas,
  saveFreelancerHeroBanners,
  saveFreelancerSuccessMetrics,
  saveFreelancerTestimonials,
} from '../../services/freelancerProfileHub.js';

const DEFAULT_FREELANCER_ID = 1;
const DEFAULT_AVAILABLE_DASHBOARDS = ['freelancer', 'user', 'agency'];

const EXPERTISE_STATUS_OPTIONS = [
  { value: 'live', label: 'Live' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'needs_decision', label: 'Needs decision' },
  { value: 'archived', label: 'Archived' },
];

const METRIC_TREND_OPTIONS = [
  { value: 'up', label: 'Trending up' },
  { value: 'steady', label: 'Steady' },
  { value: 'down', label: 'Trending down' },
];

const TESTIMONIAL_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const HERO_STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'testing', label: 'Testing' },
  { value: 'live', label: 'Live' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

const initialExpertiseDraft = {
  title: '',
  description: '',
  status: 'live',
  tags: [],
  recommendations: [],
};

const initialSuccessDraft = {
  label: '',
  value: '',
  delta: '',
  target: '',
  trend: 'steady',
};

const initialTestimonialDraft = {
  client: '',
  role: '',
  company: '',
  project: '',
  quote: '',
  status: 'draft',
};

const initialHeroDraft = {
  title: '',
  headline: '',
  audience: '',
  status: 'planned',
  ctaLabel: '',
  ctaUrl: '',
  gradient: '',
};

function formatStatus(value) {
  if (!value) return '';
  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function expertiseStatusStyles(status) {
  switch (status) {
    case 'live':
      return 'bg-emerald-100 text-emerald-700';
    case 'in_progress':
      return 'bg-amber-100 text-amber-700';
    case 'needs_decision':
      return 'bg-rose-100 text-rose-700';
    case 'archived':
    default:
      return 'bg-slate-200 text-slate-600';
  }
}

function testimonialStatusStyles(status) {
  switch (status) {
    case 'published':
      return 'bg-emerald-100 text-emerald-700';
    case 'scheduled':
      return 'bg-amber-100 text-amber-700';
    case 'draft':
      return 'bg-slate-200 text-slate-600';
    case 'archived':
    default:
      return 'bg-slate-200 text-slate-600';
  }
}

function heroStatusStyles(status) {
  switch (status) {
    case 'live':
      return 'bg-emerald-100 text-emerald-700';
    case 'testing':
      return 'bg-blue-100 text-blue-700';
    case 'paused':
      return 'bg-amber-100 text-amber-700';
    case 'archived':
      return 'bg-slate-200 text-slate-600';
    case 'planned':
    default:
      return 'bg-slate-100 text-slate-500';
  }
}

function tractionToneStyles(tone) {
  switch (tone) {
    case 'positive':
      return 'text-emerald-600';
    case 'negative':
      return 'text-rose-600';
    default:
      return 'text-slate-600';
  }
}

function metricTrendTextClasses(trend) {
  switch (trend) {
    case 'up':
      return 'text-emerald-600';
    case 'down':
      return 'text-rose-600';
    default:
      return 'text-slate-500';
  }
}

function buildMenuSections(summary = {}) {
  const retainerCount = summary.retainerCount ?? 0;
  const launchpadGigCount = summary.launchpadGigCount ?? 0;
  const heroBannersLive = summary.heroBannersLive ?? 0;
  const testimonialsPublished = summary.testimonialsPublished ?? 0;
  const expertiseLiveCount = summary.expertiseLiveCount ?? 0;
  const successMetricCount = summary.successMetricCount ?? 0;

  return [
    {
      label: 'Service delivery',
      items: [
        {
          name: 'Project workspace dashboard',
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
          description: `Monitor ${launchpadGigCount} launchpad gigs, delivery milestones, bundled services, and upsells.`,
          tags: ['gig catalog'],
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
          description: `Update ${expertiseLiveCount} live expertise themes, ${successMetricCount} success metrics, and ${heroBannersLive} hero banners with ${testimonialsPublished} published testimonials.`,
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
}

function mapExpertiseForUpdate(area, index) {
  return {
    id: area.id,
    slug: area.slug,
    title: area.title,
    description: area.description,
    status: area.status,
    tags: area.tags,
    recommendations: area.recommendations,
    traction: area.traction,
    healthScore: area.healthScore,
    displayOrder: area.displayOrder ?? index,
  };
}

function mapMetricForUpdate(metric, index) {
  return {
    id: metric.id,
    metricKey: metric.metricKey,
    label: metric.label,
    value: metric.value,
    numericValue: metric.numericValue,
    delta: metric.delta,
    target: metric.target,
    trend: metric.trend,
    breakdown: metric.breakdown,
    periodStart: metric.period?.start ?? null,
    periodEnd: metric.period?.end ?? null,
    displayOrder: metric.displayOrder ?? index,
  };
}

function mapTestimonialForUpdate(testimonial, index) {
  return {
    id: testimonial.id,
    testimonialKey: testimonial.testimonialKey,
    client: testimonial.client,
    role: testimonial.role,
    company: testimonial.company,
    project: testimonial.project,
    quote: testimonial.quote,
    status: testimonial.status,
    metrics: testimonial.metrics ?? [],
    isFeatured: testimonial.isFeatured,
    nextAction: testimonial.nextAction,
    curationNotes: testimonial.curationNotes,
    requestedAt: testimonial.requestedAt ?? null,
    recordedAt: testimonial.recordedAt ?? null,
    publishedAt: testimonial.publishedAt ?? null,
    displayOrder: testimonial.displayOrder ?? index,
  };
}

function mapHeroForUpdate(banner, index) {
  return {
    id: banner.id,
    bannerKey: banner.bannerKey,
    title: banner.title,
    headline: banner.headline,
    audience: banner.audience,
    status: banner.status,
    cta: banner.cta ?? { label: null, url: null },
    gradient: banner.gradient,
    metrics: banner.metrics ?? [],
    experimentId: banner.experimentId,
    backgroundImageUrl: banner.backgroundImageUrl,
    conversionTarget: banner.conversionTarget,
    lastLaunchedAt: banner.lastLaunchedAt ?? null,
    displayOrder: banner.displayOrder ?? index,
  };
}
const capabilitySections = [
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import {
  fetchFreelancerDashboard,
  createFreelancerGig,
  updateFreelancerGig,
  publishFreelancerGig,
} from '../../services/freelancer.js';

const FREELANCER_ID = 1;
const availableDashboards = ['freelancer', 'user', 'agency'];

const FALLBACK_MENU = [
  {
    label: 'Gig publishing',
    items: [
      {
        name: 'Post a gig',
        description: 'Launch new services with pricing matrices, calendars, and banners.',
        href: '#gig-publisher',
      },
      {
        name: 'Pricing matrix',
        description: 'Design compelling tiered packages with highlights and delivery windows.',
        href: '#pricing-matrix',
      },
      {
        name: 'Availability calendar',
        description: 'Control your booking windows and readiness buffer in one place.',
        href: '#availability-calendar',
      },
      {
        name: 'Marketing banner',
        description: 'Craft a premium hero banner and headline for conversions.',
        href: '#marketing-banner',
      },
    ],
  },
];

const FALLBACK_BLUEPRINT = {
  title: 'Brand Identity Accelerator',
  tagline: 'Launch-ready visual systems in ten days',
  category: 'Branding & Identity',
  niche: 'Venture-backed startups',
  deliveryModel: 'Hybrid sprint with async reviews',
  outcomePromise: 'Investor-ready identity kit, launch assets, and usage playbook.',
  heroAccent: '#4f46e5',
  targetMetric: 12,
  status: 'draft',
  visibility: 'private',
  packages: [
    {
      key: 'starter',
      name: 'Launch Lite',
      priceAmount: 450,
      priceCurrency: 'USD',
      deliveryDays: 5,
      revisionLimit: 1,
      highlights: ['Discovery workshop', 'Two identity concepts', 'Primary logo lockup'],
      recommendedFor: 'First-time founders preparing for launch',
      isPopular: false,
    },
    {
      key: 'growth',
      name: 'Growth Lab',
      priceAmount: 780,
      priceCurrency: 'USD',
      deliveryDays: 8,
      revisionLimit: 2,
      highlights: ['Logo suite & icon set', 'Color & typography system', 'Brand voice guardrails'],
      recommendedFor: 'Seed to Series A teams needing polish',
      isPopular: true,
    },
    {
      key: 'elite',
      name: 'Elite Experience',
      priceAmount: 1280,
      priceCurrency: 'USD',
      deliveryDays: 12,
      revisionLimit: 3,
      highlights: ['Brand guidelines', 'Social & deck templates', 'Motion starter kit'],
      recommendedFor: 'Scale-ups and venture studios',
      isPopular: false,
    },
  ],
  addOns: [
    {
      key: 'social-kit',
      name: 'Social story kit',
      priceAmount: 220,
      priceCurrency: 'USD',
      description: 'Ten editable launch templates for Instagram, LinkedIn, and TikTok.',
      isActive: true,
    },
    {
      key: 'landing-page',
      name: 'Landing page handoff',
      priceAmount: 320,
      priceCurrency: 'USD',
      description: 'Hero, pricing, and product sections prepped for Webflow or Framer.',
      isActive: true,
    },
  ],
  availability: {
    timezone: 'America/New_York',
    leadTimeDays: 2,
    slots: [],
  },
  banner: {
    headline: 'Standout branding in 10 days',
    subheadline: 'Signature identities for venture-backed founders',
    callToAction: 'Book discovery call',
    badge: 'Gigvora Elite',
    accentColor: '#4f46e5',
    backgroundStyle: 'aurora',
    testimonial: '“Riley helped us close our seed round with a pitch-perfect identity.”',
    testimonialAuthor: 'Nova Chen, Lumen Labs',
    waitlistEnabled: true,
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import {
  ClientPortalSummary,
  ClientPortalTimeline,
  ClientPortalScopeSummary,
  ClientPortalDecisionLog,
  ClientPortalInsightWidgets,
} from '../../components/clientPortal/index.js';
import { fetchClientPortalDashboard } from '../../services/clientPortals.js';

const DEFAULT_MENU_STRUCTURE = [
import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import LearningHubSection from '../../components/dashboard/LearningHubSection.jsx';
import useLearningHub from '../../hooks/useLearningHub.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import projectsService from '../../services/projects.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const HEALTH_STYLES = {
  on_track: {
    label: 'On track',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  at_risk: {
    label: 'At risk',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  critical: {
    label: 'Critical',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
};

const SPRINT_STATUS_MAP = {
  planned: { label: 'Planned', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  in_progress: { label: 'In progress', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  blocked: { label: 'Blocked', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  completed: { label: 'Completed', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

const DEPENDENCY_STATUS_MAP = {
  pending: { label: 'Pending', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  in_progress: { label: 'In progress', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  blocked: { label: 'Blocked', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  done: { label: 'Resolved', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

const RISK_STATUS_MAP = {
  open: { label: 'Open', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  monitoring: { label: 'Monitoring', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  mitigated: { label: 'Mitigated', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  closed: { label: 'Closed', className: 'border-slate-200 bg-slate-50 text-slate-600' },
};

const BILLING_STATUS_MAP = {
  upcoming: { label: 'Upcoming', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  invoiced: { label: 'Invoiced', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  paid: { label: 'Paid', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  overdue: { label: 'Overdue', className: 'border-rose-200 bg-rose-50 text-rose-700' },
};

const HEALTH_OPTIONS = Object.entries(HEALTH_STYLES).map(([value, config]) => ({ value, label: config.label }));
const SPRINT_STATUS_OPTIONS = Object.entries(SPRINT_STATUS_MAP).map(([value, config]) => ({ value, label: config.label }));
const DEPENDENCY_STATUS_OPTIONS = Object.entries(DEPENDENCY_STATUS_MAP).map(([value, config]) => ({ value, label: config.label }));
const RISK_STATUS_OPTIONS = Object.entries(RISK_STATUS_MAP).map(([value, config]) => ({ value, label: config.label }));
const BILLING_STATUS_OPTIONS = Object.entries(BILLING_STATUS_MAP).map(([value, config]) => ({ value, label: config.label }));

function StatusBadge({ status, map }) {
  const normalized = typeof status === 'string' ? status.toLowerCase() : '';
  const config = map[normalized] ?? {
    label: normalized || 'Unknown',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function MetricTile({ title, value, subtitle, tone = 'slate' }) {
  const toneStyles = {
    slate: 'border-slate-200 bg-white/80 text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  };
  const toneClass = toneStyles[tone] ?? toneStyles.slate;
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

function formatCurrency(amount, currency) {
  if (amount == null) {
    return 'TBC';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `${amount} ${currency ?? ''}`.trim();
  }
}

function formatPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  const clamped = Math.max(0, Math.min(100, Math.round(numeric)));
  return `${clamped}%`;
}

function toFormState(blueprint) {
  if (!blueprint) {
    return null;
  }
  return {
    summary: blueprint.summary ?? '',
    methodology: blueprint.methodology ?? '',
    governanceModel: blueprint.governanceModel ?? '',
    sprintCadence: blueprint.sprintCadence ?? '',
    programManager: blueprint.programManager ?? '',
    healthStatus: blueprint.healthStatus ?? 'on_track',
    startDate: blueprint.startDate ?? null,
    endDate: blueprint.endDate ?? null,
    lastReviewedAt: blueprint.lastReviewedAt ?? null,
    metadata: blueprint.metadata ?? {},
    sprints: Array.isArray(blueprint.sprints) ? blueprint.sprints.map((item) => ({ ...item })) : [],
    dependencies: Array.isArray(blueprint.dependencies) ? blueprint.dependencies.map((item) => ({ ...item })) : [],
    risks: Array.isArray(blueprint.risks) ? blueprint.risks.map((item) => ({ ...item })) : [],
    billingCheckpoints: Array.isArray(blueprint.billingCheckpoints)
      ? blueprint.billingCheckpoints.map((item) => ({ ...item }))
      : [],
  };
}

export default function FreelancerDashboardPage() {
  const [blueprints, setBlueprints] = useState([]);
  const [listError, setListError] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [blueprintData, setBlueprintData] = useState(null);
  const [formState, setFormState] = useState(null);
  const [blueprintError, setBlueprintError] = useState(null);
  const [loadingBlueprint, setLoadingBlueprint] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadBlueprintList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const response = await projectsService.listProjectBlueprints();
      const items = Array.isArray(response?.blueprints) ? response.blueprints : [];
      setBlueprints(items);
      if (items.length) {
        const defaultProjectId = items[0]?.project?.id ?? items[0]?.blueprint?.projectId ?? null;
        setSelectedProjectId((current) => current ?? defaultProjectId);
      }
    } catch (error) {
      setListError(error);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadBlueprintDetail = useCallback(async (projectId) => {
    if (!projectId) {
      setBlueprintData(null);
      setFormState(null);
      return;
    }
    setLoadingBlueprint(true);
    setBlueprintError(null);
    try {
      const response = await projectsService.fetchProjectBlueprint(projectId);
      setBlueprintData(response);
      setFormState(toFormState(response?.blueprint ?? null));
    } catch (error) {
      setBlueprintError(error);
      setFormState(null);
    } finally {
      setLoadingBlueprint(false);
import { useMemo } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import useFreelancerPurchasedGigsDashboard from '../../hooks/useFreelancerPurchasedGigsDashboard.js';

const defaultMenuSections = [
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { fetchGigManagerSnapshot } from '../../services/gigManager.js';

const FREELANCER_USER_ID = 2;

const BADGE_CLASS_MAP = {
  healthy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  attention: 'border-amber-200 bg-amber-50 text-amber-700',
  waiting: 'border-sky-200 bg-sky-50 text-sky-700',
  idle: 'border-slate-200 bg-slate-100 text-slate-600',
};

const numberFormatter = new Intl.NumberFormat('en-US');

const CAPABILITY_SECTIONS = [
import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import WorkspaceTemplatesSection from '../../components/WorkspaceTemplatesSection.jsx';
import { fetchWorkspaceTemplates } from '../../services/workspaceTemplates.js';

const BASE_MENU_SECTIONS = [
  {
    label: 'Service delivery',
    items: [
      {
        name: 'Workspace templates',
        description: 'Industry-specific playbooks, requirement questionnaires, and automated onboarding flows.',
        tags: ['templates', 'automation'],
        href: '#workspace-templates',
      },
      {
        name: 'Project workspace dashboard',
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
    title: 'Gig commerce operations',
    description:
      'Manage the full gig lifecycle from publishing listings to fulfillment, upsells, and catalog analytics across your workspace.',
    meta: 'Automation ready',
    features: [
      {
        name: 'Purchased gigs',
        description: 'Track incoming orders, requirements, revisions, and payouts.',
        href: '#purchased-gigs',
        name: 'Pipeline command center',
        description:
          'Monitor order stages, SLA breaches, revision loops, and risk alerts in a single control plane across gigs and clients.',
        bulletPoints: [
          'Surface overdue milestones, blocked owners, and waiting-on-client approvals automatically.',
          'Escalate to client portals or support with one-click triggers and templated playbooks.',
        ],
        callout: 'SLA intelligence',
      },
      {
        name: 'Bundled services engine',
        description:
          'Design, price, and iterate bundled services with attach-rate telemetry, experimentation sandboxes, and featured placements.',
        bulletPoints: [
          'Version bundles safely with staged rollouts and A/B testing.',
          'Audit profitability with hard costs, subcontractors, and blended rates baked in.',
        ],
      },
      {
        name: 'Agency collaborations',
        description: 'Manage invitations from agencies, share rate cards, and negotiate retainers.',
        href: '#agency-collaborations',
        name: 'Upsell automation',
        description:
          'Trigger contextual upsells on milestones, status changes, or client behavior with automation lanes connected to CRM and comms.',
        bulletPoints: [
          'Multi-channel delivery via email, in-app nudges, and calendar scheduling.',
          'Measure conversion, revenue lift, and experiment health across playbooks.',
        ],
        callout: 'Playbook studio',
      },
      {
        name: 'Finance & insights',
        description: 'Loading finance insights…',
        href: '#finance-insights',
        icon: CurrencyDollarIcon,
      },
    ],
  },
];

const METRIC_ICON_MAP = {
  month_to_date_revenue: CurrencyDollarIcon,
  cash_available_for_payout: BanknotesIcon,
  outstanding_invoices: ClipboardDocumentListIcon,
  net_margin: ChartBarIcon,
};

function toNumber(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(amount, currency = 'USD', { compact = true, maximumFractionDigits } = {}) {
  const numeric = toNumber(amount);
  if (numeric == null) {
    return '—';
  }
  const defaultMaximum = numeric >= 1000 ? 1 : 0;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: maximumFractionDigits ?? defaultMaximum,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: compact ? 'short' : undefined,
  });
  return formatter.format(numeric);
}

function formatPercentageValue(value, { decimals } = {}) {
  const numeric = toNumber(value);
  if (numeric == null) {
    return '—';
  }
  const fractionDigits = decimals ?? (Number.isInteger(numeric) ? 0 : 1);
  return `${numeric.toFixed(fractionDigits)}%`;
}

function resolveTrend(metric) {
  if (!metric) {
    return 'neutral';
  }
  if (metric.trend) {
    return metric.trend;
  }
  const change = toNumber(metric.changeValue);
  if (change == null) {
    return 'neutral';
  }
  if (change > 0) {
    return 'up';
  }
  if (change < 0) {
    return 'down';
  }
  return 'neutral';
}

function formatMetricValue(metric) {
  if (!metric) {
    return '—';
  }
  switch (metric.valueUnit) {
    case 'currency':
      return formatCurrency(metric.value, metric.currencyCode ?? 'USD');
    case 'percentage':
      return formatPercentageValue(metric.value);
    case 'ratio': {
      const numeric = toNumber(metric.value);
      if (numeric == null) {
        return '—';
      }
      return formatPercentageValue(numeric * 100, { decimals: 1 });
    }
    case 'count':
    default: {
      const numeric = toNumber(metric.value);
      return numeric == null ? '—' : numeric.toLocaleString('en-US');
    }
  }
}

function formatChange(metric) {
  if (!metric) {
    return null;
  }
  const numeric = toNumber(metric.changeValue);
  if (numeric == null || numeric === 0) {
    return null;
  }
  const sign = numeric > 0 ? '+' : '-';
  const absolute = Math.abs(numeric);
  switch (metric.changeUnit) {
    case 'currency':
      return `${sign}${formatCurrency(absolute, metric.currencyCode ?? 'USD', { compact: true })}`;
    case 'percentage': {
      const fractionDigits = Number.isInteger(absolute) ? 0 : 1;
      return `${sign}${absolute.toFixed(fractionDigits)}%`;
    }
    case 'percentage_points': {
      const fractionDigits = Number.isInteger(absolute) ? 0 : 1;
      return `${sign}${absolute.toFixed(fractionDigits)} pts`;
    }
    case 'ratio': {
      const percent = absolute * 100;
      const fractionDigits = percent < 1 ? 2 : 1;
      return `${sign}${percent.toFixed(fractionDigits)}%`;
    }
    case 'count':
    default:
      return `${sign}${absolute.toLocaleString('en-US')}`;
  }
}

function buildFinanceMenuDescription(financeData, loading) {
  if (loading && !financeData) {
    return 'Loading finance insights…';
  }
  if (!financeData) {
    return 'Monitor revenue analytics, payouts, tax filings, and profitability in one view.';
  }
  const summaryMetrics = Array.isArray(financeData.summaryMetrics) ? financeData.summaryMetrics : [];
  const revenueMetric = summaryMetrics.find((metric) => metric.metricKey === 'month_to_date_revenue');
  const marginMetric = summaryMetrics.find((metric) => metric.metricKey === 'net_margin');
  const payoutMetric = summaryMetrics.find((metric) => metric.metricKey === 'cash_available_for_payout');

  const revenueText = revenueMetric ? formatMetricValue(revenueMetric) : null;
  const marginText = marginMetric ? formatMetricValue(marginMetric) : null;
  const payoutText = payoutMetric ? formatMetricValue(payoutMetric) : null;

  if (revenueText && marginText && payoutText) {
    return `MTD revenue ${revenueText} · ${marginText} net margin · payouts ${payoutText}.`;
  }
  if (revenueText && marginText) {
    return `Revenue ${revenueText} with ${marginText} net margin. Dive deeper in finance insights.`;
  }
  return 'Track revenue trends, payout readiness, and compliance tasks in finance insights.';
}

function buildDashboardMenuSections(financeData, loading) {
  const description = buildFinanceMenuDescription(financeData, loading);
  const financeTags = [];
  if (financeData?.summaryMetrics) {
    const marginMetric = financeData.summaryMetrics.find((metric) => metric.metricKey === 'net_margin');
    const payoutMetric = financeData.summaryMetrics.find((metric) => metric.metricKey === 'cash_available_for_payout');
    if (marginMetric) {
      financeTags.push(formatMetricValue(marginMetric));
    }
    if (payoutMetric) {
      financeTags.push(formatMetricValue(payoutMetric));
    }
  }

  return BASE_MENU_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.name !== 'Finance & insights') {
        return item;
      }
      return {
        ...item,
        description,
        tags: financeTags.filter(Boolean).slice(0, 2),
      };
    }),
  }));
}

function buildProfile(financeData) {
  const baseProfile = {
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

  if (!financeData?.summaryMetrics) {
    return baseProfile;
  }

  const revenueMetric = financeData.summaryMetrics.find((metric) => metric.metricKey === 'month_to_date_revenue');
  const marginMetric = financeData.summaryMetrics.find((metric) => metric.metricKey === 'net_margin');

  const metrics = baseProfile.metrics.map((metric) => {
    if (metric.label === 'Monthly revenue' && revenueMetric) {
      return { ...metric, value: formatMetricValue(revenueMetric) };
    }
    if (metric.label === 'Avg. CSAT' && marginMetric) {
      return metric;
    }
    return metric;
  });

  return {
    ...baseProfile,
    metrics,
  };
}

function formatDateLabel(date) {
  if (!date) {
    return '—';
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsed);
}

const operationalSections = [
        name: 'Catalog insights',
        description:
          'Track impressions, conversion, CSAT, and revision cycles across tiers to optimise gig listings and marketing spend.',
        bulletPoints: [
          'Segment analytics by tier, client cohort, and acquisition source.',
          'Benchmark against marketplace averages with automated insights.',
        ],
      },
    ],
  },
];

const DEFAULT_PORTAL_ID = import.meta.env.VITE_FREELANCER_PORTAL_ID ?? '1';

export default function FreelancerDashboardPage() {
  const [searchParams] = useSearchParams();
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const requestedPortalId = searchParams.get('portalId');
  const portalIdentifier = (requestedPortalId ?? DEFAULT_PORTAL_ID ?? '1') || '1';

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClientPortalDashboard(portalIdentifier, { signal: controller.signal });
        if (!cancelled) {
          setPortalData(data);
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [portalIdentifier, refreshKey]);

  const portal = portalData?.portal;
  const timelineSummary = portalData?.timeline?.summary ?? {};
  const scopeSummary = portalData?.scope?.summary ?? {};
  const decisionSummary = portalData?.decisions?.summary ?? {};

  const profile = useMemo(() => {
    const badges = [];
    if (portal?.status) badges.push(`Status: ${portal.status}`);
    if (portal?.riskLevel) badges.push(`Risk: ${portal.riskLevel}`);
    if (!badges.length) badges.push('Verified Pro', 'Gigvora Elite');

    return {
      name: 'Riley Morgan',
      role: 'Lead Brand & Product Designer',
      initials: 'RM',
      status: portal?.healthScore != null ? `Portal health ${portal.healthScore}` : 'Top-rated freelancer',
      badges,
      metrics: [
        {
          label: 'Milestones',
          value: `${timelineSummary.completedCount ?? 0}/${timelineSummary.totalCount ?? 0}`,
        },
        {
          label: 'Scope delivered',
          value: `${scopeSummary.deliveredCount ?? 0}`,
        },
        {
          label: 'Decisions logged',
          value: `${decisionSummary.totalCount ?? 0}`,
        },
        {
          label: 'Health score',
          value: portal?.healthScore != null ? `${portal.healthScore}` : '—',
        },
      ],
    };
  }, [portal, timelineSummary, scopeSummary, decisionSummary]);

  const menuSections = useMemo(() => {
    const clientPortalTags = [];
    if (portal?.status) clientPortalTags.push(portal.status);
    if (portal?.healthScore != null) clientPortalTags.push(`health ${portal.healthScore}`);
    if (timelineSummary.totalCount != null) {
      clientPortalTags.push(`${timelineSummary.completedCount ?? 0}/${timelineSummary.totalCount} milestones`);
    }
    if (decisionSummary.totalCount != null) {
      clientPortalTags.push(`${decisionSummary.totalCount} decisions`);
    }

    return [
      {
        label: 'Service delivery',
        items: [
          {
            name: 'Client portals',
            description: portal?.summary ?? 'Shared timelines, scope controls, and decision logs with your clients.',
            tags: clientPortalTags,
          },
          {
            name: 'Project workspace dashboard',
            description: 'Unified workspace for briefs, assets, conversations, and approvals.',
            tags: ['whiteboards', 'files'],
          },
          {
            name: 'Project management',
            description: 'Detailed plan with sprints, dependencies, risk logs, and billing checkpoints.',
          },
        ],
      },
      ...DEFAULT_MENU_STRUCTURE,
    ];
  }, [portal, timelineSummary, decisionSummary]);

  const availableDashboards = ['freelancer', 'user', 'agency'];

  const handleRetry = () => {
    setPortalData(null);
    setError(null);
    setLoading(true);
    setRefreshKey((key) => key + 1);
  };

const BASE_CAPABILITY_SECTIONS = [
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
          'Pre-built workspace layouts for marketing, product design, development, video, and consulting practices.',
          'Standard operating procedures with reusable task lists, dependencies, and milestone sign-offs.',
          'Interactive requirement questionnaires that branch based on client inputs and service tiers.',
          'Client welcome sequences with automated kickoff surveys, contract packets, and onboarding videos.',
          'Role-based permissions and assignment presets for collaborators, reviewers, and finance approvers.',
          'Template governance that tracks revisions, owners, and adoption analytics across your team.',
        ],
        callout: 'Launch new client workspaces in minutes while keeping delivery standards consistent.',
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
    title: 'Finance, compliance, & reputation',
    description:
      'Get paid fast while staying compliant. Monitor cash flow, taxes, contracts, and reputation programmes across clients.',
    features: [
import DataStatus from '../../components/DataStatus.jsx';
import UserAvatar from '../../components/UserAvatar.jsx';
import projectsService from '../../services/projects.js';
import analytics from '../../services/analytics.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

const DEFAULT_PROJECT_ID = '1';

function formatPercent(value, { fallback = '—', maximumFractionDigits = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Math.max(0, Math.min(Number(value), 100));
  return `${numeric.toFixed(maximumFractionDigits)}%`;
}

function formatScore(value, { fallback = '—' } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  return `${Number(value).toFixed(1)}`;
}

function formatBytes(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(value);
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  const precision = index === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[index]}`;
}

function parseListInput(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function toListField(value) {
  return Array.isArray(value) ? value.join('\n') : '';
}

function deriveStatusLabel(status) {
  if (!status) return 'Unspecified';
  return status
    .toString()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function statusBadgeClass(status) {
  switch (status) {
    case 'approved':
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'blocked':
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'changes_requested':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'in_review':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'pending':
    case 'briefing':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function priorityBadgeClass(priority) {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'low':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}

export default function FreelancerDashboardPage() {
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [briefDraft, setBriefDraft] = useState({
    title: '',
    summary: '',
    objectives: '',
    deliverables: '',
    successMetrics: '',
    clientStakeholders: '',
  });

  const metrics = workspaceData?.metrics ?? {};
  const workspace = workspaceData?.workspace ?? null;
  const project = workspaceData?.project ?? null;
  const approvals = workspaceData?.approvals ?? [];
  const conversations = workspaceData?.conversations ?? [];
  const whiteboards = workspaceData?.whiteboards ?? [];
  const files = workspaceData?.files ?? [];
  const brief = workspaceData?.brief ?? null;

  const loadWorkspace = useCallback(async (targetId) => {
    const rawId = targetId ?? DEFAULT_PROJECT_ID;
    const resolvedId = String(rawId).trim();
    if (!resolvedId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await projectsService.fetchProjectWorkspace(resolvedId);
      setWorkspaceData(response);
      setLastLoadedAt(new Date());
      const briefPayload = response.brief ?? {};
      setBriefDraft({
        title: briefPayload.title ?? `${response.project?.title ?? 'Project'} workspace brief`,
        summary: briefPayload.summary ?? '',
        objectives: toListField(briefPayload.objectives),
        deliverables: toListField(briefPayload.deliverables),
        successMetrics: toListField(briefPayload.successMetrics),
        clientStakeholders: toListField(briefPayload.clientStakeholders),
      });
      analytics.track(
        'web_workspace_dashboard_loaded',
        {
          projectId: resolvedId,
          workspaceStatus: response.workspace?.status ?? null,
          pendingApprovals: response.metrics?.pendingApprovals ?? null,
        },
        { source: 'web_app' },
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlueprintList();
  }, [loadBlueprintList]);

  useEffect(() => {
    if (selectedProjectId != null) {
      loadBlueprintDetail(selectedProjectId);
    }
  }, [selectedProjectId, loadBlueprintDetail]);

  const activeProject = blueprintData?.project ??
    blueprints.find((entry) => entry?.project?.id === selectedProjectId)?.project ?? null;
  const metrics = blueprintData?.metrics ?? {
    totalSprints: 0,
    completedSprints: 0,
    openRisks: 0,
    highSeverityRisks: 0,
    blockedDependencies: 0,
    upcomingBilling: null,
  };

  const hasBlueprint = Boolean(formState);
  const healthStatus = formState?.healthStatus ?? blueprintData?.blueprint?.healthStatus ?? 'on_track';
  const upcomingBilling = metrics.upcomingBilling ?? null;
  const lastUpdatedAt = blueprintData?.blueprint?.updatedAt ?? null;
  const lastReviewedAt = blueprintData?.blueprint?.lastReviewedAt ?? null;

  const handleProjectChange = (event) => {
    const value = event.target.value;
    setSelectedProjectId(value ? Number(value) : null);
  };

  const handleFormFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({
    loadWorkspace(DEFAULT_PROJECT_ID);
  }, [loadWorkspace]);

  const handleBriefFieldChange = (field) => (event) => {
    const value = event.target.value;
    setBriefDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHealthChange = (event) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      healthStatus: value,
    }));
  };

  const handleSprintChange = (index, field, value) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const sprints = prev.sprints.map((sprint, idx) =>
        idx === index
          ? {
              ...sprint,
              [field]: field === 'progress' || field === 'velocityCommitment' ? Number(value) : value,
            }
          : sprint,
      );
      return { ...prev, sprints };
    });
  };

  const handleDependencyChange = (index, field, value) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const dependencies = prev.dependencies.map((dependency, idx) =>
        idx === index
          ? {
              ...dependency,
              [field]: value,
            }
          : dependency,
      );
      return { ...prev, dependencies };
    });
  };

  const handleRiskChange = (index, field, value) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const risks = prev.risks.map((risk, idx) =>
        idx === index
          ? {
              ...risk,
              [field]: field === 'probability' || field === 'impact' ? Number(value) : value,
            }
          : risk,
      );
      return { ...prev, risks };
    });
  };

  const handleRiskReviewChange = (index, value) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const risks = prev.risks.map((risk, idx) =>
        idx === index
          ? {
              ...risk,
              nextReviewAt: value ? new Date(value).toISOString() : null,
            }
          : risk,
      );
      return { ...prev, risks };
    });
  };

  const handleBillingChange = (index, field, value) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const billingCheckpoints = prev.billingCheckpoints.map((checkpoint, idx) =>
        idx === index
          ? {
              ...checkpoint,
              [field]: value,
            }
          : checkpoint,
      );
      return { ...prev, billingCheckpoints };
    });
  };

  const handleReset = () => {
    if (!blueprintData?.blueprint) {
      return;
    }
    setFormState(toFormState(blueprintData.blueprint));
  };

  const handleSave = async () => {
    if (!formState || !selectedProjectId) {
      return;
    }
    setSaving(true);
    setBlueprintError(null);
    try {
      const payload = {
        summary: formState.summary,
        methodology: formState.methodology,
        governanceModel: formState.governanceModel,
        sprintCadence: formState.sprintCadence,
        programManager: formState.programManager,
        healthStatus: formState.healthStatus,
        startDate: formState.startDate,
        endDate: formState.endDate,
        lastReviewedAt: new Date().toISOString(),
        metadata: formState.metadata,
        sprints: formState.sprints.map((sprint) => ({
          id: sprint.id,
          sequence: sprint.sequence,
          name: sprint.name,
          objective: sprint.objective,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          status: sprint.status,
          owner: sprint.owner,
          velocityCommitment: sprint.velocityCommitment,
          progress: sprint.progress,
          deliverables: sprint.deliverables,
          acceptanceCriteria: sprint.acceptanceCriteria,
        })),
        dependencies: formState.dependencies.map((dependency) => ({
          id: dependency.id,
          name: dependency.name,
          description: dependency.description,
          dependencyType: dependency.dependencyType,
          status: dependency.status,
          riskLevel: dependency.riskLevel,
          owner: dependency.owner,
          dueDate: dependency.dueDate,
          impact: dependency.impact,
          notes: dependency.notes,
          impactedSprintId: dependency.impactedSprintId,
        })),
        risks: formState.risks.map((risk) => ({
          id: risk.id,
          title: risk.title,
          description: risk.description,
          probability: risk.probability,
          impact: risk.impact,
          status: risk.status,
          owner: risk.owner,
          mitigationPlan: risk.mitigationPlan,
          contingencyPlan: risk.contingencyPlan,
          nextReviewAt: risk.nextReviewAt,
          tags: risk.tags,
        })),
        billingCheckpoints: formState.billingCheckpoints.map((checkpoint) => ({
          id: checkpoint.id,
          name: checkpoint.name,
          description: checkpoint.description,
          billingType: checkpoint.billingType,
          amount: checkpoint.amount,
          currency: checkpoint.currency,
          dueDate: checkpoint.dueDate,
          status: checkpoint.status,
          approvalRequired: checkpoint.approvalRequired,
          invoiceUrl: checkpoint.invoiceUrl,
          notes: checkpoint.notes,
          relatedSprintId: checkpoint.relatedSprintId,
        })),
        actorId: 1,
      };

      await projectsService.upsertProjectBlueprint(selectedProjectId, payload);
      await loadBlueprintDetail(selectedProjectId);
    } catch (error) {
      setBlueprintError(error);
  const handleBriefSubmit = async (event) => {
    event.preventDefault();
    const normalizedProjectId = String(projectId).trim();
    if (!normalizedProjectId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: briefDraft.title,
        summary: briefDraft.summary,
        objectives: parseListInput(briefDraft.objectives),
        deliverables: parseListInput(briefDraft.deliverables),
        successMetrics: parseListInput(briefDraft.successMetrics),
        clientStakeholders: parseListInput(briefDraft.clientStakeholders),
        actorId: 1,
      };
      const response = await projectsService.updateProjectWorkspaceBrief(normalizedProjectId, payload);
      setWorkspaceData(response);
      setLastLoadedAt(new Date());
      const updatedBrief = response.brief ?? {};
      setBriefDraft({
        title: updatedBrief.title ?? payload.title ?? '',
        summary: updatedBrief.summary ?? '',
        objectives: toListField(updatedBrief.objectives),
        deliverables: toListField(updatedBrief.deliverables),
        successMetrics: toListField(updatedBrief.successMetrics),
        clientStakeholders: toListField(updatedBrief.clientStakeholders),
      });
      analytics.track(
        'web_workspace_brief_saved',
        {
          projectId: normalizedProjectId,
          objectives: payload.objectives.length,
          deliverables: payload.deliverables.length,
        },
        { source: 'web_app' },
      );
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleApprovalDecision = async (approvalId, status) => {
    const normalizedProjectId = String(projectId).trim();
    if (!normalizedProjectId || !approvalId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await projectsService.updateProjectWorkspaceApproval(normalizedProjectId, approvalId, {
        status,
        actorId: 1,
      });
      setWorkspaceData(response);
      setLastLoadedAt(new Date());
      analytics.track(
        'web_workspace_approval_updated',
        { projectId: normalizedProjectId, approvalId, status },
        { source: 'web_app' },
      );
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleConversationAcknowledge = async (conversationId, priority) => {
    const normalizedProjectId = String(projectId).trim();
    if (!normalizedProjectId || !conversationId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await projectsService.acknowledgeProjectWorkspaceConversation(normalizedProjectId, conversationId, {
        priority,
        actorId: 1,
      });
      setWorkspaceData(response);
      setLastLoadedAt(new Date());
      analytics.track(
        'web_workspace_conversation_acknowledged',
        { projectId: normalizedProjectId, conversationId },
        { source: 'web_app' },
      );
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const metricsTiles = useMemo(() => {
    const blockedTone = metrics.blockedDependencies > 0 ? 'rose' : 'slate';
    const riskTone = metrics.highSeverityRisks > 0 ? 'amber' : 'slate';
    const billingTone = upcomingBilling && upcomingBilling.status === 'overdue' ? 'rose' : 'indigo';

    return [
      {
        title: 'Delivery progress',
        value: `${metrics.completedSprints}/${metrics.totalSprints}`,
        subtitle: 'Sprints completed',
        tone: 'emerald',
      },
      {
        title: 'Open risks',
        value: `${metrics.openRisks}`,
        subtitle: `${metrics.highSeverityRisks} high severity`,
        tone: riskTone,
      },
      {
        title: 'Blocked dependencies',
        value: `${metrics.blockedDependencies}`,
        subtitle: 'Needs unblocking',
        tone: blockedTone,
      },
      {
        title: 'Next billing',
        value: upcomingBilling ? formatCurrency(upcomingBilling.amount, upcomingBilling.currency) : 'No invoices',
        subtitle: upcomingBilling?.dueDate
          ? `Due ${formatRelativeTime(upcomingBilling.dueDate)}`
          : 'Awaiting scheduling',
        tone: billingTone,
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
    ];
  }, [metrics, upcomingBilling]);

  const renderSprints = () => {
    if (!formState?.sprints?.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          Add sprints to map velocity and delivery focus areas.
        </div>
      );
    }

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {formState.sprints.map((sprint, index) => (
          <div
            key={sprint.id ?? index}
            className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sprint {sprint.sequence}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{sprint.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {sprint.startDate ? formatAbsolute(sprint.startDate, { dateStyle: 'medium' }) : 'TBC'} →{' '}
                  {sprint.endDate ? formatAbsolute(sprint.endDate, { dateStyle: 'medium' }) : 'TBC'}
                </p>
              </div>
              <StatusBadge status={sprint.status} map={SPRINT_STATUS_MAP} />
            </div>
            {sprint.objective ? <p className="mt-3 text-sm text-slate-600">{sprint.objective}</p> : null}
            {Array.isArray(sprint.deliverables) && sprint.deliverables.length ? (
              <ul className="mt-4 space-y-2 text-xs text-slate-500">
                {sprint.deliverables.map((item, deliverableIndex) => (
                  <li key={deliverableIndex} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Status
                <select
                  value={sprint.status}
                  onChange={(event) => handleSprintChange(index, 'status', event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {SPRINT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Progress
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Number(sprint.progress ?? 0)}
                  onChange={(event) => handleSprintChange(index, 'progress', event.target.value)}
                  className="w-full accent-accent"
                />
                <span className="text-xs text-slate-500">{formatPercent(sprint.progress)}</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDependencies = () => {
    if (!formState?.dependencies?.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          No dependencies logged. Map integration points to stay ahead of blockers.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {formState.dependencies.map((dependency, index) => (
          <div
            key={dependency.id ?? index}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{dependency.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Owner: {dependency.owner || 'TBC'} • Due {dependency.dueDate ? formatRelativeTime(dependency.dueDate) : 'soon'}
                </p>
                {dependency.description ? (
                  <p className="mt-2 text-sm text-slate-600">{dependency.description}</p>
                ) : null}
                {dependency.impact ? (
                  <p className="mt-2 text-xs text-slate-500">Impact: {dependency.impact}</p>
                ) : null}
              </div>
              <StatusBadge status={dependency.status} map={DEPENDENCY_STATUS_MAP} />
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Status
                <select
                  value={dependency.status}
                  onChange={(event) => handleDependencyChange(index, 'status', event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {DEPENDENCY_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-slate-500">
                Linked sprint: {dependency.impactedSprintId ? `#${dependency.impactedSprintId}` : 'Unassigned'} • Risk level: {dependency.riskLevel}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRisks = () => {
    if (!formState?.risks?.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          Risk log is clear. Keep recording mitigations to maintain governance trail.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {formState.risks.map((risk, index) => (
          <div
            key={risk.id ?? index}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{risk.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Owner: {risk.owner || 'Unassigned'} • Next review {risk.nextReviewAt ? formatRelativeTime(risk.nextReviewAt) : 'TBC'}
                </p>
                {risk.description ? <p className="mt-2 text-sm text-slate-600">{risk.description}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Probability: {risk.probability}%</span>
                  <span>Impact: {risk.impact}%</span>
                  <span>Severity: {formatPercent(risk.severityScore)}</span>
                </div>
                {Array.isArray(risk.tags) && risk.tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {risk.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {risk.mitigationPlan ? (
                  <p className="mt-3 text-xs text-slate-500">Mitigation: {risk.mitigationPlan}</p>
                ) : null}
                {risk.contingencyPlan ? (
                  <p className="mt-2 text-xs text-slate-500">Contingency: {risk.contingencyPlan}</p>
                ) : null}
              </div>
              <StatusBadge status={risk.status} map={RISK_STATUS_MAP} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Status
                <select
                  value={risk.status}
                  onChange={(event) => handleRiskChange(index, 'status', event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {RISK_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Next review (local time)
                <input
                  type="datetime-local"
                  value={risk.nextReviewAt ? risk.nextReviewAt.slice(0, 16) : ''}
                  onChange={(event) => handleRiskReviewChange(index, event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBilling = () => {
    if (!formState?.billingCheckpoints?.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          No billing checkpoints recorded yet. Tie milestones to invoicing to protect cash flow.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {formState.billingCheckpoints.map((checkpoint, index) => (
          <div
            key={checkpoint.id ?? index}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{checkpoint.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {checkpoint.billingType.toUpperCase()} • Related sprint {checkpoint.relatedSprintId || 'TBC'}
                </p>
                <p className="mt-2 text-sm text-slate-600">{checkpoint.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{formatCurrency(checkpoint.amount, checkpoint.currency)}</span>
                  <span>Due {checkpoint.dueDate ? formatAbsolute(checkpoint.dueDate, { dateStyle: 'medium' }) : 'TBC'}</span>
                  <span>{checkpoint.approvalRequired ? 'Approval required' : 'Auto billable'}</span>
                </div>
                {checkpoint.notes ? <p className="mt-2 text-xs text-slate-500">Notes: {checkpoint.notes}</p> : null}
                {checkpoint.invoiceUrl ? (
                  <a
                    href={checkpoint.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:text-accentDark"
                  >
                    View invoice ↗
                  </a>
                ) : null}
              </div>
              <StatusBadge status={checkpoint.status} map={BILLING_STATUS_MAP} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Status
                <select
                  value={checkpoint.status}
                  onChange={(event) => handleBillingChange(index, 'status', event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {BILLING_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <PageHeader
          eyebrow="Freelancer dashboard"
          title={activeProject?.title ? `${activeProject.title} delivery hub` : 'Project management control centre'}
          description="Translate commitments into accountable sprints, unblock dependencies, and keep billing aligned with delivery cadence."
          meta={
            <DataStatus
              loading={loadingBlueprint || saving}
              fromCache={false}
              lastUpdated={lastUpdatedAt}
              onRefresh={() => selectedProjectId && loadBlueprintDetail(selectedProjectId)}
            />
          }
        />

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400" htmlFor="project-selector">
              Active program
            </label>
            <select
              id="project-selector"
              value={selectedProjectId ?? ''}
              onChange={handleProjectChange}
              className="w-full min-w-[220px] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 md:w-auto"
            >
              {blueprints.map((entry) => {
                const id = entry.project?.id ?? entry.blueprint?.projectId ?? '';
                return (
                  <option key={id} value={id}>
                    {entry.project?.title ?? `Project ${entry.blueprint?.projectId}`}
                  </option>
                );
              })}
              {!blueprints.length ? <option value="">No blueprints yet</option> : null}
            </select>
            {loadingList ? <span className="text-xs text-slate-400">Loading blueprint index…</span> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasBlueprint || saving || loadingBlueprint}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasBlueprint || saving}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save blueprint'}
            </button>
          </div>
        </div>

        {listError ? (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Unable to load blueprint directory. {listError.message || 'Please retry or refresh the page.'}
          </div>
        ) : null}
        {blueprintError ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Unable to load the blueprint detail. {blueprintError.message || 'Please try again or refresh the page.'}
          </div>
        ) : null}

        {loadingBlueprint ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white/70" />
            ))}
          </div>
        ) : hasBlueprint ? (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricsTiles.map((tile) => (
                <MetricTile key={tile.title} {...tile} />
              ))}
            </div>

            <section className="mb-8 rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Program summary</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Keep stakeholders aligned with a living blueprint that tracks methodology, cadence, and ownership in one place.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Last reviewed {lastReviewedAt ? formatRelativeTime(lastReviewedAt) : 'not yet recorded'}
                  </p>
                </div>
                <StatusBadge status={healthStatus} map={HEALTH_STYLES} />
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <label className="lg:col-span-2 flex flex-col gap-2 text-xs font-semibold text-slate-500">
                  Overview
                  <textarea
                    value={formState.summary}
                    onChange={handleFormFieldChange('summary')}
                    rows={4}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    placeholder="Describe the blueprint focus, goals, and success measures."
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Methodology
                    <input
                      type="text"
                      value={formState.methodology}
                      onChange={handleFormFieldChange('methodology')}
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="dual-track agile"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Governance model
                    <input
                      type="text"
                      value={formState.governanceModel}
                      onChange={handleFormFieldChange('governanceModel')}
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="weekly_governance_forum"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Sprint cadence
                    <input
                      type="text"
                      value={formState.sprintCadence}
                      onChange={handleFormFieldChange('sprintCadence')}
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="bi-weekly"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Program manager
                    <input
                      type="text"
                      value={formState.programManager}
                      onChange={handleFormFieldChange('programManager')}
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Mia Operations"
                    />
                  </label>
                  <label className="sm:col-span-2 flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    Health status
                    <select
                      value={formState.healthStatus}
                      onChange={handleHealthChange}
                      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      {HEALTH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </section>

            <section className="mb-10 space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Sprint timeline</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Track how each sprint is pacing against objectives, deliverables, and stakeholder expectations.
                </p>
                <div className="mt-4">{renderSprints()}</div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">Dependency watchlist</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Resolve blockers before they impact downstream milestones. Owners receive automated nudges when status changes.
                </p>
                <div className="mt-4">{renderDependencies()}</div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">Risk & issue log</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Maintain a real-time governance record with probability, impact, and mitigation plans for every risk.
                </p>
                <div className="mt-4">{renderRisks()}</div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">Billing checkpoints</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Sync delivery milestones with invoicing so finance, compliance, and stakeholders stay perfectly aligned.
                </p>
                <div className="mt-4">{renderBilling()}</div>
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-4xl border border-dashed border-slate-300 bg-white/80 p-12 text-center text-sm text-slate-500">
            No blueprint is configured for this project yet. Create sprints, dependencies, risks, and billing checkpoints to unlock delivery automation.
          </div>
        )}
      </section>
  const menuSections = useMemo(() => {
    const progressTag = metrics.progressPercent != null ? `${Math.round(metrics.progressPercent)}% progress` : null;
    return [
      {
        label: 'Workspace',
        items: [
          {
            name: 'Dashboard overview',
            description: 'Monitor health, approvals, automation, and milestone velocity in one place.',
            tags: [workspace?.status, progressTag].filter(Boolean),
          },
          {
            name: 'Brief & stakeholders',
            description: 'Objectives, deliverables, and client roster that guide delivery.',
            tags: [brief?.clientStakeholders?.length ? `${brief.clientStakeholders.length} stakeholders` : null].filter(Boolean),
          },
          {
            name: 'Assets & whiteboards',
            description: 'Centralised artefacts with version history and collaborator activity.',
            tags: [`${files.length} files`, `${whiteboards.length} boards`],
          },
        ],
      },
      {
        name: 'Contract & compliance locker',
        description:
          'Store MSAs, NDAs, intellectual property agreements, and compliance attestations with e-sign audit logs.',
        bulletPoints: [
          'Automated reminders for renewals and insurance certificates.',
          'Localisation for GDPR, SOC2, and freelancer classifications.',
        label: 'Collaboration',
        items: [
          {
            name: 'Conversations',
            description: 'Active delivery threads, client loops, and operational escalations.',
            tags: metrics.unreadMessages ? [`${metrics.unreadMessages} unread`] : [],
          },
          {
            name: 'Approvals',
            description: 'Track sign-offs and unblock delivery gates across stages.',
            tags: [metrics.pendingApprovals ? `${metrics.pendingApprovals} pending` : 'Up to date'].filter(Boolean),
          },
        ],
      },
    ];
  }, [metrics.pendingApprovals, metrics.progressPercent, metrics.unreadMessages, workspace?.status, brief?.clientStakeholders, files.length, whiteboards.length]);

  const profile = useMemo(
    () => ({
      name: 'Project steward',
      role: project?.title || 'Workspace member',
      status: workspace?.billingStatus ? `Billing: ${deriveStatusLabel(workspace.billingStatus)}` : 'Operational',
      badges: workspace?.status ? [deriveStatusLabel(workspace.status)] : [],
      metrics: [
        { label: 'Progress', value: formatPercent(metrics.progressPercent) },
        { label: 'Approvals', value: `${metrics.pendingApprovals ?? 0} open` },
        { label: 'Automation', value: formatPercent(metrics.automationCoverage, { maximumFractionDigits: 0 }) },
      ],
    }),
    [project?.title, workspace?.billingStatus, workspace?.status, metrics.progressPercent, metrics.pendingApprovals, metrics.automationCoverage],
  );

  const metricCards = useMemo(
    () => [
      {
        name: 'Reputation engine',
        description:
          'Capture testimonials, publish success stories, and display verified metrics such as on-time delivery and CSAT.',
        bulletPoints: [
          'Automate review requests after milestone delivery.',
          'Curate spotlight case studies directly to your profile.',
        ],
      },
    ],
  },
];

const availableDashboards = ['freelancer', 'user', 'agency'];

function getInitials(name) {
  if (!name) return 'FR';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(0);
  }
  const numeric = Number(amount);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(numeric) >= 1000 ? 0 : 2,
  }).format(numeric);
}

export default function FreelancerDashboardPage() {
  const freelancerId = Number.isFinite(DEFAULT_FREELANCER_ID) && DEFAULT_FREELANCER_ID > 0 ? DEFAULT_FREELANCER_ID : 101;
  const [collaborationsState, setCollaborationsState] = useState({ data: null, loading: false, error: null });

  const loadCollaborations = useCallback(() => {
    setCollaborationsState((previous) => ({ ...previous, loading: true, error: null }));
    fetchFreelancerAgencyCollaborations(freelancerId, { lookbackDays: 120 })
      .then((payload) => {
        setCollaborationsState({ data: payload, loading: false, error: null });
      })
      .catch((error) => {
        setCollaborationsState({
          data: null,
          loading: false,
          error: error?.message ?? 'Unable to load agency collaborations.',
        });
      });
  }, [freelancerId]);

  useEffect(() => {
    loadCollaborations();
  }, [loadCollaborations]);

  const summary = collaborationsState.data?.summary ?? null;

  const menuSections = useMemo(() => {
    return baseMenuSections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.name !== 'Agency collaborations') {
          return item;
        }

        if (!summary) {
          return item;
        }

        const description = `${formatNumber(summary.activeCollaborations ?? 0)} active retainers · ${formatCurrency(
          summary.monthlyRetainerValue,
          summary.monthlyRetainerCurrency,
        )} / month`;

        return {
          ...item,
          description,
          href: '#agency-collaborations',
          tags: ['retainers', 'rate cards'],
        };
      }),
    }));
  }, [summary]);

  const profile = useMemo(() => {
    const freelancer = collaborationsState.data?.freelancer;
    if (!freelancer) {
      return {
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
    }

    const badges = ['Agency partnerships'];
    const metrics = Array.isArray(freelancer.metrics)
      ? freelancer.metrics.map((metric) => ({
          label: metric.label,
          value:
            metric.currency != null
              ? formatCurrency(metric.value, metric.currency)
              : formatNumber(metric.value ?? 0),
        }))
      : [];

    const status = summary
      ? `${formatNumber(summary.activeCollaborations ?? 0)} active retainers`
      : 'Agency ready';

    const composedName = `${freelancer.firstName ?? ''} ${freelancer.lastName ?? ''}`.trim();
    const fallbackName = composedName || freelancer.email || 'Freelancer';

    return {
      name: freelancer.name ?? fallbackName,
      role: freelancer.title ?? 'Independent operator',
      initials: getInitials(freelancer.name ?? freelancer.email ?? 'FR'),
      status,
      badges,
      metrics,
    };
  }, [collaborationsState.data?.freelancer, summary]);
];

function pluralize(word, count, pluralForm = `${word}s`) {
  return count === 1 ? word : pluralForm;
}

function formatInteger(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(Math.round(numeric));
}

function formatCurrency(valueCents, currency = 'USD') {
  const numeric = Number(valueCents ?? 0) / 100;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(numeric) >= 1000 ? 0 : 2,
  });
  return formatter.format(Number.isFinite(numeric) ? numeric : 0);
}

function formatPercent(value, fractionDigits = 0) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return `${numeric.toFixed(fractionDigits)}%`;
}

function formatPercentDelta(value, period = 'last week') {
  if (value == null) {
    return `vs ${period}`;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || Math.abs(numeric) < 0.05) {
    return `Flat vs ${period}`;
  }
  const prefix = numeric > 0 ? '+' : '';
  return `${prefix}${numeric.toFixed(1)}% vs ${period}`;
}

function formatScoreDelta(value, period = 'last 30 days') {
  if (value == null) {
    return `vs ${period}`;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || Math.abs(numeric) < 0.05) {
    return `Flat vs ${period}`;
  }
  const prefix = numeric > 0 ? '+' : '';
  return `${prefix}${numeric.toFixed(1)} vs ${period}`;
}

function formatPointsDelta(value, period = 'last 30 days') {
  if (value == null) {
    return `vs ${period}`;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || Math.abs(numeric) < 0.05) {
    return `Flat vs ${period}`;
  }
  const prefix = numeric > 0 ? '+' : '';
  return `${prefix}${numeric.toFixed(1)} pts`;
}

function formatDueLabel(date) {
  if (!date) {
    return 'No due date';
  }
  const due = new Date(date);
  if (Number.isNaN(due.getTime())) {
    return 'No due date';
  }
  const diffMs = due.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < -1) {
    return `Overdue by ${Math.abs(diffDays)} days`;
  }
  if (diffDays === -1) {
    return 'Overdue by 1 day';
  }
  if (diffDays === 0) {
    return 'Due today';
  }
  if (diffDays === 1) {
    return 'Due tomorrow';
  }
  if (diffDays < 7) {
    return `Due in ${diffDays} days`;
  }
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDuration(days) {
  if (days == null) {
    return '—';
  }
  const numeric = Number(days);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '—';
  }
  if (numeric % 7 === 0) {
    const weeks = numeric / 7;
    return `${weeks} ${pluralize('week', weeks)}`;
  }
  if (numeric > 7) {
    return `${(numeric / 7).toFixed(1)} wks`;
  }
  return `${numeric} days`;
}

function getBadgeClasses(category) {
  return BADGE_CLASS_MAP[category] ?? BADGE_CLASS_MAP.idle;
}

function getUpsellBadge(status) {
  if (!status) {
    return BADGE_CLASS_MAP.idle;
  }
  const normalized = status.toLowerCase();
  if (normalized === 'running' || normalized === 'live') {
    return BADGE_CLASS_MAP.healthy;
  }
  if (normalized === 'pilot' || normalized === 'testing') {
    return BADGE_CLASS_MAP.waiting;
  }
  if (normalized === 'paused' || normalized === 'draft' || normalized === 'retired') {
    return BADGE_CLASS_MAP.idle;
  }
  return BADGE_CLASS_MAP.attention;
}

function buildMenuSections(summary) {
  const activeGigsCount = Number(summary?.activeGigs ?? 0);
  const dueThisWeekCount = Number(summary?.dueThisWeek ?? 0);
  const pipelineValue = formatCurrency(summary?.pipelineValueCents ?? 0, summary?.currency ?? 'USD');
  const activeGigsLabel = formatInteger(activeGigsCount);
  const dueLabel = formatInteger(dueThisWeekCount);

  return [
    {
      label: 'Service delivery',
      items: [
        {
          name: 'Project workspace dashboard',
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
          description: `Monitor ${activeGigsLabel} active ${pluralize('gig', activeGigsCount)} with ${dueLabel} ${pluralize('delivery', dueThisWeekCount, 'deliveries')} due within 7 days and ${pipelineValue} in pipeline value.`,
          tags: ['gig catalog', 'bundles', 'upsells'],
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
}

function buildMetrics(snapshot) {
  if (!snapshot) {
    return [];
  }
  const { summary } = snapshot;
  return [
    {
      key: 'active-gigs',
      label: 'Active gigs',
      value: formatInteger(summary.activeGigs),
      change: summary.dueThisWeek
        ? `${formatInteger(summary.dueThisWeek)} due within 7 days`
        : 'No deadlines within 7 days',
      helper: `${formatInteger(summary.clientsActive)} active ${pluralize('client', summary.clientsActive)}`,
    },
    {
      key: 'pipeline-value',
      label: 'Pipeline value',
      value: formatCurrency(summary.pipelineValueCents, summary.currency),
      change: formatPercentDelta(summary.pipelineValueChangePercent),
      helper: `Upsell eligible ${formatCurrency(summary.upsellEligibleValueCents, summary.currency)}`,
    },
    {
      key: 'avg-csat',
      label: 'Avg. CSAT',
      value: summary.averageCsat != null ? `${summary.averageCsat.toFixed(1)} / 5` : '—',
      change: formatScoreDelta(summary.csatDelta),
      helper: `${formatInteger(summary.recentReviewCount)} recent ${pluralize('survey', summary.recentReviewCount)}`,
    },
    {
      key: 'upsell-conversion',
      label: 'Upsell conversion',
      value: summary.upsellConversionRate != null ? formatPercent(summary.upsellConversionRate) : '—',
      change: formatPercentDelta(summary.upsellConversionChange, 'last 30 days'),
      helper: `${formatInteger(summary.upsellPlaybooksActive)} ${pluralize('playbook', summary.upsellPlaybooksActive)} live · Avg bundle attach ${
        summary.averageBundleAttachRate != null ? formatPercent(summary.averageBundleAttachRate, 1) : '—'
      }`,
    },
  ];
}

function buildProfileCard(snapshot) {
  if (!snapshot) {
    return undefined;
  }
  const { freelancer, summary } = snapshot;
  const fullName = `${freelancer.firstName ?? ''} ${freelancer.lastName ?? ''}`.trim() || 'Freelancer';
  const badges = [];
  if (summary.bundlesLive > 0) {
    badges.push(`${formatInteger(summary.bundlesLive)} live ${pluralize('bundle', summary.bundlesLive)}`);
  }
  if (summary.upsellPlaybooksActive > 0) {
    badges.push(`${formatInteger(summary.upsellPlaybooksActive)} upsell ${pluralize('playbook', summary.upsellPlaybooksActive)}`);
  }
  return {
    name: fullName,
    role: freelancer.title ?? 'Freelancer',
    initials: freelancer.initials ?? 'FL',
    status: freelancer.availability ? `Availability: ${freelancer.availability}` : undefined,
    badges,
    metrics: [
      { label: 'Active clients', value: formatInteger(summary.clientsActive) },
      {
        label: 'Avg. CSAT',
        value: freelancer.averageCsat != null ? `${freelancer.averageCsat.toFixed(1)}/5` : '—',
      },
      {
        label: 'Upsell conversion',
        value: summary.upsellConversionRate != null ? formatPercent(summary.upsellConversionRate, 1) : '—',
      },
    ],
  };
}

function LoadingState() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="h-5 w-72 animate-pulse rounded-full bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </section>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
      <h2 className="text-lg font-semibold">We couldn&apos;t load your gig manager data</h2>
      <p className="mt-2 text-sm">{message ?? 'An unexpected error occurred. Please try again.'}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-400 hover:text-rose-800"
      >
        Retry
      </button>
    </section>
  );
}

function GigManagerPanel({ metrics, pipeline, milestones, bundles, upsells, catalog, summary, onRefresh, loading }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600/80">Gig commerce</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Gig manager</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Monitor gigs, delivery milestones, bundled services, and upsells. Stay ahead of risk with a single workspace that
            blends catalog analytics, fulfillment control, and automation telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex h-fit items-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
            Gig catalog
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Refresh data
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-1 text-xs font-medium text-blue-600">{metric.change}</p>
            <p className="mt-2 text-sm text-slate-600">{metric.helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Pipeline health</h3>
            <span className="text-xs uppercase tracking-wide text-slate-400">Order flow</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Stage
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Gigs
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Value
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    SLA / Actions
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pipeline.map((stage) => (
                  <tr key={stage.stage} className="text-slate-600">
                    <td className="px-4 py-3 font-medium text-slate-900">{stage.label}</td>
                    <td className="px-4 py-3">{formatInteger(stage.gigCount)}</td>
                    <td className="px-4 py-3">{formatCurrency(stage.totalValueCents, stage.currency)}</td>
                    <td className="px-4 py-3">
                      <p>{stage.recommendedAction}</p>
                      {stage.overdueMilestones > 0 ? (
                        <p className="mt-1 text-xs text-amber-600">
                          {formatInteger(stage.overdueMilestones)} overdue {pluralize('milestone', stage.overdueMilestones)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getBadgeClasses(stage.statusCategory)}`}>
                        {stage.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Delivery milestones</h3>
            <span className="text-xs uppercase tracking-wide text-slate-400">This week</span>
          </div>
          <div className="mt-3 space-y-3">
            {milestones.slice(0, 5).map((milestone) => (
              <div key={milestone.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{milestone.gigTitle}</p>
                <p className="mt-1 text-sm text-slate-600">{milestone.title}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{formatDueLabel(milestone.dueDate)}</span>
                  <span className={`font-semibold ${getBadgeClasses(milestone.statusCategory)}`}>{milestone.statusLabel}</span>
                  {milestone.clientName ? <span>Client: {milestone.clientName}</span> : null}
                  {milestone.ownerName ? <span>Owner: {milestone.ownerName}</span> : null}
                </div>
                {milestone.progressPercent != null ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Progress</span>
                      <span>{milestone.progressPercent}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${Math.min(Math.max(milestone.progressPercent, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Bundled services</h3>
            <span className="text-xs uppercase tracking-wide text-slate-400">Attach performance</span>
          </div>
          <div className="mt-3 space-y-4">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{bundle.name}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{bundle.status}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-blue-600">{formatPercent(bundle.attachRate, 0)}</span>
                    <span className="text-xs font-medium text-slate-500">{formatPointsDelta(bundle.attachRateChange)}</span>
                    {bundle.isFeatured ? (
                      <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                        Featured
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{bundle.description}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
                  <span className="font-semibold">{formatCurrency(bundle.priceCents, bundle.currency)}</span>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {bundle.items.map((item) => (
                      <span key={item.id} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Upsell playbook</h3>
            <span className="text-xs uppercase tracking-wide text-slate-400">Automation rules</span>
          </div>
          <div className="mt-3 space-y-3">
            {upsells.map((upsell) => (
              <div key={upsell.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{upsell.name}</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getUpsellBadge(
                      upsell.status
                    )}`}
                  >
                    {upsell.status}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  {upsell.triggerEvent ? <p>{upsell.triggerEvent}</p> : null}
                  {upsell.deliveryAction ? <p>{upsell.deliveryAction}</p> : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between text-xs uppercase tracking-wide text-blue-600">
                  <span>Avg value {formatCurrency(upsell.estimatedValueCents, upsell.currency)}</span>
                  <span>
                    Conversion {formatPercent(upsell.conversionRate, 0)} · {formatPercentDelta(upsell.conversionChange, 'last 30 days')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Gig catalog</h3>
          <span className="text-xs uppercase tracking-wide text-slate-400">Top listings</span>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Gig
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Tier
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Duration
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Rating
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Price
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {catalog.map((gig) => (
                <tr key={gig.id} className="text-slate-600">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{gig.title}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{gig.code}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{gig.tier ?? '—'}</td>
                  <td className="px-4 py-3">{formatDuration(gig.durationDays)}</td>
                  <td className="px-4 py-3">
                    {gig.rating != null ? `${gig.rating.toFixed(1)} (${formatInteger(gig.ratingCount)})` : '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatCurrency(gig.priceCents, gig.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getBadgeClasses(
                      gig.status === 'published' ? 'healthy' : gig.status === 'draft' ? 'idle' : 'waiting'
                    )}`}>
                      {gig.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function CapabilitySection({ section }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{section.title}</h2>
          {section.description ? (
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p>
          ) : null}
        </div>
        {section.meta ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
            {section.meta}
          </div>
        ) : null}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {section.features.map((feature) => (
          <div
            key={feature.name}
            className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{feature.name}</h3>
              {feature.description ? <p className="mt-2 text-sm text-slate-600">{feature.description}</p> : null}
              {feature.bulletPoints?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {feature.bulletPoints.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {feature.callout ? (
              <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                {feature.callout}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FreelancerDashboardPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchGigManagerSnapshot(FREELANCER_USER_ID, {
      signal: controller.signal,
      fresh: refreshCounter > 0,
    })
      .then((data) => {
        setSnapshot(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          return;
        }
        setError(err);
        setLoading(false);
      });

    return () => controller.abort();
  }, [refreshCounter]);

  const metrics = useMemo(() => buildMetrics(snapshot), [snapshot]);
  const menuSections = useMemo(() => buildMenuSections(snapshot?.summary), [snapshot]);
  const profileCard = useMemo(() => buildProfileCard(snapshot), [snapshot]);

  const handleRefresh = () => {
    setRefreshCounter((value) => value + 1);
  };

  const pipeline = snapshot?.pipeline ?? [];
  const milestones = snapshot?.milestones ?? [];
  const bundles = snapshot?.bundles ?? [];
  const upsells = snapshot?.upsells ?? [];
  const catalog = snapshot?.catalog ?? [];
        label: 'Delivery progress',
        value: formatPercent(metrics.progressPercent),
        detail: workspace?.nextMilestone
          ? `Next milestone: ${workspace.nextMilestone}${workspace.nextMilestoneDueAt ? ` (${formatRelativeTime(workspace.nextMilestoneDueAt)})` : ''}`
          : 'Milestones will appear as they are planned.',
        render: (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.max(0, Math.min(Number(metrics.progressPercent ?? 0), 100))}%` }}
            />
          </div>
        ),
      },
      {
        label: 'Health score',
        value: formatScore(metrics.healthScore),
        detail: `Velocity score ${formatScore(metrics.velocityScore)} | Risk ${deriveStatusLabel(workspace?.riskLevel)}`,
      },
      {
        label: 'Client satisfaction',
        value: formatPercent(metrics.clientSatisfaction, { maximumFractionDigits: 0 }),
        detail: metrics.teamUtilization != null
          ? `Team utilisation ${(metrics.teamUtilization * 100).toFixed(0)}%`
          : 'Feedback cadence on track',
      },
      {
        name: 'Learning and certification hub',
        description:
          'Deepen expertise with a personalized academy that aligns learning plans, credentials, and new revenue ideas to your active gigs.',
        slug: 'learning-hub',
        bulletPoints: [
          'Curated course paths per service line with completion tracking, session replays, and micro-credential downloads.',
          'Peer mentoring marketplace that pairs you with vetted specialists for co-working sessions, office hours, and portfolio reviews.',
          'Skill gap diagnostics that benchmark your profile data against top performers to surface targeted practice briefs and labs.',
          'Certification tracker with renewal reminders, document vault storage, and automated client-facing proof of compliance.',
          'AI recommendations for new service offerings generated from marketplace demand, emerging tools, and your learning history.',
          'Launchpad planner that converts earned badges into promotional campaigns, upsell scripts, and pricing experiments.',
        ],
        callout: 'Next renewal: HubSpot Solutions Partner — 18 days left',
        label: 'Approvals pending',
        value: metrics.pendingApprovals ?? 0,
        detail: `${metrics.overdueApprovals ?? 0} overdue decisions`,
      },
      {
        label: 'Unread messages',
        value: metrics.unreadMessages ?? 0,
        detail: `${conversations.length} active channels`,
      },
      {
        label: 'Asset library',
        value: `${files.length} files`,
        detail: `${formatBytes(metrics.totalAssetsSizeBytes)} stored`,
      },
    ],
    [metrics.progressPercent, workspace?.nextMilestone, workspace?.nextMilestoneDueAt, metrics.healthScore, metrics.velocityScore, workspace?.riskLevel, metrics.clientSatisfaction, metrics.teamUtilization, metrics.pendingApprovals, metrics.overdueApprovals, metrics.unreadMessages, conversations.length, files.length, metrics.totalAssetsSizeBytes],
  );

export default function FreelancerDashboardPage() {
  const [templatesState, setTemplatesState] = useState({ data: null, loading: true, error: null });
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState(null);

  const loadTemplates = useCallback(() => {
    setTemplatesState((previous) => ({ ...previous, loading: true, error: null }));

    fetchWorkspaceTemplates({ workspaceType: 'freelancer', includeStages: true, includeResources: true })
      .then((payload) => {
        setTemplatesState({ data: payload, loading: false, error: null });
      })
      .catch((error) => {
        setTemplatesState({
          data: null,
          loading: false,
          error: error.message ?? 'Unable to load workspace templates.',
        });
      });
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const templates = templatesState.data?.templates ?? [];
  const categories = templatesState.data?.categories ?? [];
  const meta = templatesState.data?.meta ?? null;
  const stats = templatesState.data?.stats ?? null;

  useEffect(() => {
    if (templatesState.loading || templatesState.error) {
      return;
    }
    if (!templates.length) {
      setSelectedTemplateSlug(null);
      return;
    }
    setSelectedTemplateSlug((current) => {
      if (current && templates.some((template) => template.slug === current)) {
        return current;
      }
      return templates[0].slug;
    });
  }, [templatesState.loading, templatesState.error, templates]);

  useEffect(() => {
    if (activeCategory === 'all') {
      return;
    }
    const availableSlugs = new Set(categories.map((category) => category.slug));
    if (!availableSlugs.has(activeCategory)) {
      setActiveCategory('all');
    }
  }, [activeCategory, categories]);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') {
      return templates;
    }
    return templates.filter((template) => template.category?.slug === activeCategory);
  }, [templates, activeCategory]);

  useEffect(() => {
    if (templatesState.loading) {
      return;
    }
    if (!filteredTemplates.length) {
      if (!templates.length) {
        setSelectedTemplateSlug(null);
      }
      return;
    }

    setSelectedTemplateSlug((current) => {
      if (current && filteredTemplates.some((template) => template.slug === current)) {
        return current;
      }
      return filteredTemplates[0].slug;
    });
  }, [filteredTemplates, templates.length, templatesState.loading]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateSlug) {
      return filteredTemplates[0] ?? null;
    }
    return (
      filteredTemplates.find((template) => template.slug === selectedTemplateSlug) ??
      templates.find((template) => template.slug === selectedTemplateSlug) ??
      filteredTemplates[0] ??
      null
    );
  }, [filteredTemplates, selectedTemplateSlug, templates]);

  const templatesTotal = templatesState.data?.stats?.totalTemplates ?? templates.length;

  const menuSections = useMemo(() => {
    return BASE_MENU_SECTIONS.map((section) => {
      if (section.label !== 'Service delivery') {
        return section;
      }
      return {
        ...section,
        items: section.items.map((item) => {
          if (item.name !== 'Workspace templates') {
            return item;
          }
          const dynamicDescription = templatesTotal
            ? `Spin up ${templatesTotal} ready-to-use workspaces with questionnaires and automated onboarding flows.`
            : item.description;
          return {
            ...item,
            description: dynamicDescription,
          };
        }),
      };
    });
  }, [templatesTotal]);

  const workspaceTemplateSection = useMemo(
    () => ({
      id: 'workspace-templates',
      title: 'Workspace template library',
      description:
        'Kickstart delivery with production-ready playbooks, interactive questionnaires, and automated onboarding journeys tailored to your service lines.',
      meta: templatesTotal ? `${templatesTotal} production-ready templates` : undefined,
      render: () => (
        <WorkspaceTemplatesSection
          categories={categories}
          templates={filteredTemplates}
          stats={stats}
          meta={meta}
          loading={templatesState.loading}
          error={templatesState.error}
          onRetry={loadTemplates}
          activeCategory={activeCategory}
          onCategoryChange={(slug) => setActiveCategory(slug)}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={(slug) => setSelectedTemplateSlug(slug)}
        />
      ),
    }),
    [
      activeCategory,
      categories,
      filteredTemplates,
      loadTemplates,
      meta,
      selectedTemplate,
      stats,
      templatesState.error,
      templatesState.loading,
      templatesTotal,
    ],
  );

  const sections = useMemo(() => [workspaceTemplateSection, ...BASE_CAPABILITY_SECTIONS], [workspaceTemplateSection]);

function getInitials(name) {
  if (!name) return 'FM';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return 'FM';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'FM';
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(0);
  }

  const numeric = Number(amount);
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(numeric) >= 1000 ? 0 : 2,
  });
  return formatter.format(numeric);
}

function cloneMenuSections(summary, currency) {
  return defaultMenuSections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.name !== 'Purchased gigs') {
        return { ...item };
      }

      const activeOrders = summary?.activeOrders ?? 0;
      const requirementsDue = summary?.requirementsDue ?? 0;
      const pendingPayout = formatCurrency(summary?.pendingPayoutValue ?? 0, currency);

      return {
        ...item,
        description: `${activeOrders} active orders • ${requirementsDue} requirements • ${pendingPayout} pending payouts`,
        tags: ['orders', 'requirements', 'payouts'],
        href: '#purchased-gigs',
      };
    }),
  }));
}

function buildProfile(freelancer, summary, currency) {
  const derivedName = `${freelancer?.firstName ?? 'Freelancer'} ${freelancer?.lastName ?? ''}`.trim();
  const name = freelancer?.name ?? (derivedName || 'Freelancer');
  const role = freelancer?.role ?? freelancer?.headline ?? 'Lead independent professional';
  const status = freelancer?.availabilityStatusLabel ?? 'Top-rated freelancer';
  const badges = Array.isArray(freelancer?.badges) ? freelancer.badges : [];
  const initials = getInitials(name);

  const metrics = [
    { label: 'Active orders', value: String(summary?.activeOrders ?? 0) },
    { label: 'Requirements due', value: String(summary?.requirementsDue ?? 0) },
    { label: 'Revision cycles', value: String(summary?.revisionCount ?? 0) },
    { label: 'Pending payouts', value: formatCurrency(summary?.pendingPayoutValue ?? 0, currency) },
  ];

  return {
    name,
    role,
    initials,
    status,
    badges,
    metrics,
  };
}

function formatPriority(priority) {
  if (!priority) return 'normal';
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

const PIPELINE_STAGE_CONFIG = [
  {
    key: 'awaiting_requirements',
    label: 'Awaiting requirements',
    description: 'Kickoff forms or assets are still pending from the client.',
    accent: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    key: 'in_progress',
    label: 'In progress',
    description: 'Delivery is underway with milestones scheduled this week.',
    accent: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    key: 'revision_requested',
    label: 'Revisions',
    description: 'Feedback loops are active and require fast turnaround.',
    accent: 'bg-purple-50 text-purple-700 border-purple-100',
  },
  {
    key: 'ready_for_payout',
    label: 'Ready for payout',
    description: 'Delivery accepted, awaiting payout release or recently closed.',
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
};

const TIMEZONE_OPTIONS = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Singapore'];
const BACKGROUND_STYLES = [
  { value: 'aurora', label: 'Aurora gradient' },
  { value: 'pulse', label: 'Pulse spotlight' },
  { value: 'grid', label: 'Blueprint grid' },
];

const availableDashboards = ['freelancer', 'user', 'agency'];

function FinanceMetricCard({ metric, loading }) {
  if (loading && !metric) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          <span className="h-5 w-5 animate-pulse rounded-full bg-slate-200" />
        </div>
        <span className="mt-4 h-7 w-28 animate-pulse rounded bg-slate-200" />
        <span className="mt-3 h-5 w-20 animate-pulse rounded-full bg-slate-200" />
        <span className="mt-3 h-3 w-full animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  const iconKey = metric?.metricKey ?? '';
  const Icon = METRIC_ICON_MAP[iconKey] ?? CurrencyDollarIcon;
  const trend = resolveTrend(metric);
  const trendColor =
    trend === 'down' ? 'text-rose-600' : trend === 'up' ? 'text-emerald-600' : 'text-slate-600';
  const TrendIcon = trend === 'down' ? ArrowTrendingDownIcon : trend === 'up' ? ArrowTrendingUpIcon : ClockIcon;
  const valueText = formatMetricValue(metric);
  const changeText = formatChange(metric);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric?.label ?? 'Metric'}</p>
        <Icon className="h-5 w-5 text-blue-500" />
      </div>
      <p className="mt-4 text-2xl font-semibold text-slate-900">{valueText}</p>
      {changeText ? (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium">
          {TrendIcon ? <TrendIcon className={`${trendColor} h-4 w-4`} /> : null}
          <span className={trendColor}>{changeText}</span>
        </div>
      ) : null}
      {metric?.caption ? <p className="mt-3 text-xs text-slate-500">{metric.caption}</p> : null}
    </div>
  );
}

function RevenueTrendChart({ trend, loading }) {
  const points = Array.isArray(trend?.points) ? trend.points : [];
  const currencyCode = trend?.currencyCode ?? 'USD';

  if (loading && points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Revenue trend</h3>
            <p className="text-sm text-slate-500">Booked vs. realized revenue.</p>
          </div>
          <span className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="mt-6 flex items-end gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-40 w-full items-end gap-1">
                <span className="flex-1 animate-pulse rounded-t-xl bg-slate-200" />
                <span className="flex-1 animate-pulse rounded-t-xl bg-slate-300" />
              </div>
              <span className="h-3 w-10 animate-pulse rounded bg-slate-200" />
              <span className="h-3 w-20 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Revenue trend</h3>
            <p className="text-sm text-slate-500">Booked vs. realized revenue.</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-500">Revenue trend data will appear once transactions are recorded.</p>
      </div>
    );
  }

  const maxValue = points.reduce((max, point) => {
    const booked = toNumber(point.booked) ?? 0;
    const realized = toNumber(point.realized) ?? 0;
    return Math.max(max, booked, realized);
  }, 0);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Revenue trend</h3>
          <p className="text-sm text-slate-500">Booked vs. realized revenue over the last periods.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Booked
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Realized
          </span>
        </div>
      </div>
      <div className="mt-6 flex items-end gap-4">
        {points.map((point) => {
          const bookedHeight = maxValue > 0 ? Math.max(8, Math.round(((toNumber(point.booked) ?? 0) / maxValue) * 100)) : 0;
          const realizedHeight = maxValue > 0 ? Math.max(8, Math.round(((toNumber(point.realized) ?? 0) / maxValue) * 100)) : 0;
          return (
            <div key={point.monthDate ?? point.month} className="flex flex-1 flex-col items-center gap-3 text-sm">
              <div className="flex h-40 w-full items-end gap-1">
                <div
                  className="flex-1 rounded-t-xl bg-blue-500/80"
                  style={{ height: `${bookedHeight}%` }}
                  aria-hidden="true"
                />
                <div
                  className="flex-1 rounded-t-xl bg-emerald-500/80"
                  style={{ height: `${realizedHeight}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-400">{point.month}</div>
              <div className="text-xs text-slate-500">
                <span className="block">{`Booked ${formatter.format(toNumber(point.booked) ?? 0)}`}</span>
                <span className="block text-emerald-600">{`Realized ${formatter.format(toNumber(point.realized) ?? 0)}`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CapabilitySectionList({ sections }) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return null;
  }

  return sections.map((section) => (
    <section
      key={section.title}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{section.title}</h2>
          {section.description ? (
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p>
          ) : null}
        </div>
        {section.meta ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
            {section.meta}
          </div>
        ) : null}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {section.features.map((feature) => (
          <div
            key={feature.name}
            className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{feature.name}</h3>
              {feature.description ? <p className="mt-2 text-sm text-slate-600">{feature.description}</p> : null}
              {feature.bulletPoints?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {feature.bulletPoints.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {feature.callout ? (
              <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                {feature.callout}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  ));
}


function FinanceInsightsSection({ data, loading, error, onRetry }) {
  const summaryMetrics = Array.isArray(data?.summaryMetrics) ? data.summaryMetrics : [];
  const metricItems = summaryMetrics.length > 0 ? summaryMetrics : loading ? Array.from({ length: 4 }).map(() => null) : [];
  const revenueTrend = data?.revenueTrend ?? null;
  const revenueStreams = Array.isArray(data?.revenueStreams) ? data.revenueStreams : [];
  const payoutHistory = Array.isArray(data?.payoutHistory) ? data.payoutHistory : [];
  const taxCompliance = data?.taxCompliance ?? {};
  const quarterlyEstimate = taxCompliance?.quarterlyEstimate ?? null;
  const filings = Array.isArray(taxCompliance?.filings) ? taxCompliance.filings : [];
  const complianceHighlights = Array.isArray(taxCompliance?.complianceHighlights)
    ? taxCompliance.complianceHighlights
    : [];
  const deductions = taxCompliance?.deductions ?? null;
  const profitability = data?.profitability ?? { metrics: [], breakdown: [], savingsGoals: [] };
  const controls = Array.isArray(data?.controls) ? data.controls : [];
  const lastUpdatedAt = data?.lastUpdatedAt;
  const lastUpdatedLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastUpdatedAt))
    : null;

  return (
    <section
      id="finance-insights"
      className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-white p-6 shadow-[0_18px_45px_-30px_rgba(30,64,175,0.45)] sm:p-10"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Finance & insights control tower</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Keep your revenue analytics, payout cadence, tax compliance, profitability, and automations aligned. This cockpit
            keeps earnings predictable and audits painless.
          </p>
          {lastUpdatedLabel ? <p className="mt-1 text-xs text-slate-400">Last updated {lastUpdatedLabel}</p> : null}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          <BoltIcon className="h-4 w-4" />
          Realtime-ready ledgers
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-semibold">We couldn&apos;t refresh finance insights.</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span>{error?.message ?? 'Please try again in a few moments.'}</span>
            {onRetry ? (
              <button
                type="button"
                onClick={() => onRetry({ force: true })}
                className="rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-medium text-rose-700 transition hover:border-rose-400"
              >
                Retry
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {metricItems.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricItems.map((metric, index) => (
            <FinanceMetricCard key={metric?.metricKey ?? index} metric={metric} loading={loading} />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          Finance metrics will appear once you record revenue and expense activity.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Revenue composition</h3>
              <p className="text-sm text-slate-500">Where your gig and project revenue is concentrated.</p>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700">
              Healthy mix
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {revenueStreams.length > 0 ? (
              revenueStreams.map((stream) => {
                const share = stream.sharePercent == null ? '—' : `${Math.round(stream.sharePercent)}%`;
                const mrr = formatCurrency(stream.monthlyRecurringRevenue, stream.currencyCode ?? 'USD', {
                  compact: false,
                  maximumFractionDigits: 0,
                });
                const yoyNumeric = toNumber(stream.yoyChangePercent);
                const yoy =
                  yoyNumeric == null
                    ? '—'
                    : `${yoyNumeric > 0 ? '+' : ''}${Math.abs(yoyNumeric).toFixed(Number.isInteger(Math.abs(yoyNumeric)) ? 0 : 1)}% YoY`;

                return (
                  <div key={stream.id ?? stream.stream} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-slate-900">{stream.stream}</p>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                        {share}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-600">
                        MRR {mrr}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-600">
                        {yoy}
                      </span>
                      {stream.notes ? <span className="text-slate-500">{stream.notes}</span> : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Revenue stream analytics will populate as you close engagements.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Payout readiness</h3>
              <p className="text-sm text-slate-500">Monitor upcoming releases, escrow milestones, and the health of your payout cadence.</p>
            </div>
            <BanknotesIcon className="h-6 w-6 text-blue-500" />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Gig
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payoutHistory.slice(0, 6).map((entry) => {
                  const statusClass =
                    entry.status === 'released'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : entry.status === 'scheduled'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : entry.status === 'in_escrow'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : entry.status === 'failed'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600';

                  return (
                    <tr key={`${entry.id ?? entry.date}-${entry.client}`} className="text-xs text-slate-600">
                      <td className="px-4 py-3 font-medium text-slate-500">{formatDateLabel(entry.date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{entry.client}</td>
                      <td className="px-4 py-3">{entry.gig}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(entry.amount, entry.currencyCode ?? 'USD', { compact: false, maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`${statusClass} inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wide`}>
                          {entry.statusLabel ?? entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Split payouts can be configured per gig. Clients see transparency into subcontractor shares on invoices.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Revenue trend</h3>
              <p className="text-sm text-slate-500">Dive into booked vs. realized revenue across recent months.</p>
            </div>
            <div className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-purple-700">
              Forecast locked for 90 days
            </div>
          </div>
          <div className="mt-5">
            <RevenueTrendChart trend={revenueTrend} loading={loading} />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Tax & compliance</h3>
                <p className="text-sm text-slate-500">
                  Keep quarterly estimates, jurisdictional filings, and compliance reminders in one place.
                </p>
              </div>
              <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
            </div>
            {quarterlyEstimate ? (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <p className="font-semibold">
                  Next estimate due {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(quarterlyEstimate.dueDate))}
                </p>
                <p className="text-xs text-blue-600/80">
                  Amount set aside: {formatCurrency(quarterlyEstimate.amount, quarterlyEstimate.currencyCode ?? 'USD', {
                    compact: false,
                    maximumFractionDigits: 0,
                  })}{' '}
                  · Status: {quarterlyEstimate.statusLabel ?? quarterlyEstimate.status}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No quarterly estimate configured yet.</p>
            )}
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {filings.length > 0 ? (
                filings.map((filing) => (
                  <li key={filing.id ?? filing.name} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{filing.name}</p>
                      <p className="text-xs text-slate-500">
                        Due {formatDateLabel(filing.dueDate)}
                        {filing.jurisdiction ? ` · ${filing.jurisdiction}` : ''}
                      </p>
                    </div>
                    <span
                      className={`${
                        filing.status === 'submitted'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : filing.status === 'in_progress'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : filing.status === 'overdue'
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                      } inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide`}
                    >
                      {filing.statusLabel ?? filing.status}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-500">All tax filings are up to date.</li>
              )}
            </ul>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                {deductions ? `Deductible expenses ${deductions.taxYear}` : 'Track deductible expenses'}{' '}
                {deductions ? formatCurrency(deductions.amount, deductions.currencyCode ?? 'USD', { compact: false }) : ''}
              </p>
              {deductions?.changePercentage != null ? (
                <p className="text-xs text-slate-500">
                  {deductions.changePercentage > 0 ? '+' : ''}
                  {deductions.changePercentage}% vs. last year
                </p>
              ) : null}
              {deductions?.notes ? <p className="mt-2 text-xs text-slate-500">{deductions.notes}</p> : null}
            </div>
            {complianceHighlights.length > 0 ? (
              <ul className="mt-4 space-y-2 text-xs text-slate-500">
                {complianceHighlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <DocumentCheckIcon className="h-4 w-4 text-blue-400" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-700">
            <p className="font-semibold">Need an accountant?</p>
            <p className="text-xs text-blue-600/80">
              Invite your finance partner into a read-only workspace with export-ready ledgers and audit trails.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Profitability cockpit</h3>
              <p className="text-sm text-slate-500">Dive into net margin, utilization, and savings goals to stay sustainable.</p>
            </div>
            <div className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-purple-700">
              Forecast locked for 90 days
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {profitability.metrics.length > 0 ? (
              profitability.metrics.map((item) => (
                <div key={item.metricKey ?? item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{formatMetricValue(item)}</p>
                  {formatChange(item) ? <p className="mt-2 text-xs text-emerald-600">{formatChange(item)}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Profitability metrics will appear as soon as operating costs are tracked.</p>
            )}
          </div>
          <div className="mt-6 space-y-4">
            {profitability.breakdown.length > 0 ? (
              profitability.breakdown.map((line) => {
                const percent = toNumber(line.percent) ?? 0;
                return (
                  <div key={line.label}>
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-slate-700">{line.label}</p>
                      <p className="text-slate-500">{percent}%</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, percent)}%` }} aria-hidden="true" />
                    </div>
                    {line.caption ? <p className="mt-1 text-xs text-slate-500">{line.caption}</p> : null}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Add cost categories to understand margin drivers.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Savings automations</h3>
            <p className="text-sm text-slate-500">Direct percentages of payouts into dedicated envelopes.</p>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              {profitability.savingsGoals.length > 0 ? (
                profitability.savingsGoals.map((goal) => {
                  const percent = Math.max(0, Math.min(100, Math.round((goal.progress ?? 0) * 100)));
                  return (
                    <li key={goal.id ?? goal.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{goal.name}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Target {formatCurrency(goal.targetAmount, goal.currencyCode ?? 'USD', { compact: false })}
                        </p>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} aria-hidden="true" />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{percent}% funded</span>
                        <span>{goal.cadence}</span>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-slate-500">Set up savings envelopes to automate reserves.</li>
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Controls & automation</h3>
            <p className="text-sm text-slate-500">Operational guardrails to keep finance, compliance, and reputation aligned.</p>
            <div className="mt-4 space-y-4">
              {controls.length > 0 ? (
                controls.map((control) => (
                  <div key={control.id ?? control.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{control.name}</p>
                    {control.description ? <p className="mt-1 text-xs text-slate-500">{control.description}</p> : null}
                    {Array.isArray(control.bullets) && control.bullets.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-xs text-slate-500">
                        {control.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                            <DocumentCheckIcon className="h-4 w-4 text-blue-400" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Add automation controls to keep operations audit-ready.</p>
              )}
            </div>
          </div>
        </div>
export default function FreelancerDashboardPage() {
  const freelancerId = DEFAULT_FREELANCER_ID;
  const [expertiseFormOpen, setExpertiseFormOpen] = useState(false);
  const [expertiseDraft, setExpertiseDraft] = useState(initialExpertiseDraft);
  const [expertiseSaving, setExpertiseSaving] = useState(false);
  const [expertiseError, setExpertiseError] = useState(null);

  const [metricFormOpen, setMetricFormOpen] = useState(false);
  const [metricDraft, setMetricDraft] = useState(initialSuccessDraft);
  const [metricSaving, setMetricSaving] = useState(false);
  const [metricError, setMetricError] = useState(null);

  const [testimonialFormOpen, setTestimonialFormOpen] = useState(false);
  const [testimonialDraft, setTestimonialDraft] = useState(initialTestimonialDraft);
  const [testimonialSaving, setTestimonialSaving] = useState(false);
  const [testimonialError, setTestimonialError] = useState(null);

  const [heroFormOpen, setHeroFormOpen] = useState(false);
  const [heroDraft, setHeroDraft] = useState(initialHeroDraft);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroError, setHeroError] = useState(null);

  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    `dashboard:freelancer:profile-hub:${freelancerId}`,
    ({ signal, force }) => fetchFreelancerProfileHub(freelancerId, { signal, force }),
    { ttl: 1000 * 60 },
  );

  const summary = data?.summary ?? {
    retainerCount: 0,
    launchpadGigCount: 0,
    heroBannersLive: 0,
    testimonialsPublished: 0,
    expertiseLiveCount: 0,
    successMetricCount: 0,
  };

  const expertiseAreas = Array.isArray(data?.expertiseAreas) ? data.expertiseAreas : [];
  const successMetrics = Array.isArray(data?.successMetrics) ? data.successMetrics : [];
  const testimonials = Array.isArray(data?.testimonials) ? data.testimonials : [];
  const heroBanners = Array.isArray(data?.heroBanners) ? data.heroBanners : [];

  const menuSections = useMemo(() => buildMenuSections(summary), [summary]);
  const profileCard = data?.sidebarProfile ?? {
    name: 'Freelancer',
    role: 'Independent professional',
    initials: 'FR',
    status: 'Availability: Limited',
    badges: ['Gigvora member'],
    metrics: [
      { label: 'Active retainers', value: '0' },
      { label: 'Launchpad gigs', value: '0' },
      { label: 'Avg. CSAT', value: 'N/A' },
      { label: 'Net-new revenue (90d)', value: '$0' },
    ],
  };
  const availableDashboards = data?.availableDashboards ?? DEFAULT_AVAILABLE_DASHBOARDS;

  const handleAddExpertise = async (event) => {
    event.preventDefault();
    if (!expertiseDraft.title.trim()) {
      setExpertiseError('A title is required to create an expertise focus.');
      return;
    }

    setExpertiseSaving(true);
    setExpertiseError(null);
    try {
      const payload = [
        ...expertiseAreas.map(mapExpertiseForUpdate),
        {
          title: expertiseDraft.title.trim(),
          description: expertiseDraft.description.trim(),
          status: expertiseDraft.status,
          tags: expertiseDraft.tags,
          recommendations: expertiseDraft.recommendations,
          traction: [],
        },
      ];
      await saveFreelancerExpertiseAreas(freelancerId, payload);
      await refresh({ force: true });
      setExpertiseDraft(initialExpertiseDraft);
      setExpertiseFormOpen(false);
    } catch (submissionError) {
      setExpertiseError(submissionError?.message ?? 'Unable to save expertise focus.');
    } finally {
      setExpertiseSaving(false);
    }
  };

  const handleAddMetric = async (event) => {
    event.preventDefault();
    if (!metricDraft.label.trim() || !metricDraft.value.trim()) {
      setMetricError('A label and value are required for a success metric.');
      return;
    }

    setMetricSaving(true);
    setMetricError(null);
    try {
      const payload = [
        ...successMetrics.map(mapMetricForUpdate),
        {
          label: metricDraft.label.trim(),
          value: metricDraft.value.trim(),
          delta: metricDraft.delta.trim() || null,
          target: metricDraft.target.trim() || null,
          trend: metricDraft.trend,
          breakdown: [],
        },
      ];
      await saveFreelancerSuccessMetrics(freelancerId, payload);
      await refresh({ force: true });
      setMetricDraft(initialSuccessDraft);
      setMetricFormOpen(false);
    } catch (submissionError) {
      setMetricError(submissionError?.message ?? 'Unable to save success metric.');
    } finally {
      setMetricSaving(false);
    }
  };

  const handleAddTestimonial = async (event) => {
    event.preventDefault();
    if (!testimonialDraft.client.trim() || !testimonialDraft.quote.trim()) {
      setTestimonialError('Client name and quote are required.');
      return;
    }

    setTestimonialSaving(true);
    setTestimonialError(null);
    try {
      const payload = [
        ...testimonials.map(mapTestimonialForUpdate),
        {
          client: testimonialDraft.client.trim(),
          role: testimonialDraft.role.trim() || null,
          company: testimonialDraft.company.trim() || null,
          project: testimonialDraft.project.trim() || null,
          quote: testimonialDraft.quote.trim(),
          status: testimonialDraft.status,
          metrics: [],
        },
      ];
      await saveFreelancerTestimonials(freelancerId, payload);
      await refresh({ force: true });
      setTestimonialDraft(initialTestimonialDraft);
      setTestimonialFormOpen(false);
    } catch (submissionError) {
      setTestimonialError(submissionError?.message ?? 'Unable to save testimonial.');
    } finally {
      setTestimonialSaving(false);
    }
  };

  const handleAddHeroBanner = async (event) => {
    event.preventDefault();
    if (!heroDraft.title.trim() || !heroDraft.headline.trim()) {
      setHeroError('Title and headline are required for a hero banner.');
      return;
    }

    setHeroSaving(true);
    setHeroError(null);
    try {
      const ctaLabel = heroDraft.ctaLabel.trim() || null;
      const ctaUrl = heroDraft.ctaUrl.trim() || null;
      const payload = [
        ...heroBanners.map(mapHeroForUpdate),
        {
          title: heroDraft.title.trim(),
          headline: heroDraft.headline.trim(),
          audience: heroDraft.audience.trim() || null,
          status: heroDraft.status,
          cta: {
            label: ctaLabel,
            url: ctaUrl,
          },
          gradient: heroDraft.gradient.trim() || null,
          metrics: [],
        },
      ];
      await saveFreelancerHeroBanners(freelancerId, payload);
      await refresh({ force: true });
      setHeroDraft(initialHeroDraft);
      setHeroFormOpen(false);
    } catch (submissionError) {
      setHeroError(submissionError?.message ?? 'Unable to save hero banner.');
    } finally {
      setHeroSaving(false);
    }
  };
function formatCurrency(amount, currency = 'USD') {
  if (!Number.isFinite(Number(amount))) {
    return `${currency} 0`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function buildBannerBackground(style, color) {
  if (style === 'pulse') {
    return `radial-gradient(circle at top left, ${color}, rgba(79,70,229,0.15)), radial-gradient(circle at bottom right, rgba(59,130,246,0.35), rgba(59,130,246,0))`;
  }
  if (style === 'grid') {
    return `linear-gradient(135deg, ${color}, rgba(79,70,229,0.4)), repeating-linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 1px, transparent 1px, transparent 28px)`;
  }
  return `linear-gradient(135deg, ${color}, rgba(30,64,175,0.6))`;
}
function convertGigToForm(gig, defaults = FALLBACK_BLUEPRINT) {
  const base = gig ?? {};
  const blueprint = gig ? gig : defaults;
  const availabilitySlots = Array.isArray(base.availabilitySlots) ? base.availabilitySlots : [];

  return {
    id: base.id ?? null,
    title: base.title ?? blueprint.title ?? '',
    tagline: base.tagline ?? blueprint.tagline ?? '',
    category: base.category ?? blueprint.category ?? '',
    niche: base.niche ?? blueprint.niche ?? '',
    deliveryModel: base.deliveryModel ?? blueprint.deliveryModel ?? '',
    outcomePromise: base.outcomePromise ?? blueprint.outcomePromise ?? '',
    heroAccent: base.heroAccent ?? blueprint.heroAccent ?? '#4f46e5',
    targetMetric: base.targetMetric ?? blueprint.targetMetric ?? null,
    status: base.status ?? blueprint.status ?? 'draft',
    visibility: base.visibility ?? blueprint.visibility ?? 'private',
    packages: (Array.isArray(base.packages) && base.packages.length ? base.packages : blueprint.packages).map(
      (pkg, index) => ({
        key: pkg.key ?? pkg.packageKey ?? `package-${index + 1}`,
        name: pkg.name ?? '',
        priceAmount: pkg.priceAmount ?? 0,
        priceCurrency: pkg.priceCurrency ?? 'USD',
        deliveryDays: pkg.deliveryDays ?? 0,
        revisionLimit: pkg.revisionLimit ?? 0,
        highlights: Array.isArray(pkg.highlights) ? pkg.highlights : [],
        recommendedFor: pkg.recommendedFor ?? '',
        description: pkg.description ?? '',
        isPopular: pkg.isPopular ?? false,
      }),
    ),
    addOns: (Array.isArray(base.addOns) && base.addOns.length ? base.addOns : blueprint.addOns).map((addon, index) => ({
      key: addon.key ?? addon.addOnKey ?? `addon-${index + 1}`,
      name: addon.name ?? '',
      priceAmount: addon.priceAmount ?? 0,
      priceCurrency: addon.priceCurrency ?? 'USD',
      description: addon.description ?? '',
      isActive: addon.isActive !== false,
    })),
    availability: {
      timezone: base.availabilityTimezone ?? blueprint.availability.timezone,
      leadTimeDays: base.availabilityLeadTimeDays ?? blueprint.availability.leadTimeDays,
      slots: availabilitySlots.map((slot, index) => ({
        id: slot.id ?? `${slot.date}-${slot.startTime}-${index}`,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity ?? 1,
        isBookable: slot.isBookable !== false,
        notes: slot.notes ?? '',
      })),
    },
    banner: {
      headline: base.bannerSettings?.headline ?? blueprint.banner.headline ?? '',
      subheadline: base.bannerSettings?.subheadline ?? blueprint.banner.subheadline ?? '',
      callToAction: base.bannerSettings?.callToAction ?? blueprint.banner.callToAction ?? '',
      badge: base.bannerSettings?.badge ?? blueprint.banner.badge ?? '',
      accentColor: base.bannerSettings?.accentColor ?? blueprint.banner.accentColor ?? '#4f46e5',
      backgroundStyle: base.bannerSettings?.backgroundStyle ?? blueprint.banner.backgroundStyle ?? 'aurora',
      testimonial: base.bannerSettings?.testimonial ?? blueprint.banner.testimonial ?? '',
      testimonialAuthor: base.bannerSettings?.testimonialAuthor ?? blueprint.banner.testimonialAuthor ?? '',
      waitlistEnabled: base.bannerSettings?.waitlistEnabled ?? blueprint.banner.waitlistEnabled ?? true,
    },
  };
}

function buildPayloadFromForm(form) {
  return {
    actorId: FREELANCER_ID,
    ownerId: FREELANCER_ID,
    title: form.title,
    tagline: form.tagline,
    category: form.category,
    niche: form.niche,
    deliveryModel: form.deliveryModel,
    outcomePromise: form.outcomePromise,
    heroAccent: form.heroAccent,
    targetMetric: form.targetMetric,
    status: form.status,
    visibility: form.visibility,
    packages: form.packages.map((pkg, index) => ({
      key: pkg.key || `package-${index + 1}`,
      name: pkg.name,
      priceAmount: Number(pkg.priceAmount ?? 0),
      priceCurrency: pkg.priceCurrency || 'USD',
      deliveryDays: pkg.deliveryDays == null ? null : Number(pkg.deliveryDays),
      revisionLimit: pkg.revisionLimit == null ? null : Number(pkg.revisionLimit),
      highlights: Array.isArray(pkg.highlights) ? pkg.highlights : [],
      recommendedFor: pkg.recommendedFor,
      description: pkg.description,
      isPopular: Boolean(pkg.isPopular),
    })),
    addOns: form.addOns.map((addon, index) => ({
      key: addon.key || `addon-${index + 1}`,
      name: addon.name,
      priceAmount: Number(addon.priceAmount ?? 0),
      priceCurrency: addon.priceCurrency || 'USD',
      description: addon.description,
      isActive: Boolean(addon.isActive),
    })),
    availability: {
      timezone: form.availability.timezone,
      leadTimeDays: Number(form.availability.leadTimeDays ?? 2),
      slots: form.availability.slots.map((slot) => ({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: Number(slot.capacity ?? 1),
        isBookable: Boolean(slot.isBookable),
        notes: slot.notes ?? undefined,
      })),
    },
    banner: {
      ...form.banner,
    },
  };
}

function createNewPackage(index) {
  return {
    key: `new-package-${index + 1}`,
    name: '',
    priceAmount: 0,
    priceCurrency: 'USD',
    deliveryDays: 7,
    revisionLimit: 1,
    highlights: [],
    recommendedFor: '',
    description: '',
    isPopular: false,
  };
}

function createNewAddOn(index) {
  return {
    key: `new-addon-${index + 1}`,
    name: '',
    priceAmount: 0,
    priceCurrency: 'USD',
    description: '',
    isActive: true,
  };
}

function createNewSlot(index) {
  const date = new Date();
  date.setDate(date.getDate() + index + 1);
  const iso = date.toISOString().split('T')[0];
  return {
    id: `slot-${iso}-${index}`,
    date: iso,
    startTime: '09:00',
    endTime: '10:30',
    capacity: 1,
    isBookable: true,
    notes: '',
  };
}

function GigReadinessCard({ health, metrics }) {
  const readiness = health?.readinessScore ?? 0;
  const missing = Array.isArray(health?.missing) ? health.missing : [];
  const publishedCount = metrics?.publishedCount ?? 0;
  const totalGigs = metrics?.totalGigs ?? 0;
  const nextAvailability = metrics?.nextAvailability ?? null;

  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 shadow-inner">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Launch readiness</p>
          <p className="mt-2 text-3xl font-semibold text-blue-900">{readiness}% ready</p>
        </div>
        <SparklesIcon className="h-10 w-10 text-blue-400" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-500">Published gigs</p>
          <p className="mt-2 text-lg font-semibold text-blue-900">{publishedCount}</p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-500">Total gigs</p>
          <p className="mt-2 text-lg font-semibold text-blue-900">{totalGigs}</p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-500">Next availability</p>
          <p className="mt-2 text-lg font-semibold text-blue-900">
            {nextAvailability ? `${nextAvailability.date} · ${nextAvailability.startTime}` : 'Schedule slots'}
          </p>
        </div>
      </div>
      {missing.length ? (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Next actions</p>
          <ul className="space-y-2">
            {missing.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-blue-900">
                <CheckCircleIcon className="mt-0.5 h-4 w-4 text-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function GigPreview({ form }) {
  const banner = form.banner;
  const background = buildBannerBackground(banner.backgroundStyle, banner.accentColor || '#4f46e5');
  const primaryPackage = form.packages?.[1] ?? form.packages?.[0];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className="absolute inset-0" style={{ background }} aria-hidden="true" />
      <div className="relative z-10 p-8 text-white">
        {banner.badge ? (
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wide">
            {banner.badge}
          </span>
        ) : null}
        <h3 className="mt-4 text-3xl font-semibold leading-tight">{banner.headline || form.title}</h3>
        <p className="mt-3 max-w-xl text-sm text-white/90">{banner.subheadline || form.tagline}</p>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/20 px-5 py-2 text-sm font-medium">
          <CalendarDaysIcon className="h-5 w-5" />
          <span>Lead time: {form.availability.leadTimeDays} days</span>
        </div>
        {primaryPackage ? (
          <div className="mt-8 rounded-3xl bg-white/15 p-6">
            <p className="text-xs uppercase tracking-wide text-white/70">Popular package</p>
            <p className="mt-2 text-2xl font-semibold">{primaryPackage.name}</p>
            <p className="mt-1 text-sm text-white/80">{primaryPackage.recommendedFor}</p>
            <p className="mt-4 text-3xl font-semibold">
              {formatCurrency(primaryPackage.priceAmount, primaryPackage.priceCurrency)}
            </p>
          </div>
        ) : null}
        {banner.callToAction ? (
          <button
            type="button"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            {banner.callToAction}
          </button>
        ) : null}
        {banner.testimonial ? (
          <blockquote className="mt-10 rounded-3xl border border-white/20 bg-white/10 p-5 text-sm italic text-white/80">
            <p>{banner.testimonial}</p>
            {banner.testimonialAuthor ? (
              <cite className="mt-3 block text-xs font-semibold not-italic text-white/70">
                {banner.testimonialAuthor}
              </cite>
            ) : null}
          </blockquote>
        ) : null}
      </div>
    </div>
  );
}
function GigOverviewSection({ form, onFieldChange, health, metrics }) {
  return (
    <section id="gig-publisher" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Gig overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Position your signature service with a compelling promise and delivery model.
          </p>
        </div>
        <div className="flex gap-3">
          <label className="flex flex-col text-xs font-medium text-slate-500">
            Status
            <select
              value={form.status}
              onChange={(event) => onFieldChange('status', event.target.value)}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="flex flex-col text-xs font-medium text-slate-500">
            Visibility
            <select
              value={form.visibility}
              onChange={(event) => onFieldChange('visibility', event.target.value)}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Gig title</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Name your signature offer"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Tagline</span>
            <input
              type="text"
              value={form.tagline}
              onChange={(event) => onFieldChange('tagline', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Promise outcomes and positioning"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Service category</span>
              <input
                type="text"
                value={form.category}
                onChange={(event) => onFieldChange('category', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Branding & Identity"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Niche focus</span>
              <input
                type="text"
                value={form.niche}
                onChange={(event) => onFieldChange('niche', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Venture-backed startups"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Delivery model</span>
            <input
              type="text"
              value={form.deliveryModel}
              onChange={(event) => onFieldChange('deliveryModel', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Hybrid sprint with async reviews"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Outcome promise</span>
            <textarea
              value={form.outcomePromise}
              onChange={(event) => onFieldChange('outcomePromise', event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Summarise deliverables and transformation"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">North star metric (days to deliver)</span>
              <input
                type="number"
                min="0"
                value={form.targetMetric ?? ''}
                onChange={(event) => onFieldChange('targetMetric', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Accent colour</span>
              <input
                type="color"
                value={form.heroAccent}
                onChange={(event) => onFieldChange('heroAccent', event.target.value)}
                className="mt-2 h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white"
              />
            </label>
          </div>
        </div>
        <GigReadinessCard health={health} metrics={metrics} />
      </div>
    </section>
  );
}
function PricingMatrixSection({ packages, onChange, onAdd, onRemove }) {
  return (
    <section id="pricing-matrix" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Pricing matrix</h2>
          <p className="mt-1 text-sm text-slate-500">
            Define tiered packages with pricing, delivery timelines, and value signals.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          <PlusIcon className="h-4 w-4" />
          Add package
        </button>
      </div>

      <div className="mt-6 grid gap-6">
        {packages.map((pkg, index) => (
          <div key={pkg.key || index} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-inner">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Package name</span>
                  <input
                    type="text"
                    value={pkg.name}
                    onChange={(event) => onChange(index, 'name', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Growth Lab"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                  <input
                    type="checkbox"
                    checked={pkg.isPopular}
                    onChange={(event) => onChange(index, 'isPopular', event.target.checked)}
                    className="h-4 w-4 rounded border border-blue-300 text-blue-600 focus:ring-blue-400"
                  />
                  Featured package
                </label>
                {packages.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="rounded-full border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remove package"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</span>
                <input
                  type="number"
                  min="0"
                  value={pkg.priceAmount}
                  onChange={(event) => onChange(index, 'priceAmount', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</span>
                <input
                  type="text"
                  value={pkg.priceCurrency}
                  onChange={(event) => onChange(index, 'priceCurrency', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  maxLength={3}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery days</span>
                <input
                  type="number"
                  min="0"
                  value={pkg.deliveryDays ?? ''}
                  onChange={(event) => onChange(index, 'deliveryDays', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revision limit</span>
                <input
                  type="number"
                  min="0"
                  value={pkg.revisionLimit ?? ''}
                  onChange={(event) => onChange(index, 'revisionLimit', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</span>
                <textarea
                  value={pkg.highlights.join('\n')}
                  onChange={(event) => onChange(index, 'highlights', event.target.value.split('\n').map((line) => line.trim()).filter(Boolean))}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="List the deliverables as bullet points"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ideal for</span>
                <textarea
                  value={pkg.recommendedFor}
                  onChange={(event) => onChange(index, 'recommendedFor', event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Describe who benefits the most"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function AvailabilitySection({ availability, onAvailabilityChange, onSlotChange, onAddSlot, onRemoveSlot }) {
  return (
    <section id="availability-calendar" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Availability calendar</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage bookable discovery calls and maintain your lead time buffer.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddSlot}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          <PlusIcon className="h-4 w-4" />
          Add time slot
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timezone</span>
          <select
            value={availability.timezone}
            onChange={(event) => onAvailabilityChange({ timezone: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {TIMEZONE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lead time (days)</span>
          <input
            type="number"
            min="0"
            value={availability.leadTimeDays}
            onChange={(event) => onAvailabilityChange({ leadTimeDays: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-700">
          <p className="font-medium">Smart booking tips</p>
          <p className="mt-2 text-xs">Maintain at least four open slots per week to appear in fast-response filters.</p>
        </div>
      </div>
const profile = {
  name: 'Riley Morgan',
  role: 'Lead Brand & Product Designer',
  initials: 'RM',
  status: 'Top-rated freelancer',
  id: 2,
  badges: ['Verified Pro', 'Gigvora Elite'],
  metrics: [
    { label: 'Active projects', value: '6' },
    { label: 'Gigs fulfilled', value: '148' },
    { label: 'Avg. CSAT', value: '4.9/5' },
    { label: 'Monthly revenue', value: '$18.4k' },
  ],
function mergePipelineStages(pipeline = []) {
  return PIPELINE_STAGE_CONFIG.map((stage) => {
    const match = pipeline.find((item) => item.key === stage.key);
    return {
      ...stage,
      orders: Array.isArray(match?.orders) ? match.orders : [],
    };
  });
}

function resolveRevisionStatusLabel(status) {
  switch (status) {
    case 'requested':
      return 'Requested';
    case 'in_progress':
      return 'In progress';
    case 'submitted':
      return 'Submitted';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Pending';
  }
}

function resolveActivityTypeLabel(type) {
  switch (type) {
    case 'order':
      return 'Order';
    case 'requirement':
      return 'Requirement';
    case 'revision':
      return 'Revision';
    case 'payout':
      return 'Payout';
    case 'communication':
      return 'Communication';
    case 'note':
      return 'Note';
    default:
      return 'Update';
  }
}

const payoutStatusStyles = {
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
  released: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  at_risk: 'bg-amber-50 text-amber-700 border-amber-200',
  on_hold: 'bg-rose-50 text-rose-700 border-rose-200',
};

const defaultSummary = {
  activeOrders: 0,
  requirementsDue: 0,
  revisionCount: 0,
  pendingPayoutValue: 0,
  pipelineValue: 0,
  payoutsDueThisWeek: 0,
};

      <div className="mt-6 space-y-4">
        {availability.slots.length ? (
          availability.slots.map((slot, index) => (
            <div
              key={slot.id || `${slot.date}-${slot.startTime}`}
              className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-inner sm:flex-row sm:items-end"
            >
              <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
                <input
                  type="date"
                  value={slot.date}
                  onChange={(event) => onSlotChange(index, 'date', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start time
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(event) => onSlotChange(index, 'startTime', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                End time
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(event) => onSlotChange(index, 'endTime', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Capacity
                <input
                  type="number"
                  min="1"
                  value={slot.capacity}
                  onChange={(event) => onSlotChange(index, 'capacity', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <input
                  type="checkbox"
                  checked={slot.isBookable}
                  onChange={(event) => onSlotChange(index, 'isBookable', event.target.checked)}
                  className="h-4 w-4 rounded border border-blue-300 text-blue-600 focus:ring-blue-400"
                />
                Bookable
              </label>
              <button
                type="button"
                onClick={() => onRemoveSlot(index)}
                className="rounded-full border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Remove slot"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No availability windows yet. Add time slots to open bookings.
          </div>
        )}
      </div>
    </section>
  );
}
function AddOnsSection({ addOns, onChange, onAdd, onRemove }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Add-ons</h2>
          <p className="mt-1 text-sm text-slate-500">Upsell complementary services to boost engagement.</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          <PlusIcon className="h-4 w-4" />
          Add add-on
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {addOns.length ? (
          addOns.map((addon, index) => (
            <div key={addon.key || index} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-inner">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Add-on name</span>
                    <input
                      type="text"
                      value={addon.name}
                      onChange={(event) => onChange(index, 'name', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <input
                    type="checkbox"
                    checked={addon.isActive}
                    onChange={(event) => onChange(index, 'isActive', event.target.checked)}
                    className="h-4 w-4 rounded border border-blue-300 text-blue-600 focus:ring-blue-400"
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="rounded-full border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Remove add-on"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</span>
                  <input
                    type="number"
                    min="0"
                    value={addon.priceAmount}
                    onChange={(event) => onChange(index, 'priceAmount', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</span>
                  <input
                    type="text"
                    value={addon.priceCurrency}
                    onChange={(event) => onChange(index, 'priceCurrency', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    maxLength={3}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
                  <textarea
                    value={addon.description}
                    onChange={(event) => onChange(index, 'description', event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No add-ons configured yet. Create one to increase booking value.
          </div>
        )}
      </div>
    </section>
  );
}
function BannerSection({ form, onBannerChange }) {
  return (
    <section id="marketing-banner" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Marketing banner</h2>
            <p className="mt-1 text-sm text-slate-500">Craft a hero banner with a compelling headline, CTA, and social proof.</p>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Headline</span>
            <input
              type="text"
              value={form.banner.headline}
              onChange={(event) => onBannerChange('headline', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Subheadline</span>
            <input
              type="text"
              value={form.banner.subheadline}
              onChange={(event) => onBannerChange('subheadline', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Call to action</span>
              <input
                type="text"
                value={form.banner.callToAction}
                onChange={(event) => onBannerChange('callToAction', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Badge</span>
              <input
                type="text"
                value={form.banner.badge}
                onChange={(event) => onBannerChange('badge', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Accent colour</span>
              <input
                type="color"
                value={form.banner.accentColor}
                onChange={(event) => onBannerChange('accentColor', event.target.value)}
                className="mt-2 h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Background style</span>
              <select
                value={form.banner.backgroundStyle}
                onChange={(event) => onBannerChange('backgroundStyle', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {BACKGROUND_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Testimonial</span>
            <textarea
              value={form.banner.testimonial}
              onChange={(event) => onBannerChange('testimonial', event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Testimonial author</span>
            <input
              type="text"
              value={form.banner.testimonialAuthor}
              onChange={(event) => onBannerChange('testimonialAuthor', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.banner.waitlistEnabled}
              onChange={(event) => onBannerChange('waitlistEnabled', event.target.checked)}
              className="h-4 w-4 rounded border border-blue-300 text-blue-600 focus:ring-blue-400"
            />
            Enable waitlist capture
          </label>
        </div>
        <GigPreview form={form} />
      </div>
    </section>
  );
}


export default function FreelancerDashboardPage() {
  const {
    data: financeData,
    loading: financeLoading,
    error: financeError,
    refresh: refreshFinance,
  } = useCachedResource(
    `dashboard:freelancer:finance:${DEFAULT_FREELANCER_ID}`,
    ({ signal } = {}) => fetchFreelancerFinanceInsights(DEFAULT_FREELANCER_ID, { signal }),
    { ttl: 1000 * 60 * 3 },
  );

  const remainingSections = operationalSections;
  const menuSections = useMemo(() => buildDashboardMenuSections(financeData, financeLoading), [financeData, financeLoading]);
  const profile = useMemo(() => buildProfile(financeData), [financeData]);
export default function FreelancerDashboardPage() {
  const [form, setForm] = useState(() => convertGigToForm(null, FALLBACK_BLUEPRINT));
  const [formDirty, setFormDirty] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [statusMessage, setStatusMessage] = useState(null);

  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
  } = useCachedResource(
    `dashboard:freelancer:${FREELANCER_ID}`,
    ({ signal }) => fetchFreelancerDashboard({ freelancerId: FREELANCER_ID }, { signal }),
    { ttl: 1000 * 60 },
  );

  const gigComposer = data?.gigComposer ?? null;
  const defaults = useMemo(() => gigComposer?.defaults ?? FALLBACK_BLUEPRINT, [gigComposer?.defaults]);
  const activeGig = gigComposer?.activeGig ?? null;
  const menuSections = data?.menuSections ?? FALLBACK_MENU;
  const profile = data?.profile ?? {
    name: 'Freelancer',
    role: 'Independent specialist',
    initials: 'FR',
    status: 'Availability: limited',
    badges: ['Marketplace ready'],
    metrics: [],
  };

  useEffect(() => {
    setForm(convertGigToForm(activeGig, defaults));
    setFormDirty(false);
  }, [activeGig?.id, defaults]);

  const handleFieldChange = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormDirty(true);
  }, []);

  const handlePackageChange = useCallback((index, field, value) => {
    setForm((current) => {
      const nextPackages = current.packages.map((pkg, pkgIndex) =>
        pkgIndex === index
          ? {
              ...pkg,
              [field]: field === 'highlights'
                ? value
                : field === 'isPopular'
                ? Boolean(value)
                : value,
            }
          : pkg,
      );
      return { ...current, packages: nextPackages };
    });
    setFormDirty(true);
  }, []);

  const handleAddPackage = useCallback(() => {
    setForm((current) => ({ ...current, packages: [...current.packages, createNewPackage(current.packages.length)] }));
    setFormDirty(true);
  }, []);

  const handleRemovePackage = useCallback((index) => {
    setForm((current) => ({ ...current, packages: current.packages.filter((_, pkgIndex) => pkgIndex !== index) }));
    setFormDirty(true);
  }, []);

  const handleAddOnChange = useCallback((index, field, value) => {
    setForm((current) => {
      const nextAddOns = current.addOns.map((addon, addonIndex) =>
        addonIndex === index
          ? {
              ...addon,
              [field]: field === 'isActive' ? Boolean(value) : value,
            }
          : addon,
      );
      return { ...current, addOns: nextAddOns };
    });
    setFormDirty(true);
  }, []);

  const handleAddAddOn = useCallback(() => {
    setForm((current) => ({ ...current, addOns: [...current.addOns, createNewAddOn(current.addOns.length)] }));
    setFormDirty(true);
  }, []);

  const handleRemoveAddOn = useCallback((index) => {
    setForm((current) => ({ ...current, addOns: current.addOns.filter((_, addonIndex) => addonIndex !== index) }));
    setFormDirty(true);
  }, []);

  const handleAvailabilityChange = useCallback((changes) => {
    setForm((current) => ({ ...current, availability: { ...current.availability, ...changes } }));
    setFormDirty(true);
  }, []);

  const handleSlotChange = useCallback((index, field, value) => {
    setForm((current) => {
      const slots = current.availability.slots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: field === 'isBookable' ? Boolean(value) : value } : slot,
      );
      return { ...current, availability: { ...current.availability, slots } };
    });
    setFormDirty(true);
  }, []);

  const handleAddSlot = useCallback(() => {
    setForm((current) => ({
      ...current,
      availability: {
        ...current.availability,
        slots: [...current.availability.slots, createNewSlot(current.availability.slots.length)],
      },
    }));
    setFormDirty(true);
  }, []);

  const handleRemoveSlot = useCallback((index) => {
    setForm((current) => ({
      ...current,
      availability: {
        ...current.availability,
        slots: current.availability.slots.filter((_, slotIndex) => slotIndex !== index),
      },
    }));
    setFormDirty(true);
  }, []);

  const handleBannerChange = useCallback((field, value) => {
    setForm((current) => ({ ...current, banner: { ...current.banner, [field]: value } }));
    setFormDirty(true);
  }, []);

  const handleSaveDraft = useCallback(async () => {
    let savedGig = null;
    try {
      setSaveState('saving');
      setStatusMessage(null);
      const payload = buildPayloadFromForm(form);
      savedGig = form.id
        ? await updateFreelancerGig(form.id, payload)
        : await createFreelancerGig(payload);
      setForm(convertGigToForm(savedGig, defaults));
      setFormDirty(false);
      setStatusMessage({ type: 'success', text: 'Draft saved successfully.' });
      await refresh();
    } catch (saveError) {
      setStatusMessage({ type: 'error', text: saveError.message || 'Failed to save draft.' });
      savedGig = null;
    } finally {
      setSaveState('idle');
    }

    return savedGig;
  }, [defaults, form, refresh]);

  const handlePublish = useCallback(async () => {
    let draftGig = form;
    if (!form.id || formDirty) {
      draftGig = await handleSaveDraft();
    }
    try {
      setSaveState('publishing');
      setStatusMessage(null);
      const gigId = draftGig?.id ?? null;
      if (!gigId) {
        throw new Error('Unable to determine gig identifier. Save the draft before publishing.');
      }
      const result = await publishFreelancerGig(gigId, {
        actorId: FREELANCER_ID,
        visibility: form.visibility === 'private' ? 'public' : form.visibility,
      });
      setForm(convertGigToForm(result, defaults));
      setFormDirty(false);
      setStatusMessage({ type: 'success', text: 'Gig published to the marketplace.' });
      await refresh();
    } catch (publishError) {
      setStatusMessage({ type: 'error', text: publishError.message || 'Failed to publish gig.' });
    } finally {
      setSaveState('idle');
    }
    }, [defaults, form, formDirty, handleSaveDraft, refresh]);

  const heroTitle = 'Freelancer Launch Workspace';
  const heroSubtitle = 'Post a marketplace-ready gig';
  const heroDescription =
    'Compose tiered pricing, add-on services, availability calendars, and marketing banners to launch a premium Gigvora gig.';
  const [activeMenuKey, setActiveMenuKey] = useState('overview');
  const learningHubState = useLearningHub({ freelancerId: profile.id, includeEmpty: true });
  const showLearningHub = activeMenuKey === 'learning-hub';

  const handleMenuSelect = ({ key }) => {
    if (key === 'learning-hub') {
      setActiveMenuKey('learning-hub');
    } else {
      setActiveMenuKey('overview');
    }
  };
  const freelancerId = 2; // Seeded demo freelancer
  const { data, error, loading, summaryCards: derivedSummaryCards, refresh, fromCache } =
    useFreelancerPurchasedGigsDashboard({ freelancerId });

  const currency = useMemo(() => data?.orders?.[0]?.currencyCode ?? 'USD', [data]);
  const summary = data?.summary ?? defaultSummary;

  const menuSections = useMemo(() => cloneMenuSections(summary, currency), [summary, currency]);
  const profile = useMemo(() => buildProfile(data?.freelancer, summary, currency), [data, summary, currency]);

  const summaryCards = useMemo(() => {
    const templates = [
      { icon: QueueListIcon, iconBackground: 'bg-blue-100', iconColor: 'text-blue-600' },
      { icon: ClipboardDocumentCheckIcon, iconBackground: 'bg-amber-100', iconColor: 'text-amber-600' },
      { icon: ArrowPathIcon, iconBackground: 'bg-purple-100', iconColor: 'text-purple-600' },
      { icon: CurrencyDollarIcon, iconBackground: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    ];

    return templates.map((template, index) => {
      const card = derivedSummaryCards?.[index];
      return {
        ...template,
        label: card?.label ?? ['Active orders', 'Requirements outstanding', 'Revision cycles', 'Payouts queued'][index],
        value: card?.value ?? '—',
        hint: card?.hint ?? '',
      };
    });
  }, [derivedSummaryCards]);

  const pipelineStages = useMemo(() => mergePipelineStages(data?.pipeline ?? []), [data?.pipeline]);
  const requirementQueue = data?.requirementQueue ?? [];
  const revisionQueue = data?.revisionQueue ?? [];
  const payoutSchedule = data?.payoutSchedule ?? [];
  const activityFeed = data?.activityFeed ?? [];

  const heroTitle = 'Freelancer Operations HQ';
  const heroSubtitle = 'Service business cockpit';
  const heroDescription =
    'An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace.';

  const isInitialLoading = loading && !data;

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title={heroTitle}
      subtitle={heroSubtitle}
      description={heroDescription}
      menuSections={menuSections}
      sections={remainingSections}
      profile={profile}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <FinanceInsightsSection
          data={financeData}
          loading={financeLoading}
          error={financeError}
          onRetry={refreshFinance}
        />
        <CapabilitySectionList sections={remainingSections} />
      sections={capabilitySections}
      profile={profileCard}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profile hub data status</h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage expertise focuses, success metrics, testimonials, and hero banners from a unified dashboard view.
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
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error?.message ?? 'Something went wrong while loading the freelancer profile hub.'}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80">Freelancer profile</p>
              <h2 className="text-2xl font-semibold text-slate-900">Expertise tags &amp; positioning</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Curate the skills marketplace algorithms surface first, highlight differentiators, and archive offers that no longer drive demand.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setExpertiseFormOpen((open) => !open);
                setExpertiseError(null);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-100"
            >
              {expertiseFormOpen ? 'Close expertise form' : 'Add expertise focus'}
            </button>
          </div>

          {expertiseAreas.length ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {expertiseAreas.map((group) => (
                <div key={group.id ?? group.slug ?? group.title} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
                      {group.description ? (
                        <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                      ) : null}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${expertiseStatusStyles(group.status)}`}>
                      {formatStatus(group.status)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.tags?.length ? (
                      group.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-dashed border-slate-200 px-3 py-1 text-xs text-slate-400">No tags yet</span>
                    )}
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                    {group.traction?.length ? (
                      group.traction.map((item) => (
                        <div key={`${group.id ?? group.slug}-${item.label}`} className="rounded-xl border border-slate-200 bg-white p-3">
                          <dt className="uppercase tracking-wide text-slate-400">{item.label}</dt>
                          <dd className={`mt-1 text-sm font-semibold ${tractionToneStyles(item.tone)}`}>
                            {item.value}
                          </dd>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-3 text-slate-400">
                        No traction snapshot yet
                      </div>
                    )}
                  </dl>

                  {group.recommendations?.length ? (
                    <div className="mt-5 space-y-2 text-sm text-slate-600">
                      {group.recommendations.map((recommendation) => (
                        <div key={`${group.id ?? group.slug}-rec-${recommendation}`} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                          <span>{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-6 text-sm text-blue-700">
              No expertise focuses have been recorded yet. Use the form below to define your positioning pillars.
            </div>
          )}

          {expertiseFormOpen ? (
            <form onSubmit={handleAddExpertise} className="mt-6 space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Title
                  <input
                    type="text"
                    value={expertiseDraft.title}
                    onChange={(event) => setExpertiseDraft((prev) => ({ ...prev, title: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Signature service pillars"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={expertiseDraft.status}
                    onChange={(event) => setExpertiseDraft((prev) => ({ ...prev, status: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {EXPERTISE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Description
                <textarea
                  value={expertiseDraft.description}
                  onChange={(event) => setExpertiseDraft((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Summarise how this expertise focus helps clients."
                />
              </label>
              <TagInput
                label="Tags"
                items={expertiseDraft.tags}
                onChange={(items) => setExpertiseDraft((prev) => ({ ...prev, tags: items }))}
                placeholder="Add tag"
              />
              <TagInput
                label="Recommendations"
                description="Internal actions or next steps to strengthen this expertise pillar."
                items={expertiseDraft.recommendations}
                onChange={(items) => setExpertiseDraft((prev) => ({ ...prev, recommendations: items }))}
                placeholder="Add recommendation"
              />
              {expertiseError ? (
                <p className="text-sm text-rose-600">{expertiseError}</p>
              ) : null}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={expertiseSaving}
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {expertiseSaving ? 'Saving…' : 'Save expertise focus'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpertiseFormOpen(false);
                    setExpertiseDraft(initialExpertiseDraft);
                    setExpertiseError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(14,116,144,0.25)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600/80">Success metrics</p>
              <h2 className="text-2xl font-semibold text-slate-900">Delivery &amp; reputation scorecard</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Track operational excellence against targets before promoting new offers or pitching strategic retainers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMetricFormOpen((open) => !open);
                setMetricError(null);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700 shadow-sm transition hover:border-cyan-400 hover:bg-cyan-100"
            >
              {metricFormOpen ? 'Close metric form' : 'Add success metric'}
            </button>
          </div>

          {successMetrics.length ? (
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {successMetrics.map((metric) => (
                <div key={metric.id ?? metric.metricKey ?? metric.label} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{metric.label}</h3>
                      {metric.delta ? (
                        <p className={`mt-1 text-xs font-semibold ${metricTrendTextClasses(metric.trend)}`}>
                          {metric.delta}
                        </p>
                      ) : null}
                    </div>
                    {metric.target ? (
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {metric.target}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-6 text-3xl font-semibold text-slate-900">{metric.value}</p>
                  {metric.breakdown?.length ? (
                    <div className="mt-6 grid gap-3 text-xs text-slate-500">
                      {metric.breakdown.map((item) => (
                        <div key={`${metric.id ?? metric.metricKey}-${item.label}`} className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="font-medium text-slate-600">{item.label}</p>
                          <p className="mt-1 text-base font-semibold text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/40 p-6 text-sm text-cyan-700">
              No success metrics have been logged yet. Add key delivery and reputation metrics to track progress.
            </div>
          )}

          {metricFormOpen ? (
            <form onSubmit={handleAddMetric} className="mt-6 space-y-4 rounded-2xl border border-cyan-200 bg-cyan-50/40 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Label
                  <input
                    type="text"
                    value={metricDraft.label}
                    onChange={(event) => setMetricDraft((prev) => ({ ...prev, label: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    placeholder="On-time milestone delivery"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Value
                  <input
                    type="text"
                    value={metricDraft.value}
                    onChange={(event) => setMetricDraft((prev) => ({ ...prev, value: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    placeholder="98%"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Delta / change
                  <input
                    type="text"
                    value={metricDraft.delta}
                    onChange={(event) => setMetricDraft((prev) => ({ ...prev, delta: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    placeholder="+3.4% vs. last quarter"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Target
                  <input
                    type="text"
                    value={metricDraft.target}
                    onChange={(event) => setMetricDraft((prev) => ({ ...prev, target: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    placeholder="Target ≥ 95%"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Trend
                <select
                  value={metricDraft.trend}
                  onChange={(event) => setMetricDraft((prev) => ({ ...prev, trend: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  {METRIC_TREND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {metricError ? <p className="text-sm text-rose-600">{metricError}</p> : null}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={metricSaving}
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {metricSaving ? 'Saving…' : 'Save success metric'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMetricFormOpen(false);
                    setMetricDraft(initialSuccessDraft);
                    setMetricError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(147,51,234,0.25)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600/80">Testimonials</p>
              <h2 className="text-2xl font-semibold text-slate-900">Client proof &amp; narrative assets</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Pair written quotes with launchpad-ready assets and ensure every testimonial is attached to a flagship service.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTestimonialFormOpen((open) => !open);
                setTestimonialError(null);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-purple-300 bg-purple-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-purple-700 shadow-sm transition hover:border-purple-400 hover:bg-purple-100"
            >
              {testimonialFormOpen ? 'Close testimonial form' : 'Add testimonial'}
            </button>
          </div>

          {testimonials.length ? (
            <div className="mt-6 space-y-4">
              {testimonials.map((testimonial) => (
                <article key={testimonial.id ?? testimonial.testimonialKey ?? testimonial.client} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{testimonial.client}</p>
                      <p className="text-xs text-slate-500">
                        {[testimonial.role, testimonial.project].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${testimonialStatusStyles(testimonial.status)}`}>
                      {formatStatus(testimonial.status)}
                    </span>
                  </div>

                  <blockquote className="mt-3 text-sm italic text-slate-700">“{testimonial.quote}”</blockquote>

                  {testimonial.metrics?.length ? (
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                      {testimonial.metrics.map((metric) => (
                        <span key={`${testimonial.id ?? testimonial.testimonialKey}-${metric.label}`} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1">
                          <span className="font-semibold text-slate-600">{metric.label}:</span>
                          <span className="text-slate-700">{metric.value}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-6 text-sm text-purple-700">
              No testimonials captured yet. Invite clients to share outcomes and attach assets for launchpad promotion.
            </div>
          )}

          {testimonialFormOpen ? (
            <form onSubmit={handleAddTestimonial} className="mt-6 space-y-4 rounded-2xl border border-purple-200 bg-purple-50/40 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Client name
                  <input
                    type="text"
                    value={testimonialDraft.client}
                    onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, client: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="Noah Patel"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Client role
                  <input
                    type="text"
                    value={testimonialDraft.role}
                    onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, role: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="Founder, SummitOps"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Company
                  <input
                    type="text"
                    value={testimonialDraft.company}
                    onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, company: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="SummitOps"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Project
                  <input
                    type="text"
                    value={testimonialDraft.project}
                    onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, project: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="B2B SaaS brand overhaul"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Quote
                <textarea
                  value={testimonialDraft.quote}
                  onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, quote: event.target.value }))}
                  rows={3}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  placeholder="Share the headline impact in the client's own words."
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Status
                <select
                  value={testimonialDraft.status}
                  onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, status: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                >
                  {TESTIMONIAL_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {testimonialError ? <p className="text-sm text-rose-600">{testimonialError}</p> : null}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={testimonialSaving}
                  className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {testimonialSaving ? 'Saving…' : 'Save testimonial'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTestimonialFormOpen(false);
                    setTestimonialDraft(initialTestimonialDraft);
                    setTestimonialError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(245,158,11,0.25)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600/80">Hero banners</p>
              <h2 className="text-2xl font-semibold text-slate-900">Launchpad spotlight creatives</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Refresh primary hero banners by audience, keep conversion metrics visible, and prep the next launch ahead of demand spikes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHeroFormOpen((open) => !open);
                setHeroError(null);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-100"
            >
              {heroFormOpen ? 'Close banner form' : 'Add hero banner'}
            </button>
          </div>

          {heroBanners.length ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {heroBanners.map((banner) => (
                <div key={banner.id ?? banner.bannerKey ?? banner.title} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${banner.gradient ?? 'from-slate-200 via-slate-100 to-white'} opacity-20`} />
                  <div className="relative flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{banner.title}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{banner.headline}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${heroStatusStyles(banner.status)}`}>
                        {formatStatus(banner.status)}
                      </span>
                    </div>

                    {banner.audience ? (
                      <p className="text-sm text-slate-600">Audience: {banner.audience}</p>
                    ) : null}
                    <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                      Primary CTA: {banner.cta?.label ?? 'Configure call-to-action'}
                    </div>

                    <dl className="mt-auto grid grid-cols-2 gap-3 text-xs">
                      {banner.metrics?.length ? (
                        banner.metrics.map((metric) => (
                          <div key={`${banner.id ?? banner.bannerKey}-${metric.label}`} className="rounded-xl border border-white/70 bg-white/80 p-3">
                            <dt className="uppercase tracking-wide text-slate-400">{metric.label}</dt>
                            <dd className="mt-1 text-base font-semibold text-slate-900">{metric.value}</dd>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 text-slate-400">
                          No metrics logged yet
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-6 text-sm text-amber-700">
              No hero banners published yet. Add a spotlight banner to promote your flagship services and campaigns.
            </div>
          )}

          {heroFormOpen ? (
            <form onSubmit={handleAddHeroBanner} className="mt-6 space-y-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Title
                  <input
                    type="text"
                    value={heroDraft.title}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, title: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="SaaS launch accelerator"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Audience
                  <input
                    type="text"
                    value={heroDraft.audience}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, audience: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="High-growth tech founders"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Headline
                <input
                  type="text"
                  value={heroDraft.headline}
                  onChange={(event) => setHeroDraft((prev) => ({ ...prev, headline: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="Design systems that speed up product-market fit"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  CTA label
                  <input
                    type="text"
                    value={heroDraft.ctaLabel}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, ctaLabel: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="Book strategy intensive"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  CTA URL
                  <input
                    type="url"
                    value={heroDraft.ctaUrl}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, ctaUrl: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="https://"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={heroDraft.status}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, status: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {HERO_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Gradient utility classes
                  <input
                    type="text"
                    value={heroDraft.gradient}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, gradient: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="from-blue-500 via-indigo-500 to-violet-500"
                  />
                </label>
              </div>
              {heroError ? <p className="text-sm text-rose-600">{heroError}</p> : null}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={heroSaving}
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {heroSaving ? 'Saving…' : 'Save hero banner'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeroFormOpen(false);
                    setHeroDraft(initialHeroDraft);
                    setHeroError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
      sections={[]}
      profile={profile}
      availableDashboards={availableDashboards}
    >
      <>
        <AgencyCollaborationsPanel
          data={collaborationsState.data}
          loading={collaborationsState.loading}
          error={collaborationsState.error}
          onRetry={loadCollaborations}
        />

        {capabilitySections.map((section) => (
          <section
            key={section.title}
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{section.title}</h2>
                {section.description ? (
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p>
                ) : null}
              </div>
              {section.meta ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                  {section.meta}
                </div>
              ) : null}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {section.features.map((feature) => (
                <div
                  key={feature.name}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{feature.name}</h3>
                    {feature.description ? (
                      <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                    ) : null}
                    {feature.bulletPoints?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {feature.bulletPoints.map((point) => (
                          <li key={point} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {feature.callout ? (
                    <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                      {feature.callout}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </>
      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DataStatus
            loading={loading}
            error={error?.message}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRetry={refresh}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveState !== 'idle'}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className={`h-4 w-4 ${saveState === 'saving' ? 'animate-spin' : ''}`} />
              {saveState === 'saving' ? 'Saving…' : formDirty ? 'Save draft' : 'Saved'}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={saveState !== 'idle'}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              <SparklesIcon className={`h-4 w-4 ${saveState === 'publishing' ? 'animate-pulse' : ''}`} />
              {saveState === 'publishing' ? 'Publishing…' : 'Publish gig'}
            </button>
          </div>
        </div>

        {statusMessage ? (
          <div
            className={`rounded-3xl border p-4 text-sm ${
              statusMessage.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {statusMessage.text}
          </div>
        ) : null}

        <GigOverviewSection form={form} onFieldChange={handleFieldChange} health={gigComposer?.health} metrics={gigComposer?.metrics} />
        <PricingMatrixSection packages={form.packages} onChange={handlePackageChange} onAdd={handleAddPackage} onRemove={handleRemovePackage} />
        <AvailabilitySection
          availability={form.availability}
          onAvailabilityChange={handleAvailabilityChange}
          onSlotChange={handleSlotChange}
          onAddSlot={handleAddSlot}
          onRemoveSlot={handleRemoveSlot}
        />
        <BannerSection form={form} onBannerChange={handleBannerChange} />
        <AddOnsSection addOns={form.addOns} onChange={handleAddOnChange} onAdd={handleAddAddOn} onRemove={handleRemoveAddOn} />
      <div className="space-y-6">
        <ClientPortalSummary
          portal={portal}
          timelineSummary={timelineSummary}
          scopeSummary={scopeSummary}
          decisionSummary={decisionSummary}
          loading={loading}
          error={error}
          onRetry={handleRetry}
        />
        <div className="grid gap-6 xl:grid-cols-3">
          <ClientPortalTimeline
            className="xl:col-span-2"
            events={portalData?.timeline?.events ?? []}
            summary={timelineSummary}
            loading={loading}
          />
          <ClientPortalInsightWidgets className="xl:col-span-1" insights={portalData?.insights ?? {}} />
        </div>
        <ClientPortalScopeSummary scope={portalData?.scope ?? {}} />
        <ClientPortalDecisionLog decisions={portalData?.decisions ?? {}} />
      onMenuItemSelect={handleMenuSelect}
      selectedMenuItemKey={showLearningHub ? 'learning-hub' : undefined}
    >
      {showLearningHub ? (
        <LearningHubSection
          data={learningHubState.data}
          isLoading={learningHubState.loading}
          error={learningHubState.error}
          fromCache={learningHubState.fromCache}
          onRefresh={() => learningHubState.refresh?.({ force: true })}
          summaryCards={learningHubState.summaryCards}
          upcomingRenewal={learningHubState.upcomingRenewalCopy}
        />
      ) : null}
    >
      <div className="space-y-10">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p className="font-semibold">Unable to load purchased gig data.</p>
            <p className="mt-1 text-rose-600/80">{error.message ?? 'Please try refreshing the workspace.'}</p>
          </div>
        ) : null}

        <section
          id="purchased-gigs"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Purchased gig control center</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Track every purchased gig with a clear view of intake requirements, production progress, revision cycles, and
                upcoming payouts. Stay ahead of client expectations and cash flow.
              </p>
              {fromCache ? (
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Served from cache — refresh to see the latest data.
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refresh({ force: true })}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                disabled={loading}
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
                Refresh data
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBackground}`}>
                    <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</p>
                {card.hint ? <p className="mt-1 text-xs text-slate-500">{card.hint}</p> : null}
              </article>
            ))}
          </div>

          <div className="mt-10 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Order pipeline</h3>
                <p className="text-sm text-slate-600">
                  Monitor purchased gigs across the delivery journey. Each column highlights immediate actions to keep clients
                  informed and momentum strong.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {pipelineStages.map((stage) => (
                <div key={stage.key} className={`flex min-h-[320px] flex-col rounded-3xl border ${stage.accent} bg-white p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stage</p>
                      <h4 className="text-base font-semibold text-slate-900">{stage.label}</h4>
                      <p className="mt-1 text-xs text-slate-500">{stage.description}</p>
                    </div>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow">{stage.orders.length}</span>
                  </div>

                  <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
                    {stage.orders.length ? (
                      stage.orders.map((order) => {
                        const orderNumber = order.orderNumber ?? `#${order.id}`;
                        const gigTitle = order.gig?.title ?? 'Gig order';
                        const clientName = order.clientCompanyName ?? order.client?.name ?? 'Client';
                        const activeRevision = order.revisions?.find((revision) =>
                          ['requested', 'in_progress', 'submitted'].includes(revision.status),
                        );

                        return (
                          <article key={order.id} className="rounded-2xl border border-white/40 bg-white/90 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{orderNumber}</p>
                                <h5 className="text-sm font-semibold text-slate-900">{gigTitle}</h5>
                                <p className="text-xs text-slate-500">{clientName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Due</p>
                                <p className="text-xs text-slate-500">
                                  {order.dueAt ? formatAbsolute(order.dueAt, { dateStyle: 'medium' }) : 'TBD'}
                                </p>
                                {order.dueAt ? (
                                  <p className="text-[11px] font-medium text-slate-500">{formatRelativeTime(order.dueAt)}</p>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-2 flex-1 rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full bg-blue-500 transition-all"
                                  style={{ width: `${order.progressPercent ?? 0}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-slate-500">{order.progressPercent ?? 0}%</span>
                            </div>

                            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                              <div>
                                <dt className="font-semibold uppercase tracking-wide text-slate-400">Pipeline value</dt>
                                <dd className="font-medium text-slate-700">
                                  {formatCurrency(order.amount ?? 0, order.currencyCode ?? currency)}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-semibold uppercase tracking-wide text-slate-400">Requirements</dt>
                                <dd className="font-medium text-slate-700">{order.requirementsOutstanding ?? 0} pending</dd>
                              </div>
                            </dl>

                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {order.requirementsOutstanding ? (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                                  {order.requirementsOutstanding} requirement
                                  {order.requirementsOutstanding > 1 ? 's' : ''} outstanding
                                </span>
                              ) : null}
                              {order.revisionCycles ? (
                                <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
                                  {order.revisionCycles} revision cycle{order.revisionCycles > 1 ? 's' : ''}
                                </span>
                              ) : null}
                              {activeRevision?.dueAt ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                                  Revision due {formatRelativeTime(activeRevision.dueAt)}
                                </span>
                              ) : null}
                              {order.completedAt ? (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                                  Completed {formatRelativeTime(order.completedAt)}
                                </span>
                              ) : null}
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500">No orders in this stage.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Requirements desk</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Follow up on outstanding questionnaires, files, and brand assets. Keep clients accountable so delivery can begin on
                  schedule.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {requirementQueue.length ? (
                requirementQueue.map((entry) => {
                  const outstanding = entry.items.filter((item) => item.status !== 'received').length;
                  const dueLabel = entry.dueAt ? formatRelativeTime(entry.dueAt) : 'Date TBD';

                  return (
                    <article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{entry.orderNumber}</p>
                          <p className="text-sm font-medium text-slate-900">{entry.clientCompanyName}</p>
                          <p className="text-xs text-slate-500">Point of contact: {entry.clientContactName ?? 'Client team'}</p>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due {dueLabel}</span>
                          <span className="text-xs text-slate-500">
                            {entry.dueAt ? formatAbsolute(entry.dueAt, { dateStyle: 'medium' }) : 'Awaiting schedule'}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${
                              outstanding ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {outstanding ? `${outstanding} outstanding` : 'All items received'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600">Priority: {formatPriority(entry.priority)}</span>
                      </div>
                      <ul className="mt-4 space-y-3">
                        {entry.items.map((item, index) => (
                          <li key={`${item.label}-${index}`} className="flex gap-3 text-sm text-slate-600">
                            {item.status === 'received' ? (
                              <CheckCircleIcon className="mt-0.5 h-5 w-5 text-emerald-500" />
                            ) : (
                              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-amber-500" />
                            )}
                            <div>
                              <p className="font-medium text-slate-700">{item.label}</p>
                              {item.status === 'received' ? (
                                <p className="text-xs text-slate-500">
                                  Received {entry.receivedAt ? formatRelativeTime(entry.receivedAt) : 'and archived'}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-500">Awaiting client submission</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No outstanding requirements. Great job keeping clients on track.</p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Revision control</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Manage client feedback loops with clear deadlines, scope, and impact on your delivery schedule.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {revisionQueue.length ? (
                revisionQueue.map((revision) => (
                  <article key={revision.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{revision.orderNumber}</p>
                        <p className="text-sm font-medium text-slate-900">{revision.clientCompanyName}</p>
                        <p className="text-xs text-slate-500">Round {revision.roundNumber}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {revision.dueAt ? `Due ${formatRelativeTime(revision.dueAt)}` : 'Awaiting submission'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {revision.dueAt ? formatAbsolute(revision.dueAt, { dateStyle: 'medium' }) : 'Date TBD'}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${
                            revision.severity === 'high'
                              ? 'bg-rose-100 text-rose-700'
                              : revision.severity === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          Severity: {revision.severity ?? 'medium'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-600">
                        Status: {resolveRevisionStatusLabel(revision.status)}
                      </span>
                      {revision.submittedAt ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                          Submitted {formatRelativeTime(revision.submittedAt)}
                        </span>
                      ) : null}
                    </div>
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                      {revision.focusAreas?.length
                        ? revision.focusAreas.map((focus, index) => <li key={`${revision.id}-focus-${index}`}>{focus}</li>)
                        : <li>No focus areas recorded.</li>}
                    </ul>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">No active revision cycles right now.</p>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Payout runway</h2>
              <p className="mt-2 text-sm text-slate-600">
                Keep cash flow predictable by tracking upcoming releases, at-risk milestones, and completed payouts.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {payoutSchedule.length ? (
              payoutSchedule.map((payout) => {
                const statusStyle = payoutStatusStyles[payout.status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                const expectedLabel = payout.expectedAt ? formatRelativeTime(payout.expectedAt) : 'Date TBD';

                return (
                  <article key={payout.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{payout.orderNumber}</p>
                        <p className="text-sm font-semibold text-slate-900">{payout.clientCompanyName}</p>
                        <p className="text-xs text-slate-500">{payout.milestoneLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {payout.status === 'released' ? 'Released' : 'Expected'} {expectedLabel}
                        </p>
                        <p className="text-xs text-slate-500">
                          {payout.status === 'released'
                            ? formatAbsolute(payout.releasedAt ?? payout.expectedAt, { dateStyle: 'medium' })
                            : payout.expectedAt
                            ? formatAbsolute(payout.expectedAt, { dateStyle: 'medium' })
                            : 'Awaiting schedule'}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {formatCurrency(payout.amount ?? 0, payout.currencyCode ?? currency)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <span className={`rounded-full border px-3 py-1 ${statusStyle}`}>{payout.status.replace('_', ' ')}</span>
                      {payout.riskNote ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{payout.riskNote}</span>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No payouts scheduled. Close out milestones to queue earnings for release.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Activity timeline</h2>
              <p className="mt-2 text-sm text-slate-600">
                Review the latest order events, client communications, requirement submissions, and payout updates.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {activityFeed.length ? (
              activityFeed.map((activity) => (
                <article key={activity.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {activity.order?.orderNumber ?? 'Timeline event'}
                      </p>
                      <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-500">
                        {activity.order?.clientCompanyName ? `${activity.order.clientCompanyName} • ` : ''}
                        {resolveActivityTypeLabel(activity.activityType)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{activity.occurredAt ? formatAbsolute(activity.occurredAt, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</p>
                      {activity.occurredAt ? <p>{formatRelativeTime(activity.occurredAt)}</p> : null}
                    </div>
                  </div>
                  {activity.description ? <p className="mt-3 text-sm text-slate-600">{activity.description}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {activity.actor ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-600">
                        {activity.actor.firstName} {activity.actor.lastName}
                      </span>
                    ) : null}
                    {activity.order?.gig?.title ? (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{activity.order.gig.title}</span>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent activity yet. New order events will appear here in real-time.</p>
            )}
          </div>
        </section>

        {isInitialLoading ? (
          <p className="text-center text-sm text-slate-500">Loading purchased gig data…</p>
        ) : null}
  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer workspace"
      subtitle="Gig manager"
      description="Command your gig pipeline, fulfillment milestones, bundled services, and upsell playbooks from a single workspace."
      menuSections={menuSections}
      sections={CAPABILITY_SECTIONS}
      profile={profileCard}
    >
      <div className="space-y-8">
        {error ? <ErrorState message={error.message} onRetry={handleRefresh} /> : null}
        {loading && !snapshot ? <LoadingState /> : null}
        {snapshot ? (
          <GigManagerPanel
            metrics={metrics}
            pipeline={pipeline}
            milestones={milestones}
            bundles={bundles}
            upsells={upsells}
            catalog={catalog}
            summary={snapshot.summary}
            onRefresh={handleRefresh}
            loading={loading}
          />
        ) : null}
        {CAPABILITY_SECTIONS.map((section) => (
          <CapabilitySection key={section.title} section={section} />
        ))}
      title="Project workspace command centre"
      subtitle="Service delivery"
      description="Coordinate briefs, assets, conversations, and approvals from a unified freelancer workspace."
      menuSections={menuSections}
      sections={sections}
      sections={[]}
      profile={profile}
    >
      <div className="space-y-10">
        <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(30,64,175,0.4)] sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/90">Workspace dashboard</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
                  {project?.title || 'Select a project workspace'}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                  {project?.description ||
                    'Load a project workspace to review delivery velocity, collaboration pulse, and approval readiness.'}
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <label htmlFor="project-id-input" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Project ID
                </label>
                <input
                  id="project-id-input"
                  type="text"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  className="w-40 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. 42"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadWorkspace(projectId || DEFAULT_PROJECT_ID)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {loading ? 'Loading…' : 'Load workspace'}
                  </button>
                  <DataStatus
                    loading={loading}
                    fromCache={false}
                    lastUpdated={lastLoadedAt}
                    onRefresh={() => loadWorkspace(projectId)}
                  />
                </div>
              </div>
            </div>
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Unable to sync the workspace. {error.message || 'Please verify the project ID and try again.'}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {metricCards.map((card) => (
                <div
                  key={card.label}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</p>
                    <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
                  </div>
                  {card.render ? <div>{card.render}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <form
            onSubmit={handleBriefSubmit}
            className="flex h-full flex-col rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Workspace brief</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Align objectives, deliverables, and stakeholders to keep delivery teams and clients in lock-step.
                </p>
              </div>
              {brief?.updatedAt ? (
                <p className="text-xs text-slate-400">Updated {formatRelativeTime(brief.updatedAt)}</p>
              ) : null}
            </div>
            <div className="mt-6 space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-title">
                  Brief title
                </label>
                <input
                  id="brief-title"
                  type="text"
                  value={briefDraft.title}
                  onChange={handleBriefFieldChange('title')}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Workspace brief title"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-summary">
                  Summary
                </label>
                <textarea
                  id="brief-summary"
                  value={briefDraft.summary}
                  onChange={handleBriefFieldChange('summary')}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Describe the engagement scope, success definition, and any constraints."
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-objectives">
                    Objectives
                  </label>
                  <textarea
                    id="brief-objectives"
                    value={briefDraft.objectives}
                    onChange={handleBriefFieldChange('objectives')}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="One objective per line"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-deliverables">
                    Deliverables
                  </label>
                  <textarea
                    id="brief-deliverables"
                    value={briefDraft.deliverables}
                    onChange={handleBriefFieldChange('deliverables')}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="List key deliverables per line"
                  />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-metrics">
                    Success metrics
                  </label>
                  <textarea
                    id="brief-metrics"
                    value={briefDraft.successMetrics}
                    onChange={handleBriefFieldChange('successMetrics')}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="List measurable KPIs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="brief-stakeholders">
                    Client stakeholders
                  </label>
                  <textarea
                    id="brief-stakeholders"
                    value={briefDraft.clientStakeholders}
                    onChange={handleBriefFieldChange('clientStakeholders')}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="One stakeholder per line"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {saving ? 'Saving…' : 'Save brief'}
              </button>
            </div>
          </form>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <h3 className="text-xl font-semibold text-slate-900">Delivery governance</h3>
            <p className="mt-2 text-sm text-slate-600">
              Track billing status, automation coverage, and milestone readiness to keep stakeholders informed.
            </p>
            <dl className="mt-6 grid gap-4 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="font-medium text-slate-500">Billing status</dt>
                <dd className="font-semibold text-slate-800">{deriveStatusLabel(workspace?.billingStatus)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="font-medium text-slate-500">Automation coverage</dt>
                <dd className="font-semibold text-slate-800">{formatPercent(metrics.automationCoverage)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="font-medium text-slate-500">Active automation runs</dt>
                <dd className="font-semibold text-slate-800">{metrics.automationRuns ?? 0}</dd>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Last activity {workspace?.lastActivityAt ? formatRelativeTime(workspace.lastActivityAt) : 'not yet recorded'}.{' '}
                {workspace?.lastActivityAt ? `(${formatAbsolute(workspace.lastActivityAt)})` : ''}
              </div>
            </dl>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Active whiteboards</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Visual alignment across squads with participation insights and latest updates.
                </p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {whiteboards.length} boards
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {whiteboards.length ? (
                whiteboards.map((board) => (
                  <div key={board.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{deriveStatusLabel(board.status)}</p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">{board.title}</h4>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(board.status)}`}>
                        {deriveStatusLabel(board.status)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span>Owner: {board.ownerName || 'Unassigned'}</span>
                      <span>Updated {formatRelativeTime(board.updatedAt || board.lastEditedAt)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {board.activeCollaborators?.map((collaborator) => (
                        <span
                          key={`${board.id}-${collaborator}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1"
                        >
                          <UserAvatar name={collaborator} seed={collaborator} size="xs" showGlow={false} />
                          {collaborator}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Whiteboards will appear here once collaborators publish canvases to this workspace.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">File library</h3>
                <p className="mt-1 text-sm text-slate-600">Versioned assets, ops documents, and creative files with provenance.</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {formatBytes(metrics.totalAssetsSizeBytes)}
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {files.length ? (
                files.map((file) => (
                  <div key={file.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          {file.category ? deriveStatusLabel(file.category) : 'General'} · {file.version ? `v${file.version}` : 'latest'}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                        {formatBytes(file.sizeBytes)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Uploaded {formatRelativeTime(file.uploadedAt || file.updatedAt)}</span>
                      {file.tags?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {file.tags.map((tag) => (
                            <span
                              key={`${file.id}-${tag}`}
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Upload briefs, assets, and proofing files to populate the workspace library.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Conversation pulse</h3>
                <p className="mt-1 text-sm text-slate-600">Keep project, client, and operations channels in sync.</p>
              </div>
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700">
                {conversations.length} channels
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {conversations.length ? (
                conversations.map((conversation) => (
                  <div key={conversation.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {conversation.channelType}
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">{conversation.topic}</h4>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${priorityBadgeClass(conversation.priority)}`}
                      >
                        {deriveStatusLabel(conversation.priority)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{conversation.lastMessagePreview || 'No recent updates posted.'}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span>
                        Last message {conversation.lastMessageAt ? formatRelativeTime(conversation.lastMessageAt) : '—'}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {conversation.unreadCount} unread
                        </span>
                        <button
                          type="button"
                          onClick={() => handleConversationAcknowledge(conversation.id, conversation.priority)}
                          disabled={saving || conversation.unreadCount === 0}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Mark as read
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Conversations will populate once your team and clients start collaborating in this workspace.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Approvals & gates</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Track decision owners, due dates, and unblock checkpoints for delivery.
                </p>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                {metrics.pendingApprovals ?? 0} pending
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {approvals.length ? (
                approvals.map((approval) => (
                  <div key={approval.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{approval.stage}</p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">{approval.title}</h4>
                        <p className="mt-2 text-xs text-slate-500">
                          Owner {approval.ownerName || 'Unassigned'} · Approver {approval.approverEmail || 'TBC'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(approval.status)}`}
                      >
                        {deriveStatusLabel(approval.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span>
                        Due {approval.dueAt ? `${formatRelativeTime(approval.dueAt)} (${formatAbsolute(approval.dueAt)})` : 'No due date'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprovalDecision(approval.id, 'in_review')}
                          disabled={saving}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Move to review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprovalDecision(approval.id, 'approved')}
                          disabled={saving}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprovalDecision(approval.id, 'changes_requested')}
                          disabled={saving}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Request changes
                        </button>
                      </div>
                    </div>
                    {approval.decisionNotes ? (
                      <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                        Notes: {approval.decisionNotes}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Approvals will populate once deliverables move into review stages.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

