import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import useRoleAccess from '../hooks/useRoleAccess.js';
import AccessRestricted from '../components/AccessRestricted.jsx';
import { enqueueProjectAssignments, fetchProjectQueue } from '../services/autoAssign.js';
import projectsService from '../services/projects.js';
import analytics from '../services/analytics.js';
import { ANALYTICS_EVENTS } from '../constants/analyticsEvents.js';
import useJourneyProgress from '../hooks/useJourneyProgress.js';
import { formatRelativeTime } from '../utils/date.js';

const ALLOWED_MEMBERSHIPS = ['company', 'agency', 'admin'];
const WEIGHT_PRESET = {
  recency: 24,
  rating: 18,
  completionRecency: 16,
  completionQuality: 20,
  earningsBalance: 12,
  inclusion: 10,
};

const STATUS_PRESETS = {
  notified: {
    label: 'Live invitation',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  pending: {
    label: 'Pending rotation',
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
  },
  completed: {
    label: 'Completed rotation',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  expired: {
    label: 'Invitation expired',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  dropped: {
    label: 'Manually removed',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  default: {
    label: 'Queued',
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
  },
};

function ensureObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
}

function normalizeWeights(weights) {
  const total = Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, Math.max(0, Number(value || 0)) / total]),
  );
}

function formatCurrency(value, currency = 'USD') {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch (error) {
    return `${value} ${currency}`;
  }
}

