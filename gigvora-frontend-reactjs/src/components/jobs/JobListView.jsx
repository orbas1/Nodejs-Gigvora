import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { formatRelativeTime } from '../../utils/date.js';
import { formatInteger, formatPercent } from '../../utils/number.js';
import { classNames } from '../../utils/classNames.js';

function formatCurrencyRange(job) {
  const currency = job?.currency ?? job?.compensationCurrency ?? 'USD';
  const minimum = job?.salaryMin ?? job?.compensationMin ?? job?.rateMin ?? null;
  const maximum = job?.salaryMax ?? job?.compensationMax ?? job?.rateMax ?? null;
  if (minimum == null && maximum == null) {
    return null;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 0,
  });

  if (minimum != null && maximum != null) {
    return `${formatter.format(minimum)} – ${formatter.format(maximum)}`;
  }
  return formatter.format(minimum ?? maximum ?? 0);
}

function deriveMatchMetrics(job, resumeInsights) {
  const signals = job?.aiSignals ?? job?.signals ?? {};
  const matchScore = job?.matchScore ?? job?.suitabilityScore ?? signals.total ?? null;
  const metrics = [];

  if (Number.isFinite(Number(matchScore))) {
    metrics.push({
      key: 'match-score',
      label: 'Match score',
      value: formatPercent(matchScore, { maximumFractionDigits: 0 }),
    });
  }

  const breakdown = [
    { key: 'freshness', label: 'Freshness', value: signals.freshness },
    { key: 'queryAffinity', label: 'Query match', value: signals.queryAffinity },
    { key: 'taxonomy', label: 'Tag alignment', value: signals.taxonomy },
    { key: 'remoteFit', label: 'Remote fit', value: signals.remoteFit },
    { key: 'reputation', label: 'Company reputation', value: signals.reputation },
  ].filter((entry) => Number.isFinite(Number(entry.value)));

  if (breakdown.length) {
    breakdown.forEach((entry) => {
      metrics.push({
        key: entry.key,
        label: entry.label,
        value: formatPercent(entry.value, { maximumFractionDigits: 0 }),
      });
    });
  }

  if (resumeInsights?.score != null && Number.isFinite(Number(resumeInsights.score))) {
    metrics.push({
      key: 'resume-ready',
      label: resumeInsights.baselineTitle ?? 'Resume ready',
      value: formatPercent(resumeInsights.score, { maximumFractionDigits: 0 }),
    });
  }

  return metrics;
}

