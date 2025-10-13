import { useEffect, useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  MegaphoneIcon,
  QueueListIcon,
  SparklesIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { fetchAgencyDashboard } from '../../services/agency.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

const DEFAULT_WORKSPACE_SLUG = 'nova-collective';
const DEFAULT_MEMBERSHIPS = ['agency'];

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  const formatter = new Intl.NumberFormat('en-GB');
  return formatter.format(Math.round(Number(value)));
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  const numeric = Number(value);
  return `${numeric.toFixed(1)}%`;
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(0);
  }
  const numeric = Number(amount);
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(numeric) >= 1000 ? 0 : 2,
  });
  return formatter.format(numeric);
}

function formatCurrencyTotals(totals, fallbackCurrency = 'USD') {
  if (!Array.isArray(totals) || totals.length === 0) {
    return formatCurrency(0, fallbackCurrency);
  }
  return totals
    .map((entry) => formatCurrency(entry.amount ?? 0, entry.currency ?? fallbackCurrency))
    .join(' · ');
}

function formatScore(value, decimals = 1) {
  if (value == null || Number.isNaN(Number(value))) {
    return (0).toFixed(decimals);
  }
  return Number(value).toFixed(decimals);
}

function formatDecimal(value, fractionDigits = 1) {
  if (value == null || Number.isNaN(Number(value))) {
    return Number(0).toFixed(fractionDigits);
  }
  return Number(value).toFixed(fractionDigits);
}

function formatScorecardValue(card, defaultCurrency = 'USD') {
  if (!card) {
    return '—';
  }
  const unit = card.unit ?? 'count';
  switch (unit) {
    case 'currency':
      return formatCurrency(card.value ?? 0, card.currency ?? defaultCurrency);
    case 'percentage':
      return formatPercent(card.value ?? 0);
    case 'score':
    case 'decimal':
      return formatDecimal(card.value ?? 0, card.decimals ?? 1);
    case 'duration_days':
      return `${formatNumber(card.value ?? 0)} days`;
    default:
      return formatNumber(card.value ?? 0);
  }
}

function formatScorecardChange(card, defaultCurrency = 'USD') {
  if (!card || card.changeValue == null) {
    return null;
  }
  const unit = card.changeUnit ?? card.unit ?? 'count';
  const absolute = Math.abs(Number(card.changeValue));
  const sign = Number(card.changeValue) >= 0 ? '+' : '-';
  let valueText;
  switch (unit) {
    case 'currency':
      valueText = `${sign}${formatCurrency(absolute, card.currency ?? defaultCurrency)}`;
      break;
    case 'percentage':
      valueText = `${sign}${absolute.toFixed(1)}pp`;
      break;
    case 'score':
    case 'decimal':
      valueText = `${sign}${absolute.toFixed(card.decimals ?? 1)}`;
      break;
    case 'duration_days':
      valueText = `${sign}${formatNumber(absolute)} days`;
      break;
    default:
      valueText = `${sign}${formatNumber(absolute)}`;
      break;
  }
  const comparison = card.changePeriod ? ` ${card.changePeriod}` : '';
  const trend = card.trend ?? (card.changeValue >= 0 ? 'up' : 'down');
  const className =
    trend === 'down' ? 'text-red-600' : trend === 'up' ? 'text-emerald-600' : 'text-slate-500';
  return { text: `${valueText}${comparison}`.trim(), className };
}

const HR_ALERT_STYLES = {
  high: {
    border: 'border-rose-200',
    background: 'bg-rose-50/80',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-700',
    accent: 'text-rose-600',
  },
  medium: {
    border: 'border-amber-200',
    background: 'bg-amber-50/70',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    accent: 'text-amber-600',
  },
  low: {
    border: 'border-slate-200',
    background: 'bg-slate-50/80',
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-600',
    accent: 'text-slate-500',
  },
  default: {
    border: 'border-slate-200',
    background: 'bg-slate-50/80',
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-600',
    accent: 'text-slate-500',
  },
};

function getHrAlertStyle(severity = 'medium') {
  return HR_ALERT_STYLES[severity] ?? HR_ALERT_STYLES.default;
}