export default function ProjectAutoMatchPage() {
  const { projectId } = useParams();
  const { session, isAuthenticated, hasAccess } = useRoleAccess(ALLOWED_MEMBERSHIPS, {
    autoSelectActive: true,
  });
  const canAdminister = Boolean(hasAccess);
  const canView = canAdminister && Boolean(projectId);
  const { completeCheckpoint } = useJourneyProgress();

  const [formState, setFormState] = useState({
    limit: 6,
    expiresInMinutes: 240,
    projectValue: '',
    fairnessMaxAssignments: 3,
    ensureNewcomer: true,
  });
  const [weights, setWeights] = useState(WEIGHT_PRESET);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const normalizedWeights = useMemo(() => normalizeWeights(weights), [weights]);

  const projectKey = useMemo(() => `project:auto-match:${projectId}`, [projectId]);
  const queueKey = useMemo(() => `project:auto-match:${projectId}:queue`, [projectId]);

  const {
    data: projectData,
    error: projectError,
    loading: projectLoading,
    lastUpdated: projectUpdatedAt,
    refresh: refreshProject,
  } = useCachedResource(
    projectKey,
    ({ signal }) => projectsService.fetchProject(projectId, { signal }),
    { ttl: 1000 * 60, dependencies: [projectId], enabled: canView },
  );

  const {
    data: queueData,
    error: queueError,
    loading: queueLoading,
    lastUpdated: queueUpdatedAt,
    refresh: refreshQueue,
  } = useCachedResource(
    queueKey,
    ({ signal }) => fetchProjectQueue(projectId, { signal }).then((result) => result.entries ?? []),
    { ttl: 1000 * 30, dependencies: [projectId], enabled: canView },
  );

  const project = projectData ?? null;
  const queueEntries = Array.isArray(queueData) ? queueData : [];
  const sortedQueueEntries = useMemo(() => {
    return queueEntries
      .slice()
      .sort((a, b) => (a?.position ?? Number.POSITIVE_INFINITY) - (b?.position ?? Number.POSITIVE_INFINITY));
  }, [queueEntries]);

  const statusSummary = useMemo(() => {
    return queueEntries.reduce(
      (acc, entry) => {
        const statusKey = typeof entry?.status === 'string' ? entry.status.toLowerCase() : 'pending';
        acc[statusKey] = (acc[statusKey] || 0) + 1;
        return acc;
      },
      {},
    );
  }, [queueEntries]);

  const handleWeightChange = (key) => (event) => {
    const value = Number(event.target.value);
    setWeights((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : prev[key] }));
  };

  const handleFieldChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateQueue = useCallback(
    async (event) => {
      event.preventDefault();
      if (!canView) return;
      setSaving(true);
      setFeedback(null);
      try {
        await enqueueProjectAssignments(projectId, {
          projectValue: formState.projectValue ? Number(formState.projectValue) : undefined,
          limit: Number(formState.limit) || undefined,
          expiresInMinutes: Number(formState.expiresInMinutes) || undefined,
          weights: normalizedWeights,
          fairness: {
            ensureNewcomer: Boolean(formState.ensureNewcomer),
            maxAssignments: Number(formState.fairnessMaxAssignments) || undefined,
          },
        });
        analytics.track(
          ANALYTICS_EVENTS.PROJECT_AUTO_MATCH_REGENERATED.name,
          {
            projectId,
            limit: Number(formState.limit) || null,
            ensureNewcomer: Boolean(formState.ensureNewcomer),
            fairnessMaxAssignments: Number(formState.fairnessMaxAssignments) || null,
          },
          { source: 'web_app' },
        );
        completeCheckpoint('auto_match_queue_regenerated', {
          projectId,
          sessionId: session?.id ?? session?.userId ?? null,
          queueSize: queueEntries.length,
        });
        await refreshQueue({ force: true });
        await refreshProject({ force: true });
        setFeedback({ type: 'success', message: 'Queue regenerated successfully.' });
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error?.message || 'Unable to regenerate the queue right now. Please try again shortly.',
        });
      } finally {
        setSaving(false);
      }
    },
    [
      canView,
      completeCheckpoint,
      formState,
      normalizedWeights,
      projectId,
      queueEntries.length,
      refreshProject,
      refreshQueue,
      session?.id,
      session?.userId,
    ],
  );

  const renderQueue = () => {
    if (!queueEntries.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          {queueLoading
            ? 'Rebalancing your queue…'
            : 'No matches yet. Generate the queue to invite high-fit freelancers into rotation.'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sortedQueueEntries.map((entry, index) => {
          const statusKey = typeof entry?.status === 'string' ? entry.status.toLowerCase() : 'default';
          const statusPreset = STATUS_PRESETS[statusKey] ?? STATUS_PRESETS.default;
          const breakdown = ensureObject(entry?.breakdown);
          const metadata = ensureObject(entry?.metadata);
          const fairness = ensureObject(metadata.fairness);
          const projectName = entry.projectName ?? project?.title ?? `Project ${projectId}`;
          return (
            <article
              key={entry.id ?? `${entry.freelancerId}-${index}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <UserAvatar name={entry.freelancer?.firstName ?? 'Freelancer'} seed={`freelancer-${entry.freelancerId}`} size="sm" showGlow={false} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {entry.status === 'notified' ? 'Live invitation' : `Queue position #${entry.position ?? index + 1}`}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {entry.freelancer?.firstName} {entry.freelancer?.lastName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Score {(entry.score ?? 0).toFixed(2)} • Priority bucket {entry.priorityBucket ?? '—'}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide ${statusPreset.badge}`}
                >
                  {statusPreset.label}
                </span>
              </div>
              <div className="mt-4 grid gap-4 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                  <p className="font-semibold text-slate-500">Project</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{projectName}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                  <p className="font-semibold text-slate-500">Queue expires</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {entry.expiresAt ? formatRelativeTime(entry.expiresAt) : 'Pending trigger'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                  <p className="font-semibold text-slate-500">Latest completion</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {breakdown.lastCompletedDays != null
                      ? `${Math.round(breakdown.lastCompletedDays)} days`
                      : 'Awaiting first completion'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                  <p className="font-semibold text-slate-500">Fairness boost</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {fairness.ensureNewcomer || fairness.ensuredNewcomer ? 'Reserved newcomer slot' : 'Rotation'}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  if (!projectId) {
    return (
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700">
            We could not find a project identifier. Return to the <Link to="/projects" className="font-semibold text-rose-600 underline">projects list</Link> to choose a workspace.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-accent/20 blur-[160px]" aria-hidden="true" />
      <div className="absolute -left-24 bottom-16 h-72 w-72 rounded-full bg-emerald-200/40 blur-[140px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl space-y-10 px-6">
        <PageHeader
          eyebrow="Auto-match"
          title={project?.title ? `${project.title} • Auto-match` : 'Auto-match workspace'}
          description="Generate ranked freelancer rotations with fairness safeguards and live queue telemetry."
          actions={
            <Link
              to={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              View project overview
              <span aria-hidden="true">→</span>
            </Link>
          }
          meta={
            canView ? (
              <DataStatus
                loading={queueLoading}
                fromCache={false}
                lastUpdated={queueUpdatedAt ?? projectUpdatedAt}
                onRefresh={() => {
                  refreshQueue({ force: true });
                  refreshProject({ force: true });
                }}
              />
            ) : null
          }
        />

        {!isAuthenticated ? (
          <AccessRestricted
            tone="sky"
            badge="Authentication required"
            title="Sign in to orchestrate auto-match"
            description="Use an authenticated operations workspace to generate and monitor freelancer rotations."
            actionLabel="Sign in"
            actionHref="/login"
          />
        ) : null}

        {isAuthenticated && !canAdminister ? (
          <AccessRestricted
            tone="amber"
            badge={`Active role: ${session?.activeMembership ?? 'none'}`}
            title="Operations access required"
            description="Only company, agency, or admin workspaces run auto-match. Switch your active membership in settings."
            actionLabel="Manage memberships"
            actionHref="/settings"
          />
        ) : null}

        {canView && feedback ? (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-3xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-600'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        {canView ? (
          <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
            <div className="space-y-6">
              <div className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Project signals</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{project?.title ?? 'Project loading…'}</h2>
                    <p className="mt-1 text-sm text-slate-600">{project?.description ?? 'Syncing latest project details…'}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-surfaceMuted/70 px-3 py-1 text-xs font-semibold text-slate-500">
                    {project?.status ?? 'Loading'}
                  </span>
                </div>
                <dl className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/80 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Budget</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">
                      {formatCurrency(project?.budgetAmount, project?.budgetCurrency ?? 'USD')}
                    </dd>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/80 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Queue status</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">
                      {project?.autoAssignStatus
                        ? project.autoAssignStatus.replace(/_/g, ' ')
                        : 'Not generated'}
                    </dd>
                  </div>
                </dl>
                {projectError ? (
                  <p className="mt-4 text-sm text-rose-600">{projectError.message || 'Unable to load project details.'}</p>
                ) : null}
              </div>

              <form onSubmit={handleGenerateQueue} className="space-y-5 rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Regeneration controls</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Fine-tune fairness weights</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Update queue limits, expiry windows, and fairness parameters before triggering a new rotation.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
                  >
                    {saving ? 'Regenerating…' : 'Regenerate queue'}
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-500">
                    <span className="font-semibold text-slate-900">Queue size limit</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formState.limit}
                      onChange={handleFieldChange('limit')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-500">
                    <span className="font-semibold text-slate-900">Expires in (minutes)</span>
                    <input
                      type="number"
                      min="30"
                      max="1440"
                      value={formState.expiresInMinutes}
                      onChange={handleFieldChange('expiresInMinutes')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-500">
                    <span className="font-semibold text-slate-900">Project value (optional)</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formState.projectValue}
                      onChange={handleFieldChange('projectValue')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-500">
                    <span className="font-semibold text-slate-900">Fairness cap</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formState.fairnessMaxAssignments}
                      onChange={handleFieldChange('fairnessMaxAssignments')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </label>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-surfaceMuted/60 px-4 py-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={formState.ensureNewcomer}
                    onChange={handleFieldChange('ensureNewcomer')}
                    className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  <span>
                    Guarantee at least one newcomer in every regeneration to preserve equitable access across the network.
                  </span>
                </label>
                <div className="space-y-3 rounded-3xl border border-slate-200 bg-surfaceMuted/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Weight distribution</p>
                  {Object.entries(weights).map(([key, value]) => (
                    <label key={key} className="space-y-1 text-sm text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-xs text-slate-500">{Math.round(normalizedWeights[key] * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        value={value}
                        onChange={handleWeightChange(key)}
                        className="w-full accent-accent"
                      />
                    </label>
                  ))}
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Queue health</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Live match telemetry</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Track notified freelancers, pending slots, and rotation velocity after each regeneration.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refreshQueue({ force: true })}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    disabled={queueLoading}
                  >
                    {queueLoading ? 'Refreshing…' : 'Refresh queue'}
                  </button>
                </div>
                <dl className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total entries</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">{queueEntries.length}</dd>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Notified</dt>
                    <dd className="mt-2 text-base font-semibold text-emerald-600">{statusSummary.notified ?? 0}</dd>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Pending</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">{statusSummary.pending ?? 0}</dd>
                  </div>
                </dl>
                {queueError ? (
                  <p className="mt-4 text-sm text-rose-600">{queueError.message || 'Unable to sync queue status.'}</p>
                ) : null}
              </div>

              {renderQueue()}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