const JobCard = memo(function JobCard({
  job,
  onSelect,
  onApply,
  onToggleSave,
  isSaved,
  resumeInsights,
}) {
  const compensation = formatCurrencyRange(job);
  const metrics = deriveMatchMetrics(job, resumeInsights).slice(0, 4);
  const badges = [
    job?.employmentType ? {
      key: 'employment',
      label: job.employmentType,
      tone: 'slate',
    } : null,
    job?.isRemote ? {
      key: 'remote',
      label: 'Remote',
      tone: 'emerald',
    } : null,
    job?.status ? {
      key: 'status',
      label: job.status,
      tone: 'violet',
    } : null,
  ].filter(Boolean);

  const description = job?.summary ?? job?.description ?? '';
  const truncatedDescription = description.length > 240 ? `${description.slice(0, 237)}…` : description;

  const taxonomy = Array.isArray(job?.taxonomyLabels)
    ? job.taxonomyLabels.filter(Boolean).slice(0, 5)
    : Array.isArray(job?.skills)
    ? job.skills.filter(Boolean).slice(0, 5)
    : [];

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
    >
      <div className="absolute inset-0 -z-[1] bg-gradient-to-br from-accent/0 via-accent/0 to-accent/5 opacity-0 transition group-hover:opacity-100" />
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          {job?.companyName ? (
            <span className="font-semibold text-slate-600">{job.companyName}</span>
          ) : null}
          {job?.location ? <span>{job.location}</span> : null}
          {compensation ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
              {compensation}
            </span>
          ) : null}
          {badges.map((badge) => (
            <span
              key={badge.key}
              className={classNames(
                'inline-flex items-center rounded-full px-2.5 py-1 font-semibold',
                badge.tone === 'emerald'
                  ? 'bg-emerald-100 text-emerald-700'
                  : badge.tone === 'violet'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {badge.label}
            </span>
          ))}
        </div>
        {job?.updatedAt ? (
          <span className="text-slate-400">Updated {formatRelativeTime(job.updatedAt)}</span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-slate-900">
          <button
            type="button"
            onClick={() => onSelect(job)}
            className="text-left transition hover:text-accent focus:outline-none focus-visible:text-accent"
          >
            {job?.title ?? 'Untitled role'}
          </button>
        </h2>
        {truncatedDescription ? <p className="text-sm text-slate-600">{truncatedDescription}</p> : null}
      </div>
      {taxonomy.length ? (
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-500">
          {taxonomy.map((label) => (
            <span key={label} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold">
              {label}
            </span>
          ))}
        </div>
      ) : null}
      {metrics.length ? (
        <dl className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600 sm:grid-cols-2">
          {metrics.map((entry) => (
            <div key={entry.key} className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">{entry.label}</dt>
              <dd className="font-semibold text-slate-900">{entry.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          {job?.geo?.country ? <span>{job.geo.country}</span> : null}
          {job?.jobLevel ? <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{job.jobLevel}</span> : null}
          {Number.isFinite(Number(job?.applicantCount)) ? (
            <span>{formatInteger(job.applicantCount)} applicants</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSave(job)}
            className={classNames(
              'inline-flex items-center gap-1 rounded-full border px-4 py-2 text-xs font-semibold transition',
              isSaved
                ? 'border-accent bg-accent/10 text-accent hover:bg-accent/20'
                : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent',
            )}
            aria-pressed={isSaved}
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => onSelect(job)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Quick view <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            onClick={() => onApply(job)}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            Apply now <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
});

const INITIAL_BATCH = 8;
const BATCH_INCREMENT = 6;

export default function JobListView({
  jobs,
  loading,
  error,
  query,
  onSelectJob,
  onApply,
  savedJobIds,
  onToggleSave,
  resumeInsights,
  emptyMessage = 'Jobs curated from trusted teams will appear here as we sync the marketplace.',
  loadingMessage = 'Loading personalised opportunities…',
}) {
  const listRef = useRef(null);
  const sentinelRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);

  const savedSet = useMemo(() => new Set(savedJobIds ?? []), [savedJobIds]);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [jobs]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((count) => {
              if (!jobs || count >= jobs.length) {
                return count;
              }
              return Math.min(jobs.length, count + BATCH_INCREMENT);
            });
          }
        });
      },
      { root: listRef.current, rootMargin: '200px', threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    if (!Array.isArray(jobs)) {
      return [];
    }
    return jobs.slice(0, visibleCount);
  }, [jobs, visibleCount]);

  return (
    <section className="space-y-6" aria-live="polite">
      {error ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Unable to load the latest roles. {error.message || 'Try refreshing to sync again.'}
        </div>
      ) : null}
      {loading && !visibleJobs.length ? (
        <div className="space-y-4" aria-label={loadingMessage}>
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
      {!loading && (!visibleJobs.length || !jobs?.length) ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          {query ? 'No jobs matched your filters yet. Try broadening your search.' : emptyMessage}
        </div>
      ) : null}
      <div ref={listRef} className="space-y-6">
        {visibleJobs.map((job, index) => {
          const jobKey = job?.id ?? job?.slug ?? job?.title ?? `job-${index}`;
          return (
            <JobCard
              key={jobKey}
              job={job}
              onSelect={onSelectJob}
              onApply={onApply}
              onToggleSave={onToggleSave}
              isSaved={jobKey ? savedSet.has(jobKey) : false}
              resumeInsights={resumeInsights}
            />
          );
        })}
        {visibleJobs.length && jobs && visibleJobs.length < jobs.length ? (
          <div ref={sentinelRef} className="flex items-center justify-center py-4 text-xs text-slate-400">
            Loading more roles…
          </div>
        ) : (
          <div ref={sentinelRef} aria-hidden="true" />
        )}
      </div>
    </section>
  );
}
