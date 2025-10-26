import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  HandThumbUpIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { useAgencyOverview } from '../../hooks/useAgencyOverview.js';
import useAgencyDashboard from '../../hooks/useAgencyDashboard.js';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import useGigOrderDetail from '../../hooks/useGigOrderDetail.js';
import useAgencyWorkforceDashboard from '../../hooks/useAgencyWorkforceDashboard.js';
import { buildAgencyDashboardSections } from './agency/sections/dashboardSectionsRegistry.js';
import { AgencySupportSection, AgencyInboxSection, AgencyWalletSection } from './agency/sections/index.js';

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user', 'headhunter'];

const MENU_SECTIONS = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'agency-overview', name: 'Home', sectionId: 'agency-overview' },
      { id: 'agency-management', name: 'Agency management', sectionId: 'agency-management' },
      { id: 'agency-hr', name: 'HR management', sectionId: 'agency-hr' },
      { id: 'agency-crm', name: 'CRM pipeline', sectionId: 'agency-crm' },
      { id: 'agency-payments', name: 'Payments', sectionId: 'agency-payments' },
      { id: 'agency-job-applications', name: 'Job applications', sectionId: 'agency-job-applications' },
      { id: 'agency-gig-management', name: 'Gigs', sectionId: 'agency-gig-management' },
      { id: 'agency-escrow', name: 'Escrow', sectionId: 'agency-escrow' },
      { id: 'agency-finance', name: 'Finance', sectionId: 'agency-finance' },
      { id: 'agency-gig-workspace', name: 'Gig workspace', sectionId: 'agency-gig-workspace' },
      { id: 'agency-inbox', name: 'Inbox', sectionId: 'agency-inbox' },
      { id: 'agency-wallet', name: 'Wallet', sectionId: 'agency-wallet' },
      { id: 'agency-hub', name: 'Hub', sectionId: 'agency-hub' },
      { id: 'agency-creation-studio', name: 'Creation Studio', sectionId: 'agency-creation-studio' },
    ],
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    items: [
      { id: 'agency-disputes', name: 'Disputes', href: '/dashboard/agency/disputes' },
      { id: 'agency-wallet', name: 'Wallet', href: '/dashboard/agency/wallet' },
      { id: 'agency-inbox', name: 'Inbox', href: '/inbox' },
    ],
  },
];

const SECTIONS = [
  { id: 'agency-overview', label: 'Home' },
  { id: 'agency-management', label: 'Agency management' },
  { id: 'agency-hr', label: 'HR management' },
  { id: 'agency-crm', label: 'CRM pipeline' },
  { id: 'agency-payments', label: 'Payments' },
  { id: 'agency-job-applications', label: 'Job applications' },
  { id: 'agency-gig-management', label: 'Gig management' },
  { id: 'agency-escrow', label: 'Escrow' },
  { id: 'agency-finance', label: 'Finance' },
  { id: 'agency-gig-workspace', label: 'Gig workspace' },
  { id: 'agency-inbox', label: 'Inbox' },
  { id: 'agency-wallet', label: 'Wallet' },
  { id: 'agency-hub', label: 'Hub' },
  { id: 'agency-creation-studio', label: 'Creation Studio' },
];

function parseWorkspaceId(rawValue) {
  if (rawValue == null || rawValue === '') {
    return undefined;
  }
  const numeric = Number.parseInt(rawValue, 10);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeRoles(memberships = []) {
  return memberships.map((role) => `${role}`.toLowerCase());
}

function formatCurrency(amount, currency = 'USD') {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch (error) {
    return `${currency} ${Math.round(numeric)}`;
  }
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Number(value));
}

