import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  BriefcaseIcon,
  ClockIcon,
  FireIcon,
  MapPinIcon,
  TrophyIcon,
} from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import OpportunityFilterPill from '../opportunity/OpportunityFilterPill.jsx';
import { classNames } from '../../utils/classNames.js';

const WORK_MODE_OPTIONS = [
  { value: 'remote', label: 'Remote first' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
];

const COMMITMENT_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'gig', label: 'Gig & short-term' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'junior', label: 'Entry level' },
  { value: 'mid', label: 'Mid level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Leadership' },
];

const DEFAULT_FILTERS = Object.freeze({
  searchTerm: '',
  workModes: [],
  commitments: [],
  experienceLevels: [],
  remoteOnly: false,
  sortBy: 'recommended',
});

function buildFilters(filters) {
  if (!filters) return { ...DEFAULT_FILTERS };
  return {
    ...DEFAULT_FILTERS,
    ...filters,
    workModes: Array.isArray(filters.workModes) ? filters.workModes : [],
    commitments: Array.isArray(filters.commitments) ? filters.commitments : [],
    experienceLevels: Array.isArray(filters.experienceLevels) ? filters.experienceLevels : [],
    remoteOnly: Boolean(filters.remoteOnly),
    sortBy: filters.sortBy || 'recommended',
  };
}

function getSalaryLabel(job) {
  const { salary } = job || {};
  if (!salary || (salary.min == null && salary.max == null)) {
    return job?.compensationNote || 'Compensation confidential';
  }
  const currency = salary.currency ?? 'USD';
  const period = salary.period ?? 'year';
  const minPart = salary.min != null ? salary.min.toLocaleString() : null;
  const maxPart = salary.max != null ? salary.max.toLocaleString() : null;
  if (minPart && maxPart) {
    return `${currency} ${minPart} - ${maxPart} / ${period}`;
  }
  if (maxPart) {
    return `Up to ${currency} ${maxPart} / ${period}`;
  }
  return `Starting at ${currency} ${minPart} / ${period}`;
}

function formatPostedAt(postedAt) {
  if (!postedAt) return 'New';
  try {
    return `${formatDistanceToNow(new Date(postedAt), { addSuffix: true })}`;
  } catch (error) {
    return 'Recently posted';
  }
}

