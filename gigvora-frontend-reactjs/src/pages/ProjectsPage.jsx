import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import useCachedResource from '../hooks/useCachedResource.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';
import UserAvatar from '../components/UserAvatar.jsx';
import { useProjectManagementAccess } from '../hooks/useAuthorization.js';
import MarketplaceSearchInput from '../components/marketplace/MarketplaceSearchInput.jsx';
import { fetchProjectAutoAssignMetrics } from '../services/autoAssign.js';
import { formatAutoAssignStatus } from '../utils/autoAssignStatus.js';

const METRICS_CACHE_KEY = 'project:auto-match:metrics';

export default function ProjectsPage() {
  const [query, setQuery] = useState('');
  const { data, error, loading, fromCache, lastUpdated, refresh, debouncedQuery } = useOpportunityListing('projects', query, {
    pageSize: 25,
  });
  const { canManageProjects, denialReason } = useProjectManagementAccess();

  const {
    data: metricsData,
    error: metricsError,
    loading: metricsLoading,
    lastUpdated: metricsUpdatedAt,
    refresh: refreshMetrics,
  } = useCachedResource(
    METRICS_CACHE_KEY,
    ({ signal }) => fetchProjectAutoAssignMetrics({ signal }),
    { ttl: 1000 * 60, enabled: canManageProjects },
  );

  const listing = data ?? {};
  const items = useMemo(() => (Array.isArray(listing.items) ? listing.items : []), [listing.items]);

  const derivedStats = useMemo(() => {
    if (!items.length) {
      return {
        total: 0,
        autoAssignEnabled: 0,
        totalQueueEntries: 0,
        averageQueueSize: 0,
        newcomerGuarantees: 0,
        latestQueueGeneratedAt: null,
      };
    }

    const autoAssignProjects = items.filter((project) => project?.autoAssignEnabled);
    const totalQueueEntries = autoAssignProjects.reduce(
      (sum, project) => sum + Number(project?.autoAssignLastQueueSize ?? 0),
      0,
    );
    const fairnessGuarantees = autoAssignProjects.filter(
      (project) => project?.autoAssignSettings?.fairness?.ensureNewcomer !== false,
    ).length;
    const latestQueueGeneratedAt = autoAssignProjects
      .map((project) => (project?.autoAssignLastRunAt ? new Date(project.autoAssignLastRunAt).getTime() : null))
      .filter((timestamp) => Number.isFinite(timestamp))
      .sort((a, b) => b - a)[0];

    return {
      total: items.length,
      autoAssignEnabled: autoAssignProjects.length,
      totalQueueEntries,
      averageQueueSize: autoAssignProjects.length
        ? Math.round(totalQueueEntries / autoAssignProjects.length)
        : 0,
      newcomerGuarantees: fairnessGuarantees,
      latestQueueGeneratedAt: Number.isFinite(latestQueueGeneratedAt)
        ? new Date(latestQueueGeneratedAt)
        : null,
    };
  }, [items]);

  const aggregatedStats = useMemo(() => {
    const totals = metricsData?.totals ?? null;
    const velocity = metricsData?.velocity ?? null;
    const latest = totals?.latestQueueGeneratedAt ? new Date(totals.latestQueueGeneratedAt) : null;

    return {
      total: totals?.totalProjects ?? derivedStats.total,
      autoAssignEnabled: totals?.autoAssignEnabled ?? derivedStats.autoAssignEnabled,
      totalQueueEntries: totals?.totalQueueEntries ?? derivedStats.totalQueueEntries,
      averageQueueSize: totals?.averageQueueSize ?? derivedStats.averageQueueSize,
      newcomerGuarantees: totals?.newcomerGuarantees ?? derivedStats.newcomerGuarantees,
      latestQueueGeneratedAt: latest ?? derivedStats.latestQueueGeneratedAt,
      medianResponseMinutes: velocity?.medianResponseMinutes ?? null,
      completionRate: velocity?.completionRate ?? null,
      sampleSize: velocity?.sampleSize ?? null,
    };
  }, [metricsData, derivedStats]);

  const velocityLabels = useMemo(() => {
    const sampleSize = Number(aggregatedStats.sampleSize ?? 0);
    const sampleText = sampleSize > 0 ? `n=${sampleSize}` : null;
    const medianLabel =
      sampleSize > 0 && aggregatedStats.medianResponseMinutes != null
        ? `${aggregatedStats.medianResponseMinutes} (${sampleText})`
        : sampleSize === 0
        ? 'Awaiting responses'
        : `Insufficient data (${sampleText})`;
    const completionLabel =
      sampleSize > 0 && aggregatedStats.completionRate != null
        ? `${aggregatedStats.completionRate}% (${sampleText})`
        : sampleSize === 0
        ? 'Awaiting responses'
        : `Insufficient data (${sampleText})`;

    return { medianLabel, completionLabel };
  }, [aggregatedStats.medianResponseMinutes, aggregatedStats.completionRate, aggregatedStats.sampleSize]);

  const handleJoin = (project) => {
    analytics.track(
      'web_project_join_cta',
      { id: project.id, title: project.title, query: debouncedQuery || null },
      { source: 'web_app' },
    );
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Projects"
          title="Co-create on mission-driven initiatives"
          description="Join collaborative squads building products, content, and community programs across the Gigvora ecosystem."
          meta={
            <DataStatus
              loading={loading || (metricsLoading && canManageProjects)}
              fromCache={fromCache}
              lastUpdated={metricsUpdatedAt ?? lastUpdated}
              onRefresh={() => {
                refresh({ force: true });
                if (canManageProjects) {
                  refreshMetrics({ force: true });
                }
              }}
            />
          }
        />
        <div className="mb-8 grid gap-6 rounded-4xl border border-accent/20 bg-gradient-to-r from-accent/10 via-white to-emerald-50 p-6 shadow-soft lg:grid-cols-[1.25fr,1fr]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Launch a new project</h2>
            <p className="mt-2 text-sm text-slate-600">
              Capture your scope, budget, and team rituals, then let Gigvora auto-assign curated freelancers with
              fairness weights across the network.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
                <span className="mr-2 inline-flex -space-x-2">
                  <UserAvatar name="Ops" seed="Operations" size="xs" />
                  <UserAvatar name="Design" seed="Design" size="xs" />
                  <UserAvatar name="Engineering" seed="Engineering" size="xs" />
                </span>
                <span>Auto-assign queue with fairness scoring</span>
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Escrow milestones &amp; launchpad integrations
              </span>
            </div>
          </div>
            <div className="flex flex-col items-start justify-between rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-inner">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Active auto-match projects</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{aggregatedStats.autoAssignEnabled}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {aggregatedStats.total
                      ? `Out of ${aggregatedStats.total} live projects, ${aggregatedStats.autoAssignEnabled} currently rotate invitations automatically.`
                      : 'Enable auto-match to begin rotating curated freelancers into your workspace.'}
                  </p>
                </div>
                <dl className="grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <dt>Queue entries live</dt>
                    <dd className="font-semibold text-slate-800">{aggregatedStats.totalQueueEntries}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Average queue size</dt>
                    <dd className="font-semibold text-slate-800">{aggregatedStats.averageQueueSize}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Newcomer guarantees</dt>
                    <dd className="font-semibold text-slate-800">{aggregatedStats.newcomerGuarantees}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Latest regeneration</dt>
                    <dd className="font-semibold text-slate-800">
                      {aggregatedStats.latestQueueGeneratedAt
                        ? formatRelativeTime(aggregatedStats.latestQueueGeneratedAt)
                        : 'Awaiting first run'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Median response (mins)</dt>
                    <dd className="font-semibold text-slate-800">{velocityLabels.medianLabel}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Completion rate</dt>
                    <dd className="font-semibold text-slate-800">{velocityLabels.completionLabel}</dd>
                  </div>
                </dl>
                {metricsError && canManageProjects ? (
                  <p className="text-xs text-amber-600">
                    Auto-match analytics are temporarily unavailable. Queue insights reflect live project data only.
                  </p>
                ) : null}
              </div>
              {canManageProjects ? (
                <Link
                to="/projects/new"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Create project brief
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <a
                href="mailto:operations@gigvora.com?subject=Project workspace access request"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Request workspace access
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </div>
        {!canManageProjects ? (
          <div className="mb-8 rounded-4xl border border-amber-200 bg-amber-50/70 p-6 text-sm text-amber-800 shadow-sm">
            <p className="font-semibold text-amber-900">Restricted workspace</p>
            <p className="mt-2 leading-relaxed">
              {denialReason} Once approved, you&apos;ll unlock project creation, queue controls, and workspace automation across the
              Gigvora operations suite.
            </p>
          </div>
        ) : null}
        <div className="mb-6 max-w-xl">
          <MarketplaceSearchInput
            id="project-search"
            label="Search projects"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by domain, collaborators, or status"
          />
        </div>
        {error ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Unable to load the latest projects. {error.message || 'Please refresh to sync the current initiatives.'}
          </div>
        ) : null}
        {loading && !items.length ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
                <div className="h-3 w-1/4 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-full rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}
        {!loading && !items.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {debouncedQuery
              ? 'No collaborative projects match your filters. Try expanding your criteria.'
              : 'Project cohorts from Gigvora teams and partners will appear here as they go live.'}
          </div>
        ) : null}
        <div className="space-y-6">
          {items.map((project) => {
            const fairness = project.autoAssignSettings?.fairness ?? {};
            const fairnessMaxAssignments = fairness.maxAssignments ?? fairness.maxAssignmentsForPriority ?? null;

            return (
              <article
                key={project.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
              >
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                {project.status ? <span>{project.status}</span> : null}
                <span className="text-slate-400">Updated {formatRelativeTime(project.updatedAt)}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">{project.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{project.description}</p>
              {Array.isArray(project.taxonomyLabels) && project.taxonomyLabels.length ? (
                <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {project.taxonomyLabels.slice(0, 4).map((label) => (
                    <li key={label} className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                      {label}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <div className="flex -space-x-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <UserAvatar
                        key={index}
                        name={`${project.title} collaborator ${index + 1}`}
                        seed={`${project.title}-${index}`}
                        size="xs"
                        showGlow={false}
                        className="border-white"
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-surfaceMuted/70 px-3 py-1 text-slate-600">
                      {project.autoAssignEnabled
                        ? `Auto-assign · ${formatAutoAssignStatus(project.autoAssignStatus)}`
                        : 'Auto-assign disabled'}
                    </span>
                    {project.autoAssignEnabled ? (
                      <span className="rounded-full border border-slate-200 bg-surfaceMuted/70 px-3 py-1 text-slate-600">
                        Queue size {project.autoAssignLastQueueSize ?? 0}
                      </span>
                    ) : null}
                    {project.autoAssignEnabled && project.autoAssignSettings?.limit ? (
                      <span className="rounded-full border border-slate-200 bg-surfaceMuted/70 px-3 py-1 text-slate-600">
                        Limit {project.autoAssignSettings.limit}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManageProjects ? (
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      Manage project
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-4 py-1 text-xs font-semibold text-slate-400">
                      Management locked
                    </span>
                  )}
                  <Link
                    to={`/projects/${project.id}/auto-match`}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Auto-match queue
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleJoin(project)}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Join project <span aria-hidden="true">→</span>
              </button>
              <div className="mt-5 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                {project.autoAssignEnabled ? (
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <p className="font-semibold text-slate-600">Queue cadence</p>
                    <p className="mt-1 text-slate-500">
                      {project.autoAssignLastRunAt
                        ? `Last refreshed ${formatRelativeTime(project.autoAssignLastRunAt)}`
                        : 'Queue not generated yet'}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-3 text-amber-700">
                    Auto-assign is off. Enable it from the project workspace to invite a rotating freelancer cohort automatically.
                  </div>
                )}
                {project.autoAssignEnabled ? (
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <p className="font-semibold text-slate-600">Fairness weights</p>
                    <p className="mt-1 text-slate-500">
                      {fairness.ensureNewcomer !== false
                        ? 'Newcomers always secure the first slot.'
                        : 'Rotation only with weighted scoring.'}
                    </p>
                    {fairnessMaxAssignments != null ? (
                      <p className="mt-2 text-xs text-slate-500">
                        {`Max ${fairnessMaxAssignments} assignments before rebalancing.`}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          );
          })}
        </div>
      </div>
    </section>
  );
}
