import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import Modal from '../components/ui/Modal.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import useSession from '../hooks/useSession.js';
import useCachedResource from '../hooks/useCachedResource.js';
import analytics from '../services/analytics.js';
import { fetchUserDashboard } from '../services/userDashboard.js';
import { formatAbsolute, formatRelativeTime } from '../utils/date.js';
import { classNames } from '../utils/classNames.js';
import { formatInteger, formatPercent } from '../utils/number.js';
export { formatPercent };
import JobManagementWorkspace from '../components/jobs/JobManagementWorkspace.jsx';
import JobListView from '../components/jobs/JobListView.jsx';
import JobDetailPanel from '../components/jobs/JobDetailPanel.jsx';
import JobApplyDrawer from '../components/jobs/JobApplyDrawer.jsx';
import OpportunityFilterPill from '../components/opportunity/OpportunityFilterPill.jsx';
import SavedSearchList from '../components/explorer/SavedSearchList.jsx';
import useSavedSearches from '../hooks/useSavedSearches.js';
export const JOB_ACCESS_MEMBERSHIPS = new Set(['user', 'freelancer']);

export const EMPLOYMENT_TYPE_OPTIONS = [
  { id: 'full-time', label: 'Full-time', value: 'Full-time' },
  { id: 'contract', label: 'Contract', value: 'Contract' },
  { id: 'contract-to-hire', label: 'Contract-to-hire', value: 'Contract-to-hire' },
  { id: 'part-time', label: 'Part-time', value: 'Part-time' },
];

export const REMOTE_OPTIONS = [
  { id: 'any', label: 'All work styles', value: null },
  { id: 'remote', label: 'Remote only', value: true },
  { id: 'onsite', label: 'Onsite & hybrid', value: false },
];

export const FRESHNESS_OPTIONS = [
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
];

export const JOB_TABS = [
  { id: 'board', label: 'Jobs board' },
  { id: 'applications', label: 'Applications' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'manage', label: 'Manage jobs' },
];

export const SORT_OPTIONS = [
  { id: 'default', label: 'Relevance' },
  { id: 'newest', label: 'Newest' },
  { id: 'alphabetical', label: 'A–Z' },
];