function highlightMatchScore(score) {
  if (score == null) return 'opacity-0';
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

function resolveMetrics(jobs, override) {
  const base = {
    total: jobs.length,
    remote: jobs.filter((job) => job.workMode === 'remote' || job.remoteFriendly).length,
    saved: jobs.filter((job) => job.saved).length,
    interviewing: jobs.filter((job) => (job.pipeline?.interviewing ?? 0) > 0).length,
  };
  return { ...base, ...override };
}

export default function JobListView({
  jobs,
  selectedJobId,
  onSelectJob,
  filters,
  onFiltersChange,
  metrics,
  loading,
  error,
  onRefresh,
  emptyState,
  onToggleSave,
  onShare,
}) {
  const [internalFilters, setInternalFilters] = useState(() => buildFilters(filters));

  useEffect(() => {
    if (filters) {
      setInternalFilters(buildFilters(filters));
    }
  }, [filters]);

  const resolvedFilters = filters ? buildFilters(filters) : internalFilters;

  const updateFilters = (partial) => {
    setInternalFilters((previous) => {
      const next = buildFilters({ ...previous, ...partial });
      onFiltersChange?.(next);
      return next;
    });
  };

  const resolvedMetrics = useMemo(() => resolveMetrics(jobs, metrics), [jobs, metrics]);

  const derivedJobs = useMemo(() => {
    const searchTerm = resolvedFilters.searchTerm.trim().toLowerCase();
    const matchesSearch = (job) => {
      if (!searchTerm) return true;
      const haystack = [job.title, job.company?.name ?? job.company, job.location, job.summary]
        .concat(job.tags ?? [])
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchTerm);
    };

    const matchesFilter = (job) => {
      if (resolvedFilters.remoteOnly && !(job.remoteFriendly || job.workMode === 'remote')) {
        return false;
      }
      if (resolvedFilters.workModes.length && !resolvedFilters.workModes.includes(job.workMode)) {
        return false;
      }
      if (resolvedFilters.commitments.length && !resolvedFilters.commitments.includes(job.commitment)) {
        return false;
      }
      if (
        resolvedFilters.experienceLevels.length &&
        !resolvedFilters.experienceLevels.includes(job.experienceLevel)
      ) {
        return false;
      }
      return true;
    };

    const scoredJobs = jobs
      .filter((job) => matchesSearch(job) && matchesFilter(job))
      .map((job) => ({
        ...job,
        normalizedScore:
          job.matchScore != null
            ? job.matchScore
            : job.pipeline?.priorityScore ?? (job.remoteFriendly ? 55 : 35),
      }));

    const sortedJobs = [...scoredJobs].sort((a, b) => {
      switch (resolvedFilters.sortBy) {
        case 'newest': {
          const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
          const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
          return dateB - dateA;
        }
        case 'compensation': {
          const maxA = a.salary?.max ?? a.salary?.min ?? 0;
          const maxB = b.salary?.max ?? b.salary?.min ?? 0;
          return maxB - maxA;
        }
        case 'engagement': {
          const engageA = a.metrics?.views ?? 0 + (a.metrics?.saves ?? 0) * 2;
          const engageB = b.metrics?.views ?? 0 + (b.metrics?.saves ?? 0) * 2;
          return engageB - engageA;
        }
        default:
          return (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0);
      }
    });

    return sortedJobs;
  }, [jobs, resolvedFilters]);

  const renderJobBadges = (job) => {
    const badges = [];
    if (job.pipeline?.stage === 'interviewing') {
      badges.push({ label: 'Interviewing now', tone: 'accent' });
    }
    if (job.urgent) {
      badges.push({ label: 'Urgent hire', tone: 'accent' });
    }
    if (job.matchScore != null) {
      badges.push({ label: `${job.matchScore}% match`, tone: 'muted' });
    }
    if (job.remoteFriendly) {
      badges.push({ label: 'Remote friendly', tone: 'muted' });
    }
    (job.badges ?? []).forEach((badge) => badges.push({ label: badge, tone: 'muted' }));

    if (!badges.length) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={`${badge.label}-${badge.tone}`}
            className={classNames(
              'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
              badge.tone === 'accent'
                ? 'border-transparent bg-accent text-white shadow-soft'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            )}
          >
            {badge.label}
          </span>
        ))}
      </div>
    );
  };

  const renderJobTags = (job) => {
    if (!(job.tags && job.tags.length)) return null;
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {job.tags.slice(0, 6).map((tag) => (
          <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            #{tag}
          </span>
        ))}
      </div>
    );
  };

  const renderJobActions = (job) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleSave?.(job);
        }}
        className={classNames(
          'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          job.saved
            ? 'border-accent bg-accent text-white shadow-soft hover:border-accentDark hover:bg-accentDark'
            : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent'
        )}
      >
        <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
        {job.saved ? 'Saved' : 'Save'}
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onShare?.(job);
        }}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
        Share
      </button>
    </div>
  );

  const renderJobItem = (job) => {
    const isSelected = String(job.id) === String(selectedJobId ?? '');
    const salaryLabel = getSalaryLabel(job);
    const postedLabel = formatPostedAt(job.postedAt);
    const matchScore = job.matchScore ?? job.normalizedScore;

    return (
      <li key={job.id} className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:border-accent/40 hover:shadow-lg focus-within:border-accent/60">
        <button
          type="button"
          className="flex w-full flex-col items-start gap-4 text-left"
          onClick={() => onSelectJob?.(job)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectJob?.(job);
            }
          }}
        >
          <div className="flex w-full items-start justify-between gap-4">
            <div className="flex flex-1 items-start gap-3">
              {job.company?.logo ? (
                <img
                  src={job.company.logo}
                  alt={job.company?.name ? `${job.company.name} logo` : 'Company logo'}
                  className="h-12 w-12 flex-none rounded-2xl border border-slate-200 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm font-semibold uppercase text-slate-400">
                  {job.company?.name?.slice(0, 2) ?? 'JB'}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                  {job.company?.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                      <SparklesIcon className="h-3 w-3" aria-hidden="true" />
                      Verified
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <BriefcaseIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {job.company?.name || job.company || 'Confidential company'}
                  </span>
                  {job.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      {job.location}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {postedLabel}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{job.summary || 'This role drives a flagship initiative with executive sponsorship and premium mentorship support.'}</p>
                {renderJobTags(job)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <span className="block text-sm font-medium text-slate-500">Salary guide</span>
                <span className="text-base font-semibold text-slate-900">{salaryLabel}</span>
              </div>
              {matchScore != null ? (
                <div className="flex w-40 flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Match score</span>
                    <span>{Math.round(matchScore)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className={classNames('h-2 rounded-full transition-all', highlightMatchScore(matchScore))}
                      style={{ width: `${Math.min(Math.max(matchScore, 0), 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
              {renderJobActions(job)}
            </div>
          </div>
          {renderJobBadges(job)}
          {job.pipeline ? (
            <dl className="grid w-full grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:grid-cols-4">
              <div>
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Pipeline</dt>
                <dd className="mt-1 text-sm text-slate-700">{job.pipeline.stageLabel ?? job.pipeline.stage ?? 'Open for applicants'}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Applicants</dt>
                <dd className="mt-1 text-sm text-slate-700">{job.pipeline.applicants ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Interviews</dt>
                <dd className="mt-1 text-sm text-slate-700">{job.pipeline.interviewing ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Offers</dt>
                <dd className="mt-1 text-sm text-slate-700">{job.pipeline.offers ?? '—'}</dd>
              </div>
            </dl>
          ) : null}
        </button>
        {isSelected ? (
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <FireIcon className="h-4 w-4" aria-hidden="true" />
            Currently viewing
          </span>
        ) : null}
      </li>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <ul className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white/60 p-5">
              <div className="flex flex-col gap-3">
                <div className="h-6 w-1/3 rounded-full bg-slate-200" />
                <div className="h-4 w-2/3 rounded-full bg-slate-200" />
                <div className="h-4 w-full rounded-full bg-slate-100" />
                <div className="flex gap-3">
                  <div className="h-3 w-20 rounded-full bg-slate-100" />
                  <div className="h-3 w-16 rounded-full bg-slate-100" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      );
    }

    if (error) {
      return (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-600">
          <p className="font-semibold">We could not load new roles right now.</p>
          <p className="mt-2 text-rose-500">{typeof error === 'string' ? error : 'Please try again in a moment.'}</p>
          {onRefresh ? (
            <button
              type="button"
              onClick={() => onRefresh()}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          ) : null}
        </div>
      );
    }

    const state = emptyState ?? {
      title: 'No matches just yet',
      description:
        'Broaden filters or explore new skill tracks to unlock hidden opportunities curated by the Gigvora talent team.',
      actionLabel: 'Reset filters',
    };

    return (
      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
        <TrophyIcon className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{state.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{state.description}</p>
        {state.onAction ? (
          <button
            type="button"
            onClick={() => {
              state.onAction?.();
              updateFilters(DEFAULT_FILTERS);
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <FunnelIcon className="h-4 w-4" aria-hidden="true" />
            {state.actionLabel}
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <section aria-label="Job opportunities" className="rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-900/5">
      <header className="flex flex-col gap-6 border-b border-slate-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Opportunities curated for you</p>
          <h2 className="text-2xl font-semibold text-slate-900">Marketplace pipeline</h2>
          <p className="text-sm text-slate-600">
            Track roles sourced from companies, agencies, and community partners. Dial in filters to surface the perfect match
            and move from discovery to interview in minutes.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-3xl bg-slate-100 px-4 py-2">
            <FireIcon className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="font-semibold text-slate-900">{resolvedMetrics.total}</span>
            <span className="text-slate-600">active roles</span>
          </div>
          <div className="flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-2">
            <SparklesIcon className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="font-semibold text-slate-900">{resolvedMetrics.remote}</span>
            <span className="text-slate-600">remote first</span>
          </div>
          <div className="flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-2">
            <BookmarkIcon className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="font-semibold text-slate-900">{resolvedMetrics.saved}</span>
            <span className="text-slate-600">saved</span>
          </div>
          <div className="flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-2">
            <BriefcaseIcon className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="font-semibold text-slate-900">{resolvedMetrics.interviewing}</span>
            <span className="text-slate-600">interviewing</span>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <label htmlFor="job-search" className="sr-only">
              Search job titles, companies, or keywords
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" aria-hidden="true" />
              <input
                id="job-search"
                type="search"
                value={resolvedFilters.searchTerm}
                onChange={(event) => updateFilters({ searchTerm: event.target.value })}
                placeholder="Search job titles, skills, or companies"
                className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OpportunityFilterPill
                label="Remote only"
                active={resolvedFilters.remoteOnly}
                onClick={() => updateFilters({ remoteOnly: !resolvedFilters.remoteOnly })}
                tone="accent"
              />
              {WORK_MODE_OPTIONS.map((option) => (
                <OpportunityFilterPill
                  key={option.value}
                  label={option.label}
                  active={resolvedFilters.workModes.includes(option.value)}
                  onClick={() => {
                    const next = resolvedFilters.workModes.includes(option.value)
                      ? resolvedFilters.workModes.filter((value) => value !== option.value)
                      : [...resolvedFilters.workModes, option.value];
                    updateFilters({ workModes: next });
                  }}
                />
              ))}
              {COMMITMENT_OPTIONS.map((option) => (
                <OpportunityFilterPill
                  key={option.value}
                  label={option.label}
                  active={resolvedFilters.commitments.includes(option.value)}
                  onClick={() => {
                    const next = resolvedFilters.commitments.includes(option.value)
                      ? resolvedFilters.commitments.filter((value) => value !== option.value)
                      : [...resolvedFilters.commitments, option.value];
                    updateFilters({ commitments: next });
                  }}
                />
              ))}
              {EXPERIENCE_OPTIONS.map((option) => (
                <OpportunityFilterPill
                  key={option.value}
                  label={option.label}
                  active={resolvedFilters.experienceLevels.includes(option.value)}
                  onClick={() => {
                    const next = resolvedFilters.experienceLevels.includes(option.value)
                      ? resolvedFilters.experienceLevels.filter((value) => value !== option.value)
                      : [...resolvedFilters.experienceLevels, option.value];
                    updateFilters({ experienceLevels: next });
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>{derivedJobs.length} roles match the criteria</span>
              <div className="flex items-center gap-2">
                <label htmlFor="job-sort" className="text-slate-500">
                  Sort by
                </label>
                <select
                  id="job-sort"
                  value={resolvedFilters.sortBy}
                  onChange={(event) => updateFilters({ sortBy: event.target.value })}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <option value="recommended">Recommended</option>
                  <option value="newest">Newest</option>
                  <option value="compensation">Compensation</option>
                  <option value="engagement">Community buzz</option>
                </select>
              </div>
            </div>
          </div>

          {derivedJobs.length ? (
            <ul className="space-y-4" role="list">
              {derivedJobs.map((job) => renderJobItem(job))}
            </ul>
          ) : (
            renderEmpty()
          )}
        </div>

        <aside className="flex w-full max-w-xs flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-b from-white/90 via-white/60 to-slate-50 p-5 shadow-inner lg:sticky lg:top-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pipeline momentum</h3>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shortlist focus</p>
              <p className="mt-2 text-sm text-slate-600">
                Spotlight the top roles aligned with your profile and monitor where recruiters are engaging most right now.
              </p>
              <ul className="mt-3 space-y-2 text-xs">
                <li className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Interviews scheduled</span>
                  <span className="font-semibold text-slate-900">{resolvedMetrics.interviewing}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Saved opportunities</span>
                  <span className="font-semibold text-slate-900">{resolvedMetrics.saved}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Remote prospects</span>
                  <span className="font-semibold text-slate-900">{resolvedMetrics.remote}</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tips</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                <li>Pair saved roles with tailored outreach using Gigvora connection nudges.</li>
                <li>Enable one-click resume routing to auto-fill profiles across agency partners.</li>
                <li>Track recruiter response SLAs directly in the job detail timeline.</li>
              </ul>
            </div>
            {onRefresh ? (
              <button
                type="button"
                onClick={() => onRefresh()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-accentDark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowPathIcon className={classNames('h-5 w-5', loading ? 'animate-spin' : null)} aria-hidden="true" />
                Refresh recommendations
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

const JobShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  summary: PropTypes.string,
  company: PropTypes.shape({
    name: PropTypes.string,
    logo: PropTypes.string,
    verified: PropTypes.bool,
  }),
  location: PropTypes.string,
  workMode: PropTypes.oneOf(['remote', 'hybrid', 'onsite']),
  remoteFriendly: PropTypes.bool,
  commitment: PropTypes.string,
  experienceLevel: PropTypes.string,
  salary: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
    currency: PropTypes.string,
    period: PropTypes.string,
  }),
  compensationNote: PropTypes.string,
  postedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  badges: PropTypes.arrayOf(PropTypes.string),
  tags: PropTypes.arrayOf(PropTypes.string),
  matchScore: PropTypes.number,
  metrics: PropTypes.shape({
    views: PropTypes.number,
    saves: PropTypes.number,
  }),
  pipeline: PropTypes.shape({
    stage: PropTypes.string,
    stageLabel: PropTypes.string,
    applicants: PropTypes.number,
    interviewing: PropTypes.number,
    offers: PropTypes.number,
    priorityScore: PropTypes.number,
  }),
  saved: PropTypes.bool,
  urgent: PropTypes.bool,
});

JobListView.propTypes = {
  jobs: PropTypes.arrayOf(JobShape),
  selectedJobId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectJob: PropTypes.func,
  filters: PropTypes.shape({
    searchTerm: PropTypes.string,
    workModes: PropTypes.arrayOf(PropTypes.string),
    commitments: PropTypes.arrayOf(PropTypes.string),
    experienceLevels: PropTypes.arrayOf(PropTypes.string),
    remoteOnly: PropTypes.bool,
    sortBy: PropTypes.oneOf(['recommended', 'newest', 'compensation', 'engagement']),
  }),
  onFiltersChange: PropTypes.func,
  metrics: PropTypes.shape({
    total: PropTypes.number,
    remote: PropTypes.number,
    saved: PropTypes.number,
    interviewing: PropTypes.number,
  }),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  onRefresh: PropTypes.func,
  emptyState: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    actionLabel: PropTypes.string,
    onAction: PropTypes.func,
  }),
  onToggleSave: PropTypes.func,
  onShare: PropTypes.func,
};

JobListView.defaultProps = {
  jobs: [],
  selectedJobId: null,
  onSelectJob: undefined,
  filters: undefined,
  onFiltersChange: undefined,
  metrics: undefined,
  loading: false,
  error: false,
  onRefresh: undefined,
  emptyState: undefined,
  onToggleSave: undefined,
  onShare: undefined,
};