function getInitials(name) {
  if (!name) return 'AG';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function titleCase(value) {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatAvailabilityLabel(status) {
  if (!status) {
    return 'Unknown';
  }
  return titleCase(status);
}

export default function AgencyDashboardPage() {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let isMounted = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetchAgencyDashboard({ workspaceSlug: DEFAULT_WORKSPACE_SLUG, lookbackDays: 120 })
      .then((payload) => {
        if (isMounted) {
          setState({ data: payload, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setState({ data: null, loading: false, error: error.message ?? 'Unable to load agency dashboard.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = state.data?.summary ?? null;
  const workspace = state.data?.workspace ?? null;
  const agencyProfile = state.data?.agencyProfile ?? null;
  const members = state.data?.members?.list ?? [];
  const invites = state.data?.members?.invites ?? [];
  const projects = state.data?.projects?.list ?? [];
  const projectEvents = state.data?.projects?.events ?? [];
  const contactNotes = state.data?.contactNotes ?? [];
  const gigs = state.data?.gigs ?? [];
  const jobs = state.data?.jobs ?? [];
  const pipeline = summary?.pipeline ?? { statuses: {}, topCandidates: [] };
  const financialSummary = summary?.financials ?? { inEscrow: 0, released: 0, outstanding: 0, currency: 'USD' };
  const paymentsDistribution = state.data?.paymentsDistribution ?? {};
  const paymentsSummary = paymentsDistribution.summary ?? {};
  const paymentsUpcoming = paymentsDistribution.upcomingBatches ?? [];
  const paymentsTeammates = paymentsDistribution.teammates ?? [];
  const paymentsExports = paymentsDistribution.exports ?? { summary: {}, available: [], generating: [], failed: [], archived: [] };
  const paymentsInsights = paymentsDistribution.insights ?? { recommendedActions: [], splitStatus: {} };
  const paymentsOutstandingTotals = paymentsSummary.outstandingSplits?.totals ?? [];
  const paymentsFailedTotals = paymentsSummary.failedSplits?.totals ?? [];
  const paymentsInvoiceTotals = paymentsSummary.invoiceOutstanding ?? [];
  const paymentsActions = paymentsInsights.recommendedActions ?? [];
  const paymentsSplitStatus = paymentsInsights.splitStatus ?? {};
  const paymentsCurrency = paymentsSummary.currency ?? financialSummary.currency ?? 'USD';
  const paymentsExportsSummary = paymentsExports.summary ?? {};
  const paymentsAvailableExports = paymentsExports.available ?? [];
  const paymentsGeneratingExports = paymentsExports.generating ?? [];
  const paymentsFailedExports = paymentsExports.failed ?? [];
  const hasPaymentsData =
    (paymentsSummary.totalBatches ?? 0) > 0 || paymentsTeammates.length > 0 || paymentsUpcoming.length > 0;
  const executiveData = state.data?.executive ?? {};
  const intelligenceOverview = executiveData.intelligence ?? {};
  const analyticsWarRoomData = executiveData.analyticsWarRoom ?? { summary: {}, scorecards: [], grouped: {} };
  const scenarioExplorerData = executiveData.scenarioExplorer ?? { scenarios: {}, breakdowns: {} };
  const governanceDeskData = executiveData.governance ?? {
    policies: [],
    obligations: [],
    reminders: [],
    risks: [],
    audits: [],
  };
  const leadershipHubData = executiveData.leadership ?? {
    rituals: [],
    okrs: [],
    decisions: [],
    briefings: [],
    strategicBets: [],
    collaborationRooms: [],
  };
  const innovationLabData = executiveData.innovation ?? { initiatives: [], funding: { summary: {}, events: [] } };

  const focusMetricOrder = [
    { key: 'revenueRunRate', label: 'Revenue run-rate' },
    { key: 'grossMargin', label: 'Gross margin' },
    { key: 'utilization', label: 'Utilization' },
    { key: 'pipelineVelocity', label: 'Pipeline velocity' },
    { key: 'clientSatisfaction', label: 'Client satisfaction' },
    { key: 'policyAdherence', label: 'Policy adherence' },
  ];

  function formatMetricValue(metric) {
    if (!metric || metric.value == null) {
      return '—';
    }
    switch (metric.unit) {
      case 'currency':
        return formatCurrency(metric.value, metric.metadata?.currency ?? financialSummary.currency ?? 'USD');
      case 'percentage':
        return formatPercent(metric.value);
      case 'duration':
        return `${formatNumber(metric.value)} ${metric.metadata?.unitLabel ?? 'days'}`;
      case 'score':
        return formatNumber(metric.value);
      default:
        return formatNumber(metric.value);
    }
  }

  function describeMetricChange(metric) {
    if (!metric || metric.changeValue == null) {
      return null;
    }
    const changeUnit = metric.changeUnit ?? metric.unit ?? 'count';
    const absolute = Math.abs(metric.changeValue);
    const sign = metric.changeValue >= 0 ? '+' : '-';
    let valueText;
    switch (changeUnit) {
      case 'currency':
        valueText = `${sign}${formatCurrency(absolute, metric.metadata?.currency ?? financialSummary.currency ?? 'USD')}`;
        break;
      case 'percentage':
        valueText = `${sign}${absolute.toFixed(1)}pp`;
        break;
      case 'duration':
        valueText = `${sign}${formatNumber(absolute)} ${metric.metadata?.unitLabel ?? 'days'}`;
        break;
      case 'score':
        valueText = `${sign}${formatNumber(absolute)}`;
        break;
      default:
        valueText = `${sign}${formatNumber(absolute)}`;
        break;
    }
    const directionClass =
      metric.trend === 'down' ? 'text-red-600' : metric.trend === 'up' ? 'text-emerald-600' : 'text-slate-500';
    const comparison = metric.comparisonPeriod ? ` ${metric.comparisonPeriod}` : '';
    return { text: `${valueText}${comparison}`, className: directionClass };
  }

  function normaliseTagList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        // Ignore parse failures and fall back to splitting
      }
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  function summariseAssumptions(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object') {
      if (Array.isArray(value.drivers)) {
        return value.drivers.join(', ');
      }
      const stringEntries = Object.values(value).filter((entry) => typeof entry === 'string');
      if (stringEntries.length) {
        return stringEntries.join(', ');
      }
    }
    return null;
  }

  const focusMetrics = focusMetricOrder.map((item) => ({
    ...item,
    metric: analyticsWarRoomData.summary?.[item.key] ?? null,
  }));

  const groupedWarRoom = analyticsWarRoomData.grouped ?? {};
  const scenarioBreakdowns = scenarioExplorerData.breakdowns ?? {};
  const topPolicies = (governanceDeskData.policies ?? []).slice(0, 4);
  const topObligations = (governanceDeskData.obligations ?? []).slice(0, 4);
  const upcomingReminders = (governanceDeskData.reminders ?? []).slice(0, 4);
  const highlightedRisks = (governanceDeskData.risks ?? []).slice(0, 4);
  const recentAudits = (governanceDeskData.audits ?? []).slice(0, 4);
  const upcomingRituals = (leadershipHubData.rituals ?? []).slice(0, 4);
  const keyOkrs = (leadershipHubData.okrs ?? []).slice(0, 4);
  const decisionLog = (leadershipHubData.decisions ?? []).slice(0, 4);
  const briefingPacks = (leadershipHubData.briefings ?? []).slice(0, 4);
  const strategicBets = (leadershipHubData.strategicBets ?? []).slice(0, 4);
  const leadershipRooms = (leadershipHubData.collaborationRooms ?? []).slice(0, 4);
  const innovationInitiatives = (innovationLabData.initiatives ?? []).slice(0, 6);
  const fundingSummary = innovationLabData.funding?.summary ?? {};
  const fundingEvents = (innovationLabData.funding?.events ?? []).slice(0, 5);

  const activeProjectsCount = summary?.projects?.buckets?.active ?? summary?.projects?.total ?? 0;
  const totalProjectsCount = summary?.projects?.total ?? projects.length ?? 0;
  const autoAssignQueueSize = summary?.projects?.autoAssignQueueSize ?? pipeline.statuses?.pending ?? 0;
  const utilizationRate = summary?.members?.utilizationRate ?? 0;
  const pendingInvitesCount = summary?.members?.pendingInvites ?? invites.length;
  const totalMembersCount = summary?.members?.total ?? members.length;
  const benchCount = summary?.members?.bench ?? benchMembers.length;
  const averageWeeklyCapacity = summary?.members?.averageWeeklyCapacity ?? null;
  const totalGigsCount = gigs.length;
  const acceptedAssignmentsCount = pipeline.statuses?.accepted ?? 0;
  const pendingMatchesCount = pipeline.statuses?.pending ?? 0;
  const activeClientsCount = summary?.clients?.active ?? contactNotes.length;
  const releasedAmountText = formatCurrency(financialSummary.released ?? 0, financialSummary.currency);
  const summaryScope = state.data?.scope ?? 'global';
  const workspaceSlugValue = workspace?.slug ?? 'n/a';

  const revenueRunRateText = formatMetricValue(analyticsWarRoomData.summary?.revenueRunRate ?? null);
  const marginText = formatMetricValue(analyticsWarRoomData.summary?.grossMargin ?? null);
  const analyticsScorecardCount = analyticsWarRoomData.scorecards?.length ?? 0;
  const analyticsCategoryCount = Object.keys(groupedWarRoom).length;
  const scenarioCount = Object.keys(scenarioExplorerData.scenarios ?? {}).length;
  const governancePolicyCount = governanceDeskData.policies?.length ?? 0;
  const governanceObligationCount = governanceDeskData.obligations?.length ?? 0;
  const leadershipDecisionCount = leadershipHubData.decisions?.length ?? 0;
  const leadershipRitualCount = leadershipHubData.rituals?.length ?? 0;
  const innovationCount = innovationLabData.initiatives?.length ?? 0;
  const talentLifecycle = state.data?.talentLifecycle ?? {};
  const talentLifecycleSummary = talentLifecycle.summary ?? {};
  const talentCrm = talentLifecycle.crm ?? {};
  const peopleOps = talentLifecycle.peopleOps ?? {};
  const talentOpportunityBoard = talentLifecycle.opportunityBoard ?? {};
  const brandingStudio = talentLifecycle.branding ?? {};
  const hrManagement = talentLifecycle.hrManagement ?? {};
  const staffingCapacity = hrManagement.staffingCapacity ?? {};
  const hrAlerts = hrManagement.alerts ?? [];
  const hrRoleCoverage = hrManagement.roleAssignments?.coverage ?? [];
  const hrRoleTotals = hrManagement.roleAssignments?.totals ?? {};
  const hrAttentionRoles = hrManagement.roleAssignments?.attention ?? [];
  const outstandingPolicies = hrManagement.policyAcknowledgements ?? [];
  const onboardingQueue = (hrManagement.onboardingQueue ?? []).slice(0, 5);
  const availabilityBreakdown = staffingCapacity.availabilityBreakdown ?? [];
  const hrHealth = staffingCapacity.health ?? {};
  const capacityPlanning = talentLifecycle.capacityPlanning ?? {};
  const internalMarketplace = talentLifecycle.internalMarketplace ?? {};
  const leadership = state.data?.marketplaceLeadership ?? {};
  const studio = leadership.studio ?? {};
  const studioSummary = studio.summary ?? {};
  const deliverablesSummary = studio.deliverables ?? {};
  const partnerPrograms = leadership.partnerPrograms ?? {};
  const partnerSummary = partnerPrograms.summary ?? {};
  const marketingAutomation = leadership.marketingAutomation ?? {};
  const marketingSummary = marketingAutomation.summary ?? {};
  const clientAdvocacy = leadership.clientAdvocacy ?? {};
  const clientAdvocacySummary = clientAdvocacy.summary ?? {};
  const defaultCurrency = financialSummary.currency ?? 'USD';

  const benchMembers = members
    .filter((member) => member.availability?.status === 'available')
    .slice(0, 4);

  const operatingIntelligence = state.data?.operatingIntelligence ?? {};
  const portfolioInsights = operatingIntelligence.projectPortfolioMastery ?? {};
  const orchestratorInsights = operatingIntelligence.workspaceOrchestrator ?? {};
  const resourceIntelligenceInsights = operatingIntelligence.resourceIntelligence ?? {};
  const qualityInsights = operatingIntelligence.qualityAssurance ?? {};
  const financialOversightInsights = operatingIntelligence.financialOversight ?? {};

  const portfolioSummary = portfolioInsights.summary ?? {};
  const orchestratorSummary = orchestratorInsights.summary ?? {};
  const resourceSummary = resourceIntelligenceInsights.summary ?? {};
  const qualitySummary = qualityInsights.summary ?? {};
  const financialOversightSummary = financialOversightInsights.summary ?? {};

  const operations = state.data?.operations ?? {};
  const operationsOverview = operations.overview ?? {};
  const operationsProjects = operations.projectsWorkspace ?? {};
  const operationsGigPrograms = operations.gigPrograms ?? {};

  const fallbackOperationsScorecards = useMemo(
    () => [
      {
        key: 'utilization',
        label: 'Utilization rate',
        value: summary?.members?.utilizationRate ?? resourceSummary.averageUtilization ?? 0,
        unit: 'percentage',
        description: `${formatNumber(summary?.members?.bench ?? 0)} on bench`,
      },
      {
        key: 'projects',
        label: 'On-track engagements',
        value: portfolioSummary.onTrack ?? 0,
        unit: 'count',
        description: `${formatNumber((portfolioSummary.atRisk ?? 0) + (portfolioSummary.critical ?? 0))} flagged`,
      },
      {
        key: 'financial',
        label: 'Revenue released',
        value: financialSummary.released ?? 0,
        unit: 'currency',
        currency: financialSummary.currency ?? 'USD',
        description: `${formatCurrency(financialSummary.inEscrow ?? 0, financialSummary.currency ?? 'USD')} in escrow`,
      },
      {
        key: 'client_satisfaction',
        label: 'Client satisfaction',
        value: qualitySummary.averageClientSatisfaction ?? 0,
        unit: 'score',
        decimals: 1,
        description: `${formatNumber(summary?.clients?.active ?? 0)} active clients`,
      },
    ],
    [summary, resourceSummary, portfolioSummary, financialSummary, qualitySummary],
  );

  const fallbackOperationsAlerts = useMemo(() => {
    const alerts = [];
    (portfolioInsights.projects ?? []).forEach((project) => {
      const scopeHealth = String(project.scopeHealth ?? '').toLowerCase();
      const riskLevel = String(project.riskLevel ?? '').toLowerCase();
      const severity =
        scopeHealth === 'critical' || riskLevel === 'critical' || riskLevel === 'high' ? 'critical' : 'warning';
      if (['at_risk', 'critical'].includes(scopeHealth) || ['high', 'critical'].includes(riskLevel)) {
        alerts.push({
          type: 'project',
          severity,
          title: project.title ?? `Project ${project.id}`,
          message:
            scopeHealth === 'critical'
              ? 'Project flagged as critical. Immediate intervention required.'
              : 'Project marked at risk. Review mitigation plan.',
          referenceId: project.id,
        });
      }
      if (Number(project.issuesOpen ?? 0) > 0) {
        alerts.push({
          type: 'quality',
          severity: 'warning',
          title: project.title ?? `Project ${project.id}`,
          message: `${formatNumber(project.issuesOpen)} open issues to triage`,
          referenceId: project.id,
        });
      }
    });

    (financialOversightInsights.alerts ?? []).forEach((alert) => {
      alerts.push({
        type: alert.type ?? 'financial',
        severity: alert.severity ?? 'warning',
        title: 'Financial alert',
        message: alert.message,
        referenceId: alert.engagementId ?? null,
      });
    });

    (resourceSummary.atRiskSkills ?? []).forEach((skill) => {
      alerts.push({
        type: 'capacity',
        severity: 'warning',
        title: 'Capacity pressure',
        message: `Burnout risk detected in ${skill} squad`,
        referenceId: skill,
      });
    });

    if (
      qualitySummary.averageClientSatisfaction != null &&
      Number(qualitySummary.averageClientSatisfaction) < 4
    ) {
      alerts.push({
        type: 'client_experience',
        severity: 'warning',
        title: 'Client satisfaction dip',
        message: `Average CSAT ${formatDecimal(qualitySummary.averageClientSatisfaction, 1)} below 4.0 benchmark`,
      });
    }

    return alerts.slice(0, 12);
  }, [portfolioInsights.projects, financialOversightInsights.alerts, resourceSummary.atRiskSkills, qualitySummary.averageClientSatisfaction]);

  const operationsScorecards = (operationsOverview.scorecards ?? []).length
    ? operationsOverview.scorecards
    : fallbackOperationsScorecards;

  const operationsAlerts = (operationsOverview.alerts ?? []).length
    ? operationsOverview.alerts
    : fallbackOperationsAlerts;

  const operationsUtilization = {
    rate:
      operationsOverview.utilization?.rate ??
      operationsOverview.utilization?.utilizationRate ??
      summary?.members?.utilizationRate ??
      resourceSummary.averageUtilization ??
      0,
    benchCount:
      operationsOverview.utilization?.benchCount ??
      operationsOverview.utilization?.bench ??
      summary?.members?.bench ??
      0,
    benchHours: operationsOverview.utilization?.benchHours ?? resourceSummary.benchHours ?? 0,
    averageWeeklyCapacity:
      operationsOverview.utilization?.averageWeeklyCapacity ?? summary?.members?.averageWeeklyCapacity ?? null,
    atRiskSkills: operationsOverview.utilization?.atRiskSkills ?? resourceSummary.atRiskSkills ?? [],
    assignments: operationsOverview.utilization?.assignments ?? resourceIntelligenceInsights.assignmentMatches ?? [],
  };

  const operationsClientHealth = {
    activeClients: operationsOverview.clientHealth?.activeClients ?? summary?.clients?.active ?? 0,
    csatScore:
      operationsOverview.clientHealth?.csatScore ?? qualitySummary.averageClientSatisfaction ?? null,
    qaScore: operationsOverview.clientHealth?.qaScore ?? qualitySummary.averageQaScore ?? null,
    atRiskEngagements:
      operationsOverview.clientHealth?.atRiskEngagements ??
      (portfolioSummary.atRisk ?? 0) + (portfolioSummary.critical ?? 0),
    recentNotes: operationsOverview.clientHealth?.recentNotes ?? contactNotes.slice(0, 4),
  };

  const clientHealthNotes = operationsClientHealth.recentNotes ?? contactNotes.slice(0, 4);
  const operationsAssignments = Array.isArray(operationsUtilization.assignments)
    ? operationsUtilization.assignments
    : [];
  const operationsAlertTone = {
    critical: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  const projectsWorkspaceSummary = operationsProjects.summary ?? portfolioSummary;
  const projectsQueueSummary = operationsProjects.queue ?? summary?.pipeline ?? pipeline;
  const profitabilityWorkspaceSummary =
    operationsProjects.financialOversight?.summary ?? financialOversightSummary;
  const gigProgramsStudio = operationsGigPrograms.studio ?? studio;
  const gigProgramsSummary = gigProgramsStudio.summary ?? studioSummary;
  const gigProgramsDeliverables = gigProgramsStudio.deliverables ?? deliverablesSummary;
  const gigProgramsPartnerSummary =
    operationsGigPrograms.partnerPrograms?.summary ?? partnerSummary;
  const gigProgramsMarketingSummary =
    operationsGigPrograms.marketing?.summary ?? marketingSummary;
  const gigProgramsAdvocacySummary =
    operationsGigPrograms.advocacy?.summary ?? clientAdvocacySummary;
  const gigMarketplacePipeline = operationsGigPrograms.marketplacePipeline ?? {
    gigs,
    jobs,
  };

  const menuSections = useMemo(() => {
    const activeProjects = summary?.projects?.buckets?.active ?? summary?.projects?.total ?? 0;
    const utilization = summary?.members?.utilizationRate ?? 0;
    const pendingInvites = summary?.members?.pendingInvites ?? invites.length;

    const sections = [
    const conversionRate = talentLifecycleSummary?.conversionRate ?? talentCrm?.conversionRate ?? 0;
    const openInternalOpportunities = talentOpportunityBoard?.summary?.open ?? 0;
    const averageMatchScore = talentOpportunityBoard?.summary?.averageMatchScore ?? 0;
    const brandingReach = brandingStudio?.metrics?.totals?.reach ?? 0;
    const benchCapacityHours = Number.isFinite(Number(capacityPlanning?.benchCapacityHours))
      ? Math.round(Number(capacityPlanning.benchCapacityHours))
      : 0;
    const utilisationRate = capacityPlanning?.utilizationRate ?? utilization;
    return [
      {
        label: 'Executive intelligence & governance',
        items: [
          {
            name: 'Executive overview',
            sectionId: 'executive-intelligence',
            description: `${revenueRunRateText} run-rate · ${marginText} margin`,
          },
          {
            name: 'Analytics war room',
            sectionId: 'analytics-war-room',
            description: `${formatNumber(analyticsScorecardCount)} scorecards across ${formatNumber(analyticsCategoryCount)} categories`,
          },
          {
            name: 'Scenario explorer',
            sectionId: 'scenario-explorer',
            description: `${formatNumber(scenarioCount)} active scenarios with drill-downs`,
          },
          {
            name: 'Governance desk',
            sectionId: 'governance-desk',
            description: `${formatNumber(governancePolicyCount)} policies · ${formatNumber(governanceObligationCount)} obligations`,
          },
          {
            name: 'Leadership collaboration',
            sectionId: 'leadership-collaboration',
            description: `${formatNumber(leadershipRitualCount)} rituals · ${formatNumber(leadershipDecisionCount)} decisions tracked`,
          },
          {
            name: 'Innovation lab',
            sectionId: 'innovation-lab',
            description: `${formatNumber(innovationCount)} initiatives in pipeline`,
          },
        ],
      },
      {
        label: 'Agency operations',
        items: [
          {
            name: 'Agency overview',
            sectionId: 'agency-overview',
            description: `${formatPercent(operationsUtilization.rate)} utilization · ${formatNumber(operationsAlerts.length)} alerts open`,
          },
          {
            name: 'Projects workspace',
            sectionId: 'projects-workspace',
            description: `${formatNumber(projectsWorkspaceSummary.totalProjects ?? totalProjectsCount)} engagements · Margin ${formatPercent(projectsWorkspaceSummary.avgMargin ?? 0)}`,
          },
          {
            name: 'Gig programs',
            sectionId: 'gig-programs',
            description: `${formatNumber(gigProgramsSummary.managedGigs ?? gigProgramsSummary.totalGigs ?? totalGigsCount)} managed gigs · ${formatPercent(gigProgramsSummary.onTimeRate ?? 0)} on-time`,
          },
        ],
      },
      {
        label: 'Talent lifecycle & HR excellence',
        items: [
          {
            name: 'Talent CRM',
            description: `${formatNumber(talentCrm?.totals?.candidates ?? 0)} candidates • ${formatPercent(conversionRate)} conversion`,
            tags: ['talent_crm'],
          },
          {
            name: 'People ops hub',
            description: `${formatNumber(peopleOps?.policies?.active ?? 0)} active policies • ${formatPercent(peopleOps?.policies?.acknowledgementRate ?? 0)} acknowledgement`,
            tags: ['people_ops'],
          },
          {
            name: 'Internal opportunity board',
            description: `${formatNumber(openInternalOpportunities)} open opportunities • Avg match ${formatScore(averageMatchScore)}`,
            tags: ['opportunity_board'],
          },
          {
            name: 'Agency member branding',
            description: `${formatNumber(brandingStudio?.totals?.published ?? 0)} published assets • ${formatNumber(brandingReach)} reach`,
            tags: ['branding'],
          },
          {
            name: 'HR management',
            description: `${formatNumber(totalMembersCount)} members · ${formatNumber(benchCount)} on bench · ${formatNumber(pendingInvitesCount)} invites open`,
          },
          {
            name: 'Capacity planning',
            description: `Average weekly capacity ${averageWeeklyCapacity ? `${averageWeeklyCapacity}h` : 'n/a'}.`,
          },
          {
            name: 'Internal marketplace',
            description: `${formatNumber(pendingMatchesCount)} pending matches ready for review.`,
            tags: ['auto-assign'],
            description: `${formatNumber(hrManagement?.activeHeadcount ?? summary?.members?.total ?? members.length)} headcount • ${formatNumber(hrManagement?.complianceOutstanding ?? 0)} compliance tasks open`,
          },
          {
            name: 'Capacity planning',
            description: `${benchCapacityHours} bench hours • Utilisation ${formatPercent(utilisationRate)}`,
          },
          {
            name: 'Internal marketplace',
            description: `${formatNumber(internalMarketplace?.openOpportunities ?? 0)} open matches • ${formatNumber(internalMarketplace?.benchAvailable ?? benchMembers.length)} bench ready`,
            tags: ['marketplace'],
          },
        ],
      },
      {
        label: 'Growth & brand',
        items: [
          {
            name: 'Analytics & insights',
            description: `${releasedAmountText} released YTD.`,
          },
          {
            name: 'Marketing studio',
            description: `${formatNumber(activeClientsCount)} active client relationships tracked.`,
          },
          {
            name: 'Settings & governance',
            description: `Workspace ${workspaceSlugValue} · ${summaryScope === 'workspace' ? 'Workspace filtered' : summaryScope === 'global_fallback' ? 'Global metrics fallback' : 'Global view'}.`,
          },
        ],
      },
      {
        label: 'Marketplace & gig leadership',
        items: [
          {
            name: 'Agency gig studio',
            description: `${formatNumber(studioSummary.managedGigs ?? studioSummary.totalGigs ?? 0)} managed gigs · ${formatPercent(
              studioSummary.onTimeRate ?? 0,
            )} on-time`,
            sectionId: 'marketplace-gig-leadership',
          },
          {
            name: 'Partner & reseller programs',
            description: `${formatNumber(partnerSummary.activeAlliances ?? 0)} alliances · ${formatPercent(
              partnerSummary.averageConversionRate ?? 0,
            )} avg conversion`,
            sectionId: 'partner-programs',
          },
          {
            name: 'Marketing automation',
            description: `${formatNumber(marketingSummary.activeCampaigns ?? 0)} live campaigns · ${formatCurrency(
              marketingSummary.totalPipelineValue ?? 0,
              defaultCurrency,
            )} pipeline`,
            sectionId: 'marketing-automation',
          },
          {
            name: 'Client advocacy',
            description: `${formatNumber(clientAdvocacySummary.activePlaybooks ?? 0)} playbooks · ${formatPercent(
              clientAdvocacySummary.reviewResponseRate ?? 0,
            )} response rate`,
            sectionId: 'client-advocacy',
          },
        ],
      },
    ];
  }, [
    revenueRunRateText,
    marginText,
    analyticsScorecardCount,
    analyticsCategoryCount,
    scenarioCount,
    governancePolicyCount,
    governanceObligationCount,
    leadershipRitualCount,
    leadershipDecisionCount,
    innovationCount,
    utilizationRate,
    activeProjectsCount,
    totalProjectsCount,
    autoAssignQueueSize,
    totalGigsCount,
    acceptedAssignmentsCount,
    totalMembersCount,
    benchCount,
    pendingInvitesCount,
    averageWeeklyCapacity,
    pendingMatchesCount,
    releasedAmountText,
    activeClientsCount,
    workspaceSlugValue,
    summaryScope,

    sections.push({
      label: 'Operating intelligence',
      items: [
        {
          name: 'Project portfolio mastery',
          description: `${formatNumber(portfolioSummary.totalProjects ?? 0)} projects · ${formatPercent(portfolioSummary.avgMargin ?? 0)} avg margin`,
          sectionId: 'project-portfolio-mastery',
        },
        {
          name: 'Workspace orchestrator',
          description: `${formatNumber(orchestratorSummary.totalBlueprints ?? 0)} blueprints · ${formatNumber(orchestratorSummary.automationGuardrails ?? 0)} guardrails`,
          sectionId: 'workspace-orchestrator',
        },
        {
          name: 'Resource intelligence',
          description: `${formatPercent(resourceSummary.averageUtilization ?? 0)} utilization · ${formatNumber(resourceSummary.totalScenarioPlans ?? 0)} scenarios`,
          sectionId: 'resource-intelligence',
        },
        {
          name: 'Quality assurance workflow',
          description: `${formatNumber(qualitySummary.completedReviews ?? 0)} reviews · QA ${formatPercent(qualitySummary.averageQaScore ?? 0)}`,
          sectionId: 'quality-assurance',
        },
        {
          name: 'Financial oversight',
          description: `${formatNumber(financialOversightSummary.totalEngagements ?? 0)} engagements · ${formatNumber(financialOversightSummary.alerts ?? 0)} alerts`,
          sectionId: 'financial-oversight',
        },
        {
          name: 'Payments distribution',
          description: `${formatCurrencyTotals(paymentsSummary.processedThisQuarter ?? [], paymentsSummary.currency ?? financialSummary.currency ?? 'USD')} processed · ${formatCurrencyTotals(paymentsSummary.outstandingSplits?.totals ?? [], paymentsSummary.currency ?? financialSummary.currency ?? 'USD')} outstanding`,
          sectionId: 'payments-distribution',
        },
      ],
    });

    return sections;
  }, [
    summary,
    invites.length,
    benchMembers.length,
    gigs.length,
    contactNotes.length,
    workspace?.slug,
    state.data?.scope,
    portfolioSummary,
    orchestratorSummary,
    resourceSummary,
    qualitySummary,
    financialOversightSummary,
    paymentsSummary,
  ]);

  const portfolioSummaryCards = [
    {
      name: 'Active projects',
      value: formatNumber(portfolioSummary.totalProjects ?? 0),
      description: `${formatNumber(portfolioSummary.onTrack ?? 0)} on track`,
      tone: 'emerald',
    },
    {
      name: 'Projects at risk',
      value: formatNumber(portfolioSummary.atRisk ?? 0),
      description: `${formatNumber(portfolioSummary.critical ?? 0)} critical`,
      tone: 'amber',
    },
    {
      name: 'Average margin',
      value: formatPercent(portfolioSummary.avgMargin ?? 0),
      description: `Quality ${formatPercent(portfolioSummary.avgQualityScore ?? 0)}`,
      tone: 'sky',
    },
    {
      name: 'Automation coverage',
      value: formatPercent(portfolioSummary.avgAutomationCoverage ?? 0),
      description: 'Across monitored portfolio',
      tone: 'violet',
    },
  ];

  const orchestratorStats = [
    {
      name: 'Active blueprints',
      value: formatNumber(orchestratorSummary.activeBlueprints ?? 0),
      description: `${formatNumber(orchestratorSummary.totalBlueprints ?? 0)} total`,
    },
    {
      name: 'Average cadence',
      value: orchestratorSummary.averageCadenceDays != null
        ? `${formatNumber(Math.round((orchestratorSummary.averageCadenceDays + Number.EPSILON) * 10) / 10)} days`
        : 'n/a',
      description: 'Cadence between blueprint runs',
    },
    {
      name: 'Automation guardrails',
      value: formatNumber(orchestratorSummary.automationGuardrails ?? 0),
      description: 'Workspace automation policies',
    },
  ];

  const resourceStats = [
    {
      name: 'Average utilization',
      value: formatPercent(resourceSummary.averageUtilization ?? 0),
      description: `${formatNumber(resourceSummary.totalSkillGroups ?? 0)} skill groups`,
    },
    {
      name: 'Bench hours',
      value: `${formatNumber(Math.round(resourceSummary.benchHours ?? 0))}h`,
      description: 'Available capacity',
    },
    {
      name: 'Scenario plans',
      value: formatNumber(resourceSummary.totalScenarioPlans ?? 0),
      description: `${formatNumber(resourceSummary.totalMembers ?? members.length)} members`,
    },
  ];

  const qualityStats = [
    {
      name: 'Completed reviews',
      value: formatNumber(qualitySummary.completedReviews ?? 0),
      description: `${formatNumber(qualitySummary.totalReviews ?? 0)} total reviews`,
    },
    {
      name: 'Avg QA score',
      value: formatPercent(qualitySummary.averageQaScore ?? 0),
      description: `Client CSAT ${formatPercent(qualitySummary.averageClientSatisfaction ?? 0)}`,
    },
  ];

  const financialStats = [
    {
      name: 'Engagements monitored',
      value: formatNumber(financialOversightSummary.totalEngagements ?? 0),
      description: `${formatNumber(financialOversightSummary.alerts ?? 0)} alerts`,
    },
  ];

  const portfolioProjects = portfolioInsights.projects ?? [];
  const portfolioDependencies = portfolioInsights.dependencies ?? [];
  const portfolioCalendar = portfolioInsights.calendar ?? [];

  const orchestratorBlueprints = orchestratorInsights.blueprints ?? [];
  const orchestratorCadences = orchestratorInsights.cadences ?? [];
  const orchestratorGuardrails = orchestratorInsights.automationGuardrails ?? [];
  const orchestratorDashboards = orchestratorInsights.clientDashboards ?? [];
  const orchestratorNotes = orchestratorInsights.latestNotes ?? [];

  const resourceHeatmap = resourceIntelligenceInsights.heatmap ?? [];
  const assignmentMatches = resourceIntelligenceInsights.assignmentMatches ?? [];
  const scenarioPlans = resourceIntelligenceInsights.scenarioPlans ?? [];

  const qualityUpcoming = qualityInsights.upcoming ?? [];
  const qualityScorecards = qualityInsights.scorecards ?? [];
  const qualityLessons = qualityInsights.lessonsLearned ?? [];
  const qualityIncentives = qualityInsights.incentives ?? [];

  const financialEngagements = financialOversightInsights.engagements ?? [];
  const financialAlerts = financialOversightInsights.alerts ?? [];
  const financialEscrow = financialOversightInsights.escrow ?? [];
  const financialCurrencies = financialOversightSummary.currencies ?? [];

  const toneClasses = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
  };
    talentLifecycleSummary,
    talentCrm,
    peopleOps,
    talentOpportunityBoard,
    brandingStudio,
    hrManagement,
    capacityPlanning,
    internalMarketplace,
    studioSummary.managedGigs,
    studioSummary.totalGigs,
    studioSummary.onTimeRate,
    partnerSummary.activeAlliances,
    partnerSummary.averageConversionRate,
    marketingSummary.activeCampaigns,
    marketingSummary.totalPipelineValue,
    clientAdvocacySummary.activePlaybooks,
    clientAdvocacySummary.reviewResponseRate,
    defaultCurrency,
  ]);

  const profile = useMemo(() => {
    const metrics = [];
    if (summary?.members?.active != null) {
      metrics.push({ label: 'Active members', value: formatNumber(summary.members.active) });
    }
    if (summary?.projects?.total != null) {
      metrics.push({ label: 'Projects', value: formatNumber(summary.projects.total) });
    }
    if (summary?.financials?.inEscrow != null) {
      metrics.push({ label: 'In escrow', value: formatCurrency(summary.financials.inEscrow, summary.financials.currency) });
    }

    const badges = [];
    if (state.data?.scope === 'workspace') {
      badges.push('Workspace view');
    } else if (state.data?.scope === 'global_fallback') {
      badges.push('Global metrics fallback');
    } else {
      badges.push('Global view');
    }

    return {
      name: agencyProfile?.agencyName ?? workspace?.name ?? 'Agency Workspace',
      role: agencyProfile?.focusArea ?? 'Agency operations',
      initials: agencyProfile?.agencyName ? getInitials(agencyProfile.agencyName) : getInitials(workspace?.name ?? 'Agency'),
      status: workspace?.isActive === false ? 'Suspended' : 'Operating at scale',
      badges,
      metrics,
    };
  }, [agencyProfile, workspace, summary, state.data?.scope]);

  const capabilitySections = [];

  const renderLoading = (
    <section className="rounded-3xl border border-blue-100 bg-white/80 p-10 shadow-inner">
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded-full bg-blue-100" />
        <div className="h-4 w-64 animate-pulse rounded-full bg-blue-50" />
        <div className="h-4 w-80 animate-pulse rounded-full bg-blue-50" />
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-3xl border border-blue-50 bg-blue-50/50 p-6">
            <div className="h-4 w-32 animate-pulse rounded-full bg-blue-100" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-blue-200" />
            <div className="h-4 w-24 animate-pulse rounded-full bg-blue-100" />
          </div>
        ))}
      </div>
    </section>
  );

  const renderError = (
    <section className="rounded-3xl border border-red-100 bg-red-50/70 p-6 text-red-700">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0" />
        <div>
          <h2 className="text-base font-semibold">We couldn&rsquo;t load the agency dashboard</h2>
          <p className="mt-1 text-sm">{state.error ?? 'An unexpected error occurred. Please try refreshing the page.'}</p>
        </div>
      </div>
    </section>
  );

  const executiveFocusMetrics = focusMetrics.filter((item) => item.metric);
  const executiveScorecards = (intelligenceOverview.metrics ?? []).slice(0, 6);
  const executivePolicies = (intelligenceOverview.compliancePolicies ?? []).slice(0, 4);
  const executiveObligations = (intelligenceOverview.upcomingObligations ?? []).slice(0, 4);
  const executiveRooms = (intelligenceOverview.collaborationRooms ?? []).slice(0, 3);

  const renderAgencyOverview = (
    <section id="agency-overview" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Agency operations</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            Performance scorecards, client health, and guardrails at a glance
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Monitor utilization, client sentiment, and operational alerts to orchestrate delivery, staffing, and revenue in real
            time.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Utilization</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatPercent(operationsUtilization.rate)}</p>
          <p className="text-xs text-slate-500">{formatNumber(operationsUtilization.benchCount)} on bench</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {operationsScorecards.length ? (
          operationsScorecards.map((card) => {
            const key = card.key ?? card.label;
            const change = formatScorecardChange(card, card.currency ?? defaultCurrency);
            return (
              <div key={key} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatScorecardValue(card, card.currency ?? defaultCurrency)}
                </p>
                {change ? (
                  <p className={`mt-1 text-xs font-medium ${change.className}`}>{change.text}</p>
                ) : null}
                {card.description ? (
                  <p className="mt-2 text-xs text-slate-500">{card.description}</p>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 p-6 text-sm text-slate-500">
            Scorecards will populate once utilization, projects, and financial metrics are recorded.
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
          <h3 className="text-base font-semibold text-slate-900">Utilization &amp; capacity</h3>
          <p className="mt-1 text-sm text-slate-500">
            Balance delivery loads, highlight squads under pressure, and keep the bench ready for deployment.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Utilization</dt>
              <dd className="text-lg font-semibold text-slate-900">{formatPercent(operationsUtilization.rate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bench ready</dt>
              <dd className="text-lg font-semibold text-slate-900">{formatNumber(operationsUtilization.benchCount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bench hours</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {formatNumber(Math.round(Number(operationsUtilization.benchHours ?? 0)))}h
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg weekly capacity</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {operationsUtilization.averageWeeklyCapacity != null
                  ? `${formatNumber(Math.round(Number(operationsUtilization.averageWeeklyCapacity)))}h`
                  : 'n/a'}
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">At-risk skills</p>
            {operationsUtilization.atRiskSkills.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {operationsUtilization.atRiskSkills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-amber-700"
                  >
                    {titleCase(skill)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No burnout risks detected this week.</p>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Staffing signals</p>
            <ul className="mt-2 space-y-2">
              {operationsAssignments.slice(0, 3).map((assignment, index) => (
                <li
                  key={assignment.skillGroup ?? index}
                  className="rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-600"
                >
                  <p className="font-semibold text-slate-900">{assignment.skillGroup ?? 'Skill group'}</p>
                  <p className="mt-1">
                    {assignment.utilizationRate != null
                      ? `Utilization ${formatPercent(assignment.utilizationRate)}`
                      : 'Utilization pending'}
                    {' · '}
                    {assignment.recommendation ?? 'Maintain cadence'}
                  </p>
                </li>
              ))}
              {!operationsAssignments.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                  Staffing recommendations will populate once resource intelligence snapshots are available.
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
          <h3 className="text-base font-semibold text-slate-900">Client health</h3>
          <p className="mt-1 text-sm text-slate-500">
            Pulse on relationships, CSAT, and risk signals to keep delivery partners in the know.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active clients</dt>
              <dd className="text-lg font-semibold text-slate-900">{formatNumber(operationsClientHealth.activeClients)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">At-risk engagements</dt>
              <dd className="text-lg font-semibold text-slate-900">{formatNumber(operationsClientHealth.atRiskEngagements)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">CSAT</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {operationsClientHealth.csatScore != null
                  ? formatDecimal(operationsClientHealth.csatScore, 1)
                  : 'n/a'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">QA score</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {operationsClientHealth.qaScore != null
                  ? formatPercent(operationsClientHealth.qaScore)
                  : 'n/a'}
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest touchpoints</p>
            <ul className="mt-2 space-y-2">
              {clientHealthNotes.length ? (
                clientHealthNotes.slice(0, 4).map((note) => (
                  <li key={note.id ?? note.createdAt ?? note.note} className="rounded-2xl border border-slate-200/70 bg-white px-3 py-2">
                    <p className="text-sm text-slate-700">{note.note ?? 'Client update logged.'}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                      {note.subject
                        ? `${note.subject.firstName} ${note.subject.lastName}`
                        : note.subjectUserId
                          ? `Contact ${note.subjectUserId}`
                          : 'Client contact'}
                      {' · '}
                      {formatRelativeTime(note.createdAt)}
                    </p>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                  Log client notes and feedback to populate the health stream.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Operational alerts</h3>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
              {formatNumber(operationsAlerts.length)} open
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Blend of delivery, financial, and compliance alerts needing triage.
          </p>
          <ul className="mt-4 space-y-3">
            {operationsAlerts.length ? (
              operationsAlerts.slice(0, 6).map((alert, index) => {
                const toneClass = operationsAlertTone[alert.severity ?? 'warning'] ?? operationsAlertTone.warning;
                return (
                  <li
                    key={alert.referenceId ?? alert.message ?? index}
                    className={`rounded-2xl border px-3 py-3 text-sm ${toneClass}`}
                  >
                    <p className="font-semibold">{alert.title ?? titleCase(alert.type ?? 'alert')}</p>
                    <p className="mt-1 text-xs">{alert.message ?? 'Action required'}</p>
                    {alert.timestamp ? (
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                        {formatRelativeTime(alert.timestamp)}
                      </p>
                    ) : null}
                  </li>
                );
              })
            ) : (
              <li className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                No active alerts. Keep monitoring delivery, compliance, and finance signals.
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderExecutiveIntelligenceSection = (
    <section id="executive-intelligence" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Executive intelligence &amp; governance</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Stay on top of the agency command centre</h2>
          <p className="mt-2 text-sm text-slate-500">
            Signal-driven focus metrics, compliance posture, and collaboration rooms aligned to leadership decisions.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Run-rate</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{revenueRunRateText}</p>
          <p className="text-xs text-slate-500">Gross margin {marginText}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {executiveFocusMetrics.length ? (
          executiveFocusMetrics.map((item) => {
            const change = describeMetricChange(item.metric);
            return (
              <div key={item.key} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMetricValue(item.metric)}</p>
                {change ? (
                  <p className={`mt-1 text-xs font-medium ${change.className}`}>{change.text}</p>
                ) : null}
                {item.metric?.description ? (
                  <p className="mt-3 text-xs text-slate-500">{item.metric.description}</p>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
            Executive metrics will appear here once configured.
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Executive scorecards</h3>
              <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                {formatNumber(analyticsScorecardCount)} metrics tracked
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {executiveScorecards.length ? (
                executiveScorecards.map((metric) => {
                  const change = describeMetricChange(metric);
                  return (
                    <li
                      key={metric.id ?? metric.metricKey}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/70 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{metric.name}</p>
                        {metric.description ? (
                          <p className="text-xs text-slate-500">{metric.description}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatMetricValue(metric)}</p>
                        {change ? (
                          <p className={`text-xs font-medium ${change.className}`}>{change.text}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="rounded-2xl border border-dashed border-blue-200 px-4 py-6 text-center text-sm text-slate-500">
                  Add metrics to populate the leadership scorecard view.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Compliance policies</h3>
            <ul className="mt-3 space-y-3">
              {executivePolicies.length ? (
                executivePolicies.map((policy) => (
                  <li key={policy.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{policy.title}</p>
                    <p className="text-xs text-slate-500">
                      {titleCase(policy.documentType)} · {titleCase(policy.status ?? 'active')}
                      {policy.nextReviewAt ? ` · Next review ${formatAbsolute(policy.nextReviewAt)}` : ''}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No policies have been catalogued.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Upcoming obligations</h3>
            <ul className="mt-3 space-y-3">
              {executiveObligations.length ? (
                executiveObligations.map((obligation) => (
                  <li key={obligation.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{obligation.description}</p>
                    <p className="text-xs text-slate-500">
                      {obligation.document?.title ? `${obligation.document.title} · ` : ''}
                      Due {obligation.dueAt ? formatAbsolute(obligation.dueAt) : 'TBC'}
                      {obligation.priority ? ` · Priority ${titleCase(obligation.priority)}` : ''}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">All governance obligations are up to date.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Leadership rooms</h3>
            <ul className="mt-3 space-y-3">
              {executiveRooms.length ? (
                executiveRooms.map((room) => (
                  <li key={room.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{room.name}</p>
                    <p className="text-xs text-slate-500">
                      {room.summary ?? 'Shared workspace for leadership rituals.'}
                    </p>
                    {room.meetingCadence ? (
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-blue-600">{room.meetingCadence}</p>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">Create collaboration rooms to orchestrate executive work.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  const warRoomScorecards = (analyticsWarRoomData.scorecards ?? []).slice(0, 9);
  const groupedWarRoomEntries = Object.entries(groupedWarRoom).sort((a, b) => a[0].localeCompare(b[0]));

  const renderAnalyticsWarRoomSection = (
    <section id="analytics-war-room" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Agency analytics war room</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Interactive command centre for revenue and delivery</h2>
          <p className="mt-2 text-sm text-slate-500">
            Track revenue, margin, utilisation, and policy adherence with real-time scorecards grouped by strategic lenses.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Categories</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(analyticsCategoryCount)}</p>
          <p className="text-xs text-slate-500">{formatNumber(analyticsScorecardCount)} scorecards</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Metric spotlight</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {warRoomScorecards.length ? (
                warRoomScorecards.map((metric) => {
                  const change = describeMetricChange(metric);
                  return (
                    <div key={metric.id ?? metric.metricKey} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titleCase(metric.category)}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{metric.name}</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-900">{formatMetricValue(metric)}</p>
                      {change ? (
                        <p className={`mt-1 text-xs font-medium ${change.className}`}>{change.text}</p>
                      ) : null}
                      {metric.description ? (
                        <p className="mt-3 text-xs text-slate-500">{metric.description}</p>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  Configure scorecards to activate the analytics war room.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {groupedWarRoomEntries.length ? (
            groupedWarRoomEntries.map(([category, metrics]) => (
              <div key={category} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{titleCase(category)}</h3>
                  <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                    {formatNumber(metrics.length)} metrics
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {metrics.slice(0, 4).map((metric) => (
                    <li key={metric.id ?? metric.metricKey} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-white px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-600">{metric.name}</p>
                        {metric.description ? (
                          <p className="text-[11px] text-slate-500">{metric.description}</p>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatMetricValue(metric)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
              Metrics will automatically cluster into command pods once recorded.
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const scenarioCards = Object.entries(scenarioExplorerData.scenarios ?? {}).map(([scenarioKey, scenario]) => ({
    key: scenarioKey,
    ...scenario,
  }));
  const scenarioOrder = ['best', 'base', 'worst'];
  scenarioCards.sort((a, b) => {
    const indexA = scenarioOrder.indexOf(a.key);
    const indexB = scenarioOrder.indexOf(b.key);
    if (indexA === -1 && indexB === -1) return a.label.localeCompare(b.label);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  function summariseScenarioMetrics(metrics = {}) {
    const parts = [];
    if (metrics.revenue != null) {
      parts.push(`Revenue ${formatCurrency(metrics.revenue, financialSummary.currency)}`);
    }
    if (metrics.grossMargin != null) {
      parts.push(`Margin ${formatPercent(metrics.grossMargin)}`);
    }
    if (metrics.utilization != null) {
      parts.push(`Util ${formatPercent(metrics.utilization)}`);
    }
    if (metrics.pipelineVelocity != null) {
      parts.push(`Velocity ${formatNumber(metrics.pipelineVelocity)} days`);
    }
    if (metrics.clientSatisfaction != null) {
      parts.push(`Satisfaction ${formatNumber(metrics.clientSatisfaction)}`);
    }
    if (metrics.netRetention != null) {
      parts.push(`Net retention ${formatPercent(metrics.netRetention)}`);
    }
    return parts.join(' · ');
  }

  const scenarioDimensions = [
    { key: 'clients', label: 'Clients' },
    { key: 'serviceLines', label: 'Service lines' },
    { key: 'squads', label: 'Squads' },
    { key: 'individuals', label: 'Individuals' },
  ];

  const renderScenarioExplorerSection = (
    <section id="scenario-explorer" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Scenario explorer</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Plan best, base, and worst-case outcomes</h2>
          <p className="mt-2 text-sm text-slate-500">
            Model forecasts and drill down into clients, service lines, squads, or individuals to stress-test delivery plans.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Scenarios</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(scenarioCards.length)}</p>
          <p className="text-xs text-slate-500">Interactive forecasts</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {scenarioCards.length ? (
          scenarioCards.map((scenario) => (
            <div key={scenario.key} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titleCase(scenario.key)}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{scenario.label ?? titleCase(scenario.key)}</h3>
                </div>
                {scenario.timeframeStart || scenario.timeframeEnd ? (
                  <p className="text-xs text-slate-500 text-right">
                    {scenario.timeframeStart ? formatAbsolute(scenario.timeframeStart) : ''}
                    {scenario.timeframeStart && scenario.timeframeEnd ? ' – ' : ''}
                    {scenario.timeframeEnd ? formatAbsolute(scenario.timeframeEnd) : ''}
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">{summariseScenarioMetrics(scenario.metrics)}</p>
              {summariseAssumptions(scenario.assumptions) ? (
                <p className="mt-3 text-xs text-slate-500">Assumptions: {summariseAssumptions(scenario.assumptions)}</p>
              ) : null}
              {scenario.notes ? <p className="mt-3 text-xs text-slate-500">Notes: {scenario.notes}</p> : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500 md:col-span-3">
            Create scenario plans to compare best, base, and downside cases.
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {scenarioDimensions.map((dimension) => {
          const items = (scenarioBreakdowns[dimension.key] ?? []).slice(0, 6);
          return (
            <div key={dimension.key} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{dimension.label} drill-down</h3>
                <span className="text-xs font-medium uppercase tracking-wide text-blue-600">{formatNumber(items.length)} entries</span>
              </div>
              <ul className="mt-3 space-y-3">
                {items.length ? (
                  items.map((item) => (
                    <li key={`${item.dimensionKey}-${item.scenarioType}`} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.label ?? item.dimensionKey}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">{titleCase(item.scenarioType)}</p>
                        </div>
                        <p className="text-xs text-slate-500 text-right">{summariseScenarioMetrics(item.metrics)}</p>
                      </div>
                      {item.owner ? (
                        <p className="mt-2 text-xs text-slate-500">Owner: {item.owner}</p>
                      ) : null}
                      {item.highlight ? (
                        <p className="mt-1 text-xs text-emerald-600">Highlight: {item.highlight}</p>
                      ) : null}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500">No {dimension.label.toLowerCase()} captured yet.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderGovernanceDeskSection = (
    <section id="governance-desk" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Governance &amp; compliance desk</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Contracts, NDAs, insurance, and regulatory coverage</h2>
          <p className="mt-2 text-sm text-slate-500">
            Maintain risk registers, automated reviews, and audit-ready exports tied directly to mitigation owners.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Policies &amp; obligations</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatNumber(governancePolicyCount)} / {formatNumber(governanceObligationCount)}
          </p>
          <p className="text-xs text-slate-500">Tracked artefacts</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Policy register</h3>
            <ul className="mt-3 space-y-3">
              {topPolicies.length ? (
                topPolicies.map((policy) => (
                  <li key={policy.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{policy.title}</p>
                        <p className="text-xs text-slate-500">{titleCase(policy.documentType)} · {titleCase(policy.status ?? 'active')}</p>
                      </div>
                      {policy.expiryDate ? (
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-600">
                          Expires {formatAbsolute(policy.expiryDate)}
                        </span>
                      ) : null}
                    </div>
                    {policy.renewalTerms ? (
                      <p className="mt-2 text-xs text-slate-500">Renewal: {policy.renewalTerms}</p>
                    ) : null}
                    {policy.counterpartyName ? (
                      <p className="mt-1 text-xs text-slate-500">Counterparty: {policy.counterpartyName}</p>
                    ) : null}
                    {policy.nextReviewAt ? (
                      <p className="mt-1 text-xs text-blue-600">Next review {formatAbsolute(policy.nextReviewAt)}</p>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No policies available for this workspace.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Risk register</h3>
            <ul className="mt-3 space-y-3">
              {highlightedRisks.length ? (
                highlightedRisks.map((risk) => (
                  <li key={risk.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{risk.title}</p>
                        <p className="text-xs text-slate-500">
                          {titleCase(risk.category ?? 'risk')} · Status {titleCase(risk.status ?? 'open')} · Impact {formatNumber(risk.impactScore)} / Likelihood {formatNumber(risk.likelihoodScore)}
                        </p>
                      </div>
                      {risk.targetResolutionDate ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-amber-700">
                          Resolve by {formatAbsolute(risk.targetResolutionDate)}
                        </span>
                      ) : null}
                    </div>
                    {risk.mitigationPlan ? (
                      <p className="mt-2 text-xs text-slate-500">Plan: {risk.mitigationPlan}</p>
                    ) : null}
                    {risk.mitigationOwner ? (
                      <p className="mt-1 text-xs text-slate-500">Owner: {risk.mitigationOwner}</p>
                    ) : null}
                    {risk.mitigationStatus ? (
                      <p className="mt-1 text-xs text-blue-600">Status: {risk.mitigationStatus}</p>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No risks captured in the register.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Obligations &amp; reminders</h3>
            <ul className="mt-3 space-y-3">
              {topObligations.length ? (
                topObligations.map((obligation) => (
                  <li key={obligation.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{obligation.description}</p>
                    <p className="text-xs text-slate-500">
                      {obligation.document?.title ? `${obligation.document.title} · ` : ''}
                      Due {obligation.dueAt ? formatAbsolute(obligation.dueAt) : 'TBC'}
                      {obligation.status ? ` · ${titleCase(obligation.status)}` : ''}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No obligations require attention.</li>
              )}
            </ul>

            <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Automated reminders</p>
              <ul className="mt-2 space-y-2">
                {upcomingReminders.length ? (
                  upcomingReminders.map((reminder) => (
                    <li key={reminder.id} className="text-xs text-slate-500">
                      {reminder.document?.title ? `${reminder.document.title} · ` : ''}
                      {titleCase(reminder.reminderType ?? 'reminder')} scheduled {reminder.sendAt ? formatAbsolute(reminder.sendAt) : 'TBC'}
                      {reminder.status ? ` · ${titleCase(reminder.status)}` : ''}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500">No reminders scheduled.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Audit-ready exports</h3>
            <ul className="mt-3 space-y-3">
              {recentAudits.length ? (
                recentAudits.map((audit) => (
                  <li key={audit.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{titleCase(audit.exportType ?? 'export')}</p>
                    <p className="text-xs text-slate-500">
                      Requested by {audit.requestedBy ?? 'Client'} · Generated {audit.generatedAt ? formatAbsolute(audit.generatedAt) : 'TBC'}
                    </p>
                    {audit.notes ? <p className="mt-1 text-xs text-slate-500">{audit.notes}</p> : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No audit exports generated yet.</li>
              )}
  const renderTalentOverview = (
    <div className="rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Talent lifecycle &amp; HR excellence</h2>
          <p className="text-sm text-slate-600">
            Give every agency member a consumer-grade experience across hiring, onboarding, development, and performance.
          </p>
        </div>
        <span className="rounded-2xl bg-purple-100/80 p-3 text-purple-600">
          <SparklesIcon className="h-6 w-6" />
        </span>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active headcount</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(hrManagement?.activeHeadcount ?? summary?.members?.total ?? members.length ?? 0)}
          </dd>
          <dd className="mt-1 text-xs text-slate-500">
            {formatNumber(hrManagement?.contractors ?? 0)} contractors · Bench {formatPercent(staffingCapacity?.benchRate ?? 0)}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Talent conversion</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">
            {formatPercent(talentLifecycleSummary?.conversionRate ?? talentCrm?.conversionRate ?? 0)}
          </dd>
          <dd className="mt-1 text-xs text-slate-500">
            Avg time-to-fill {formatScore(talentCrm?.averageTimeToFillDays ?? 0)} days
          </dd>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bench capacity</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(Math.round(staffingCapacity?.benchHours ?? capacityPlanning?.benchCapacityHours ?? 0))} hrs
          </dd>
          <dd className="mt-1 text-xs text-slate-500">
            {`Utilisation ${formatPercent(
              staffingCapacity?.utilizationRate ??
                capacityPlanning?.utilizationRate ??
                summary?.members?.utilizationRate ??
                0,
            )}`}{' '}
            · {`Health ${titleCase((hrHealth?.level ?? 'balanced').replace(/_/g, ' '))}`}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brand reach</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(brandingStudio?.metrics?.totals?.reach ?? 0)}
          </dd>
          <dd className="mt-1 text-xs text-slate-500">
            {formatNumber(brandingStudio?.metrics?.totals?.leadsAttributed ?? 0)} attributed leads
          </dd>
        </div>
      </dl>
    </div>
  );

  const renderHrManagementSection = (
    <section className="rounded-3xl border border-purple-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Workforce intelligence</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Agency HR command centre</h2>
          <p className="mt-2 text-sm text-slate-500">
            Monitor role coverage, staffing health, and compliance follow-ups with production signals from the provider workspace.
          </p>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50/60 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Utilisation</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatPercent(staffingCapacity?.utilizationRate ?? summary?.members?.utilizationRate ?? 0)}
          </p>
          <p className="text-xs text-slate-500">
            {formatNumber(staffingCapacity?.activeMembers ?? summary?.members?.active ?? totalMembersCount)} active team members
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headcount</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(hrManagement?.activeHeadcount ?? 0)}</dd>
          <dd className="mt-1 text-xs text-slate-500">{formatNumber(hrManagement?.contractors ?? 0)} contractors</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hiring pipeline</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(hrRoleTotals?.hiring ?? 0)}</dd>
          <dd className="mt-1 text-xs text-slate-500">
            {formatNumber(hrRoleTotals?.interviewing ?? 0)} interviewing · {formatNumber(hrRoleTotals?.offers ?? 0)} offers ·{' '}
            {formatNumber(hrAttentionRoles.length)} coverage risks
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compliance tasks</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(hrManagement?.complianceOutstanding ?? 0)}
          </dd>
          <dd className="mt-1 text-xs text-slate-500">Outstanding acknowledgements</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bench health</dt>
          <dd className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(staffingCapacity?.benchHours ?? 0)} hrs</dd>
          <dd className="mt-1 text-xs text-slate-500">
            {`Health ${titleCase((hrHealth?.level ?? 'balanced').replace(/_/g, ' '))}`}
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority alerts</p>
              <span className="text-xs text-slate-500">{formatNumber(hrAlerts.length)} open</span>
            </div>
            <ul className="mt-3 space-y-3">
              {hrAlerts.length ? (
                hrAlerts.slice(0, 4).map((alert) => {
                  const style = getHrAlertStyle(alert.severity);
                  return (
                    <li
                      key={alert.id ?? alert.message}
                      className={`rounded-2xl border ${style.border} ${style.background} px-4 py-3`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className={`text-sm font-semibold ${style.text}`}>{alert.message}</p>
                          {alert.recommendedAction ? (
                            <p className="mt-1 text-xs text-slate-600">Next: {alert.recommendedAction}</p>
                          ) : null}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${style.badge}`}
                        >
                          <ExclamationTriangleIcon className={`h-3.5 w-3.5 ${style.accent}`} />
                          {titleCase(alert.type ?? 'alert')}
                        </span>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-slate-500">No alerts detected in the last 30 days.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outstanding policies</p>
            <ul className="mt-3 space-y-2">
              {outstandingPolicies.length ? (
                outstandingPolicies.map((policy) => (
                  <li
                    key={policy.id ?? policy.title}
                    className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{policy.title ?? 'Policy'}</p>
                      <p className="text-xs text-slate-500">
                        {formatNumber(policy.outstanding ?? 0)} outstanding
                        {policy.reviewCycleDays ? ` · Review every ${policy.reviewCycleDays}d` : ''}
                      </p>
                    </div>
                    {policy.effectiveDate ? (
                      <span className="text-xs text-slate-500">{formatAbsolute(policy.effectiveDate)}</span>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">All published policies are acknowledged.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role coverage</p>
              <span className="text-xs text-slate-500">
                {formatNumber(hrRoleTotals?.roles ?? hrRoleCoverage.length)} roles · {formatNumber(hrRoleTotals?.hiring ?? 0)} hiring
              </span>
            </div>
            <ul className="mt-3 space-y-3">
              {hrRoleCoverage.length ? (
                hrRoleCoverage.slice(0, 5).map((role) => {
                  const utilisationText =
                    role.utilizationRate == null ? 'N/A' : formatPercent(role.utilizationRate ?? 0);
                  return (
                    <li key={role.roleKey ?? role.role} className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{role.role ?? 'Role'}</p>
                          <p className="text-xs text-slate-500">
                            {formatNumber(role.active ?? 0)} active · {formatNumber(role.hiring ?? 0)} in pipeline
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{utilisationText}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${role.needsAttention ? 'bg-rose-500' : 'bg-purple-500'}`}
                          style={{ width: `${Math.min(role.utilizationRate ?? 0, 100)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Bench {formatNumber(role.bench ?? 0)} · Capacity {formatNumber(role.capacityHours ?? 0)} hrs
                        {role.pipeline?.offers ? ` · Offers ${formatNumber(role.pipeline.offers)}` : ''}
                      </p>
                      {role.needsAttention ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                          <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                          Coverage risk
                        </span>
                      ) : null}
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-slate-500">Assign members to roles to unlock coverage insights.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Staffing insights</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{formatNumber(staffingCapacity?.totalCapacityHours ?? 0)} hrs</p>
                <p className="text-xs text-slate-500">Total capacity</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{formatNumber(staffingCapacity?.committedHours ?? 0)} hrs</p>
                <p className="text-xs text-slate-500">Committed</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{formatNumber(staffingCapacity?.benchMembers ?? 0)}</p>
                <p className="text-xs text-slate-500">Bench members</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{formatPercent(staffingCapacity?.benchRate ?? 0)}</p>
                <p className="text-xs text-slate-500">Bench rate</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{hrHealth.summary ?? 'Capacity insights ready.'}</p>
            {hrHealth.recommendedAction ? (
              <p className="mt-1 text-xs font-medium text-purple-600">Next: {hrHealth.recommendedAction}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
              {availabilityBreakdown.filter((item) => item.count > 0).length ? (
                availabilityBreakdown
                  .filter((item) => item.count > 0)
                  .map((item) => (
                    <span key={item.status} className="rounded-full bg-purple-50 px-3 py-1 font-medium text-purple-700">
                      {formatAvailabilityLabel(item.status)} · {formatNumber(item.count)}
                    </span>
                  ))
              ) : (
                <span className="text-xs text-slate-500">Availability data pending.</span>
              )}
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming onboarding</p>
              <ul className="mt-2 space-y-2">
                {onboardingQueue.length ? (
                  onboardingQueue.map((candidate) => (
                    <li
                      key={candidate.id ?? candidate.name}
                      className="rounded-xl border border-white/60 bg-white/80 px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-slate-900">{candidate.name}</p>
                      <p className="text-xs text-slate-500">
                        {candidate.role ?? 'Role TBC'}
                        {candidate.startDate ? ` · Starts ${formatAbsolute(candidate.startDate)}` : ' · Start date TBC'}
                        {candidate.status ? ` · ${titleCase(candidate.status)}` : ''}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500">No onboarding workflows queued.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderTalentCrm = (
    <div className="rounded-3xl border border-purple-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Talent CRM</h2>
          <p className="text-sm text-slate-500">
            Recruit, evaluate, and onboard permanent staff, contractors, and collectives with interview scheduling and feedback loops.
          </p>
        </div>
        <span className="rounded-2xl bg-purple-50 p-3 text-purple-600">
          <BriefcaseIcon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {Object.entries(talentCrm?.stageCounts ?? {}).map(([stage, count]) => (
          <div key={stage} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titleCase(stage)}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatNumber(count)}</p>
          </div>
        ))}
        {!Object.keys(talentCrm?.stageCounts ?? {}).length ? (
          <p className="col-span-full text-sm text-slate-500">
            No candidates in the pipeline yet. Publish a role or gig to start sourcing talent.
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
        {Object.entries(talentCrm?.diversityBreakdown ?? {})
          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
          .slice(0, 4)
          .map(([tag, count]) => (
            <span key={tag} className="rounded-full bg-purple-50 px-3 py-1 font-medium text-purple-700">
              {titleCase(tag)} · {formatNumber(count)}
            </span>
          ))}
        {talentCrm?.totals?.offersSigned != null ? (
          <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
            {formatNumber(talentCrm.totals.offersSigned)} signed offers
          </span>
        ) : null}
        {talentCrm?.pipelineAnalytics?.latest?.openRoles != null ? (
          <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
            {formatNumber(talentCrm.pipelineAnalytics.latest.openRoles)} open roles
          </span>
        ) : null}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming interviews</p>
          <ul className="mt-3 space-y-3">
            {(talentCrm?.upcomingInterviews ?? []).length ? (
              talentCrm.upcomingInterviews.slice(0, 4).map((interview) => (
                <li key={`${interview.id ?? interview.scheduledAt}-upcoming`} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">{titleCase(interview.stage ?? 'Interview')}</p>
                  <p className="text-xs text-slate-500">
                    Candidate {interview.candidateId ?? 'TBC'} • {interview.scheduledAt ? formatAbsolute(interview.scheduledAt) : 'Scheduling'}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No interviews scheduled.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offer workflows</p>
          <ul className="mt-3 space-y-3">
            {(talentCrm?.offerWorkflows ?? []).length ? (
              talentCrm.offerWorkflows.slice(0, 4).map((offer) => (
                <li key={`${offer.id ?? offer.candidateId}-offer`} className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">{offer.roleTitle ?? 'Offer'}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(offer.status ?? 'draft')} • {offer.sentAt ? formatRelativeTime(offer.sentAt) : 'Pending send'}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">Draft an offer to begin automated approvals.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderPeopleOpsHub = (
    <div className="rounded-3xl border border-purple-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">People ops hub</h2>
          <p className="text-sm text-slate-500">
            Centralize HR policies, benefits, compliance attestations, performance reviews, and wellbeing insights.
          </p>
        </div>
        <span className="rounded-2xl bg-purple-50 p-3 text-purple-600">
          <ClipboardDocumentCheckIcon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policies</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatNumber(peopleOps?.policies?.active ?? 0)} active • {formatPercent(peopleOps?.policies?.acknowledgementRate ?? 0)} acknowledged
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(peopleOps?.policies?.list ?? []).slice(0, 3).map((policy) => (
                <li key={policy.id ?? policy.title ?? 'policy'} className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2">
                  <span className="font-medium text-slate-900">{policy.title ?? 'Policy'}</span>
                  <span className="text-xs text-slate-500">{policy.updatedAt || policy.effectiveDate ? formatAbsolute(policy.updatedAt ?? policy.effectiveDate) : 'Review pending'}</span>
                </li>
              ))}
              {!peopleOps?.policies?.list?.length ? <li className="text-xs text-slate-500">No policies published yet.</li> : null}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Performance reviews</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatNumber(peopleOps?.performance?.outstanding ?? 0)} outstanding • {formatNumber(peopleOps?.performance?.completed ?? 0)} completed
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(peopleOps?.performance?.reviews ?? []).slice(0, 3).map((review) => (
                <li key={review.id ?? review.memberId ?? 'review'} className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2">
                  <span className="font-medium text-slate-900">{review.cycle ?? 'Review cycle'}</span>
                  <span className="text-xs text-slate-500">{titleCase(review.status ?? 'pending')}</span>
                </li>
              ))}
              {!peopleOps?.performance?.reviews?.length ? <li className="text-xs text-slate-500">No reviews scheduled.</li> : null}
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills matrix</p>
            <ul className="mt-3 space-y-3">
              {Object.entries(peopleOps?.skills?.coverage ?? {}).slice(0, 3).map(([category, coverage]) => {
                const total = coverage.total ?? 0;
                const ready = coverage.ready ?? 0;
                const percent = total ? Math.round((ready / total) * 100) : 0;
                return (
                  <li key={category} className="rounded-xl border border-white/60 bg-white/80 p-3">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-900">
                      <span>{titleCase(category)}</span>
                      <span>{percent}% ready</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-purple-100">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(percent, 100)}%` }} />
                    </div>
                  </li>
                );
              })}
              {!Object.keys(peopleOps?.skills?.coverage ?? {}).length ? (
                <li className="text-xs text-slate-500">Document skills to unlock growth pathways.</li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wellbeing</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              Score {formatScore(peopleOps?.wellbeing?.averageScore ?? 0)} • {formatNumber(peopleOps?.wellbeing?.atRisk ?? 0)} at-risk
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {Object.entries(peopleOps?.wellbeing?.riskCounts ?? {}).map(([risk, count]) => (
                <span key={risk} className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                  {titleCase(risk)} · {formatNumber(count ?? 0)}
                </span>
              ))}
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              {(peopleOps?.wellbeing?.snapshots ?? []).slice(0, 3).map((snapshot) => (
                <li key={snapshot.id ?? snapshot.capturedAt ?? 'snapshot'} className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2">
                  <span>Member {snapshot.memberId}</span>
                  <span>{snapshot.capturedAt ? formatRelativeTime(snapshot.capturedAt) : 'Awaiting check-in'}</span>
                </li>
              ))}
              {!peopleOps?.wellbeing?.snapshots?.length ? <li>No wellbeing surveys captured.</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  const renderLeadershipHubSection = (
    <section id="leadership-collaboration" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Leadership collaboration</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Shared rituals, OKRs, decisions, and async briefings</h2>
          <p className="mt-2 text-sm text-slate-500">
            Coordinate distributed leaders with recurring rituals, transparent decision logs, and Monday-ready briefing packs.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Leadership assets</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(leadershipRitualCount + leadershipDecisionCount)}</p>
          <p className="text-xs text-slate-500">Rituals &amp; decisions</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Upcoming rituals</h3>
            <ul className="mt-3 space-y-3">
              {upcomingRituals.length ? (
                upcomingRituals.map((ritual) => (
                  <li key={ritual.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{ritual.name}</p>
                        <p className="text-xs text-slate-500">Cadence {titleCase(ritual.cadence ?? 'weekly')} · Facilitator {ritual.facilitator ?? 'TBC'}</p>
                      </div>
                      {ritual.nextSessionAt ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-emerald-600">
                          Next {formatAbsolute(ritual.nextSessionAt)}
                        </span>
                      ) : null}
                    </div>
                    {ritual.summary ? <p className="mt-2 text-xs text-slate-500">{ritual.summary}</p> : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">No leadership rituals scheduled.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Strategic bets</h3>
            <ul className="mt-3 space-y-3">
              {strategicBets.length ? (
                strategicBets.map((bet) => (
                  <li key={bet.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{bet.name}</p>
                    <p className="text-xs text-slate-500">
                      Owner {bet.owner ?? 'TBC'} · Progress {formatPercent(bet.progress ?? 0)} · Impact {formatNumber(bet.impactScore ?? 0)}
                    </p>
                    {bet.project?.title ? (
                      <p className="mt-1 text-xs text-slate-500">Linked project: {bet.project.title}</p>
                    ) : null}
                    {bet.thesis ? <p className="mt-2 text-xs text-slate-500">Thesis: {bet.thesis}</p> : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500">Document strategic bets to align leadership focus.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Objectives &amp; key results</h3>
            <ul className="mt-3 space-y-3">
              {keyOkrs.length ? (
                keyOkrs.map((okr) => {
                  const keyResults = normaliseTagList(okr.keyResults);
                  return (
                    <li key={okr.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{okr.objective}</p>
                      <p className="text-xs text-slate-500">
                        Owner {okr.owner ?? 'TBC'} · Status {titleCase(okr.status ?? 'on_track')} · Progress {formatPercent(okr.progress ?? 0)} · Confidence {formatPercent(okr.confidence ?? 0)}
                      </p>
                      {keyResults.length ? (
                        <p className="mt-2 text-xs text-slate-500">Key results: {keyResults.join('; ')}</p>
                      ) : null}
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-slate-500">No OKRs have been logged for this cycle.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Decision log &amp; briefing packs</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent decisions</p>
                <ul className="mt-2 space-y-2">
                  {decisionLog.length ? (
                    decisionLog.map((decision) => (
                      <li key={decision.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{decision.title}</p>
                        <p className="text-xs text-slate-500">
                          {titleCase(decision.status ?? 'open')} · {decision.decidedAt ? formatAbsolute(decision.decidedAt) : 'Date TBC'} · Owner {decision.owner ?? 'TBC'}
                        </p>
                        {decision.summary ? <p className="mt-1 text-xs text-slate-500">{decision.summary}</p> : null}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">No decisions recorded yet.</li>
                  )}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Briefing packs</p>
                <ul className="mt-2 space-y-2">
                  {briefingPacks.length ? (
                    briefingPacks.map((briefing) => {
                      const highlights = normaliseTagList(briefing.highlights);
                      return (
                        <li key={briefing.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{briefing.title}</p>
                          <p className="text-xs text-slate-500">
                            {titleCase(briefing.status ?? 'draft')} · {briefing.distributionDate ? formatAbsolute(briefing.distributionDate) : 'Distribution TBC'} · Prepared by {briefing.preparedBy ?? 'Team'}
                          </p>
                          {briefing.summary ? <p className="mt-1 text-xs text-slate-500">{briefing.summary}</p> : null}
                          {highlights.length ? (
                            <p className="mt-1 text-xs text-blue-600">Highlights: {highlights.join('; ')}</p>
                          ) : null}
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-sm text-slate-500">No briefing packs published yet.</li>
                  )}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collaboration rooms</p>
                <ul className="mt-2 space-y-2">
                  {leadershipRooms.length ? (
                    leadershipRooms.map((room) => (
                      <li key={room.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{room.name}</p>
                        <p className="text-xs text-slate-500">{room.summary ?? 'Leadership collaboration space.'}</p>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">Spin up leadership rooms to centralise async rituals.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderInnovationLabSection = (
    <section id="innovation-lab" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Innovation lab</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Experiment with new service lines and incubators</h2>
          <p className="mt-2 text-sm text-slate-500">
            Prioritise initiatives, track funding, and link ROI snapshots back to executive decision-making.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Portfolio</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(innovationCount)}</p>
          <p className="text-xs text-slate-500">Active initiatives</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Funding snapshot</h3>
          <dl className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Allocated</dt>
              <dd className="text-sm font-semibold text-slate-900">{formatCurrency(fundingSummary.allocated ?? 0, financialSummary.currency)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spent</dt>
              <dd className="text-sm font-semibold text-slate-900">{formatCurrency(fundingSummary.spent ?? 0, financialSummary.currency)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Returned</dt>
              <dd className="text-sm font-semibold text-slate-900">{formatCurrency(fundingSummary.returned ?? 0, financialSummary.currency)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Balance</dt>
              <dd className="text-sm font-semibold text-emerald-700">{formatCurrency(fundingSummary.balance ?? 0, financialSummary.currency)}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Funding events</p>
            <ul className="mt-2 space-y-2">
              {fundingEvents.length ? (
                fundingEvents.map((event) => (
                  <li key={event.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{titleCase(event.eventType ?? 'allocation')}</span>
                    {` • ${formatCurrency(event.amount ?? 0, event.currency ?? financialSummary.currency)} · ${event.recordedAt ? formatAbsolute(event.recordedAt) : 'Recorded TBC'}`}
                    {event.owner ? ` · ${event.owner}` : ''}
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-500">No funding activity captured.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Innovation pipeline</h3>
          <ul className="mt-3 space-y-3">
            {innovationInitiatives.length ? (
              innovationInitiatives.map((initiative) => {
                const tags = normaliseTagList(initiative.tags);
                return (
                  <li key={initiative.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{initiative.name}</p>
                        <p className="text-xs text-slate-500">
                          {titleCase(initiative.category ?? 'innovation')} · Stage {titleCase(initiative.stage ?? 'ideation')} · Priority {titleCase(initiative.priority ?? 'medium')}
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-600">
                        Score {formatNumber(initiative.priorityScore ?? 0)}
                      </span>
                    </div>
                    {initiative.summary ? <p className="mt-2 text-xs text-slate-500">{initiative.summary}</p> : null}
                    <p className="mt-2 text-xs text-slate-500">
                      ETA {initiative.eta ? formatAbsolute(initiative.eta) : 'TBC'} · Confidence {formatPercent(initiative.confidence ?? 0)} · ROI {formatCurrency(initiative.projectedRoi ?? 0, initiative.roiCurrency ?? financialSummary.currency)}
                    </p>
                    {tags.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            {titleCase(tag)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })
            ) : (
              <li className="text-sm text-slate-500">No innovation initiatives captured. Add initiatives to track experiments and ROI.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
    </div>
  );

  const renderTalentOpportunityBoard = (
    <div className="rounded-3xl border border-purple-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Internal opportunity board</h2>
          <p className="text-sm text-slate-500">
            Advertise cross-agency projects, mentorships, communities, and bench initiatives to keep talent engaged.
          </p>
        </div>
        <span className="rounded-2xl bg-purple-50 p-3 text-purple-600">
          <UserGroupIcon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="rounded-full bg-purple-50 px-3 py-1 font-medium text-purple-700">
          {formatNumber(talentOpportunityBoard?.summary?.open ?? 0)} open opportunities
        </span>
        <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
          Avg match {formatScore(talentOpportunityBoard?.summary?.averageMatchScore ?? 0)}
        </span>
        <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
          {formatNumber(talentOpportunityBoard?.summary?.mobileAlerts ?? 0)} mobile alerts sent
        </span>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming opportunities</p>
          <ul className="mt-3 space-y-3">
            {(talentOpportunityBoard?.opportunities ?? []).length ? (
              talentOpportunityBoard.opportunities.slice(0, 4).map((opportunity) => (
                <li key={opportunity.id ?? opportunity.title} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">{opportunity.title}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(opportunity.category ?? 'project')} • {opportunity.startDate ? formatAbsolute(opportunity.startDate) : 'Start TBD'}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No internal opportunities posted.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Smart matches</p>
          <ul className="mt-3 space-y-3">
            {(talentOpportunityBoard?.matches ?? []).length ? (
              talentOpportunityBoard.matches.slice(0, 4).map((match) => (
                <li key={match.id ?? match.memberId ?? 'match'} className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">Member {match.memberId}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(match.status ?? 'new')} • Match score {formatScore(match.matchScore ?? 0)}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">Matches will appear once opportunities go live.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderBrandingStudio = (
    <div className="rounded-3xl border border-purple-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Agency member branding</h2>
          <p className="text-sm text-slate-500">
            Provide banners, media kits, and social cards for each team member to promote agency credentials with approval workflows and analytics.
          </p>
        </div>
        <span className="rounded-2xl bg-purple-50 p-3 text-purple-600">
          <MegaphoneIcon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published assets</p>
          <ul className="mt-3 space-y-3">
            {(brandingStudio?.assets ?? []).length ? (
              brandingStudio.assets.slice(0, 4).map((asset) => (
                <li key={asset.id ?? asset.title ?? 'asset'} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
                  <p className="text-sm font-medium text-slate-900">{asset.title}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(asset.assetType ?? 'asset')} • {titleCase(asset.status ?? 'draft')}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No branding assets uploaded.</li>
            )}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reach &amp; engagement</p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Reach</dt>
                <dd className="text-lg font-semibold text-slate-900">{formatNumber(brandingStudio?.metrics?.totals?.reach ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Engagements</dt>
                <dd className="text-lg font-semibold text-slate-900">{formatNumber(brandingStudio?.metrics?.totals?.engagements ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Clicks</dt>
                <dd className="text-lg font-semibold text-slate-900">{formatNumber(brandingStudio?.metrics?.totals?.clicks ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Leads</dt>
                <dd className="text-lg font-semibold text-slate-900">{formatNumber(brandingStudio?.metrics?.totals?.leadsAttributed ?? 0)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval queue</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(brandingStudio?.approvals?.queue ?? []).slice(0, 4).map((approval) => (
                <li key={approval.id ?? approval.assetId ?? 'approval'} className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2">
                  <span>Asset {approval.assetId ?? 'pending'}</span>
                  <span className="text-xs text-slate-500">{approval.requestedAt ? formatRelativeTime(approval.requestedAt) : 'Awaiting review'}</span>
                </li>
              ))}
              {!brandingStudio?.approvals?.queue?.length ? <li className="text-xs text-slate-500">No approvals pending.</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Active engagements</h2>
          <p className="text-sm text-slate-500">Top projects by recent activity</p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(summary?.projects?.total ?? 0)} total
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {(projects || []).slice(0, 6).map((project) => {
          const status = titleCase(project.status ?? 'unspecified');
          const queueStatus = project.autoAssignEnabled ? titleCase(project.autoAssignStatus ?? 'Queue ready') : 'Manual staffing';
          return (
            <div key={project.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{project.title}</p>
                  <p className="text-xs text-slate-500">
                    {status}
                    {project.budgetAmount != null
                      ? ` • ${formatCurrency(project.budgetAmount, project.budgetCurrency ?? financialSummary.currency)}`
                      : ''}
                  </p>
                </div>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-700">
                  {queueStatus}
                </span>
              </div>
            </div>
          );
        })}
        {!projects.length ? (
          <p className="text-sm text-slate-500">No projects found for this workspace.</p>
        ) : null}
      </div>
    </div>
  );

  const renderPipeline = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Auto-assign pipeline</h2>
          <p className="text-sm text-slate-500">Candidate queue across active projects</p>
        </div>
        <UsersIcon className="h-6 w-6 text-blue-500" />
      </div>
      <dl className="mt-6 space-y-3">
        {Object.entries(pipeline.statuses || {}).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
            <dt className="text-sm font-medium text-slate-600">{titleCase(status)}</dt>
            <dd className="text-base font-semibold text-slate-900">{formatNumber(count)}</dd>
          </div>
        ))}
        {!Object.keys(pipeline.statuses || {}).length ? (
          <p className="text-sm text-slate-500">No auto-assign activity captured for this period.</p>
        ) : null}
      </dl>
      {pipeline.topCandidates?.length ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top candidates</p>
          <ul className="mt-3 space-y-3">
            {pipeline.topCandidates.map((candidate) => (
              <li key={candidate.freelancerId} className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {candidate.freelancer
                      ? `${candidate.freelancer.firstName} ${candidate.freelancer.lastName}`
                      : `Freelancer ${candidate.freelancerId}`}
                  </p>
                  <p className="text-xs text-slate-500">Pending {formatNumber(candidate.pendingCount)} · Accepted {formatNumber(candidate.acceptedCount)}</p>
                </div>
                <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-700">
                  Score {candidate.topScore.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );

  const renderFinancials = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Financial snapshot</h2>
          <p className="text-sm text-slate-500">Escrow and revenue analytics</p>
        </div>
      </div>
      <dl className="mt-6 space-y-4">
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">In escrow</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(financialSummary.inEscrow ?? 0, financialSummary.currency)}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Released</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(financialSummary.released ?? 0, financialSummary.currency)}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outstanding</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(financialSummary.outstanding ?? 0, financialSummary.currency)}
          </dd>
        </div>
      </dl>
    </div>
  );

  const renderBench = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <UsersIcon className="h-6 w-6 text-blue-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Bench capacity</h2>
          <p className="text-sm text-slate-500">Talent available for immediate assignment</p>
        </div>
      </div>
      <ul className="mt-6 space-y-3">
        {benchMembers.map((member) => (
          <li key={member.id} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {member.user ? `${member.user.firstName} ${member.user.lastName}` : `Member ${member.userId}`}
              </p>
              <p className="text-xs text-slate-500">{titleCase(member.role ?? 'staff')} · {member.availability?.availableHoursPerWeek ? `${member.availability.availableHoursPerWeek}h available` : 'Capacity TBD'}</p>
            </div>
            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
          </li>
        ))}
        {!benchMembers.length ? (
          <p className="text-sm text-slate-500">No members on the bench right now.</p>
        ) : null}
      </ul>
    </div>
  );

  const renderNotes = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <BuildingOffice2Icon className="h-6 w-6 text-blue-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Client relationship log</h2>
          <p className="text-sm text-slate-500">Recent collaboration notes and health signals</p>
        </div>
      </div>
      <ul className="mt-6 space-y-4">
        {contactNotes.slice(0, 4).map((note) => (
          <li key={note.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-sm text-slate-700">{note.note}</p>
            <p className="mt-2 text-xs text-slate-500">
              {note.subject
                ? `${note.subject.firstName} ${note.subject.lastName}`
                : `Contact ${note.subjectUserId}`}
              {' · '}
              {formatRelativeTime(note.createdAt)}
            </p>
          </li>
        ))}
        {!contactNotes.length ? (
          <p className="text-sm text-slate-500">No notes recorded yet. Capture client updates to build institutional memory.</p>
        ) : null}
      </ul>
    </div>
  );

  const renderTimeline = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <ArrowTrendingUpIcon className="h-6 w-6 text-blue-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent delivery activity</h2>
          <p className="text-sm text-slate-500">Milestones captured in the last 120 days</p>
        </div>
      </div>
      <ul className="mt-6 space-y-4">
        {projectEvents.slice(0, 6).map((event) => (
          <li key={event.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
            <p className="text-sm font-medium text-slate-900">{titleCase(event.eventType)}</p>
            {event.payload?.milestone ? (
              <p className="text-xs text-slate-500">{event.payload.milestone}</p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              {event.actor ? `${event.actor.firstName} ${event.actor.lastName}` : 'System'} · {formatAbsolute(event.createdAt)}
            </p>
          </li>
        ))}
        {!projectEvents.length ? (
          <p className="text-sm text-slate-500">No recent project activity recorded.</p>
        ) : null}
      </ul>
    </div>
  );

  const renderOpportunities = (
    <div className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex items-center gap-3">
        <QueueListIcon className="h-6 w-6 text-blue-500" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Marketplace pipeline</h2>
          <p className="text-sm text-slate-500">Latest gigs and roles surfaced for the agency</p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gigs</p>
          <ul className="mt-2 space-y-2">
            {gigs.slice(0, 3).map((gig) => (
              <li key={gig.id ?? gig.title} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{gig.title}</p>
                <p className="text-xs text-slate-500">{gig.duration ?? 'Duration TBD'}{gig.budget ? ` • ${gig.budget}` : ''}</p>
              </li>
            ))}
            {!gigs.length ? <p className="text-sm text-slate-500">No gigs published yet.</p> : null}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Roles</p>
          <ul className="mt-2 space-y-2">
            {jobs.slice(0, 3).map((job) => (
              <li key={job.id ?? job.title} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{job.title}</p>
                <p className="text-xs text-slate-500">{job.employmentType ?? 'Type TBD'}</p>
              </li>
            ))}
            {!jobs.length ? <p className="text-sm text-slate-500">No roles have been drafted.</p> : null}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderProjectPortfolio = (
    <section
      id="project-portfolio-mastery"
      className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Project portfolio mastery</p>
          <h2 className="text-xl font-semibold text-slate-900">Operational visibility across every engagement</h2>
          <p className="mt-1 text-sm text-slate-500">
            Run complex client programs with live signals on scope, staffing, profitability, and automation coverage.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(portfolioSummary.totalProjects ?? 0)} projects monitored
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {portfolioSummaryCards.map((card) => (
          <div
            key={card.name}
            className={`rounded-3xl border px-4 py-5 ${toneClasses[card.tone] ?? 'border-blue-100 bg-blue-50/60 text-blue-700'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide">{card.name}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            {card.description ? (
              <p className="mt-1 text-xs text-blue-900/70">{card.description}</p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-slate-50/60 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Portfolio health</h3>
              <p className="text-xs text-slate-500">Staffing, quality, and margin signals by project</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {formatNumber(portfolioProjects.length)} tracked
            </span>
          </div>
          <ul className="space-y-3">
            {portfolioProjects.slice(0, 6).map((project) => (
              <li key={project.id} className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                    <p className="text-xs text-slate-500">
                      Scope {titleCase(project.scopeHealth ?? 'unknown')} · Staffing {titleCase(project.staffingStatus ?? 'unknown')} · Profitability {titleCase(project.profitabilityStatus ?? 'unknown')}
                    </p>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    {titleCase(project.status ?? 'unspecified')}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Margin {project.marginPercent != null ? formatPercent(project.marginPercent) : 'n/a'}</span>
                  <span>QA {project.qualityScore != null ? `${Math.round(project.qualityScore * 10) / 10}` : 'n/a'}</span>
                  <span>Automation {project.automationCoverage != null ? formatPercent(project.automationCoverage) : 'n/a'}</span>
                  <span>Issues {formatNumber(project.issuesOpen ?? 0)}</span>
                </div>
              </li>
            ))}
            {!portfolioProjects.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                No project snapshots captured yet.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Dependency map</h3>
                <p className="text-xs text-slate-500">Critical links across the delivery portfolio</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                {formatNumber(portfolioDependencies.length)} dependencies
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {portfolioDependencies.slice(0, 6).map((dependency) => (
                <li key={dependency.id} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{dependency.projectTitle}</p>
                  <p className="text-xs text-slate-600">
                    Depends on {dependency.dependentProjectTitle} · {titleCase(dependency.dependencyType ?? 'dependency')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600">
                      {titleCase(dependency.status ?? 'open')}
                    </span>
                    <span className={`rounded-full px-2 py-1 ${String(dependency.riskLevel ?? '').toLowerCase() === 'critical' ? 'border border-red-200 bg-red-50 text-red-600' : 'border border-amber-200 bg-amber-50 text-amber-600'}`}>
                      Risk {titleCase(dependency.riskLevel ?? 'moderate')}
                    </span>
                    {dependency.isCritical ? (
                      <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-red-600">Critical path</span>
                    ) : null}
                    {dependency.leadTimeDays != null ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600">
                        Lead {formatNumber(dependency.leadTimeDays)}d
                      </span>
                    ) : null}
                  </div>
                  {dependency.notes ? <p className="mt-2 text-xs text-slate-500">{dependency.notes}</p> : null}
                </li>
              ))}
              {!portfolioDependencies.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No dependency links configured.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Delivery calendar</h3>
            <p className="text-xs text-slate-500">Milestones and reviews across the last 120 days</p>
            <ul className="mt-4 space-y-3">
              {portfolioCalendar.slice(0, 6).map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{titleCase(entry.eventType ?? 'event')}</p>
                  <p className="text-xs text-slate-500">{entry.projectTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatAbsolute(entry.occurredAt)}</p>
                  {entry.description ? <p className="mt-1 text-xs text-slate-500">{entry.description}</p> : null}
                </li>
              ))}
              {!portfolioCalendar.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No recent milestones captured.
                </li>
              ) : null}
            </ul>
  const renderGigStudio = (
    <section id="marketplace-gig-leadership" className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Marketplace & gig leadership</h2>
          <p className="text-sm text-slate-500">
            Govern packaged services, delivery SLAs, and storytelling assets for every managed gig program.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(studioSummary.packages ?? 0)} packages · {formatNumber(studioSummary.hybridBundles ?? 0)} bundles
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Managed gigs',
            value: formatNumber(studioSummary.managedGigs ?? studioSummary.totalGigs ?? 0),
            description: `${formatNumber(studioSummary.addons ?? 0)} add-ons configured`,
          },
          {
            label: 'Hybrid bundles live',
            value: formatNumber(studioSummary.hybridBundles ?? 0),
            description: `${formatNumber(studioSummary.upsellPrograms ?? 0)} upsell programs running`,
          },
          {
            label: 'On-time SLA',
            value: formatPercent(studioSummary.onTimeRate ?? 0),
            description: `${formatNumber(deliverablesSummary.breaches ?? 0)} breaches this quarter`,
          },
          {
            label: 'Avg delivery',
            value: `${formatDecimal(studioSummary.averageDeliveryDays ?? 0, 1)} days`,
            description: `${formatNumber(studioSummary.activeOrders ?? 0)} active orders`,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Gig program studio</h3>
                <p className="text-xs text-slate-500">Tiered offerings, live performance, and staffing queues</p>
              </div>
              <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                {formatNumber(studio.gigs?.length ?? 0)} programs
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {(studio.gigs ?? []).slice(0, 4).map((gig) => {
                const performance = gig.latestPerformance ?? {};
                const contractValueAmount =
                  gig.contractValueCents != null ? Number(gig.contractValueCents) / 100 : null;
                return (
                  <li key={gig.id ?? gig.title} className="rounded-2xl border border-slate-200/60 bg-white/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{gig.title}</p>
                        <p className="text-xs text-slate-500">
                          {titleCase(gig.pipelineStage ?? gig.status ?? 'draft')}
                          {contractValueAmount != null
                            ? ` • ${formatCurrency(contractValueAmount, gig.currency ?? defaultCurrency)}`
                            : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Orders</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatNumber(gig.orders?.open ?? 0)} open · {formatNumber(gig.orders?.total ?? 0)} total
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200/70 bg-slate-100/60 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Packages</p>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(gig.packages?.length ?? 0)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200/70 bg-slate-100/60 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Conversion</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {performance.conversionRate != null ? formatPercent(performance.conversionRate) : '—'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/70 bg-slate-100/60 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Avg order value</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {performance.averageOrderValue != null
                            ? formatCurrency(performance.averageOrderValue, gig.currency ?? defaultCurrency)
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
              {!studio.gigs?.length ? <p className="text-sm text-slate-500">No gig programs have been configured yet.</p> : null}
            </ul>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Delivery & SLA guardrails</h3>
          <p className="text-xs text-slate-500">Real-time pulse on delivery commitments and upcoming deadlines</p>
          <dl className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Active contracts</dt>
              <dd className="text-sm font-semibold text-slate-900">{formatNumber(deliverablesSummary.activeContracts ?? 0)}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Upcoming within 7 days</dt>
              <dd className="text-sm font-semibold text-slate-900">{formatNumber(deliverablesSummary.upcomingDue ?? 0)}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total deliverables</dt>
              <dd className="text-sm font-semibold text-slate-900">{formatNumber(deliverablesSummary.totalDeliverables ?? 0)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Team rosters</h3>
          <p className="text-xs text-slate-500">Managed pods blending freelancers and full-time specialists</p>
          <ul className="mt-4 space-y-3">
            {(studio.rosters ?? []).slice(0, 4).map((roster) => (
              <li key={roster.id ?? roster.name} className="rounded-2xl border border-slate-200/60 bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{roster.name}</p>
                    <p className="text-xs text-slate-500">{titleCase(roster.allianceType ?? 'delivery')} · {titleCase(roster.status ?? 'active')}</p>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    {formatNumber(roster.members?.length ?? 0)} members
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {(roster.members ?? []).slice(0, 4).map((member) => (
                    <li key={member.id ?? member.userId} className="flex items-center justify-between text-xs text-slate-600">
                      <span>
                        {member.user ? `${member.user.firstName} ${member.user.lastName}` : `Member ${member.id ?? ''}`}
                        {' · '}
                        {titleCase(member.role ?? 'contributor')}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {member.commitmentHours != null ? `${formatDecimal(member.commitmentHours, 1)}h` : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {!studio.rosters?.length ? <p className="text-sm text-slate-500">No partner pods have been set up yet.</p> : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Bundles & upsell motions</h3>
          <p className="text-xs text-slate-500">Hybrid offerings ready for go-to-market pitches</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bundles</p>
              <ul className="mt-2 space-y-2">
                {(studio.bundles ?? []).slice(0, 3).map((bundle) => (
                  <li key={bundle.id ?? bundle.name} className="rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">{bundle.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(bundle.priceAmount ?? 0, bundle.currency ?? defaultCurrency)} · {titleCase(bundle.status ?? 'draft')}
                    </p>
                  </li>
                ))}
                {!studio.bundles?.length ? <p className="text-xs text-slate-500">No bundles have been published.</p> : null}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Upsell programs</p>
              <ul className="mt-2 space-y-2">
                {(studio.upsells ?? []).slice(0, 3).map((upsell) => (
                  <li key={upsell.id ?? upsell.name} className="rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">{upsell.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(upsell.estimatedValueAmount ?? 0, upsell.currency ?? defaultCurrency)} · {titleCase(upsell.status ?? 'draft')}
                    </p>
                  </li>
                ))}
                {!studio.upsells?.length ? <p className="text-xs text-slate-500">No upsell automations configured.</p> : null}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderWorkspaceOrchestrator = (
    <section
      id="workspace-orchestrator"
      className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Workspace orchestrator</p>
          <h2 className="text-xl font-semibold text-slate-900">Launch structured client workspaces in seconds</h2>
          <p className="mt-1 text-sm text-slate-500">
            Standardise briefs, SOWs, cadences, and automation guardrails across your operating system.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(orchestratorSummary.totalBlueprints ?? 0)} blueprints
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {orchestratorStats.map((stat) => (
          <div key={stat.name} className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            {stat.description ? <p className="mt-1 text-xs text-slate-500">{stat.description}</p> : null}
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Blueprint library</h3>
          <p className="text-xs text-slate-500">Automation-ready workspace templates per client</p>
          <ul className="space-y-3">
            {orchestratorBlueprints.slice(0, 6).map((blueprint) => (
              <li key={blueprint.id} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{blueprint.name}</p>
                    <p className="text-xs text-slate-500">
                      {blueprint.clientName ? `${blueprint.clientName} · ` : ''}
                      {titleCase(blueprint.status ?? 'draft')}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Guardrails {formatNumber(blueprint.guardrailCount ?? 0)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {blueprint.deliveryCadence ? <span>{titleCase(blueprint.deliveryCadence)}</span> : null}
                  {blueprint.cadenceCycleDays ? <span>{formatNumber(blueprint.cadenceCycleDays)} day cycle</span> : null}
                  {blueprint.lastRunAt ? <span>Last run {formatRelativeTime(blueprint.lastRunAt)}</span> : null}
                  {blueprint.nextRunAt ? <span>Next {formatRelativeTime(blueprint.nextRunAt)}</span> : null}
                  {blueprint.checklistCount ? <span>{formatNumber(blueprint.checklistCount)} kickoff steps</span> : null}
                </div>
              </li>
            ))}
            {!orchestratorBlueprints.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No workspace blueprints have been published.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Delivery cadences</h3>
            <p className="text-xs text-slate-500">Structured rhythms that keep engagements on pace</p>
            <ul className="mt-4 space-y-3">
              {orchestratorCadences.slice(0, 6).map((cadence) => (
                <li key={cadence.blueprintId} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{cadence.blueprintName}</p>
                  <p className="text-xs text-slate-500">{cadence.cadence}</p>
                  {cadence.nextRunAt ? <p className="mt-1 text-xs text-slate-500">Next run {formatRelativeTime(cadence.nextRunAt)}</p> : null}
                </li>
              ))}
              {!orchestratorCadences.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No cadences configured yet.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Automation guardrails</h3>
            <p className="text-xs text-slate-500">Policies, approvals, and QA steps embedded in delivery</p>
            <ul className="mt-4 space-y-3">
              {orchestratorGuardrails.slice(0, 5).map((guardrail) => (
                <li key={guardrail.blueprintId} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{guardrail.blueprintName}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                    {guardrail.guardrails.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </li>
              ))}
              {!orchestratorGuardrails.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No automation guardrails documented.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Client dashboards</h3>
          <p className="text-xs text-slate-500">Branded experiences and recent touchpoints</p>
          <ul className="mt-4 space-y-3">
            {orchestratorDashboards.slice(0, 6).map((dashboard) => (
              <li key={dashboard.blueprintId} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{dashboard.clientName}</p>
                <p className="text-xs text-slate-500">Status {titleCase(dashboard.status ?? 'active')}</p>
                {dashboard.experienceSummary ? <p className="mt-1 text-xs text-slate-500">{dashboard.experienceSummary}</p> : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  {dashboard.lastTouchpointAt ? <span className="rounded-full border border-slate-200 bg-white px-2 py-1">Last touch {formatRelativeTime(dashboard.lastTouchpointAt)}</span> : null}
                  {dashboard.nextRunAt ? <span className="rounded-full border border-slate-200 bg-white px-2 py-1">Next cadence {formatRelativeTime(dashboard.nextRunAt)}</span> : null}
                  {dashboard.brandTheme ? <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{titleCase(dashboard.brandTheme)}</span> : null}
                </div>
              </li>
            ))}
            {!orchestratorDashboards.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No client-specific dashboards generated.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Latest orchestration notes</h3>
          <p className="text-xs text-slate-500">Capture decision logs and governance updates</p>
          <ul className="mt-4 space-y-3">
            {orchestratorNotes.slice(0, 6).map((note) => (
              <li key={note.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3">
                <p className="text-sm text-slate-700">{note.note}</p>
                <p className="mt-2 text-xs text-slate-500">Logged {formatRelativeTime(note.createdAt)}</p>
              </li>
            ))}
            {!orchestratorNotes.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No orchestration notes recorded.
              </li>
            ) : null}
  const renderPartnerPrograms = (
    <section id="partner-programs" className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Partner & reseller programs</h2>
          <p className="text-sm text-slate-500">
            Track alliance pods, revenue sharing, and onboarding checklists for every channel partner.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(partnerSummary.partnerEngagements ?? 0)} partner touchpoints
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Active alliances',
            value: formatNumber(partnerSummary.activeAlliances ?? 0),
            description: `${formatNumber(partnerSummary.alliances ?? 0)} total programs`,
          },
          {
            label: 'Average conversion',
            value: formatPercent(partnerSummary.averageConversionRate ?? 0),
            description: `${formatNumber(partnerSummary.partnerEngagements ?? 0)} engagements tracked`,
          },
          {
            label: 'Rate cards live',
            value: formatNumber(partnerSummary.activeRateCards ?? 0),
            description: `${formatNumber(partnerSummary.pendingRateCards ?? 0)} pending approvals`,
          },
          {
            label: 'Revenue splits active',
            value: formatNumber(partnerSummary.activeRevenueSplits ?? 0),
            description: 'Shared commercial agreements',
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Alliance pods</h3>
          <p className="text-xs text-slate-500">Delivery, growth, and reseller pods with member rosters</p>
          <ul className="mt-4 space-y-3">
            {(partnerPrograms.alliances ?? []).slice(0, 4).map((alliance) => (
              <li key={alliance.id ?? alliance.name} className="rounded-2xl border border-slate-200/60 bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{alliance.name}</p>
                    <p className="text-xs text-slate-500">{titleCase(alliance.allianceType ?? 'delivery')} · {titleCase(alliance.status ?? 'planned')}</p>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    {formatNumber(alliance.memberCount ?? 0)} members
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {Array.isArray(alliance.focusAreas) && alliance.focusAreas.length
                    ? alliance.focusAreas.join(', ')
                    : 'Focus areas TBD'}
                </p>
              </li>
            ))}
            {!partnerPrograms.alliances?.length ? <p className="text-sm text-slate-500">No alliances have been onboarded.</p> : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Partner channel analytics</h3>
          <p className="text-xs text-slate-500">Conversion velocity by partner type</p>
          <ul className="mt-4 space-y-3">
            {(partnerPrograms.engagements ?? []).map((engagement) => (
              <li key={engagement.partnerType} className="rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{titleCase(engagement.partnerType)}</p>
                    <p className="text-xs text-slate-500">{formatNumber(engagement.touchpoints ?? 0)} touchpoints logged</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversion</p>
                    <p className="text-sm font-semibold text-slate-900">{formatPercent(engagement.averageConversionRate ?? 0)}</p>
                  </div>
                </div>
              </li>
            ))}
            {!partnerPrograms.engagements?.length ? <p className="text-sm text-slate-500">No channel activity captured yet.</p> : null}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderResourceIntelligence = (
    <section
      id="resource-intelligence"
      className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Resource intelligence</p>
          <h2 className="text-xl font-semibold text-slate-900">Match assignments to skill, availability, and cost</h2>
          <p className="mt-1 text-sm text-slate-500">
            Heatmaps and scenario plans keep utilisation balanced while protecting against burnout.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatPercent(resourceSummary.averageUtilization ?? 0)} avg utilisation
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {resourceStats.map((stat) => (
          <div key={stat.name} className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            {stat.description ? <p className="mt-1 text-xs text-slate-500">{stat.description}</p> : null}
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Capacity heatmap</h3>
          <p className="text-xs text-slate-500">Utilisation and burnout risk by skill group</p>
          <ul className="mt-4 space-y-3">
            {resourceHeatmap.slice(0, 8).map((entry) => (
              <li key={entry.skillGroup} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{entry.skillGroup}</p>
                    <p className="text-xs text-slate-500">{formatNumber(entry.availableHours ?? 0)}h available · {formatNumber(entry.assignedHours ?? 0)}h assigned</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Utilisation {entry.utilizationRate != null ? formatPercent(entry.utilizationRate) : 'n/a'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Bench {formatNumber(entry.benchHours ?? 0)}h</span>
                  {entry.burnoutRisk ? <span>Risk {titleCase(entry.burnoutRisk)}</span> : null}
                  {entry.billableRate != null ? <span>Billable {formatCurrency(entry.billableRate)}</span> : null}
                  {entry.costRate != null ? <span>Cost {formatCurrency(entry.costRate)}</span> : null}
                  {entry.notes ? <span>{entry.notes}</span> : null}
                </div>
              </li>
            ))}
            {!resourceHeatmap.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No capacity snapshots captured.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Assignment intelligence</h3>
            <p className="text-xs text-slate-500">Recommendations based on workload and risk</p>
            <ul className="mt-4 space-y-3">
              {assignmentMatches.slice(0, 6).map((match, index) => (
                <li key={`${match.skillGroup}-${index}`} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{match.skillGroup}</p>
                  <p className="text-xs text-slate-500">
                    {formatNumber(match.availableHours ?? 0)}h available · {formatNumber(match.assignedHours ?? 0)}h assigned · Utilisation {match.utilizationRate != null ? formatPercent(match.utilizationRate) : 'n/a'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{match.recommendation}</p>
                </li>
              ))}
              {!assignmentMatches.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No assignment insights generated.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Scenario planning</h3>
            <p className="text-xs text-slate-500">Stress-test staffing plans for upcoming pitches or renewals</p>
            <ul className="mt-4 space-y-3">
              {scenarioPlans.slice(0, 5).map((plan) => (
                <li key={plan.id} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{plan.title}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(plan.scenarioType ?? 'scenario')} · {titleCase(plan.status ?? 'draft')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {plan.window?.startDate ? <span>Start {formatAbsolute(plan.window.startDate)}</span> : null}
                    {plan.window?.endDate ? <span>End {formatAbsolute(plan.window.endDate)}</span> : null}
                    {plan.projectedRevenue != null ? <span>Revenue {formatCurrency(plan.projectedRevenue)}</span> : null}
                    {plan.projectedCost != null ? <span>Cost {formatCurrency(plan.projectedCost)}</span> : null}
                    {plan.projectedMargin != null ? <span>Margin {formatPercent(plan.projectedMargin)}</span> : null}
                  </div>
                  {plan.notes ? <p className="mt-2 text-xs text-slate-500">{plan.notes}</p> : null}
                </li>
              ))}
              {!scenarioPlans.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No scenario plans drafted yet.
                </li>
              ) : null}
  const renderMarketingAutomation = (
    <section id="marketing-automation" className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Marketing automation</h2>
          <p className="text-sm text-slate-500">
            Campaigns, nurture flows, and events orchestrated to grow recurring revenue pipeline.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatCurrency(marketingSummary.totalPipelineValue ?? 0, defaultCurrency)} pipeline
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: 'Active campaigns',
            value: formatNumber(marketingSummary.activeCampaigns ?? 0),
            description: `${formatNumber(marketingSummary.totalCampaigns ?? 0)} total programs`,
          },
          {
            label: 'Open deals',
            value: formatNumber(marketingSummary.openDeals ?? 0),
            description: `${formatNumber(marketingSummary.wonDeals ?? 0)} won to date`,
          },
          {
            label: 'Win probability',
            value: formatPercent(marketingSummary.averageWinProbability ?? 0),
            description: 'Weighted pipeline confidence',
          },
          {
            label: 'Follow-ups due',
            value: formatNumber(marketingSummary.followUpsDueSoon ?? 0),
            description: `${formatNumber(marketingAutomation.followUps?.length ?? 0)} total touchpoints`,
          },
          {
            label: 'Landing pages live',
            value: formatNumber(marketingSummary.liveLandingPages ?? 0),
            description: `${formatNumber(marketingAutomation.landingPages?.length ?? 0)} assets tracked`,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Campaign command center</h3>
          <ul className="mt-4 space-y-3">
            {(marketingAutomation.campaigns ?? []).slice(0, 5).map((campaign) => (
              <li key={campaign.id ?? campaign.name} className="rounded-2xl border border-slate-200/60 bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{campaign.name}</p>
                    <p className="text-xs text-slate-500">{titleCase(campaign.status ?? 'draft')} · {campaign.targetService ?? 'Service TBD'}</p>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    {campaign.launchDate ? `Launched ${formatAbsolute(campaign.launchDate)}` : 'Launch pending'}
                  </span>
                </div>
                {campaign.metrics ? (
                  <p className="mt-2 text-xs text-slate-500">
                    {campaign.metrics.openRate != null ? `Open rate ${formatPercent(campaign.metrics.openRate)}` : 'Open rate n/a'}
                    {campaign.metrics.clickRate != null ? ` • Click rate ${formatPercent(campaign.metrics.clickRate)}` : ''}
                  </p>
                ) : null}
              </li>
            ))}
            {!marketingAutomation.campaigns?.length ? <p className="text-sm text-slate-500">No campaigns launched yet.</p> : null}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
            <h3 className="text-base font-semibold text-slate-900">Upcoming events & webinars</h3>
            <ul className="mt-3 space-y-2">
              {(marketingAutomation.webinars ?? marketingAutomation.events ?? []).slice(0, 4).map((event) => (
                <li key={event.id ?? event.title} className="rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{event.title ?? 'Event'}</p>
                  <p className="text-xs text-slate-500">
                    {event.startsAt ? formatAbsolute(event.startsAt) : 'Schedule TBD'}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                </li>
              ))}
              {!marketingAutomation.events?.length ? <p className="text-xs text-slate-500">No events scheduled.</p> : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
            <h3 className="text-base font-semibold text-slate-900">Landing pages</h3>
            <ul className="mt-3 space-y-2">
              {(marketingAutomation.landingPages ?? []).slice(0, 3).map((asset) => (
                <li key={asset.id ?? asset.title} className="rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{asset.title ?? 'Landing page'}</p>
                  <p className="text-xs text-slate-500">
                    {titleCase(asset.assetType ?? 'landing_page')} · {titleCase(asset.status ?? 'draft')}
                    {asset.engagementScore != null ? ` · Engagement ${formatDecimal(asset.engagementScore, 1)}` : ''}
                  </p>
                </li>
              ))}
              {!marketingAutomation.landingPages?.length ? <p className="text-xs text-slate-500">No landing pages published.</p> : null}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  const renderQualityAssurance = (
    <section
      id="quality-assurance"
      className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Quality assurance workflow</p>
          <h2 className="text-xl font-semibold text-slate-900">Embed QA scorecards and retros in every project</h2>
          <p className="mt-1 text-sm text-slate-500">
            Operationalise pre-delivery reviews, CSAT tracking, and lessons learned to drive performance.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(qualitySummary.completedReviews ?? 0)} reviews completed
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {qualityStats.map((stat) => (
          <div key={stat.name} className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            {stat.description ? <p className="mt-1 text-xs text-slate-500">{stat.description}</p> : null}
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Upcoming QA checkpoints</h3>
          <p className="text-xs text-slate-500">Scheduled reviews before delivery hand-offs</p>
          <ul className="mt-4 space-y-3">
            {qualityUpcoming.slice(0, 6).map((item) => (
              <li key={item.id} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{item.projectTitle}</p>
                <p className="text-xs text-slate-500">{titleCase(item.reviewType ?? 'qa')} · {titleCase(item.status ?? 'scheduled')}</p>
                {item.reviewDate ? <p className="mt-1 text-xs text-slate-500">Review {formatAbsolute(item.reviewDate)}</p> : null}
                {item.reviewer ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Reviewer {item.reviewer.firstName} {item.reviewer.lastName}
                  </p>
                ) : null}
                {item.automationCoverage != null ? (
                  <p className="mt-1 text-xs text-slate-500">Automation {formatPercent(item.automationCoverage)}</p>
                ) : null}
              </li>
            ))}
            {!qualityUpcoming.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No upcoming QA checkpoints scheduled.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">QA scorecards</h3>
          <p className="text-xs text-slate-500">Quality, CSAT, and follow-up actions by project</p>
          <ul className="mt-4 space-y-3">
            {qualityScorecards.slice(0, 6).map((card) => (
              <li key={card.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{card.projectTitle}</p>
                <p className="text-xs text-slate-500">
                  {titleCase(card.reviewType ?? 'review')} · {titleCase(card.status ?? 'completed')}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {card.qaScore != null ? <span>QA {Math.round(card.qaScore * 10) / 10}</span> : null}
                  {card.clientSatisfaction != null ? <span>CSAT {Math.round(card.clientSatisfaction * 10) / 10}</span> : null}
                  <span>Lessons {formatNumber(card.lessonsLearnedCount ?? 0)}</span>
                  <span>Follow-ups {formatNumber(card.followUpActionsCount ?? 0)}</span>
                </div>
              </li>
            ))}
            {!qualityScorecards.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No QA scorecards have been recorded.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Lessons learned</h3>
          <p className="text-xs text-slate-500">Auto-generated insights synced to knowledge bases</p>
          <ul className="mt-4 space-y-3">
            {qualityLessons.slice(0, 6).map((lesson, index) => (
              <li key={`${lesson.reviewId}-${index}`} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{lesson.projectTitle}</p>
                {lesson.category ? <p className="text-xs text-slate-500">{titleCase(lesson.category)}</p> : null}
                <p className="mt-1 text-xs text-slate-500">{lesson.lesson ?? 'Lesson summary unavailable.'}</p>
              </li>
            ))}
            {!qualityLessons.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No retrospectives documented.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Performance incentives</h3>
          <p className="text-xs text-slate-500">Link QA outcomes to recognition and rewards</p>
          <ul className="mt-4 space-y-3">
            {qualityIncentives.slice(0, 6).map((incentive, index) => (
              <li key={`${incentive.reviewId}-${index}`} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{incentive.title}</p>
                {incentive.owner ? <p className="text-xs text-slate-500">Owner {incentive.owner}</p> : null}
                {incentive.dueDate ? <p className="mt-1 text-xs text-slate-500">Due {formatAbsolute(incentive.dueDate)}</p> : null}
              </li>
            ))}
            {!qualityIncentives.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No incentive actions opened yet.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderFinancialOversight = (
    <section
      id="financial-oversight"
      className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Financial oversight</p>
          <h2 className="text-xl font-semibold text-slate-900">Stay ahead of budget, billing, and compliance</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor profitability, change orders, and invoicing policies across every client engagement.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatNumber(financialOversightSummary.totalEngagements ?? 0)} engagements
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {financialStats.map((stat) => (
          <div key={stat.name} className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            {stat.description ? <p className="mt-1 text-xs text-slate-500">{stat.description}</p> : null}
          </div>
        ))}
        <div className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alerts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(financialAlerts.length)}</p>
          <p className="mt-1 text-xs text-slate-500">Margin erosion, overdue invoices, and compliance</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Financial posture by currency</h3>
          <p className="text-xs text-slate-500">Budgets, spend, and change orders per market</p>
          <ul className="mt-4 space-y-3">
            {financialCurrencies.slice(0, 6).map((currency) => (
              <li key={currency.currency} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{currency.currency}</p>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {formatNumber(currency.engagements ?? 0)} engagements
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <span>Budget {formatCurrency(currency.budgetAmount ?? 0, currency.currency)}</span>
                  <span>Actual {formatCurrency(currency.actualSpend ?? 0, currency.currency)}</span>
                  <span>Invoiced {formatCurrency(currency.invoicedAmount ?? 0, currency.currency)}</span>
                  <span>Outstanding {formatCurrency(currency.outstandingAmount ?? 0, currency.currency)}</span>
                  <span>Change orders {formatNumber(currency.changeOrders ?? 0)}</span>
                </div>
              </li>
            ))}
            {!financialCurrencies.length ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No financial summaries recorded.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Escrow position</h3>
            <p className="text-xs text-slate-500">Multi-currency tracking of funds in motion</p>
            <ul className="mt-4 space-y-3">
              {financialEscrow.slice(0, 6).map((entry, index) => (
                <li key={`${entry.currency}-${index}`} className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{entry.currency}</p>
                  <p className="text-xs text-slate-500">In escrow {formatCurrency(entry.inEscrow ?? 0, entry.currency)}</p>
                  <p className="text-xs text-slate-500">Released {formatCurrency(entry.released ?? 0, entry.currency)}</p>
                </li>
              ))}
              {!financialEscrow.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No escrow transactions recorded.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Alerts & governance</h3>
            <p className="text-xs text-slate-500">Stay ahead of risk on billing and profitability</p>
            <ul className="mt-4 space-y-3">
              {financialAlerts.slice(0, 6).map((alert, index) => (
                <li key={`${alert.engagementId}-${index}`} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{titleCase(alert.type ?? 'alert')}</p>
                  <p className="text-xs text-slate-500">{alert.message}</p>
                  <p className="mt-1 text-xs text-slate-500">Severity {titleCase(alert.severity ?? 'warning')}</p>
                </li>
              ))}
              {!financialAlerts.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No financial alerts triggered.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Engagement ledger</h3>
        <p className="text-xs text-slate-500">Budgets, invoices, and profitability per client</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Client</th>
                <th scope="col" className="px-4 py-3 font-semibold">Policy</th>
                <th scope="col" className="px-4 py-3 font-semibold">Budget</th>
                <th scope="col" className="px-4 py-3 font-semibold">Actual</th>
                <th scope="col" className="px-4 py-3 font-semibold">Outstanding</th>
                <th scope="col" className="px-4 py-3 font-semibold">Margin</th>
                <th scope="col" className="px-4 py-3 font-semibold">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financialEngagements.slice(0, 8).map((engagement) => (
                <tr key={engagement.id} className="bg-white">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">{engagement.clientName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">{engagement.policyName}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatCurrency(engagement.budgetAmount ?? 0, engagement.billingCurrency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatCurrency(engagement.actualSpend ?? 0, engagement.billingCurrency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatCurrency(engagement.outstandingAmount ?? 0, engagement.billingCurrency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {engagement.marginPercent != null ? formatPercent(engagement.marginPercent) : 'n/a'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {titleCase(engagement.complianceStatus ?? 'on_track')}
                  </td>
                </tr>
              ))}
              {!financialEngagements.length ? (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-sm text-slate-500">
                    No financial engagement summaries recorded.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
  const renderPaymentsDistribution = (
    <section id="payments-distribution" className="space-y-6 rounded-3xl border border-blue-100 bg-white p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Finance operations</p>
          <h2 className="text-xl font-semibold text-slate-900">Payments distribution & exports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track payout batches, outstanding splits, and export readiness to keep finance audit-ready.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average processing</p>
          <p className="text-2xl font-semibold text-slate-900">
            {paymentsSummary.averageProcessingTimeDays != null
              ? `${Number(paymentsSummary.averageProcessingTimeDays).toFixed(1)} days`
              : 'n/a'}
          </p>
        </div>
      </header>
      {hasPaymentsData ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Processed this quarter</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrencyTotals(paymentsSummary.processedThisQuarter ?? [], paymentsCurrency)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatNumber(paymentsSummary.totalBatches ?? 0)} batches executed
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming payouts</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrencyTotals(paymentsSummary.upcomingBatches?.totals ?? [], paymentsCurrency)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {paymentsSummary.upcomingBatches?.nextScheduledAt
                  ? `Next ${formatRelativeTime(paymentsSummary.upcomingBatches.nextScheduledAt)}`
                  : 'No batches scheduled'}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outstanding splits</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrencyTotals(paymentsOutstandingTotals, paymentsCurrency)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatNumber(paymentsSummary.outstandingSplits?.count ?? 0)} splits awaiting approval
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/60 bg-slate-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice outstanding</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrencyTotals(paymentsInvoiceTotals, paymentsCurrency)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatNumber(paymentsSummary.invoiceOutstandingCount ?? 0)} engagements with balance
              </p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Upcoming payout batches</h3>
                <p className="text-xs text-slate-500">Scheduled distributions and outstanding split counts.</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/60">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Batch
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Scheduled
                        </th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Amount
                        </th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Outstanding
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {paymentsUpcoming.slice(0, 6).map((batch) => (
                        <tr key={batch.id ?? batch.name}>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">{batch.name ?? 'Payout batch'}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                            {batch.scheduledAt ? formatAbsolute(batch.scheduledAt) : 'Schedule TBC'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(batch.totalAmount ?? 0, batch.currency ?? paymentsCurrency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-500">
                            {formatNumber(batch.outstandingSplits ?? 0)} splits
                          </td>
                        </tr>
                      ))}
                      {!paymentsUpcoming.length ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-sm text-slate-500">
                            No upcoming payout batches scheduled.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(paymentsSplitStatus).map(([status, count]) => (
                    <span
                      key={status}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {titleCase(status)} · {formatNumber(count)}
                    </span>
                  ))}
                  {!Object.keys(paymentsSplitStatus).length ? (
                    <span className="text-xs text-slate-500">No split status data recorded yet.</span>
                  ) : null}
                </div>
              </div>
              {paymentsActions.length ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Recommended actions</p>
                  <ul className="mt-3 space-y-2">
                    {paymentsActions.slice(0, 4).map((action, index) => (
                      <li key={`${action.type}-${index}`} className="flex items-start gap-3">
                        <span
                          className={`mt-1 inline-flex h-2 w-2 rounded-full ${
                            action.severity === 'critical'
                              ? 'bg-rose-500'
                              : action.severity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <p className="text-sm text-slate-700">{action.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Teammate payouts</h3>
                <p className="text-xs text-slate-500">Top recipients across recent payout batches.</p>
                <ul className="mt-4 space-y-3">
                  {paymentsTeammates.slice(0, 5).map((member) => (
                    <li
                      key={`${member.teammateName}-${member.recipientEmail ?? member.currency}`}
                      className="rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{member.teammateName}</p>
                          {member.teammateRole ? <p className="text-xs text-slate-500">{member.teammateRole}</p> : null}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(member.totalAmount ?? 0, member.currency ?? paymentsCurrency)}
                        </p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {member.averageSharePercentage != null ? (
                          <span>Avg share {Number(member.averageSharePercentage).toFixed(2)}%</span>
                        ) : null}
                        {member.lastPaidAt ? <span>Last paid {formatRelativeTime(member.lastPaidAt)}</span> : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {member.currencyBreakdown?.slice(0, 3).map((entry) => (
                          <span
                            key={`${entry.currency}-${entry.amount}`}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600"
                          >
                            {entry.currency} {formatCurrency(entry.amount ?? 0, entry.currency ?? paymentsCurrency)}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                  {!paymentsTeammates.length ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No teammate payouts recorded yet.
                    </li>
                  ) : null}
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Export readiness</h3>
                <p className="text-xs text-slate-500">
                  {paymentsExportsSummary.available
                    ? `${formatNumber(paymentsExportsSummary.available)} export${paymentsExportsSummary.available === 1 ? '' : 's'} ready to download.`
                    : 'Generate exports to keep reconciliation on track.'}
                </p>
                <ul className="mt-4 space-y-2">
                  {paymentsAvailableExports.slice(0, 3).map((record) => {
                    const downloadDisabled = !record.downloadUrl;
                    return (
                      <li key={record.id ?? record.exportType} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{titleCase(record.exportType ?? 'export')}</p>
                            <p className="text-xs text-slate-500">
                              {record.generatedAt ? `Generated ${formatRelativeTime(record.generatedAt)}` : 'Generated'}
                              {record.periodEnd ? ` · Period ended ${formatAbsolute(record.periodEnd)}` : ''}
                            </p>
                          </div>
                          <a
                            className={`inline-flex items-center rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-semibold text-blue-700 ${
                              downloadDisabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-blue-50'
                            }`}
                            href={downloadDisabled ? '#' : record.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => {
                              if (downloadDisabled) {
                                event.preventDefault();
                              }
                            }}
                            aria-disabled={downloadDisabled}
                          >
                            Download
                          </a>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {formatCurrency(record.amount ?? 0, record.currency ?? paymentsCurrency)}
                        </p>
                      </li>
                    );
                  })}
                  {paymentsGeneratingExports.slice(0, 2).map((record) => (
                    <li key={`${record.id ?? record.exportType}-generating`} className="rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                      <p className="text-sm font-semibold text-amber-800">Generating {titleCase(record.exportType ?? 'export')}</p>
                      <p className="text-xs text-amber-700">Queued — refresh later for download.</p>
                    </li>
                  ))}
                  {paymentsFailedExports.slice(0, 2).map((record) => (
                    <li key={`${record.id ?? record.exportType}-failed`} className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3">
                      <p className="text-sm font-semibold text-rose-700">Export failed</p>
                      <p className="text-xs text-rose-600">{titleCase(record.exportType ?? 'export')} needs regeneration.</p>
                    </li>
                  ))}
                  {!paymentsAvailableExports.length && !paymentsGeneratingExports.length && !paymentsFailedExports.length ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No finance exports generated yet.
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-600">
            Payments distribution data will appear once payout batches and finance exports are recorded.
          </p>
        </div>
      )}
    </section>
  );

  const renderClientAdvocacy = (
    <section id="client-advocacy" className="rounded-3xl border border-blue-100 bg-white p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Client advocacy</h2>
          <p className="text-sm text-slate-500">
            Launch CSAT programs, reference kits, and incentive loops that convert clients into advocates.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
          {formatPercent(clientAdvocacySummary.reviewResponseRate ?? 0)} review response rate
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Active playbooks',
            value: formatNumber(clientAdvocacySummary.activePlaybooks ?? 0),
            description: `${formatNumber(clientAdvocacySummary.totalPlaybooks ?? 0)} total sequences`,
          },
          {
            label: 'Enrollments in flight',
            value: formatNumber(clientAdvocacySummary.enrollmentsInFlight ?? 0),
            description: `${formatNumber(clientAdvocacySummary.enrollmentsCompleted ?? 0)} completed`,
          },
          {
            label: 'Referral pipeline',
            value: formatNumber(clientAdvocacySummary.referralCount ?? 0),
            description: `${formatCurrency(clientAdvocacySummary.referralRewardValue ?? 0, defaultCurrency)} rewards`,
          },
          {
            label: 'Affiliate conversions',
            value: formatNumber(clientAdvocacySummary.affiliateConversions ?? 0),
            description: `${formatNumber(clientAdvocacySummary.affiliatePrograms ?? 0)} programs active`,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Customer success playbooks</h3>
          <ul className="mt-3 space-y-2">
            {(clientAdvocacy.playbooks ?? []).slice(0, 5).map((playbook) => (
              <li key={playbook.id ?? playbook.name} className="rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">{playbook.name}</p>
                <p className="text-xs text-slate-500">Trigger: {titleCase(playbook.triggerType ?? 'gig_purchase')}</p>
              </li>
            ))}
            {!clientAdvocacy.playbooks?.length ? <p className="text-xs text-slate-500">No playbooks created yet.</p> : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Storytelling kits</h3>
          <ul className="mt-3 space-y-2">
            {(clientAdvocacy.storytellingKits ?? []).slice(0, 4).map((kit) => (
              <li key={kit.id ?? kit.title} className="rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">{kit.title}</p>
                <p className="text-xs text-slate-500">
                  {kit.clientName ?? 'Client'} · CSAT {kit.csatScore != null ? formatDecimal(kit.csatScore, 1) : 'n/a'} ({
                    formatNumber(kit.csatResponseCount ?? 0)
                  } responses)
                </p>
              </li>
            ))}
            {!clientAdvocacy.storytellingKits?.length ? (
              <p className="text-xs text-slate-500">No storytelling kits have been published.</p>
            ) : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Incentive programs</h3>
          <ul className="mt-3 space-y-2">
            {(clientAdvocacy.referrals ?? []).slice(0, 3).map((referral) => (
              <li key={referral.id ?? referral.referralCode} className="rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">Referral {referral.referralCode}</p>
                <p className="text-xs text-slate-500">
                  Reward {formatCurrency(referral.rewardValueAmount ?? 0, referral.rewardCurrency ?? defaultCurrency)} · {titleCase(
                    referral.status ?? 'invited',
                  )}
                </p>
              </li>
            ))}
            {(clientAdvocacy.affiliateLinks ?? []).slice(0, 3).map((link) => (
              <li key={link.id ?? link.code} className="rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">Affiliate {link.code}</p>
                <p className="text-xs text-slate-500">
                  {link.totalConversions ?? 0} conversions · Commission {link.commissionRate != null ? formatPercent(link.commissionRate) : 'n/a'}
                </p>
              </li>
            ))}
            {!clientAdvocacy.referrals?.length && !clientAdvocacy.affiliateLinks?.length ? (
              <p className="text-xs text-slate-500">No incentive programs launched yet.</p>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderProjectsWorkspace = (
    <section id="projects-workspace" className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Projects workspace</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Portfolio, staffing, and profitability cockpit</h2>
          <p className="mt-2 text-sm text-slate-500">
            Bring delivery milestones, resource plans, and financial guardrails into a single workspace for account teams.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Automation coverage</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatPercent(projectsWorkspaceSummary.avgAutomationCoverage ?? 0)}
          </p>
          <p className="text-xs text-slate-500">QA {formatPercent(projectsWorkspaceSummary.avgQualityScore ?? 0)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{
          label: 'Active engagements',
          value: formatNumber(projectsWorkspaceSummary.totalProjects ?? summary?.projects?.total ?? projects.length ?? 0),
          description: `${formatNumber(projectsWorkspaceSummary.onTrack ?? 0)} on track`,
        },
        {
          label: 'At-risk engagements',
          value: formatNumber((projectsWorkspaceSummary.atRisk ?? 0) + (projectsWorkspaceSummary.critical ?? 0)),
          description: `${formatNumber(projectsWorkspaceSummary.critical ?? 0)} critical`,
        },
        {
          label: 'Average margin',
          value: formatPercent(projectsWorkspaceSummary.avgMargin ?? 0),
          description: `Financial alerts ${formatNumber(profitabilityWorkspaceSummary.alerts ?? 0)}`,
        },
        {
          label: 'Auto-assign queue',
          value: formatNumber(projectsQueueSummary.statuses?.pending ?? 0),
          description: `${formatNumber(projectsQueueSummary.statuses?.accepted ?? 0)} accepted`,
        }].map((card) => (
          <div key={card.label} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {renderProjects}
          {renderTimeline}
          {renderProjectPortfolio}
          {renderWorkspaceOrchestrator}
        </div>
        <div className="space-y-6">
          {renderPipeline}
          {renderResourceIntelligence}
          {renderQualityAssurance}
          {renderFinancialOversight}
          {renderPaymentsDistribution}
          {renderFinancials}
        </div>
      </div>
    </section>
  );

  const renderGigPrograms = (
    <section id="gig-programs" className="rounded-3xl border border-purple-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Gig programs</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Publish managed services, bundles, and alliances</h2>
          <p className="mt-2 text-sm text-slate-500">
            Launch branded gigs, manage alliances, automate marketing nurtures, and convert clients into advocates.
          </p>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">On-time delivery</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatPercent(gigProgramsSummary.onTimeRate ?? 0)}</p>
          <p className="text-xs text-slate-500">{formatNumber(gigProgramsDeliverables.backlog ?? 0)} deliverables in backlog</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{
          label: 'Managed gigs',
          value: formatNumber(gigProgramsSummary.managedGigs ?? gigProgramsSummary.totalGigs ?? gigs.length ?? 0),
          description: `${formatNumber(gigProgramsSummary.packages ?? studio.packages ?? 0)} packages`,
        },
        {
          label: 'Bundles & upsells',
          value: formatNumber(gigProgramsSummary.hybridBundles ?? gigProgramsSummary.bundles ?? 0),
          description: `${formatNumber(gigProgramsSummary.upsellPrograms ?? 0)} upsell programs`,
        },
        {
          label: 'Active alliances',
          value: formatNumber(gigProgramsPartnerSummary.activeAlliances ?? 0),
          description: `${formatNumber(gigProgramsPartnerSummary.partnerEngagements ?? 0)} partner engagements`,
        },
        {
          label: 'Marketing pipeline',
          value: formatCurrency(gigProgramsMarketingSummary.totalPipelineValue ?? 0, defaultCurrency),
          description: `${formatNumber(gigProgramsMarketingSummary.activeCampaigns ?? 0)} live campaigns`,
        }].map((card) => (
          <div key={card.label} className="rounded-2xl border border-purple-100 bg-purple-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          {renderGigStudio}
          {renderPartnerPrograms}
        </div>
        <div className="space-y-6">
          {renderMarketingAutomation}
          {renderClientAdvocacy}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Marketplace pipeline</h3>
        <div className="mt-3 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-purple-100 bg-white p-6">
            <h4 className="text-base font-semibold text-slate-900">Agency gigs</h4>
            <p className="mt-1 text-xs text-slate-500">
              {formatNumber((gigMarketplacePipeline.gigs ?? []).length)} published listings ready for promotion.
            </p>
            <ul className="mt-3 space-y-2">
              {(gigMarketplacePipeline.gigs ?? gigs).slice(0, 4).map((gig) => (
                <li key={gig.id ?? gig.title} className="rounded-2xl border border-slate-200/70 bg-slate-50/60 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{gig.title ?? 'Agency gig'}</p>
                  <p className="text-xs text-slate-500">
                    {gig.duration ?? 'Duration TBD'}
                    {gig.budget ? ` · ${gig.budget}` : ''}
                  </p>
                </li>
              ))}
              {!(gigMarketplacePipeline.gigs ?? gigs).length ? (
                <li className="text-xs text-slate-500">No gigs published yet.</li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-purple-100 bg-white p-6">
            <h4 className="text-base font-semibold text-slate-900">Roles &amp; talent briefs</h4>
            <p className="mt-1 text-xs text-slate-500">
              {formatNumber((gigMarketplacePipeline.jobs ?? jobs).length)} open roles across programs.
            </p>
            <ul className="mt-3 space-y-2">
              {(gigMarketplacePipeline.jobs ?? jobs).slice(0, 4).map((role) => (
                <li key={role.id ?? role.title} className="rounded-2xl border border-slate-200/70 bg-slate-50/60 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{role.title ?? 'Open role'}</p>
                  <p className="text-xs text-slate-500">{role.employmentType ?? 'Type TBD'}</p>
                </li>
              ))}
              {!(gigMarketplacePipeline.jobs ?? jobs).length ? (
                <li className="text-xs text-slate-500">No open roles have been drafted.</li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  const renderContent = state.loading
    ? renderLoading
    : state.error
      ? renderError
      : (
          <div className="space-y-10">
            {renderAgencyOverview}
            {renderExecutiveIntelligenceSection}
            {renderAnalyticsWarRoomSection}
            {renderScenarioExplorerSection}
            {renderGovernanceDeskSection}
            {renderLeadershipHubSection}
            {renderInnovationLabSection}
            <section>{renderTalentOverview}</section>

            {renderHrManagementSection}

            <section className="grid gap-6 xl:grid-cols-2">
              {renderTalentCrm}
              {renderPeopleOpsHub}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              {renderTalentOpportunityBoard}
              {renderBrandingStudio}
            </section>

            {renderProjectsWorkspace}

            {renderGigPrograms}
          </div>
        );

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency Command Studio"
      subtitle="Operations, talent, and growth"
      description="Purpose-built to help agencies orchestrate projects, talent, gigs, and marketing campaigns while staying ahead of analytics and governance."
      menuSections={menuSections}
      sections={capabilitySections}
      profile={profile}
      availableDashboards={DEFAULT_MEMBERSHIPS}
    >
      {renderContent}
    </DashboardLayout>
  );
}
