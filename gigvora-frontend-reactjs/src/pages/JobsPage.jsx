import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import useSession from '../hooks/useSession.js';
import useCachedResource from '../hooks/useCachedResource.js';
import analytics from '../services/analytics.js';
import { fetchUserDashboard } from '../services/userDashboard.js';
import { formatAbsolute, formatRelativeTime } from '../utils/date.js';
import { classNames } from '../utils/classNames.js';
import JobManagementWorkspace from '../components/jobs/JobManagementWorkspace.jsx';
import { resolveTaxonomyLabels } from '../utils/taxonomy.js';

export const DEFAULT_USER_ID = 1;
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

export function createDefaultFilters() {
  return {
    employmentTypes: [],
    isRemote: null,
    updatedWithin: '30d',
  };
}

export function formatNumber(value) {
  if (value == null) return '0';
  try {
    return new Intl.NumberFormat('en-GB').format(Number(value));
  } catch (error) {
    return `${value}`;
  }
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  try {
    return new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
      Number(value) / 100,
    );
  } catch (error) {
    return `${value}%`;
  }
}

export function formatStatusLabel(value) {
  if (!value) return 'Unknown';
  return `${value}`
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function FilterPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        active ? 'border-accent bg-accentSoft text-accent shadow-soft' : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
      )}
    >
      {label}
    </button>
  );
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

  const memberships = useMemo(() => session?.memberships ?? [], [session?.memberships]);
  const canAccessJobs = useMemo(
    () => memberships.some((membership) => JOB_ACCESS_MEMBERSHIPS.has(membership)),
    [memberships],
  );
  const userId = session?.id ?? session?.userId ?? DEFAULT_USER_ID;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { redirectTo: '/jobs' } });
    }
  }, [isAuthenticated, navigate]);

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
    ({ signal }) => fetchUserDashboard(userId, { signal }),
    { enabled: isAuthenticated && canAccessJobs },
  );

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

  const handleToggleEmploymentType = useCallback((value) => {
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
    setFilters((previous) => ({ ...previous, isRemote: value }));
  }, []);

  const handleFreshnessSelection = useCallback((value) => {
    setFilters((previous) => ({ ...previous, updatedWithin: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
    setSort('default');
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

  if (!isAuthenticated) {
    return (
      <section className="relative overflow-hidden py-20">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.35),_transparent_65%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl px-6">
          <PageHeader
            eyebrow="Jobs"
            title="Securing the jobs workspace"
            description="You’ll be redirected to the secure login to confirm your credentials before accessing the job marketplace."
          />
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white/80 p-8 text-sm text-slate-600 shadow-sm">
            Preparing secure session…
          </div>
        </div>
      </section>
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
      value: formatNumber(totalJobs),
      description: 'Marketplace roles currently published for Gigvora talent.',
    }),
    metricCard({
      title: 'Remote friendly',
      value: formatPercent(remoteStats.percentage),
      description: `${formatNumber(remoteStats.remoteCount)} listings flagged as remote-first.`,
    }),
    metricCard({
      title: 'Updated this week',
      value: formatNumber(freshnessStats),
      description: 'Roles refreshed in the last 7 days.',
      highlight: employmentTypeHighlight
        ? `${formatNumber(employmentTypeHighlight.count)} ${employmentTypeHighlight.type.toLowerCase()} openings`
        : null,
    }),
  ];

  const boardContent = (
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
              onChange={(event) => setQuery(event.target.value)}
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
              onChange={(event) => setSort(event.target.value)}
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
                <FilterPill
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
                <FilterPill
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
                <FilterPill
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
                  if (badge.key === 'remote:true') {
                    return (
                      <ActiveFilterTag
                        key={badge.key}
                        label={badge.label}
                        onRemove={() => handleRemoteSelection(null)}
                      />
                    );
                  }
                  if (badge.key === 'remote:false') {
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
              <p className="text-xs text-slate-500">Refine the board with work style, employment type, and freshness filters.</p>
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
      {error ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Unable to load the latest roles. {error.message || 'Try refreshing to sync again.'}
        </div>
      ) : null}
      {loading && !items.length ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
              <div className="h-3 w-1/3 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-full rounded bg-slate-200" />
              <div className="mt-1 h-3 w-5/6 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : null}
      {!loading && !items.length ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          {debouncedQuery
            ? 'No jobs matched your filters yet. Try broadening your search.'
            : 'Jobs curated from trusted teams will appear here as we sync the marketplace.'}
        </div>
      ) : null}
      <div className="space-y-6">
        {items.map((job) => {
          const jobTaxonomyLabels = resolveTaxonomyLabels(job);
          return (
            <article
              key={job.id}
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
            >
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-2">
                {job.location ? <span>{job.location}</span> : null}
                {job.employmentType ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                    {job.employmentType}
                  </span>
                ) : null}
                {job.isRemote ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">
                    Remote
                  </span>
                ) : null}
              </div>
              <span className="text-slate-400">Updated {formatRelativeTime(job.updatedAt)}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">{job.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{job.description}</p>
            {jobTaxonomyLabels.length ? (
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-500">
                {jobTaxonomyLabels.slice(0, 3).map((label) => (
                  <span key={label} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold">
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {job.geo?.country ? <span>{job.geo.country}</span> : null}
              </div>
              <button
                type="button"
                onClick={() => handleApply(job)}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Apply now <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
          );
        })}
      </div>
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
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatNumber(applicationSummary.totalApplications)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatNumber(applicationSummary.activeApplications)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interviews</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatNumber(applicationSummary.interviewsScheduled)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offers in play</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatNumber(applicationSummary.offersNegotiating)}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Stage distribution</h3>
        <ul className="mt-4 space-y-3">
          {pipelineStatuses.length ? (
            pipelineStatuses.map((status) => (
              <li key={status.status} className="flex items-center justify-between text-sm text-slate-600">
                <span>{formatStatusLabel(status.status)}</span>
                <span className="font-semibold text-slate-900">{formatNumber(status.count)}</span>
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
        {recentApplications.map((application) => (
          <article key={application.id} className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex flex-col gap-1 text-left">
                <span className="text-sm font-semibold text-slate-900">
                  {application.target?.title || `Application #${application.id}`}
                </span>
                {application.target?.companyName ? <span>{application.target.companyName}</span> : null}
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                {formatStatusLabel(application.status)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              {application.submittedAt ? <span>Submitted {formatRelativeTime(application.submittedAt)}</span> : null}
              {application.updatedAt ? <span>Updated {formatRelativeTime(application.updatedAt)}</span> : null}
              {Number.isFinite(application.daysSinceUpdate) ? (
                <span>{application.daysSinceUpdate} days since last activity</span>
              ) : null}
            </div>
            {application.nextStep ? <p className="mt-3 text-sm text-slate-600">Next step: {application.nextStep}</p> : null}
          </article>
        ))}
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
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatNumber(interviewSummary.upcoming)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatNumber(interviewSummary.completed)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness tasks</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {formatNumber(interviewReadiness.completedItems)} / {formatNumber(interviewReadiness.totalItems)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interviews scheduled</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatNumber(interviews.length)}</p>
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
              <p className="mt-3 text-2xl font-semibold text-slate-900">{formatNumber(stage.metrics?.total)}</p>
              <p className="mt-1 text-xs text-amber-600">
                {formatNumber(stage.metrics?.overdue)} overdue follow-ups
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
              <dd className="text-lg font-semibold text-slate-900">{formatNumber(guardrails.manualReviewRequired)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Premium protected roles</dt>
              <dd className="text-lg font-semibold text-slate-900">{formatNumber(guardrails.premiumProtected)}</dd>
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
                    {formatNumber(tabBadgeMap[tab.id])}
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
    </section>
  );
}
