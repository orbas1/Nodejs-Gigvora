import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';
import UserAvatar from '../components/UserAvatar.jsx';
import { useProjectManagementAccess } from '../hooks/useAuthorization.js';
import useCachedResource from '../hooks/useCachedResource.js';
import projectsService from '../services/projects.js';

const SAVED_VIEWS_STORAGE_KEY = 'gigvora:projects:savedViews';

function ensureObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value) {
    return [];
  }
  return [value].filter(Boolean);
}

function coerceNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatDurationFromMinutes(minutes) {
  if (!Number.isFinite(minutes)) {
    return '—';
  }
  const totalSeconds = Math.max(0, Math.round(minutes * 60));
  const hours = Math.floor(totalSeconds / 3600);
  const remainingSeconds = totalSeconds % 3600;
  const mins = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return [hours, mins, seconds]
    .map((part) => part.toString().padStart(2, '0'))
    .join(':');
}

function formatPercentage(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const normalised = value > 1 ? value : value * 100;
  return `${Math.round(normalised)}%`;
}

function formatQueueStatus(status) {
  if (!status) return 'Inactive';
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function loadSavedViews() {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function ProjectCollaboratorRecommendations({ projectId }) {
  const {
    data,
    loading,
    error,
  } = useCachedResource(
    `project:${projectId}:recommendations`,
    ({ signal }) => projectsService.fetchProjectRecommendations(projectId, { signal }),
    {
      ttl: 1000 * 60 * 10,
      dependencies: [projectId],
      enabled: Boolean(projectId),
    },
  );

  const collaborators = useMemo(() => {
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.items)) {
      return data.items;
    }
    if (Array.isArray(data?.recommendations)) {
      return data.recommendations;
    }
    return [];
  }, [data]);

  const trackedCountRef = useRef(null);
  useEffect(() => {
    if (!projectId || !collaborators.length) {
      return;
    }
    const key = `${projectId}:${collaborators.length}`;
    if (trackedCountRef.current === key) {
      return;
    }
    trackedCountRef.current = key;
    analytics.track(
      'web_project_recommendations_loaded',
      { projectId, count: collaborators.length },
      { source: 'web_app' },
    );
  }, [collaborators.length, projectId]);

  if (loading) {
    return (
      <div className="mt-4 grid gap-2 text-xs text-slate-500">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="mt-4 text-xs text-rose-600">
        {error.message || 'Unable to load collaborator recommendations right now.'}
      </p>
    );
  }

  if (!collaborators.length) {
    return (
      <p className="mt-4 text-xs text-slate-500">
        Collaborator recommendations will appear once the auto-match service analyses similar projects.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-surfaceMuted/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Suggested collaborators
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {collaborators.slice(0, 3).map((collaborator, index) => {
          const safeName = collaborator?.name || collaborator?.displayName || `Collaborator ${index + 1}`;
          const headline =
            collaborator?.primaryDiscipline || collaborator?.headline || collaborator?.focus || 'Awaiting profile sync';
          const skills = ensureArray(collaborator?.skills || collaborator?.tags)
            .map((skill) => `${skill}`.trim())
            .filter(Boolean)
            .slice(0, 2);
          const profileHref = collaborator?.profileUrl || collaborator?.href || null;
          return (
            <li key={collaborator?.id ?? `${projectId}-collaborator-${index}`} className="flex items-center gap-3">
              <span title={safeName} className="inline-flex">
                <UserAvatar
                  name={safeName}
                  seed={`${projectId}-${safeName}`}
                  size="xs"
                  showGlow={false}
                  className="border-white"
                />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-slate-700">{safeName}</p>
                <p className="text-xs text-slate-500">
                  {headline}
                  {skills.length ? ` • ${skills.join(', ')}` : ''}
                </p>
              </div>
              {profileHref ? (
                <Link
                  to={profileHref}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  View profile
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProjectCard({ project, canManageProjects, onJoin, variant = 'list' }) {
  const workspace = ensureObject(project?.workspace ?? project?.workspaceSummary);
  const conversationId = workspace.conversationId || workspace.latestConversationId;
  const chatHref =
    workspace.chatUrl ||
    (conversationId ? `/projects/${project.id}/workspace/conversations/${conversationId}` : `/projects/${project.id}/workspace/chat`);
  const commentsHref = workspace.commentsUrl || `/projects/${project.id}/workspace/comments`;
  const containerClasses =
    variant === 'kanban'
      ? 'rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-soft'
      : 'rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft';

  return (
    <article className={containerClasses}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        {project.status ? <span className="font-semibold text-slate-600">{project.status}</span> : null}
        <span className="text-slate-400">Updated {formatRelativeTime(project.updatedAt)}</span>
      </div>
      <h2 className="mt-3 text-xl font-semibold text-slate-900">{project.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{project.description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="flex -space-x-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <span key={index} title={`Core collaborator ${index + 1}`} className="inline-flex">
                <UserAvatar
                  name={`${project.title} collaborator ${index + 1}`}
                  seed={`${project.title}-${index}`}
                  size="xs"
                  showGlow={false}
                  className="border-white"
                />
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-surfaceMuted/70 px-3 py-1 text-slate-600">
              {project.autoAssignEnabled
                ? `Auto-assign · ${formatQueueStatus(project.autoAssignStatus)}`
                : 'Auto-assign disabled'}
            </span>
            {project.autoAssignEnabled ? (
              <span className="rounded-full border border-slate-200 bg-surfaceMuted/70 px-3 py-1 text-slate-600">
                Queue size {project.autoAssignLastQueueSize ?? 0}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-accent">
        <Link
          to={chatHref}
          className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-accent transition hover:border-accent hover:bg-accent/10"
        >
          Workspace chat
          <span aria-hidden="true">→</span>
        </Link>
        <Link
          to={commentsHref}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-accent hover:text-accent"
        >
          Comment on brief
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      <button
        type="button"
        onClick={() => onJoin(project)}
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
              {project.autoAssignSettings?.fairness?.ensureNewcomer
                ? 'Newcomers always secure the first slot.'
                : 'Rotation only with weighted scoring.'}
            </p>
          </div>
        ) : null}
      </div>
      <ProjectCollaboratorRecommendations projectId={project.id} />
    </article>
  );
}

export default function ProjectsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoAssignFilter, setAutoAssignFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [savedViews, setSavedViews] = useState(() => loadSavedViews());
  const [activeSavedView, setActiveSavedView] = useState('');
  const { data, error, loading, fromCache, lastUpdated, refresh, debouncedQuery } = useOpportunityListing('projects', query, {
    pageSize: 25,
  });
  const { canManageProjects, denialReason } = useProjectManagementAccess();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
    } catch (storageError) {
      // Silently ignore storage failures (e.g., private browsing mode).
    }
  }, [savedViews]);

  useEffect(() => {
    if (!activeSavedView) {
      return;
    }
    const saved = savedViews.find((entry) => entry.id === activeSavedView);
    if (!saved) {
      setActiveSavedView('');
    }
  }, [activeSavedView, savedViews]);

  useEffect(() => {
    analytics.track(
      'web_projects_filters_applied',
      {
        query: debouncedQuery || null,
        status: statusFilter,
        autoAssign: autoAssignFilter,
        viewMode,
      },
      { source: 'web_app' },
    );
  }, [autoAssignFilter, debouncedQuery, statusFilter, viewMode]);

  const listing = data ?? {};
  const items = useMemo(() => (Array.isArray(listing.items) ? listing.items : []), [listing.items]);

  const statusOptions = useMemo(() => {
    const map = new Map();
    items.forEach((project) => {
      if (typeof project?.status === 'string' && project.status.trim().length) {
        const value = project.status.trim();
        map.set(value.toLowerCase(), value);
      }
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items]);

  useEffect(() => {
    if (!activeSavedView) {
      return;
    }
    const saved = savedViews.find((entry) => entry.id === activeSavedView);
    if (!saved) {
      return;
    }
    const matchesStatus = (saved.filters?.status ?? 'all') === statusFilter;
    const matchesAutoAssign = (saved.filters?.autoAssign ?? 'all') === autoAssignFilter;
    if (!matchesStatus || !matchesAutoAssign) {
      setActiveSavedView('');
    }
  }, [activeSavedView, autoAssignFilter, savedViews, statusFilter]);

  const filteredItems = useMemo(() => {
    return items.filter((project) => {
      if (statusFilter !== 'all') {
        const projectStatus = typeof project?.status === 'string' ? project.status.toLowerCase() : '';
        if (projectStatus !== statusFilter) {
          return false;
        }
      }
      if (autoAssignFilter === 'enabled' && !project.autoAssignEnabled) {
        return false;
      }
      if (autoAssignFilter === 'disabled' && project.autoAssignEnabled) {
        return false;
      }
      return true;
    });
  }, [autoAssignFilter, items, statusFilter]);

  const kanbanColumns = useMemo(() => {
    const groups = new Map();
    filteredItems.forEach((project) => {
      const label = typeof project?.status === 'string' && project.status.trim().length ? project.status.trim() : 'Planning';
      const key = label.toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, { key, label, items: [] });
      }
      groups.get(key).items.push(project);
    });

    if (!groups.size) {
      return [];
    }

    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredItems]);

  const matchingInsights = useMemo(() => {
    const analyticsData = ensureObject(
      listing.autoAssignAnalytics ?? listing.analytics?.autoAssign ?? listing.telemetry?.autoAssign,
    );
    const durations = [];
    const acceptanceRates = [];

    const analyticsDuration =
      coerceNumber(analyticsData.averageConfirmationMinutes) ??
      (coerceNumber(analyticsData.averageConfirmationHours) != null
        ? coerceNumber(analyticsData.averageConfirmationHours) * 60
        : null) ??
      coerceNumber(analyticsData.medianConfirmationMinutes);
    if (analyticsDuration != null) {
      durations.push(analyticsDuration);
    }
    const analyticsAcceptance =
      coerceNumber(analyticsData.acceptanceRate) ?? coerceNumber(analyticsData.confirmationRate);
    if (analyticsAcceptance != null) {
      acceptanceRates.push(analyticsAcceptance);
    }

    let activeQueues = 0;
    let newcomerGuarantees = 0;

    items.forEach((project) => {
      if (project.autoAssignEnabled) {
        activeQueues += 1;
        const projectDuration =
          coerceNumber(project.autoAssignAnalytics?.averageConfirmationMinutes) ??
          coerceNumber(project.autoAssignLastConfirmationMinutes) ??
          coerceNumber(project.autoAssignMetrics?.averageConfirmationMinutes);
        if (projectDuration != null) {
          durations.push(projectDuration);
        }
        const projectAcceptance =
          coerceNumber(project.autoAssignAnalytics?.acceptanceRate) ??
          coerceNumber(project.autoAssignAcceptanceRate);
        if (projectAcceptance != null) {
          acceptanceRates.push(projectAcceptance);
        }
      }
      const fairness = ensureObject(project.autoAssignSettings?.fairness ?? project.autoAssignFairness);
      if (fairness.ensureNewcomer || fairness.ensureNewcomers || fairness.guaranteeNewcomer) {
        newcomerGuarantees += 1;
      }
    });

    const averageMinutes = durations.length
      ? durations.reduce((total, value) => total + value, 0) / durations.length
      : null;
    const acceptanceRate = acceptanceRates.length
      ? acceptanceRates.reduce((total, value) => total + value, 0) / acceptanceRates.length
      : null;
    const newcomerCoverage = items.length ? newcomerGuarantees / items.length : null;

    return {
      averageMinutes,
      activeQueues,
      newcomerCoverage,
      acceptanceRate,
    };
  }, [items, listing.analytics, listing.autoAssignAnalytics, listing.telemetry]);

  const hasActiveFilters =
    statusFilter !== 'all' || autoAssignFilter !== 'all' || (debouncedQuery && debouncedQuery.length > 0);
  const showEmptyState = !loading && filteredItems.length === 0;

  const handleJoin = useCallback(
    (project) => {
      analytics.track(
        'web_project_join_cta',
        { id: project.id, title: project.title, query: debouncedQuery || null },
        { source: 'web_app' },
      );
    },
    [debouncedQuery],
  );

  const handleSaveView = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const name = window.prompt('Name for this saved view', 'Operations focus');
    if (!name) {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed.length) {
      return;
    }
    const newView = {
      id: `${Date.now()}`,
      name: trimmed,
      filters: {
        status: statusFilter,
        autoAssign: autoAssignFilter,
      },
    };
    setSavedViews((prev) => [...prev, newView]);
    setActiveSavedView(newView.id);
    analytics.track(
      'web_projects_saved_view_created',
      { name: trimmed, status: statusFilter, autoAssign: autoAssignFilter },
      { source: 'web_app' },
    );
  }, [autoAssignFilter, statusFilter]);

  const handleDeleteSavedView = useCallback(
    (viewId) => {
      setSavedViews((prev) => prev.filter((view) => view.id !== viewId));
      if (activeSavedView === viewId) {
        setActiveSavedView('');
      }
      analytics.track('web_projects_saved_view_deleted', { viewId }, { source: 'web_app' });
    },
    [activeSavedView],
  );

  const handleSelectSavedView = useCallback(
    (viewId) => {
      setActiveSavedView(viewId);
      const saved = savedViews.find((entry) => entry.id === viewId);
      if (saved) {
        setStatusFilter(saved.filters?.status ?? 'all');
        setAutoAssignFilter(saved.filters?.autoAssign ?? 'all');
        analytics.track(
          'web_projects_saved_view_applied',
          { viewId, status: saved.filters?.status ?? 'all', autoAssign: saved.filters?.autoAssign ?? 'all' },
          { source: 'web_app' },
        );
      }
    },
    [savedViews],
  );

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
              loading={loading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
            />
          }
        />
        <div className="mb-8 grid gap-6 rounded-4xl border border-accent/20 bg-gradient-to-r from-accent/10 via-white to-emerald-50 p-6 shadow-soft lg:grid-cols-[1.25fr,1fr]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Launch a new project</h2>
            <p className="mt-2 text-sm text-slate-600">
              Capture your scope, budget, and team rituals, then let Gigvora auto-assign curated freelancers with fairness weights across the network.
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
            <dl className="mt-5 grid gap-4 text-xs text-slate-600 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3">
                <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Matching velocity</dt>
                <dd className="mt-2 text-2xl font-bold text-slate-900">
                  {formatDurationFromMinutes(matchingInsights.averageMinutes)}
                </dd>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3">
                <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Active queues</dt>
                <dd className="mt-2 text-2xl font-bold text-slate-900">{matchingInsights.activeQueues}</dd>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3">
                <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Newcomer coverage</dt>
                <dd className="mt-2 text-2xl font-bold text-slate-900">
                  {formatPercentage(matchingInsights.newcomerCoverage)}
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col items-start justify-between rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-inner">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Acceptance rate</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatPercentage(matchingInsights.acceptanceRate)}
              </p>
              <p className="mt-1 text-sm text-slate-500">Average share of invitations that convert to confirmed collaborators.</p>
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
              {denialReason} Once approved, you&apos;ll unlock project creation, queue controls, and workspace automation across the Gigvora operations suite.
            </p>
          </div>
        ) : null}
        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="block">
            <span className="sr-only">Search projects</span>
            <input
              id="project-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by domain, collaborators, or status"
              className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <label className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Auto-assign</span>
              <select
                value={autoAssignFilter}
                onChange={(event) => setAutoAssignFilter(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="all">All</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-600">
            <label className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Saved view</span>
              <select
                value={activeSavedView}
                onChange={(event) => handleSelectSavedView(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="">Select</option>
                {savedViews.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleSaveView}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Save current view
            </button>
            {activeSavedView ? (
              <button
                type="button"
                onClick={() => handleDeleteSavedView(activeSavedView)}
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Delete
              </button>
            ) : null}
            <div className="ml-2 inline-flex rounded-full border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-full px-3 py-1 font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-accent text-white shadow-soft'
                    : 'text-slate-600 hover:text-accent'
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`rounded-full px-3 py-1 font-semibold transition ${
                  viewMode === 'kanban'
                    ? 'bg-accent text-white shadow-soft'
                    : 'text-slate-600 hover:text-accent'
                }`}
              >
                Kanban
              </button>
            </div>
          </div>
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
        {showEmptyState ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {debouncedQuery || hasActiveFilters
              ? 'No collaborative projects match your current filters. Try adjusting your query or saved view.'
              : 'Project cohorts from Gigvora teams and partners will appear here as they go live.'}
          </div>
        ) : null}
        {viewMode === 'kanban' && kanbanColumns.length ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {kanbanColumns.map((column) => (
              <div key={column.key} className="rounded-4xl border border-slate-200 bg-white/80 p-4 shadow-soft">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">{column.label}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                    {column.items.length}
                  </span>
                </div>
                <div className="mt-4 space-y-4">
                  {column.items.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      canManageProjects={canManageProjects}
                      onJoin={handleJoin}
                      variant="kanban"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {viewMode === 'list' && filteredItems.length ? (
          <div className="space-y-6">
            {filteredItems.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                canManageProjects={canManageProjects}
                onJoin={handleJoin}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
