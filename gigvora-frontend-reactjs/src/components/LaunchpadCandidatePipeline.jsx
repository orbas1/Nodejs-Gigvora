import { useCallback, useEffect, useMemo, useState } from 'react';
import DataStatus from './DataStatus.jsx';
import useDebounce from '../hooks/useDebounce.js';
import { fetchLaunchpadApplications } from '../services/launchpad.js';
import { formatRelativeTime } from '../utils/date.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'completed', label: 'Completed' },
];

const SORT_OPTIONS = [
  { value: 'score_desc', label: 'Highest readiness' },
  { value: 'score_asc', label: 'Emerging talent' },
  { value: 'recent', label: 'Recently updated' },
];

function ScoreBadge({ score }) {
  if (score == null || Number.isNaN(score)) {
    return <span className="font-semibold text-slate-900">N/A</span>;
  }
  return <span className="font-semibold text-slate-900">{Math.round(score)}</span>;
}

function Chip({ children, tone = 'slate' }) {
  const toneClasses =
    tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses}`}>
      {children}
    </span>
  );
}

function PlacementSummary({ placements }) {
  if (!placements?.length) {
    return <p className="text-xs text-slate-500">Not yet placed.</p>;
  }

  return (
    <ul className="space-y-2 text-xs text-slate-500">
      {placements.slice(0, 3).map((placement) => (
        <li key={placement.id} className="rounded-lg border border-slate-200/70 bg-white/80 p-2">
          <div className="flex items-center justify-between gap-2 text-slate-600">
            <span className="capitalize">{placement.status}</span>
            {placement.placementDate ? (
              <span>Placed {formatRelativeTime(placement.placementDate)}</span>
            ) : null}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
            {placement.targetType ? `${placement.targetType} • ${placement.targetId ?? 'TBC'}` : 'Unassigned brief'}
          </div>
        </li>
      ))}
    </ul>
  );
}

function MatchHighlight({ highlight }) {
  if (!highlight) {
    return <p className="text-xs text-slate-500">No live opportunity match yet.</p>;
  }

  const percentage = Math.round((highlight.score ?? 0) * 100);
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs ${
        highlight.autoAssigned
          ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
          : 'border-slate-200 bg-slate-50/80 text-slate-600'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-900">
          {highlight.opportunity?.title ?? 'Experience opportunity'}
        </span>
        <Chip tone={highlight.autoAssigned ? 'emerald' : 'slate'}>
          {highlight.autoAssigned ? 'Auto-assign ready' : 'Recommended'}
        </Chip>
      </div>
      <div className="mt-1 text-slate-600">
        Match score <span className="font-semibold text-slate-900">{`${percentage}%`}</span>
      </div>
      {highlight.matchedSkills?.length ? (
        <div className="mt-1 text-slate-600">Skills: {highlight.matchedSkills.join(', ')}</div>
      ) : null}
      {highlight.learningMatches?.length ? (
        <div className="mt-1 text-slate-600">Learning goals: {highlight.learningMatches.join(', ')}</div>
      ) : null}
      {highlight.opportunity?.summary ? (
        <div className="mt-1 text-slate-500">{highlight.opportunity.summary}</div>
      ) : null}
    </div>
  );
}

function CandidateCard({ application }) {
  const readiness = application.readiness ?? {};
  const applicant = application.applicant ?? {};
  const fullName = [applicant.firstName, applicant.lastName].filter(Boolean).join(' ').trim();
  const readinessScore = readiness.score == null ? null : Number(readiness.score);
  const missingSkillCount = readiness.missingSkills?.length ?? 0;
  const learningAlignedMissing = readiness.learningAlignedMissing?.length ?? 0;
  const appliedAt = application.createdAt ? formatRelativeTime(application.createdAt) : 'Recently submitted';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:border-accent/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{fullName || `Application #${application.id}`}</h4>
          <p className="text-xs text-slate-500">
            {applicant.email || 'Applicant email shared once interview is confirmed'}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">Applied {appliedAt}</p>
        </div>
        <Chip>{application.status}</Chip>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600">
          <div className="flex items-center justify-between text-slate-500">
            <span>Readiness score</span>
            <ScoreBadge score={readinessScore} />
          </div>
          <div>
            <span className="font-semibold text-slate-900">{readiness.recommendedStatus ?? 'Screening'}</span>
            <span className="ml-1 text-slate-500">recommended track</span>
          </div>
          <div>
            {readiness.meetsExperience ? (
              <span className="text-emerald-600">Experience threshold met</span>
            ) : (
              <span className="text-amber-600">Below experience threshold</span>
            )}
          </div>
          {missingSkillCount ? (
            <div>
              {missingSkillCount} skill gap{missingSkillCount === 1 ? '' : 's'} · {learningAlignedMissing} aligned to goals
            </div>
          ) : (
            <div>All required skills covered</div>
          )}
        </div>
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600">
          <div className="font-semibold text-slate-900">Focus areas</div>
          <div className="flex flex-wrap gap-2">
            {(readiness.skills ?? []).slice(0, 6).map((skill) => (
              <Chip key={skill}>{skill}</Chip>
            ))}
          </div>
          <div className="pt-2 font-semibold text-slate-900">Growth goals</div>
          <div className="flex flex-wrap gap-2">
            {(readiness.targetSkills ?? []).slice(0, 6).map((skill) => (
              <Chip key={skill} tone="emerald">
                {skill}
              </Chip>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <MatchHighlight highlight={application.matchHighlight} />
          <PlacementSummary placements={application.placements} />
        </div>
      </div>
    </article>
  );
}

function PaginationControls({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { page, totalPages, total } = pagination;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
      <div>
        Showing page {page} of {totalPages} · {total} applications
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="rounded-full border border-slate-300 px-3 py-1 font-semibold transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="rounded-full border border-slate-300 px-3 py-1 font-semibold transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function LaunchpadCandidatePipeline({ launchpadId }) {
  const [filters, setFilters] = useState({
    status: 'all',
    minScore: '',
    maxScore: '',
    sort: 'score_desc',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const debouncedSearch = useDebounce(filters.search.trim(), 400);

  const handleFilterChange = useCallback((event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const loadApplications = useCallback(
    async (nextPage) => {
      if (!launchpadId) {
        setData(null);
        return;
      }
      const targetPage = Number.isFinite(Number(nextPage)) ? Number(nextPage) : 1;
      setLoading(true);
      setError(null);
      try {
        const payload = {
          launchpadId,
          page: targetPage,
          pageSize: 10,
          sort: filters.sort,
          includeMatches: true,
        };
        if (filters.status !== 'all') {
          payload.status = filters.status;
        }
        if (debouncedSearch) {
          payload.search = debouncedSearch;
        }
        if (filters.minScore !== '') {
          payload.minScore = Number(filters.minScore);
        }
        if (filters.maxScore !== '') {
          payload.maxScore = Number(filters.maxScore);
        }

        const response = await fetchLaunchpadApplications(payload);
        setData(response);
        setPage(targetPage);
        setLastUpdated(new Date());
      } catch (loadError) {
        setError(loadError);
      } finally {
        setLoading(false);
      }
    },
    [launchpadId, filters.sort, filters.status, filters.minScore, filters.maxScore, debouncedSearch],
  );

  useEffect(() => {
    if (!launchpadId) {
      setData(null);
      setPage(1);
      return;
    }
    loadApplications(1);
  }, [launchpadId, loadApplications]);

  const currentPage = data?.pagination?.page ?? 1;

  const handleRefresh = useCallback(() => {
    loadApplications(currentPage);
  }, [currentPage, loadApplications]);

  const statusBreakdown = useMemo(() => data?.statusBreakdown ?? {}, [data]);
  const items = useMemo(() => (Array.isArray(data?.items) ? data.items : []), [data]);

  const breakdownEntries = useMemo(() => Object.entries(statusBreakdown), [statusBreakdown]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Cohort pipeline intelligence</h3>
          <p className="mt-1 text-sm text-slate-600">
            Filter and prioritise candidates by readiness, interest areas, and placement progress.
          </p>
        </div>
        <DataStatus loading={loading} fromCache={false} lastUpdated={lastUpdated} onRefresh={handleRefresh} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="mt-2 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Min readiness
          <input
            name="minScore"
            value={filters.minScore}
            onChange={handleFilterChange}
            type="number"
            min="0"
            max="100"
            placeholder="60"
            className="mt-2 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Max readiness
          <input
            name="maxScore"
            value={filters.maxScore}
            onChange={handleFilterChange}
            type="number"
            min="0"
            max="100"
            placeholder="95"
            className="mt-2 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sort by
          <select
            name="sort"
            value={filters.sort}
            onChange={handleFilterChange}
            className="mt-2 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4">
        <label className="sr-only" htmlFor="launchpad-candidate-search">
          Search applicants
        </label>
        <input
          id="launchpad-candidate-search"
          type="search"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by applicant name or email"
          className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
        {breakdownEntries.map(([status, count]) => (
          <span key={status} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            <span className="font-semibold text-slate-900">{count}</span> {status}
          </span>
        ))}
      </div>
      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error.message || 'Unable to load the latest applications right now.'}
        </div>
      ) : null}
      {loading && !items.length ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="h-3 w-1/3 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-1/4 rounded bg-slate-200" />
              <div className="mt-4 h-32 rounded-xl bg-slate-200" />
            </div>
          ))}
        </div>
      ) : null}
      {!loading && !items.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500">
          No candidates match the current filters. Adjust the readiness range or try another status.
        </div>
      ) : null}
      <div className="mt-6 space-y-4">
        {items.map((application) => (
          <CandidateCard key={application.id} application={application} />
        ))}
      </div>
      <div className="mt-8 border-t border-slate-200 pt-4">
        <PaginationControls pagination={data?.pagination ?? null} onPageChange={loadApplications} />
      </div>
    </section>
  );
}