function parseMetricNumber(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const numeric = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function clampPercent(value) {
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.min(100, Math.max(0, value));
}

export default function AgencyDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, isAuthenticated } = useSession();

  const memberships = useMemo(
    () => normalizeRoles(session?.memberships ?? session?.roles ?? []),
    [session?.memberships, session?.roles],
  );
  const isAgencyMember = memberships.some((role) => ['agency', 'agency_admin', 'admin'].includes(role));
  const canManageOverview = memberships.some((role) => ['agency_admin', 'admin'].includes(role));

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isAgencyMember) {
      const fallback = session?.primaryDashboard || memberships.find((role) => role !== 'agency') || 'user';
      navigate(`/dashboard/${fallback}`, { replace: true });
    }
  }, [isAuthenticated, isAgencyMember, navigate, session?.primaryDashboard, memberships]);

  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug') ?? undefined;
  const workspaceId = parseWorkspaceId(workspaceIdParam);

  const {
    data: overviewPayload,
    loading: overviewLoading,
    error: overviewError,
    fromCache: overviewFromCache,
    lastUpdated: overviewLastUpdated,
    refresh: refreshOverview,
    save: saveOverview,
    saving: overviewSaving,
  } = useAgencyOverview({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    enabled: isAuthenticated && isAgencyMember,
  });

  const workspaceOptions = overviewPayload?.meta?.availableWorkspaces ?? [];
  const selectedWorkspaceId = workspaceIdParam
    || (overviewPayload?.workspace?.id ? `${overviewPayload.workspace.id}` : workspaceOptions[0]?.id ?? '');

  useEffect(() => {
    const selected = overviewPayload?.meta?.selectedWorkspaceId;
    if (!workspaceIdParam && selected) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${selected}`);
        next.delete('workspaceSlug');
        return next;
      }, { replace: true });
    }
  }, [overviewPayload?.meta?.selectedWorkspaceId, setSearchParams, workspaceIdParam]);

  const handleWorkspaceChange = useCallback(
    (event) => {
      const nextId = event.target.value;
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (nextId) {
          next.set('workspaceId', nextId);
          next.delete('workspaceSlug');
        } else {
          next.delete('workspaceId');
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const overview = overviewPayload?.overview ?? null;
  const workspace = overviewPayload?.workspace ?? null;

  const {
    data: agencyDashboard,
    loading: dashboardLoading,
    error: dashboardError,
    fromCache: dashboardFromCache,
    lastUpdated: dashboardLastUpdated,
    refresh: refreshAgencyDashboard,
  } = useAgencyDashboard({
    workspaceId,
    workspaceSlug: workspaceSlugParam,
    enabled: isAuthenticated && isAgencyMember,
  });

  const effectiveWorkspaceId = workspace?.id ?? workspaceId ?? overviewPayload?.meta?.selectedWorkspaceId ?? undefined;

  const workforceDashboard = useAgencyWorkforceDashboard({
    workspaceId: effectiveWorkspaceId,
    enabled: isAuthenticated && isAgencyMember,
  });

  const ownerId = useMemo(
    () => agencyDashboard?.workspace?.ownerId ?? session?.id ?? null,
    [agencyDashboard?.workspace?.ownerId, session?.id],
  );

  const projectGigResource = useProjectGigManagement(ownerId);
  const {
    data: projectGigData,
    loading: projectLoading,
    error: projectError,
    actions: projectActions,
    reload: reloadProject,
  } = projectGigResource;

  const orders = useMemo(() => projectGigData?.purchasedGigs?.orders ?? [], [projectGigData]);
  const [selectedOrderId, setSelectedOrderId] = useState(() => (orders.length ? orders[0].id : null));

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId(null);
      return;
    }
    setSelectedOrderId((previous) => {
      if (previous && orders.some((order) => order.id === previous)) {
        return previous;
      }
      return orders[0].id;
    });
  }, [orders]);

  const {
    data: orderDetail,
    loading: orderLoading,
    error: orderError,
    actions: orderActions,
    refresh: refreshOrder,
    pendingAction,
  } = useGigOrderDetail(ownerId, selectedOrderId);

  const [creatingGig, setCreatingGig] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const handleRefreshGigData = useCallback(async () => {
    await Promise.all([
      refreshAgencyDashboard({ force: true }),
      reloadProject(),
    ]);
    if (selectedOrderId) {
      await refreshOrder();
    }
  }, [refreshAgencyDashboard, reloadProject, refreshOrder, selectedOrderId]);

  const handleCreateGig = useCallback(
    async (payload) => {
      if (!projectActions?.createGigOrder) return;
      setCreatingGig(true);
      try {
        const response = await projectActions.createGigOrder(payload);
        await handleRefreshGigData();
        if (response?.order?.id) {
          setSelectedOrderId(response.order.id);
        }
      } finally {
        setCreatingGig(false);
      }
    },
    [projectActions, handleRefreshGigData],
  );

  const handleUpdateOrder = useCallback(
    async (orderIdValue, payload) => {
      if (!projectActions?.updateGigOrder) return;
      setUpdatingOrderId(orderIdValue);
      try {
        await projectActions.updateGigOrder(orderIdValue, payload);
        await refreshOrder();
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [projectActions, refreshOrder],
  );

  const handleReopenOrder = useCallback(
    async (order) => {
      if (!order || !projectActions?.updateGigOrder) return;
      const fallbackDate = order.dueAt ? new Date(order.dueAt) : new Date();
      const normalized = new Date(
        fallbackDate.getFullYear(),
        fallbackDate.getMonth(),
        fallbackDate.getDate() + 7,
      )
        .toISOString()
        .slice(0, 10);
      setUpdatingOrderId(order.id);
      try {
        await projectActions.updateGigOrder(order.id, {
          status: 'in_delivery',
          dueAt: normalized,
          progressPercent: order.progressPercent ?? 0,
        });
        setSelectedOrderId(order.id);
        await refreshOrder();
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [projectActions, refreshOrder],
  );

  const handleAddTimelineEvent = useCallback(
    (payload) => orderActions?.addTimelineEvent?.(payload),
    [orderActions],
  );

  const handleCreateSubmission = useCallback(
    (payload) => orderActions?.createSubmission?.(payload),
    [orderActions],
  );

  const handleUpdateSubmission = useCallback(
    (submissionId, payload) => orderActions?.updateSubmission?.(submissionId, payload),
    [orderActions],
  );

  const handleSendMessage = useCallback(
    (payload) => orderActions?.sendMessage?.(payload),
    [orderActions],
  );

  const handleAcknowledgeMessage = useCallback(
    (messageId) => orderActions?.acknowledgeMessage?.(messageId),
    [orderActions],
  );

  const studioInsights = agencyDashboard?.operations?.gigPrograms?.studio ?? {};
  const gigSummary = studioInsights.summary ?? null;
  const gigDeliverables = studioInsights.deliverables ?? null;
  const financeSnapshot = agencyDashboard?.finance ?? {};
  const workforceMetrics = useMemo(() => {
    const entries = Array.isArray(workforceDashboard.summaryCards) ? workforceDashboard.summaryCards : [];
    return entries.reduce((accumulator, card) => {
      if (!card) {
        return accumulator;
      }
      const key = card.id ?? card.label;
      if (key) {
        accumulator[key] = card;
      }
      return accumulator;
    }, {});
  }, [workforceDashboard.summaryCards]);

  const headcountValue = parseMetricNumber(workforceMetrics.headcount?.value);
  const activeMemberCount = parseMetricNumber(workforceMetrics.active?.value);
  const benchHoursValue = parseMetricNumber(workforceMetrics.benchHours?.value);
  const utilisationPercent = clampPercent(parseMetricNumber(workforceMetrics.utilisation?.value));
  const benchCapacity = useMemo(() => {
    if (headcountValue == null || activeMemberCount == null) {
      return null;
    }
    return Math.max(0, headcountValue - activeMemberCount);
  }, [headcountValue, activeMemberCount]);
  const trustScore = clampPercent(parseMetricNumber(overview?.trustScore));
  const ratingScore = parseMetricNumber(overview?.rating);
  const gigStats = useMemo(() => {
    const stats = projectGigData?.purchasedGigs?.stats ?? {};
    const submissionStats = projectGigData?.purchasedGigs?.submissions?.stats ?? {};
    return {
      ...stats,
      awaitingReview: stats.awaitingReview ?? submissionStats.pending ?? 0,
      pendingClient: stats.pendingClient ?? submissionStats.pending ?? 0,
    };
  }, [projectGigData]);
  const boardMetrics = useMemo(() => projectGigData?.board?.metrics ?? {}, [projectGigData]);
  const autoMatchSnapshot = useMemo(() => {
    const snapshot = projectGigData?.autoMatch ?? {};
    if (snapshot.summary && typeof snapshot.readyCount !== 'number') {
      return { ...snapshot, readyCount: snapshot.summary.readyCount ?? 0 };
    }
    return snapshot;
  }, [projectGigData]);

  const activeOrdersCount = useMemo(
    () => orders.filter((order) => order?.status !== 'completed').length,
    [orders],
  );

  const dueSoonCount = useMemo(() => {
    const now = Date.now();
    const sevenDays = 1000 * 60 * 60 * 24 * 7;
    return orders.filter((order) => {
      if (!order?.dueAt) {
        return false;
      }
      const due = new Date(order.dueAt).getTime();
      if (Number.isNaN(due)) {
        return false;
      }
      return due - now <= sevenDays && due >= now && order?.status !== 'completed';
    }).length;
  }, [orders]);

  const averageProgress = useMemo(() => {
    const progressEntries = orders
      .map((order) => Number(order?.progressPercent ?? order?.progress ?? 0))
      .filter((value) => Number.isFinite(value));
    if (!progressEntries.length) {
      return 0;
    }
    const total = progressEntries.reduce((sum, value) => sum + value, 0);
    return Math.round(total / progressEntries.length);
  }, [orders]);

  const pipelineCurrency = financeSnapshot.currency || agencyDashboard?.workspace?.currency || 'USD';

  const [activeMenuItem, setActiveMenuItem] = useState('agency-overview');

  const handleMenuItemSelect = useCallback((itemId, item) => {
    setActiveMenuItem(itemId);
    if (item?.href) {
      return;
    }
    const targetId = item?.sectionId ?? itemId;
    if (targetId && typeof document !== 'undefined') {
      const element = document.getElementById(targetId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const financeHighlights = useMemo(() => {
    const currency = financeSnapshot.currency || agencyDashboard?.workspace?.currency || 'USD';
    const items = [
      { id: 'runRate', label: 'Revenue run-rate', value: financeSnapshot.runRate, helper: financeSnapshot.runRateHint },
      { id: 'invoiced', label: 'Invoices sent', value: financeSnapshot.invoiced, helper: financeSnapshot.invoicedHint },
      { id: 'payouts', label: 'Payouts processed', value: financeSnapshot.payouts, helper: financeSnapshot.payoutsHint },
      { id: 'margin', label: 'Gross margin', value: financeSnapshot.margin, helper: financeSnapshot.marginHint },
    ];
    return items
      .filter((item) => item.value != null)
      .map((item) => ({
        ...item,
        formatted: typeof item.value === 'string' && item.value.includes('%')
          ? item.value
          : formatCurrency(item.value, currency),
      }));
  }, [financeSnapshot, agencyDashboard?.workspace?.currency]);

  const gigError = projectError || orderError;

  const awaitingReviewCount = gigStats.awaitingReview ?? gigStats.pendingClient ?? 0;
  const runRateDisplay = financeSnapshot.runRate != null
    ? formatCurrency(financeSnapshot.runRate, pipelineCurrency)
    : '—';

  const pipelineInsights = useMemo(
    () => [
      {
        id: 'active-gigs',
        label: 'Active gigs',
        value: formatNumber(activeOrdersCount),
        description: 'Orders currently moving through delivery teams.',
      },
      {
        id: 'due-soon',
        label: 'Due within 7 days',
        value: formatNumber(dueSoonCount),
        description: 'Deliverables requiring attention this week.',
      },
      {
        id: 'awaiting-review',
        label: 'Awaiting review',
        value: formatNumber(awaitingReviewCount),
        description: 'Submissions awaiting agency approval.',
      },
      {
        id: 'average-progress',
        label: 'Average progress',
        value: `${Math.max(0, Math.min(100, averageProgress))}%`,
        description: 'Blended completion across live gig orders.',
      },
      {
        id: 'revenue-run-rate',
        label: 'Revenue run-rate',
        value: runRateDisplay,
        description: 'Annualised revenue for the selected workspace.',
      },
    ],
    [activeOrdersCount, dueSoonCount, awaitingReviewCount, averageProgress, runRateDisplay],
  );

  const numericMargin = useMemo(() => {
    if (financeSnapshot.margin == null) {
      return null;
    }
    if (typeof financeSnapshot.margin === 'string') {
      const parsed = Number.parseFloat(financeSnapshot.margin);
      return Number.isFinite(parsed) ? parsed : null;
    }
    const numeric = Number(financeSnapshot.margin);
    return Number.isFinite(numeric) ? numeric : null;
  }, [financeSnapshot.margin]);

  const overdueInvoicesCount = useMemo(() => {
    const candidates = [financeSnapshot.overdueInvoices, financeSnapshot.unpaidInvoices, financeSnapshot.awaitingPayment];
    for (const candidate of candidates) {
      if (candidate == null) {
        continue;
      }
      const numeric = Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    }
    return 0;
  }, [financeSnapshot.awaitingPayment, financeSnapshot.overdueInvoices, financeSnapshot.unpaidInvoices]);

  const marginDisplay = numericMargin != null ? `${numericMargin.toFixed(1)}%` : null;
  const utilisationDisplay = utilisationPercent != null ? `${utilisationPercent.toFixed(1)}%` : null;
  const benchHoursDisplay = benchHoursValue != null ? `${benchHoursValue.toFixed(1)}` : null;

  const executiveSignals = useMemo(() => {
    const signals = [];
    if (trustScore != null) {
      signals.push({
        id: 'trust-score',
        label: 'Trust score',
        value: `${Math.round(trustScore)}/100`,
        description: 'Confidence level across client and talent feedback loops.',
        icon: ShieldCheckIcon,
        iconBackgroundClassName: 'bg-indigo-600/90',
        href: '#agency-management',
        badge: 'Trust',
      });
    }
    if (ratingScore != null) {
      signals.push({
        id: 'csat-rating',
        label: 'CSAT rating',
        value: `${ratingScore.toFixed(1)}/5`,
        description: 'Average post-engagement reviews across programmes.',
        icon: HandThumbUpIcon,
        iconBackgroundClassName: 'bg-amber-500/90',
        href: '#agency-inbox',
        badge: 'Experience',
      });
    }
    if (activeMemberCount != null) {
      signals.push({
        id: 'active-team',
        label: 'Active team',
        value: formatNumber(activeMemberCount),
        description: 'Members deployed on live gigs and retainers.',
        icon: UsersIcon,
        iconBackgroundClassName: 'bg-blue-600/90',
        href: '#agency-hr',
        badge: 'People',
      });
    }
    if (utilisationDisplay) {
      signals.push({
        id: 'team-utilisation',
        label: 'Utilisation',
        value: utilisationDisplay,
        description: 'Capacity allocation across squads this week.',
        icon: ChartBarIcon,
        iconBackgroundClassName: 'bg-sky-600/90',
        href: '#agency-hr',
        badge: 'Delivery',
      });
    }
    if (marginDisplay) {
      signals.push({
        id: 'gross-margin',
        label: 'Gross margin',
        value: marginDisplay,
        description: 'Blended margin across recent invoices.',
        icon: BanknotesIcon,
        iconBackgroundClassName: 'bg-emerald-600/90',
        href: '#agency-finance',
        badge: 'Finance',
      });
    }
    if (financeSnapshot.runRate != null) {
      signals.push({
        id: 'run-rate-signal',
        label: 'Revenue run-rate',
        value: runRateDisplay,
        description: 'Annualised revenue projection for this workspace.',
        icon: ArrowTrendingUpIcon,
        iconBackgroundClassName: 'bg-violet-600/90',
        href: '#agency-finance',
        badge: 'Growth',
      });
    }
    if (benchHoursDisplay) {
      signals.push({
        id: 'bench-hours',
        label: 'Bench hours',
        value: benchHoursDisplay,
        description: 'Unassigned capacity recorded across teams.',
        icon: ClockIcon,
        iconBackgroundClassName: 'bg-rose-500/90',
        href: '#agency-hr',
        badge: 'Capacity',
      });
    }
    return signals;
  }, [
    trustScore,
    ratingScore,
    activeMemberCount,
    utilisationDisplay,
    marginDisplay,
    financeSnapshot.runRate,
    runRateDisplay,
    benchHoursDisplay,
  ]);

  const executiveAlerts = useMemo(() => {
    const alerts = [];
    if (trustScore != null && trustScore < 70) {
      alerts.push({
        tone: 'warning',
        title: 'Trust score requires attention',
        message: `Trust score is ${Math.round(trustScore)} / 100. Review feedback and client touchpoints to reinforce confidence.`,
        actions: [
          <a
            key="agency-management"
            href="#agency-management"
            className="inline-flex items-center rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:text-amber-800"
          >
            Open agency management
          </a>,
        ],
      });
    }

    const lowUtilisation = utilisationPercent != null && utilisationPercent < 70;
    const heavyBench = benchHoursValue != null && benchHoursValue > 40;
    if (lowUtilisation || heavyBench || (benchCapacity != null && benchCapacity >= 3)) {
      const benchHeadline = benchCapacity != null && benchCapacity >= 3 ? `${formatNumber(benchCapacity)} team members` : 'Bench capacity';
      alerts.push({
        tone: 'info',
        title: `${benchHeadline} ready for redeployment`,
        message:
          heavyBench || benchHoursDisplay
            ? `Utilisation is ${utilisationDisplay ?? '—'} with ${benchHoursDisplay ?? '0'} bench hours logged. Reassign talent to upcoming gigs or proposals.`
            : `Utilisation is ${utilisationDisplay ?? '—'}. Reassign available members to keep teams fully engaged.`,
        actions: [
          <a
            key="agency-hr"
            href="#agency-hr"
            className="inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold text-sky-600 transition hover:border-sky-300 hover:text-sky-800"
          >
            Review HR management
          </a>,
        ],
      });
    }

    return alerts;
  }, [
    benchCapacity,
    benchHoursDisplay,
    benchHoursValue,
    trustScore,
    utilisationDisplay,
    utilisationPercent,
  ]);

  const executiveInsightsLoading = overviewLoading || dashboardLoading || workforceDashboard.loading;

  const handleRefreshExecutiveSignals = useCallback(async () => {
    const tasks = [refreshAgencyDashboard({ force: true })];
    if (typeof refreshOverview === 'function') {
      tasks.push(refreshOverview({ force: true }));
    }
    if (typeof workforceDashboard.refresh === 'function') {
      tasks.push(workforceDashboard.refresh({ force: true }));
    }
    await Promise.all(tasks);
  }, [refreshAgencyDashboard, refreshOverview, workforceDashboard.refresh]);

  const pipelineAlerts = useMemo(() => {
    const alerts = [];
    if (dueSoonCount > 0 && averageProgress < 60) {
      alerts.push({
        tone: 'warning',
        title: 'Catch up on deliverables due this week',
        message: `Average progress is ${Math.max(0, Math.min(100, averageProgress))}% with ${formatNumber(dueSoonCount)} deliverables approaching their deadlines.`,
        actions: [
          <a
            key="gig-ops"
            href="#agency-gig-management"
            className="inline-flex items-center rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:text-amber-800"
          >
            Open gig management
          </a>,
        ],
      });
    }

    if (numericMargin != null && numericMargin < 20) {
      alerts.push({
        tone: 'highlight',
        title: 'Margin trending below target',
        message: `Gross margin is ${numericMargin.toFixed(1)}%. Review pricing or delivery costs to protect profitability.`,
        actions: [
          <a
            key="finance"
            href="#agency-finance"
            className="inline-flex items-center rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-800"
          >
            Inspect finance controls
          </a>,
        ],
      });
    }

    if (overdueInvoicesCount > 0) {
      alerts.push({
        tone: 'info',
        title: `${formatNumber(overdueInvoicesCount)} invoices waiting on payment`,
        message: 'Sync with clients and finance to accelerate collections and unblock payouts.',
        actions: [
          <a
            key="payments"
            href="#agency-payments"
            className="inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold text-sky-600 transition hover:border-sky-300 hover:text-sky-800"
          >
            Review payment centre
          </a>,
        ],
      });
    }

    return alerts;
  }, [averageProgress, dueSoonCount, numericMargin, overdueInvoicesCount]);

  const handleReviewPipeline = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const target = document.getElementById('agency-gig-management');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const workspaceIdentifier = workspace?.id ?? workspaceId;
  const inboxSummary = agencyDashboard?.inbox?.summary ?? null;
  const supportSnapshot = agencyDashboard?.support ?? undefined;

  const workspaceModules = useMemo(
    () => [
      {
        id: 'agency-inbox-module',
        anchorId: 'agency-inbox',
        title: 'Inbox orchestration',
        badge: 'Collaboration',
        tone: 'slate',
        render: () => (
          <AgencyInboxSection
            workspaceId={workspaceIdentifier}
            statusLabel="Inbox telemetry"
            initialSummary={inboxSummary}
          />
        ),
      },
      {
        id: 'agency-wallet-module',
        anchorId: 'agency-wallet',
        title: 'Wallet operations',
        badge: 'Finance',
        tone: 'emerald',
        render: () => <AgencyWalletSection workspaceId={workspaceIdentifier} />,
      },
      {
        id: 'agency-support-module',
        anchorId: 'agency-support',
        title: 'Support command desk',
        badge: 'Experience',
        tone: 'indigo',
        render: () => (
          <AgencySupportSection userId={ownerId} supportSnapshot={supportSnapshot} asModule />
        ),
      },
    ],
    [workspaceIdentifier, inboxSummary, supportSnapshot, ownerId],
  );

  const overviewSectionProps = useMemo(() => {
    const allowWorkspaceSelection = workspaceOptions.length > 1;
    return {
      overview,
      workspace,
      loading: overviewLoading,
      error: overviewError,
      onRefresh: () => refreshOverview({ force: true }),
      fromCache: overviewFromCache,
      lastUpdated: overviewLastUpdated,
      onSave: saveOverview,
      saving: overviewSaving,
      canManage: canManageOverview,
      workspaceOptions,
      selectedWorkspaceId,
      onWorkspaceChange: allowWorkspaceSelection ? handleWorkspaceChange : undefined,
      currentDate: overviewPayload?.currentDate,
    };
  }, [
    overview,
    workspace,
    overviewLoading,
    overviewError,
    refreshOverview,
    overviewFromCache,
    overviewLastUpdated,
    saveOverview,
    overviewSaving,
    canManageOverview,
    workspaceOptions,
    selectedWorkspaceId,
    handleWorkspaceChange,
    overviewPayload?.currentDate,
  ]);

  const executiveSectionProps = useMemo(
    () => ({
      signals: executiveSignals,
      alerts: executiveAlerts,
      loading: executiveInsightsLoading,
      onRefresh: handleRefreshExecutiveSignals,
    }),
    [executiveSignals, executiveAlerts, executiveInsightsLoading, handleRefreshExecutiveSignals],
  );

  const pipelineSectionProps = useMemo(
    () => ({ insights: pipelineInsights, alerts: pipelineAlerts }),
    [pipelineInsights, pipelineAlerts],
  );

  const managementSectionProps = useMemo(
    () => ({
      overview,
      workspace,
      loading: overviewLoading,
      error: overviewError,
      onRefresh: () => refreshOverview?.(),
    }),
    [overview, workspace, overviewLoading, overviewError, refreshOverview],
  );

  const hrSectionProps = useMemo(
    () => ({
      workspaceId: workspace?.id ?? workspaceId,
      canEdit: canManageOverview,
      workforceResource: workforceDashboard,
    }),
    [workspace?.id, workspaceId, canManageOverview, workforceDashboard],
  );

  const crmSectionProps = useMemo(
    () => ({ workspaceId: workspace?.id ?? workspaceId }),
    [workspace?.id, workspaceId],
  );

  const paymentsSectionProps = useMemo(
    () => ({
      workspaceId: workspace?.id ?? workspaceId,
      workspaceLabel: workspace?.name ?? overviewPayload?.workspace?.name ?? '',
    }),
    [workspace?.id, workspaceId, workspace?.name, overviewPayload?.workspace?.name],
  );

  const jobsSectionProps = useMemo(() => ({ ownerId }), [ownerId]);

  const gigOperationsProps = useMemo(
    () => ({
      summary: gigSummary,
      deliverables: gigDeliverables,
      orders,
      selectedOrderId,
      onSelectOrder: setSelectedOrderId,
      onRefresh: handleRefreshGigData,
      loading: projectLoading || orderLoading || dashboardLoading,
      error: gigError || dashboardError,
      fromCache: dashboardFromCache,
      lastUpdated: dashboardLastUpdated,
      detail: orderDetail,
      onUpdateOrder: handleUpdateOrder,
      updatingOrderId,
      onReopenOrder: handleReopenOrder,
      onCreateSubmission: handleCreateSubmission,
      onUpdateSubmission: handleUpdateSubmission,
      pendingAction,
      onAddEvent: handleAddTimelineEvent,
      onSendMessage: handleSendMessage,
      onAcknowledgeMessage: handleAcknowledgeMessage,
      onCreateGig: handleCreateGig,
      creatingGig,
      defaultCurrency: agencyDashboard?.workspace?.currency,
      onGigCreated: handleRefreshGigData,
      autoMatchSnapshot,
      boardMetrics,
      gigStats,
      onReviewPipeline: handleReviewPipeline,
      projectGigResource,
      workspaceStatusLabel: 'Gig marketplace sync',
      statusLabel: 'Gig data',
    }),
    [
      gigSummary,
      gigDeliverables,
      orders,
      selectedOrderId,
      handleRefreshGigData,
      projectLoading,
      orderLoading,
      dashboardLoading,
      gigError,
      dashboardError,
      dashboardFromCache,
      dashboardLastUpdated,
      orderDetail,
      handleUpdateOrder,
      updatingOrderId,
      handleReopenOrder,
      handleCreateSubmission,
      handleUpdateSubmission,
      pendingAction,
      handleAddTimelineEvent,
      handleSendMessage,
      handleAcknowledgeMessage,
      handleCreateGig,
      creatingGig,
      agencyDashboard?.workspace?.currency,
      autoMatchSnapshot,
      boardMetrics,
      gigStats,
      handleReviewPipeline,
      projectGigResource,
    ],
  );

  const escrowSectionProps = useMemo(
    () => ({ workspaceId, workspaceSlug: workspaceSlugParam }),
    [workspaceId, workspaceSlugParam],
  );

  const financeSectionProps = useMemo(
    () => ({
      highlights: financeHighlights,
      loading: dashboardLoading,
      error: dashboardError,
      fromCache: dashboardFromCache,
      lastUpdated: dashboardLastUpdated,
      onRefresh: () => refreshAgencyDashboard({ force: true }),
      currency: agencyDashboard?.workspace?.currency,
      ownerId,
    }),
    [
      financeHighlights,
      dashboardLoading,
      dashboardError,
      dashboardFromCache,
      dashboardLastUpdated,
      refreshAgencyDashboard,
      agencyDashboard?.workspace?.currency,
      ownerId,
    ],
  );

  const workspaceModulesProps = useMemo(
    () => ({ modules: workspaceModules }),
    [workspaceModules],
  );

  const hubSectionProps = useMemo(
    () => ({
      dashboard: agencyDashboard,
      loading: dashboardLoading,
      error: dashboardError,
      lastUpdated: dashboardLastUpdated,
      fromCache: dashboardFromCache,
      onRefresh: () => refreshAgencyDashboard({ force: true }),
    }),
    [
      agencyDashboard,
      dashboardLoading,
      dashboardError,
      dashboardLastUpdated,
      dashboardFromCache,
      refreshAgencyDashboard,
    ],
  );

  const creationStudioProps = useMemo(
    () => ({ agencyProfileId: agencyDashboard?.agencyProfile?.id }),
    [agencyDashboard?.agencyProfile?.id],
  );

  const sectionDefinitions = useMemo(
    () =>
      buildAgencyDashboardSections({
        overview: overviewSectionProps,
        executive: executiveSectionProps,
        pipeline: pipelineSectionProps,
        management: managementSectionProps,
        hr: hrSectionProps,
        crm: crmSectionProps,
        payments: paymentsSectionProps,
        jobs: jobsSectionProps,
        gigOperations: gigOperationsProps,
        escrow: escrowSectionProps,
        finance: financeSectionProps,
        workspaceModules: workspaceModulesProps,
        hub: hubSectionProps,
        creationStudio: creationStudioProps,
      }),
    [
      overviewSectionProps,
      executiveSectionProps,
      pipelineSectionProps,
      managementSectionProps,
      hrSectionProps,
      crmSectionProps,
      paymentsSectionProps,
      jobsSectionProps,
      gigOperationsProps,
      escrowSectionProps,
      financeSectionProps,
      workspaceModulesProps,
      hubSectionProps,
      creationStudioProps,
    ],
  );

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency"
      subtitle={workspace?.name || 'Control tower'}
      description="Run delivery, finance, and guardrails from a single operating picture."
      menuSections={MENU_SECTIONS}
      sections={SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem={activeMenuItem}
      onMenuItemSelect={handleMenuItemSelect}
      adSurface="agency_dashboard"
    >
      <div className="space-y-12">
        {sectionDefinitions.map(({ key, Component, props }) => (
          <Component key={key} {...props} />
        ))}
      </div>
    </DashboardLayout>
  );
}