export const SAVED_SEARCH_FREQUENCIES = [
  { id: 'immediate', label: 'Immediate' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
];

export function createDefaultFilters() {
  return {
    employmentTypes: [],
    isRemote: null,
    updatedWithin: '30d',
  };
}

export function formatStatusLabel(value) {
  if (!value) return 'Unknown';
  return `${value}`
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function ActiveFilterTag({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-accentSoft hover:text-accent"
    >
      <span>{label}</span>
      <span aria-hidden="true">×</span>
      <span className="sr-only">Remove filter</span>
    </button>
  );
}

function metricCard({ title, value, description, highlight }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
      {highlight ? <p className="mt-3 text-xs font-semibold text-accent">{highlight}</p> : null}
    </div>
  );
}

export default function JobsPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(() => createDefaultFilters());
  const [sort, setSort] = useState('default');
  const [activeTab, setActiveTab] = useState('board');
  const [savedSearchName, setSavedSearchName] = useState('');
  const [activeSavedSearchId, setActiveSavedSearchId] = useState(null);
  const [savedSearchFrequency, setSavedSearchFrequency] = useState('daily');
  const [savedSearchNotifyEmail, setSavedSearchNotifyEmail] = useState(false);
  const [savedSearchNotifyInApp, setSavedSearchNotifyInApp] = useState(true);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [applicationStages, setApplicationStages] = useState({});
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [applyDrawerOpen, setApplyDrawerOpen] = useState(false);
  const resolveJobKey = (job) => job?.id ?? job?.slug ?? job?.title ?? null;

  const savedJobsStorageKey = useMemo(() => {
    const userKey = session?.id ?? session?.userId ?? 'anon';
    return `gigvora:web:saved-jobs:${userKey}`;
  }, [session?.id, session?.userId]);

  const memberships = useMemo(() => session?.memberships ?? [], [session?.memberships]);
  const canAccessJobs = useMemo(
    () => memberships.some((membership) => JOB_ACCESS_MEMBERSHIPS.has(membership)),
    [memberships],
  );
  const userId = session?.id ?? session?.userId ?? null;

  useEffect(() => {
    if (typeof window === 'undefined' || !savedJobsStorageKey) {
      return;
    }
    try {
      const raw = window.localStorage.getItem(savedJobsStorageKey);
      if (!raw) {
        setSavedJobIds([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedJobIds(parsed.filter((entry) => typeof entry === 'string' && entry.trim()));
      }
    } catch (error) {
      console.warn('Unable to load saved jobs', error);
    }
  }, [savedJobsStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !savedJobsStorageKey) {
      return;
    }
    try {
      window.localStorage.setItem(savedJobsStorageKey, JSON.stringify(savedJobIds));
    } catch (error) {
      console.warn('Unable to persist saved jobs', error);
    }
  }, [savedJobIds, savedJobsStorageKey]);

  const {
    items: savedSearches,
    loading: savedSearchesLoading,
    createSavedSearch,
    deleteSavedSearch,
    runSavedSearch,
    canUseServer: canSyncSavedSearches,
  } = useSavedSearches({ enabled: isAuthenticated && canAccessJobs });

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
    } else {
      setAuthPromptOpen(false);
    }
  }, [isAuthenticated]);

  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
    debouncedQuery,
  } = useOpportunityListing('jobs', query, {
    pageSize: 25,
    filters,
    sort,
    includeFacets: true,
    enabled: isAuthenticated && canAccessJobs,
  });

  const listing = data ?? {};
  const items = useMemo(() => (Array.isArray(listing.items) ? listing.items : []), [listing.items]);
  const totalJobs = listing.total ?? items.length;

  const jobMap = useMemo(() => {
    const map = new Map();
    items.forEach((job) => {
      const key = resolveJobKey(job);
      if (key) {
        map.set(key, job);
      }
    });
    return map;
  }, [items]);

  useEffect(() => {
    if (!items.length) {
      setSelectedJobId(null);
      return;
    }
    setSelectedJobId((current) => {
      if (current != null && jobMap.has(current)) {
        return current;
      }
      if (current === null) {
        return resolveJobKey(items[0]) ?? null;
      }
      const fallback = resolveJobKey(items[0]);
      return fallback ?? current;
    });
  }, [items, jobMap]);

  useEffect(() => {
    if (!applyDrawerOpen) {
      setApplyJobId(null);
    }
  }, [applyDrawerOpen]);

  const selectedJob = useMemo(() => {
    if (!items.length) {
      return null;
    }
    if (selectedJobId && jobMap.has(selectedJobId)) {
      return jobMap.get(selectedJobId);
    }
    return items[0] ?? null;
  }, [items, jobMap, selectedJobId]);

  const applyJob = useMemo(() => {
    if (applyJobId && jobMap.has(applyJobId)) {
      return jobMap.get(applyJobId);
    }
    return selectedJob ?? null;
  }, [applyJobId, jobMap, selectedJob]);

  const filterTelemetry = useMemo(
    () => ({
      query: debouncedQuery || null,
      sort,
      filters,
    }),
    [debouncedQuery, sort, filters],
  );

  const viewTrackedRef = useRef(false);
  useEffect(() => {
    if (!canAccessJobs || !items.length) {
      return;
    }
    const signature = JSON.stringify(filterTelemetry);
    if (viewTrackedRef.current === signature) {
      return;
    }
    viewTrackedRef.current = signature;
    analytics.track(
      'web_job_listing_viewed',
      {
        query: debouncedQuery || null,
        sort,
        resultCount: totalJobs,
        filters,
      },
      { source: 'web_app' },
    );
  }, [canAccessJobs, items.length, debouncedQuery, sort, totalJobs, filterTelemetry, filters]);

  const filtersInitializedRef = useRef(false);
  useEffect(() => {
    if (!canAccessJobs) {
      return;
    }
    if (!filtersInitializedRef.current) {
      filtersInitializedRef.current = true;
      return;
    }
    analytics.track(
      'web_job_filters_updated',
      {
        query: debouncedQuery || null,
        sort,
        filters,
      },
      { source: 'web_app' },
    );
  }, [filters, canAccessJobs, debouncedQuery, sort]);

  const sortInitializedRef = useRef(false);
  useEffect(() => {
    if (!canAccessJobs) {
      return;
    }
    if (!sortInitializedRef.current) {
      sortInitializedRef.current = true;
      return;
    }
    analytics.track(
      'web_job_sort_changed',
      {
        sort,
        query: debouncedQuery || null,
        filters,
      },
      { source: 'web_app' },
    );
  }, [sort, canAccessJobs, debouncedQuery, filters]);

  const {
    data: dashboardData,
    error: dashboardError,
    loading: dashboardLoading,
    fromCache: dashboardFromCache,
    lastUpdated: dashboardLastUpdated,
    refresh: refreshDashboard,
  } = useCachedResource(
    `user-dashboard:${userId}`,
    ({ signal }) => {
      if (!userId) {
        return Promise.resolve(null);
      }
      return fetchUserDashboard(userId, { signal });
    },
    { enabled: isAuthenticated && canAccessJobs && Boolean(userId) },
  );

  const savedSearchAnalytics = useMemo(() => {
    if (!dashboardData?.topSearch) {
      return {
        stats: null,
        upcomingRuns: [],
        keywordHighlights: [],
        categoryHighlights: [],
      };
    }
    const stats = dashboardData.topSearch.stats ?? null;
    return {
      stats,
      upcomingRuns: Array.isArray(dashboardData.topSearch.upcomingRuns)
        ? dashboardData.topSearch.upcomingRuns
        : [],
      keywordHighlights: stats?.keywordHighlights ?? [],
      categoryHighlights: dashboardData.topSearch.recommendations?.categoryHighlights ?? [],
    };
  }, [dashboardData?.topSearch]);

  const resumeInsights = useMemo(() => {
    const cvStudio = dashboardData?.documentStudio?.cvStudio ?? null;
    if (!cvStudio) {
      return null;
    }

    const baseline = cvStudio.baseline ?? null;
    const variants = Array.isArray(cvStudio.variants) ? cvStudio.variants : [];
    const metrics = baseline?.latestVersion?.metrics ?? {};
    const rawScore =
      metrics.qualityScore ?? metrics.aiCopyScore ?? baseline?.aiCopyScore ?? null;

    let scoreFraction = null;
    if (rawScore != null && Number.isFinite(Number(rawScore))) {
      const numeric = Number(rawScore);
      scoreFraction = Math.abs(numeric) <= 1 ? numeric : numeric / 100;
      if (!Number.isFinite(scoreFraction)) {
        scoreFraction = null;
      }
    }

    const clampedScore =
      scoreFraction == null ? null : Math.max(0, Math.min(1, scoreFraction));

    const summaryText =
      baseline?.latestVersion?.aiSummary ?? baseline?.latestVersion?.summary ?? null;

    const lastUpdated =
      baseline?.updatedAt ??
      baseline?.latestVersion?.updatedAt ??
      cvStudio.summary?.lastUpdatedAt ??
      null;

    let recommendation;
    if (!baseline) {
      recommendation = 'Upload a baseline CV to unlock resume quality scoring.';
    } else if (clampedScore != null && clampedScore < 0.75) {
      recommendation = 'Incorporate recent achievements and keywords to raise your resume score.';
    } else {
      recommendation = 'Your baseline resume is ready for auto-apply workflows.';
    }

    return {
      hasBaseline: Boolean(baseline),
      score: clampedScore,
      summary: summaryText,
      lastUpdated,
      variantCount: variants.length,
      baselineTitle: baseline?.title ?? 'Baseline CV',
      totalDocuments: cvStudio.summary?.cvCount ?? 0,
      recommendation,
      variantSamples: variants
        .slice(0, 3)
        .map((variant) => variant.title ?? variant.roleTag)
        .filter(Boolean),
    };
  }, [dashboardData?.documentStudio]);

  const savedSearchStats = savedSearchAnalytics.stats;
  const savedSearchTotals = savedSearchStats?.totals ?? null;
  const savedSearchSchedule = savedSearchStats?.schedule ?? null;
  const savedSearchUpcomingRuns = savedSearchAnalytics.upcomingRuns;
  const savedSearchKeywordHighlights = savedSearchAnalytics.keywordHighlights ?? [];

  const applicationSummary = dashboardData?.summary ?? {};
  const pipelineStatuses = useMemo(
    () => (Array.isArray(dashboardData?.pipeline?.statuses) ? dashboardData.pipeline.statuses : []),
    [dashboardData?.pipeline?.statuses],
  );
  const recentApplications = useMemo(
    () => (Array.isArray(dashboardData?.applications?.recent) ? dashboardData.applications.recent : []),
    [dashboardData?.applications?.recent],
  );
  const interviews = useMemo(
    () => (Array.isArray(dashboardData?.interviews) ? dashboardData.interviews : []),
    [dashboardData?.interviews],
  );
  const automation = dashboardData?.careerPipelineAutomation ?? {};
  const stageBuckets = useMemo(
    () => (Array.isArray(automation?.kanban?.stages) ? automation.kanban.stages : []),
    [automation?.kanban?.stages],
  );
  const bulkReminders = useMemo(
    () => (Array.isArray(automation?.bulkOperations?.reminders) ? automation.bulkOperations.reminders : []),
    [automation?.bulkOperations?.reminders],
  );
  const autoApplyRules = useMemo(
    () => (Array.isArray(automation?.autoApply?.rules) ? automation.autoApply.rules.slice(0, 3) : []),
    [automation?.autoApply?.rules],
  );
  const guardrails = automation?.autoApply?.guardrails ?? {};
  const interviewReadiness = automation?.interviewCommandCenter?.readiness ?? {};
  const interviewSummary = automation?.interviewCommandCenter?.summary ?? {};

  useEffect(() => {
    setApplicationStages((current) => {
      const next = {};
      recentApplications.forEach((application) => {
        if (application?.id == null) {
          return;
        }
        const key = application.id;
        next[key] = current[key] ?? application.status ?? 'applied';
      });
      return next;
    });
  }, [recentApplications]);

  const stageOptions = useMemo(() => {
    const options = new Set();
    pipelineStatuses.forEach((status) => {
      if (status?.status) {
        options.add(`${status.status}`);
      }
    });
    stageBuckets.forEach((stage) => {
      if (stage?.id) {
        options.add(`${stage.id}`);
      }
      if (stage?.name) {
        options.add(`${stage.name}`);
      }
    });
    recentApplications.forEach((application) => {
      const stage = applicationStages[application.id] ?? application.status;
      if (stage) {
        options.add(`${stage}`);
      }
    });
    const normalised = Array.from(options)
      .map((entry) => `${entry}`.trim())
      .filter((entry) => entry.length);
    if (!normalised.length) {
      return ['applied', 'screening', 'interview', 'offer', 'hired'];
    }
    return normalised.sort((a, b) => a.localeCompare(b));
  }, [pipelineStatuses, stageBuckets, recentApplications, applicationStages]);

  const pipelineStatusDisplay = useMemo(() => {
    const base = new Map();
    pipelineStatuses.forEach((status) => {
      if (status?.status) {
        base.set(`${status.status}`, Number(status.count) || 0);
      }
    });
    if (!base.size) {
      const fallback = new Map();
      recentApplications.forEach((application) => {
        const stage = applicationStages[application.id] ?? application.status;
        if (!stage) {
          return;
        }
        const key = `${stage}`;
        fallback.set(key, (fallback.get(key) ?? 0) + 1);
      });
      return Array.from(fallback.entries()).map(([status, count]) => ({ status, count }));
    }

    const adjusted = new Map(base.entries());
    recentApplications.forEach((application) => {
      const original = application.status ? `${application.status}` : null;
      const override = applicationStages[application.id] ?? original;
      if (!override || override === original) {
        return;
      }
      if (original && adjusted.has(original)) {
        adjusted.set(original, Math.max(0, (adjusted.get(original) ?? 0) - 1));
      }
      const key = `${override}`;
      adjusted.set(key, (adjusted.get(key) ?? 0) + 1);
    });

    return Array.from(adjusted.entries()).map(([status, count]) => ({ status, count }));
  }, [pipelineStatuses, recentApplications, applicationStages]);

  const remoteStats = useMemo(() => {
    const facet = listing.facets?.isRemote ?? listing.facets?.isremote ?? {};
    let remoteCount = 0;
    Object.entries(facet).forEach(([key, value]) => {
      if (`${key}`.toLowerCase() === 'true') {
        remoteCount += Number(value) || 0;
      }
    });
    if (!remoteCount) {
      remoteCount = items.filter((job) => job.isRemote).length;
    }
    const percentage = totalJobs ? Math.round((remoteCount / totalJobs) * 100) : 0;
    return { remoteCount, percentage };
  }, [items, listing.facets, totalJobs]);

  const freshnessStats = useMemo(() => {
    const sevenDayFacet = listing.facets?.updatedAtDate?.['7d'];
    if (sevenDayFacet != null) {
      return Number(sevenDayFacet) || 0;
    }
    const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return items.filter((job) => {
      const updated = job.updatedAt ? new Date(job.updatedAt).getTime() : NaN;
      return Number.isFinite(updated) && updated >= threshold;
    }).length;
  }, [items, listing.facets]);

  const employmentTypeHighlight = useMemo(() => {
    const typeFacet = listing.facets?.employmentType ?? {};
    const entries = Object.entries(typeFacet).map(([key, value]) => [key, Number(value) || 0]);
    if (entries.length) {
      entries.sort((a, b) => b[1] - a[1]);
      const [type, count] = entries[0];
      return { type, count };
    }
    const counts = new Map();
    items.forEach((job) => {
      if (!job.employmentType) return;
      const key = job.employmentType;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    if (!counts.size) {
      return null;
    }
    const [type, count] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    return { type, count };
  }, [items, listing.facets]);

  const activeFilterBadges = useMemo(() => {
    const badges = [];
    if (filters.isRemote === true) {
      badges.push({ key: 'remote:true', label: 'Remote only' });
    } else if (filters.isRemote === false) {
      badges.push({ key: 'remote:false', label: 'Onsite & hybrid' });
    }
    filters.employmentTypes.forEach((type) => {
      badges.push({ key: `type:${type}`, label: type });
    });
    if (filters.updatedWithin && filters.updatedWithin !== '30d') {
      const option = FRESHNESS_OPTIONS.find((entry) => entry.id === filters.updatedWithin);
      badges.push({ key: 'freshness', label: option ? option.label : `Updated within ${filters.updatedWithin}` });
    }
    return badges;
  }, [filters]);

  const hasActiveFilters = activeFilterBadges.length > 0 || sort !== 'default' || Boolean(debouncedQuery);

  const mergeSavedSearchFilters = useCallback((source) => {
    const base = createDefaultFilters();
    if (!source) {
      return base;
    }
    const next = { ...base };
    if (Array.isArray(source.employmentTypes)) {
      next.employmentTypes = source.employmentTypes.filter((entry) => Boolean(entry));
    }
    if (source.isRemote === true || source.isRemote === false || source.isRemote === null) {
      next.isRemote = source.isRemote;
    }
    if (typeof source.updatedWithin === 'string' && source.updatedWithin.trim().length) {
      next.updatedWithin = source.updatedWithin;
    }
    return next;
  }, []);

  const handleToggleEmploymentType = useCallback((value) => {
    setActiveSavedSearchId(null);
    setFilters((previous) => {
      const next = new Set(previous.employmentTypes);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...previous, employmentTypes: Array.from(next) };
    });
  }, []);

  const handleRemoteSelection = useCallback((value) => {
    setActiveSavedSearchId(null);
    setFilters((previous) => ({ ...previous, isRemote: value }));
  }, []);

  const handleFreshnessSelection = useCallback((value) => {
    setActiveSavedSearchId(null);
    setFilters((previous) => ({ ...previous, updatedWithin: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
    setSort('default');
    setActiveSavedSearchId(null);
    analytics.track(
      'web_job_filters_reset',
      {
        query: debouncedQuery || null,
      },
      { source: 'web_app' },
    );
  }, [debouncedQuery]);

  const handleApply = useCallback(
    (job) => {
      if (!job) {
        return;
      }
      const key = resolveJobKey(job);
      if (key) {
        setSelectedJobId(key);
        setApplyJobId(key);
        setApplyDrawerOpen(true);
      }
      analytics.track(
        'web_job_apply_cta',
        {
          id: job.id,
          title: job.title,
          query: debouncedQuery || null,
          sort,
          filters,
        },
        { source: 'web_app' },
      );
    },
    [debouncedQuery, sort, filters],
  );

  const handleSelectJob = useCallback(
    (job) => {
      if (!job) {
        return;
      }
      const key = resolveJobKey(job);
      if (!key) {
        return;
      }
      setSelectedJobId(key);
      analytics.track(
        'web_job_detail_viewed',
        {
          opportunityId: job.id ?? null,
          title: job.title ?? null,
          matchScore: job.matchScore ?? job.aiSignals?.total ?? null,
          saved: savedJobIds.includes(key),
        },
        { source: 'web_app' },
      );
    },
    [savedJobIds],
  );

  const handleToggleSavedJob = useCallback(
    (job) => {
      if (!job) {
        return;
      }
      const key = resolveJobKey(job);
      if (!key) {
        return;
      }
      setSavedJobIds((current) => {
        const next = new Set(current);
        const willSave = !next.has(key);
        if (willSave) {
          next.add(key);
        } else {
          next.delete(key);
        }
        analytics.track(
          'web_job_saved_toggle',
          {
            opportunityId: job.id ?? null,
            title: job.title ?? null,
            saved: willSave,
          },
          { source: 'web_app' },
        );
        return Array.from(next);
      });
    },
    [],
  );

  const handleSubmitApplication = useCallback(
    async ({ job: targetJob }) => {
      analytics.track(
        'web_job_application_submitted',
        {
          opportunityId: targetJob?.id ?? null,
          title: targetJob?.title ?? null,
          query: debouncedQuery || null,
          sort,
          filters,
          saved: targetJob ? savedJobIds.includes(resolveJobKey(targetJob)) : false,
        },
        { source: 'web_app' },
      );
      await refresh();
    },
    [debouncedQuery, sort, filters, refresh, savedJobIds],
  );

  const handleStageTransition = useCallback((application, nextStage) => {
    if (!application?.id || !nextStage) {
      return;
    }
    setApplicationStages((current) => {
      const previousStage = current[application.id] ?? application.status ?? null;
      if (previousStage === nextStage) {
        return current;
      }
      analytics.track(
        'web_job_application_stage_changed',
        {
          applicationId: application.id,
          previousStage,
          nextStage,
          opportunityId: application.opportunityId ?? application.target?.id ?? null,
        },
        { source: 'web_app' },
      );
      return { ...current, [application.id]: nextStage };
    });
  }, []);

  const handleContactRecruiter = useCallback(
    (application) => {
      if (!application) {
        return;
      }
      const recruiterId = application.recruiter?.id ?? application.recruiterId ?? null;
      const recruiterName = application.recruiter?.name ?? application.recruiterName ?? null;
      const composeTarget = recruiterId ? `recruiter-${encodeURIComponent(String(recruiterId))}` : 'recruiter-outreach';
      const url = `/inbox?compose=${composeTarget}`;
      analytics.track(
        'web_job_recruiter_chat_initiated',
        {
          applicationId: application.id,
          recruiterId,
          recruiterName,
          opportunityId: application.opportunityId ?? application.target?.id ?? null,
        },
        { source: 'web_app' },
      );
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener');
      } else {
        navigate('/inbox');
      }
    },
    [navigate],
  );

  const handleSaveCurrentSearch = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmedName = savedSearchName.trim();
      const trimmedQuery = query.trim();
      const payload = {
        name: trimmedName || (trimmedQuery ? `Jobs • ${trimmedQuery}` : 'Jobs saved search'),
        category: 'jobs',
        query: trimmedQuery || '',
        filters,
        sort,
        frequency: savedSearchFrequency,
        notifyByEmail: savedSearchNotifyEmail,
        notifyInApp: savedSearchNotifyInApp,
      };
      try {
        const created = await createSavedSearch(payload);
        analytics.track(
          'web_job_saved_search_created',
          {
            savedSearchId: created?.id ?? null,
            query: payload.query || null,
            sort: payload.sort,
            filters: payload.filters,
            frequency: payload.frequency,
            notifyByEmail: payload.notifyByEmail,
            notifyInApp: payload.notifyInApp,
          },
          { source: 'web_app' },
        );
        setActiveSavedSearchId(created?.id ?? null);
        setSavedSearchName('');
      } catch (error) {
        console.error('Unable to create saved search', error);
      }
    },
    [savedSearchName, query, filters, sort, savedSearchFrequency, savedSearchNotifyEmail, savedSearchNotifyInApp, createSavedSearch],
  );

  const handleApplySavedSearch = useCallback(
    (search) => {
      if (!search) {
        return;
      }
      const normalisedFilters = mergeSavedSearchFilters(search.filters ?? null);
      setActiveTab('board');
      setActiveSavedSearchId(search.id ?? null);
      setQuery(search.query ?? '');
      setFilters(normalisedFilters);
      setSort(search.sort ?? 'default');
      setSavedSearchFrequency((search.frequency ?? 'daily').toLowerCase());
      setSavedSearchNotifyEmail(Boolean(search.notifyByEmail));
      setSavedSearchNotifyInApp(search.notifyInApp !== false);
      analytics.track(
        'web_job_saved_search_applied',
        {
          savedSearchId: search.id ?? null,
          query: search.query ?? null,
          sort: search.sort ?? 'default',
          filters: normalisedFilters,
          frequency: (search.frequency ?? 'daily').toLowerCase(),
          notifyByEmail: Boolean(search.notifyByEmail),
          notifyInApp: search.notifyInApp !== false,
        },
        { source: 'web_app' },
      );
      runSavedSearch(search).catch((error) => {
        console.warn('Failed to trigger saved search', error);
      });
    },
    [mergeSavedSearchFilters, runSavedSearch],
  );

  const handleDeleteSavedSearch = useCallback(
    async (search) => {
      if (!search) {
        return;
      }
      try {
        await deleteSavedSearch(search);
        analytics.track(
          'web_job_saved_search_deleted',
          {
            savedSearchId: search.id ?? null,
          },
          { source: 'web_app' },
        );
        setActiveSavedSearchId((current) => (current === search.id ? null : current));
      } catch (error) {
        console.error('Unable to delete saved search', error);
      }
    },
    [deleteSavedSearch],
  );

  const recommendations = useMemo(() => {
    const direct = (() => {
      if (Array.isArray(listing.recommendations)) {
        return listing.recommendations;
      }
      if (Array.isArray(listing.recommendations?.jobs)) {
        return listing.recommendations.jobs;
      }
      if (Array.isArray(dashboardData?.recommendations?.jobs)) {
        return dashboardData.recommendations.jobs;
      }
      if (Array.isArray(dashboardData?.recommendations)) {
        return dashboardData.recommendations;
      }
      return [];
    })();
    const sanitisedDirect = direct.filter((job) => job && (job.id != null || job.title));
    if (sanitisedDirect.length) {
      const uniqueMap = new Map();
      sanitisedDirect.forEach((job) => {
        const key = job.id ?? job.title;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, job);
        }
      });
      return Array.from(uniqueMap.values()).slice(0, 3);
    }

    const scored = items
      .map((job) => {
        const score = Number(job.matchScore ?? job.suitabilityScore ?? job.score ?? job.priority ?? 0);
        const updatedAt = job.updatedAt ? new Date(job.updatedAt).getTime() : 0;
        return {
          job,
          score: Number.isFinite(score) ? score : 0,
          updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.updatedAt - a.updatedAt;
      })
      .map((entry) => entry.job);
    if (scored.length) {
      return scored.slice(0, 3);
    }

    const remotePreferred = items.filter((job) => job.isRemote).slice(0, 3);
    if (remotePreferred.length) {
      return remotePreferred;
    }

    return items.slice(0, 3);
  }, [dashboardData?.recommendations, items, listing.recommendations]);

  const handleRecommendationExplore = useCallback(
    (job) => {
      if (!job) {
        return;
      }
      setActiveTab('board');
      setActiveSavedSearchId(null);
      if (job.title) {
        setQuery(job.title);
      }
      setFilters((previous) => {
        const next = { ...previous };
        if (job.employmentType) {
          next.employmentTypes = [job.employmentType];
        }
        if (job.isRemote) {
          next.isRemote = true;
        }
        return next;
      });
      analytics.track(
        'web_job_recommendation_selected',
        {
          opportunityId: job.id ?? null,
          title: job.title ?? null,
          source: job.source ?? listing.source ?? 'recommendation',
        },
        { source: 'web_app' },
      );
    },
    [listing.source],
  );

  const handleKeywordSuggestion = useCallback((keyword) => {
    if (!keyword) {
      return;
    }
    const trimmed = `${keyword}`.trim();
    if (!trimmed) {
      return;
    }
    setActiveTab('board');
    setActiveSavedSearchId(null);
    setQuery(trimmed);
    analytics.track(
      'web_job_keyword_suggestion_applied',
      { keyword: trimmed },
      { source: 'web_app' },
    );
  }, []);

  if (!isAuthenticated) {
    return (
      <>
        <section className="relative overflow-hidden py-20">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.35),_transparent_65%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-5xl px-6">
            <PageHeader
              eyebrow="Jobs"
              title="Secure your curated job workspace"
              description="Sign in to unlock saved searches, AI match insights, and resume readiness scoring for the Gigvora jobs marketplace."
            />
            <div className="mt-10 rounded-3xl border border-slate-200 bg-white/80 p-8 text-sm text-slate-600 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p>Authenticate to continue exploring opportunities tailored to your memberships.</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setAuthPromptOpen(true)}
                    className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
                  >
                    Open sign-in prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Return home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Modal
          open={authPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          title="Sign in to access Gigvora jobs"
          description="Verify your account to view curated roles, saved filters, and automation guardrails."
        >
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              Use your Gigvora credentials to continue. We’ll return you to the jobs marketplace with your filters and alerts
              intact.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  navigate('/login', { state: { redirectTo: '/jobs', reason: 'jobs_board' } });
                }}
                className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Go to secure sign-in
              </button>
              <button
                type="button"
                onClick={() => setAuthPromptOpen(false)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Maybe later
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Need access? Email{' '}
              <a href="mailto:support@gigvora.com" className="font-semibold text-accent">
                support@gigvora.com
              </a>{' '}
              to request a job-seeker membership.
            </p>
          </div>
        </Modal>
      </>
    );
  }

  if (!canAccessJobs) {
    return (
      <section className="relative overflow-hidden py-20">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.35),_transparent_65%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl px-6">
          <PageHeader
            eyebrow="Jobs"
            title="Access requires a talent membership"
            description="Request freelancer or job-seeker workspace access from the Gigvora team to unlock the curated job marketplace."
          />
          <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-700 shadow-sm">
            <p>
              Your account currently does not include the freelancer or job-seeker membership required to view long-term roles.
              Contact your Gigvora administrator or email <a href="mailto:support@gigvora.com" className="font-semibold">support@gigvora.com</a>{' '}
              to enable job marketplace access.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const metrics = [
    metricCard({
      title: 'Open opportunities',
      value: formatInteger(totalJobs),
      description: 'Marketplace roles currently published for Gigvora talent.',
    }),
    metricCard({
      title: 'Remote friendly',
      value: formatPercent(remoteStats.percentage, { maximumFractionDigits: 0 }),
      description: `${formatInteger(remoteStats.remoteCount)} listings flagged as remote-first.`,
    }),
    metricCard({
      title: 'Updated this week',
      value: formatInteger(freshnessStats),
      description: 'Roles refreshed in the last 7 days.',
      highlight: employmentTypeHighlight
        ? `${formatInteger(employmentTypeHighlight.count)} ${employmentTypeHighlight.type.toLowerCase()} openings`
        : null,
    }),
  ];

  const boardContent = (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(280px,1fr)]">
      <div className="space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label htmlFor="job-search" className="sr-only">
                Search jobs
              </label>
              <input
                id="job-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveSavedSearchId(null);
                }}
                placeholder="Search by title, company, or keywords"
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="job-sort" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sort
              </label>
              <select
                id="job-sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setActiveSavedSearchId(null);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Work style</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {REMOTE_OPTIONS.map((option) => (
                  <OpportunityFilterPill
                    key={option.id}
                    active={filters.isRemote === option.value}
                    label={option.label}
                    onClick={() => handleRemoteSelection(option.value)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employment type</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                  <OpportunityFilterPill
                    key={option.id}
                    active={filters.employmentTypes.includes(option.value)}
                    label={option.label}
                    onClick={() => handleToggleEmploymentType(option.value)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Freshness</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FRESHNESS_OPTIONS.map((option) => (
                  <OpportunityFilterPill
                    key={option.id}
                    active={filters.updatedWithin === option.id}
                    label={option.label}
                    onClick={() => handleFreshnessSelection(option.id)}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {hasActiveFilters ? (
                <div className="flex flex-wrap gap-2">
                  {activeFilterBadges.map((badge) => {
                    if (badge.key.startsWith('type:')) {
                      const type = badge.key.slice('type:'.length);
                      return (
                        <ActiveFilterTag
                          key={badge.key}
                          label={badge.label}
                          onRemove={() => handleToggleEmploymentType(type)}
                        />
                      );
                    }
                    if (badge.key === 'remote:true' || badge.key === 'remote:false') {
                      return (
                        <ActiveFilterTag
                          key={badge.key}
                          label={badge.label}
                          onRemove={() => handleRemoteSelection(null)}
                        />
                      );
                    }
                    return (
                      <ActiveFilterTag
                        key={badge.key}
                        label={badge.label}
                        onRemove={() => handleFreshnessSelection('30d')}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Refine the board with work style, employment type, and freshness filters.
                </p>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics}</div>
        <JobListView
          jobs={items}
          loading={loading}
          error={error}
          query={debouncedQuery}
          onSelectJob={handleSelectJob}
          onApply={handleApply}
          savedJobIds={savedJobIds}
          onToggleSave={handleToggleSavedJob}
          resumeInsights={resumeInsights}
        />
      </div>
      <aside className="space-y-6">
        <JobDetailPanel job={selectedJob} open={Boolean(selectedJob)} onApply={handleApply} resumeInsights={resumeInsights} />
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Saved searches</h3>
          <p className="mt-2 text-xs text-slate-500">
            Capture favourite filters to receive proactive ATS nudges and interview prep prompts.
          </p>
          <form onSubmit={handleSaveCurrentSearch} className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <label htmlFor="jobs-saved-search-name" className="sr-only">
                Name this search
              </label>
              <input
                id="jobs-saved-search-name"
                type="text"
                value={savedSearchName}
                onChange={(event) => setSavedSearchName(event.target.value)}
                placeholder="Give it a name"
                className="flex-1 min-w-[8rem] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savedSearchesLoading}
              >
                Save search
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <label htmlFor="jobs-saved-search-frequency" className="flex items-center gap-2 font-semibold text-slate-600">
                Frequency
                <select
                  id="jobs-saved-search-frequency"
                  value={savedSearchFrequency}
                  onChange={(event) => setSavedSearchFrequency(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={savedSearchesLoading}
                >
                  {SAVED_SEARCH_FREQUENCIES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="jobs-saved-search-email"
                  type="checkbox"
                  checked={savedSearchNotifyEmail}
                  onChange={(event) => setSavedSearchNotifyEmail(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                  disabled={savedSearchesLoading}
                />
                <label htmlFor="jobs-saved-search-email" className="font-semibold text-slate-600">
                  Email alerts
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="jobs-saved-search-inapp"
                  type="checkbox"
                  checked={savedSearchNotifyInApp}
                  onChange={(event) => setSavedSearchNotifyInApp(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                  disabled={savedSearchesLoading}
                />
                <label htmlFor="jobs-saved-search-inapp" className="font-semibold text-slate-600">
                  In-app alerts
                </label>
              </div>
            </div>
          </form>
          <div className="mt-4">
            <SavedSearchList
              savedSearches={savedSearches}
              onApply={handleApplySavedSearch}
              onDelete={handleDeleteSavedSearch}
              loading={savedSearchesLoading}
              activeSearchId={activeSavedSearchId}
              canManageServerSearches={canSyncSavedSearches}
            />
          </div>
          {savedSearchKeywordHighlights.length ? (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Suggested keywords
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {savedSearchKeywordHighlights.slice(0, 5).map((keyword) => (
                  <button
                    key={keyword.keyword ?? keyword}
                    type="button"
                    onClick={() => handleKeywordSuggestion(keyword.keyword ?? keyword)}
                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    #{keyword.keyword ?? keyword}
                    {keyword.count ? (
                      <span className="ml-1 text-[11px] text-slate-400">({formatInteger(keyword.count)})</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {savedSearchTotals ? (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Saved search automation</h3>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Saved views</span>
                <span className="font-semibold text-slate-900">{formatInteger(savedSearchTotals.saved)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email alerts enabled</span>
                <span className="font-semibold text-slate-900">{formatInteger(savedSearchTotals.withEmailAlerts)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Remote filters active</span>
                <span className="font-semibold text-slate-900">{formatInteger(savedSearchTotals.remoteEnabled)}</span>
              </div>
            </div>
            {savedSearchSchedule ? (
              <div className="mt-4 space-y-2 text-xs text-slate-500">
                {savedSearchSchedule.nextRunAt ? (
                  <p>
                    Next digest {formatRelativeTime(savedSearchSchedule.nextRunAt)}{' '}
                    <span className="text-slate-400">({formatAbsolute(savedSearchSchedule.nextRunAt)})</span>
                  </p>
                ) : null}
                {savedSearchSchedule.overdue ? (
                  <p className="font-semibold text-amber-600">
                    {formatInteger(savedSearchSchedule.overdue)} overdue run{savedSearchSchedule.overdue === 1 ? '' : 's'} awaiting sync
                  </p>
                ) : null}
                {savedSearchSchedule.dueSoon ? (
                  <p>
                    {formatInteger(savedSearchSchedule.dueSoon)} run{savedSearchSchedule.dueSoon === 1 ? '' : 's'} scheduled within 72 hours.
                  </p>
                ) : null}
              </div>
            ) : null}
            {savedSearchUpcomingRuns.length ? (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Upcoming runs</p>
                <ul className="mt-2 space-y-2 text-xs text-slate-500">
                  {savedSearchUpcomingRuns.slice(0, 3).map((run) => (
                    <li key={run.id ?? run.name} className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold text-slate-600">{run.name}</span>
                      <span className="text-slate-400" title={run.nextRunAt ? formatAbsolute(run.nextRunAt) : undefined}>
                        {run.nextRunAt ? formatRelativeTime(run.nextRunAt) : 'Pending'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recommended roles</h3>
          <p className="mt-2 text-xs text-slate-500">
            Personalised suggestions blend marketplace trends with your recent applications.
          </p>
          {recommendations.length ? (
            <ul className="mt-4 space-y-3">
              {recommendations.map((job, index) => {
                const companyName = job?.companyName ?? job?.company?.name ?? job?.organisation ?? null;
                const score = job?.matchScore ?? job?.suitabilityScore ?? job?.score;
                const scoreValue = Number(score);
                const matchLabel = Number.isFinite(scoreValue)
                  ? formatPercent(scoreValue, { maximumFractionDigits: 0 })
                  : null;
                return (
                  <li
                    key={`recommendation-${job?.id ?? job?.title ?? index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{job?.title ?? 'Recommended role'}</p>
                        {companyName ? <p className="mt-1 text-xs text-slate-500">{companyName}</p> : null}
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                          {job?.isRemote ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                              Remote-friendly
                            </span>
                          ) : null}
                          {job?.employmentType ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                              {job.employmentType}
                            </span>
                          ) : null}
                          {matchLabel ? (
                            <span className="inline-flex items-center rounded-full bg-accentSoft px-2 py-1 font-semibold text-accent">
                              Match {matchLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRecommendationExplore(job)}
                        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Load filters
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              Track a few applications to unlock tailored job picks and recruiter-ready insights.
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resume readiness</h3>
          {resumeInsights ? (
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-700">{resumeInsights.baselineTitle}</span>
                {resumeInsights.score != null ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {formatPercent(resumeInsights.score, { maximumFractionDigits: 0 })}
                  </span>
                ) : null}
              </div>
              {resumeInsights.summary ? (
                <p className="text-xs text-slate-500">{resumeInsights.summary}</p>
              ) : null}
              <p className="text-xs text-slate-500">{resumeInsights.recommendation}</p>
              <div className="text-xs text-slate-500">
                <p>
                  {formatInteger(resumeInsights.variantCount)} variant{resumeInsights.variantCount === 1 ? '' : 's'}
                  {resumeInsights.variantSamples?.length
                    ? ` · ${resumeInsights.variantSamples.join(', ')}`
                    : ''}
                </p>
                {resumeInsights.lastUpdated ? (
                  <p className="mt-1 text-slate-400">
                    Updated {formatRelativeTime(resumeInsights.lastUpdated)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Create or upload a baseline resume to unlock AI quality scoring and automation guardrails.
            </p>
          )}
        </div>
      </aside>
    </div>
  );

  const applicationsContent = (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Application pipeline</h2>
        <DataStatus
          loading={dashboardLoading}
          fromCache={dashboardFromCache}
          lastUpdated={dashboardLastUpdated}
          onRefresh={() => refreshDashboard({ force: true })}
        />
      </div>
      {dashboardError ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Unable to load application insights. {dashboardError.message || 'Try refreshing to sync again.'}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total applications</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatInteger(applicationSummary.totalApplications)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatInteger(applicationSummary.activeApplications)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interviews</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatInteger(applicationSummary.interviewsScheduled)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offers in play</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatInteger(applicationSummary.offersNegotiating)}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Stage distribution</h3>
        <ul className="mt-4 space-y-3">
          {pipelineStatusDisplay.length ? (
            pipelineStatusDisplay.map((status) => (
              <li key={status.status ?? status} className="flex items-center justify-between text-sm text-slate-600">
                <span>{formatStatusLabel(status.status ?? status)}</span>
                <span className="font-semibold text-slate-900">{formatInteger(status.count)}</span>
              </li>
            ))
          ) : (
            <li className="text-xs text-slate-500">Submit applications to unlock stage analytics.</li>
          )}
        </ul>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent applications</h3>
        {dashboardLoading && !recentApplications.length ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5">
                <div className="h-3 w-1/3 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}
        {!dashboardLoading && !recentApplications.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-sm text-slate-500">
            Submit applications to unlock conversion analytics and follow-up insights.
          </div>
        ) : null}
        {recentApplications.map((application) => {
          const stageValue = applicationStages[application.id] ?? application.status ?? 'applied';
          return (
            <article key={application.id} className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-sm font-semibold text-slate-900">
                    {application.target?.title || `Application #${application.id}`}
                  </span>
                  {application.target?.companyName ? <span>{application.target.companyName}</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor={`application-stage-${application.id}`} className="sr-only">
                    Update application stage
                  </label>
                  <select
                    id={`application-stage-${application.id}`}
                    value={stageValue}
                    onChange={(event) => handleStageTransition(application, event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    {stageOptions.map((option) => (
                      <option key={option} value={option}>
                        {formatStatusLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                {application.submittedAt ? <span>Submitted {formatRelativeTime(application.submittedAt)}</span> : null}
                {application.updatedAt ? <span>Updated {formatRelativeTime(application.updatedAt)}</span> : null}
                {Number.isFinite(application.daysSinceUpdate) ? (
                  <span>{application.daysSinceUpdate} days since last activity</span>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {application.nextStep ? (
                  <p className="text-sm text-slate-600">Next step: {application.nextStep}</p>
                ) : (
                  <p className="text-xs text-slate-500">Track your follow-ups to keep recruiters engaged.</p>
                )}
                <button
                  type="button"
                  onClick={() => handleContactRecruiter(application)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Message recruiter
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );

  const interviewsContent = (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Interview command centre</h2>
        <DataStatus
          loading={dashboardLoading}
          fromCache={dashboardFromCache}
          lastUpdated={dashboardLastUpdated}
          onRefresh={() => refreshDashboard({ force: true })}
        />
      </div>
      {dashboardError ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Unable to load interview insights. {dashboardError.message || 'Try refreshing to sync again.'}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatInteger(interviewSummary.upcoming)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatInteger(interviewSummary.completed)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness tasks</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {formatInteger(interviewReadiness.completedItems)} / {formatInteger(interviewReadiness.totalItems)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interviews scheduled</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatInteger(interviews.length)}</p>
        </div>
      </div>
      {dashboardLoading && !interviews.length ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5">
              <div className="h-3 w-1/2 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-1/3 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : null}
      {!dashboardLoading && !interviews.length ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-sm text-slate-500">
          Interview schedules will surface here once hiring teams respond to your applications.
        </div>
      ) : null}
      <div className="space-y-4">
        {interviews.map((interview) => (
          <article key={interview.applicationId} className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex flex-col gap-1 text-left">
                <span className="text-sm font-semibold text-slate-900">{interview.targetName}</span>
                {interview.stage ? <span>{formatStatusLabel(interview.stage)}</span> : null}
              </div>
              {interview.scheduledAt ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                  {formatAbsolute(interview.scheduledAt)}
                </span>
              ) : null}
            </div>
            {interview.nextStep ? <p className="mt-3 text-sm text-slate-600">Next step: {interview.nextStep}</p> : null}
            {interview.reviewer?.name ? (
              <p className="mt-2 text-xs text-slate-500">Host: {interview.reviewer.name}</p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );

  const manageContent = (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Job management cockpit</h2>
        <DataStatus
          loading={dashboardLoading}
          fromCache={dashboardFromCache}
          lastUpdated={dashboardLastUpdated}
          onRefresh={() => refreshDashboard({ force: true })}
        />
      </div>
      {dashboardError ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Unable to load management analytics. {dashboardError.message || 'Try refreshing to sync again.'}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {stageBuckets.length ? (
          stageBuckets.map((stage) => (
            <div key={stage.id} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stage.name}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{formatInteger(stage.metrics?.total)}</p>
              <p className="mt-1 text-xs text-amber-600">
                {formatInteger(stage.metrics?.overdue)} overdue follow-ups
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-sm text-slate-500">
            Create a job pipeline to unlock stage analytics and guardrails.
          </div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Automation guardrails</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Manual review required</dt>
              <dd className="text-lg font-semibold text-slate-900">{formatInteger(guardrails.manualReviewRequired)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Premium protected roles</dt>
              <dd className="text-lg font-semibold text-slate-900">{formatInteger(guardrails.premiumProtected)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Bulk follow-up reminders</h3>
          <ul className="mt-4 space-y-3">
            {bulkReminders.length ? (
              bulkReminders.slice(0, 4).map((reminder) => (
                <li key={reminder.opportunityId} className="text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{reminder.title}</p>
                  {reminder.recommendation ? (
                    <p className="text-xs text-slate-500">{reminder.recommendation}</p>
                  ) : null}
                  {reminder.dueAt ? (
                    <p className="text-xs text-slate-400">Due {formatRelativeTime(reminder.dueAt)}</p>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500">Automation will surface reminders once opportunities progress.</li>
            )}
          </ul>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Auto-apply programmes</h3>
        <ul className="mt-4 space-y-3">
          {autoApplyRules.length ? (
            autoApplyRules.map((rule) => (
              <li key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                <p className="mt-1 text-xs text-slate-500">Status: {formatStatusLabel(rule.status)}</p>
                {rule.recommendation ? (
                  <p className="mt-2 text-sm text-slate-600">{rule.recommendation}</p>
                ) : null}
              </li>
            ))
          ) : (
            <li className="text-xs text-slate-500">
              Configure auto-apply rules to automate sourcing while preserving premium guardrails.
            </li>
          )}
        </ul>
      </div>
      <JobManagementWorkspace />
    </div>
  );

  const tabBadgeMap = {
    board: totalJobs,
    applications: applicationSummary.activeApplications,
    interviews: interviews.length,
    manage: automation?.kanban?.metrics?.totalOpportunities,
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.35),_transparent_65%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Jobs"
          title="Roles designed for Gigvora talent"
          description="Full-time and long-term opportunities curated for the marketplace community with transparent salary bands."
          meta={
            <DataStatus
              loading={loading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
            />
          }
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">{metrics}</div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {JOB_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={classNames(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                  activeTab === tab.id
                    ? 'border-accent bg-accent text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
                )}
              >
                <span>{tab.label}</span>
                {tabBadgeMap[tab.id] != null ? (
                  <span className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-white/20 px-2 text-xs font-semibold">
                    {formatInteger(tabBadgeMap[tab.id])}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8">
          {activeTab === 'board' ? boardContent : null}
          {activeTab === 'applications' ? applicationsContent : null}
          {activeTab === 'interviews' ? interviewsContent : null}
          {activeTab === 'manage' ? manageContent : null}
        </div>
      </div>
      <JobApplyDrawer
        open={applyDrawerOpen}
        job={applyJob}
        onClose={() => setApplyDrawerOpen(false)}
        onSubmit={handleSubmitApplication}
        resumeInsights={resumeInsights}
        session={session}
      />
    </section>
  );
}
