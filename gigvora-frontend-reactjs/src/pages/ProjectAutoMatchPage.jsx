import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import useRoleAccess from '../hooks/useRoleAccess.js';
import AccessRestricted from '../components/AccessRestricted.jsx';
import { enqueueProjectAssignments, fetchProjectQueue, updateQueueEntry } from '../services/autoAssign.js';
import projectsService from '../services/projects.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';

const TOAST_TIMEOUT = 5000;
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

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
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

function coerceNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatDuration(minutes) {
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

export default function ProjectAutoMatchPage() {
  const { projectId } = useParams();
  const { session, isAuthenticated, hasAccess } = useRoleAccess(ALLOWED_MEMBERSHIPS, {
    autoSelectActive: true,
  });
  const canAdminister = Boolean(hasAccess);
  const canView = canAdminister && Boolean(projectId);

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
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const [entryActions, setEntryActions] = useState({});
  const formInitialisedRef = useRef(false);
  const fairnessSnapshotRef = useRef(null);

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone });
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, TOAST_TIMEOUT);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    formInitialisedRef.current = false;
  }, [projectId]);

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
    data: queuePayload,
    error: queueError,
    loading: queueLoading,
    lastUpdated: queueUpdatedAt,
    refresh: refreshQueue,
  } = useCachedResource(
    queueKey,
    ({ signal }) => fetchProjectQueue(projectId, { signal }),
    { ttl: 1000 * 30, dependencies: [projectId], enabled: canView },
  );

  const {
    data: auditData,
    error: auditError,
    loading: auditLoading,
    refresh: refreshAudit,
  } = useCachedResource(
    `${projectKey}:events`,
    ({ signal }) => projectsService.fetchProjectEvents(projectId, { signal, limit: 25 }),
    { ttl: 1000 * 60, dependencies: [projectId], enabled: canView },
  );

  const project = projectData ?? null;
  const queueEntries = useMemo(
    () => (Array.isArray(queuePayload?.entries) ? queuePayload.entries : []),
    [queuePayload],
  );
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

  const queueTelemetry = useMemo(
    () => ensureObject(queuePayload?.analytics ?? queuePayload?.metrics ?? queuePayload?.telemetry),
    [queuePayload],
  );
  const queueVelocityMinutes = useMemo(() => {
    return (
      coerceNumber(queueTelemetry.averageConfirmationMinutes) ??
      (coerceNumber(queueTelemetry.averageConfirmationHours) != null
        ? coerceNumber(queueTelemetry.averageConfirmationHours) * 60
        : null) ??
      coerceNumber(queueTelemetry.medianConfirmationMinutes)
    );
  }, [queueTelemetry]);
  const queueAcceptanceRate = useMemo(() => {
    return coerceNumber(queueTelemetry.acceptanceRate ?? queueTelemetry.confirmationRate);
  }, [queueTelemetry]);

  const fairnessMetrics = useMemo(() => {
    if (!queueEntries.length) {
      return { newcomerShare: 0, averageScore: null, pending: 0 };
    }
    let newcomers = 0;
    let scoreTotal = 0;
    let countedScores = 0;
    let pending = 0;

    queueEntries.forEach((entry) => {
      const fairness = ensureObject(entry?.metadata?.fairness);
      if (fairness.ensureNewcomer || fairness.ensuredNewcomer) {
        newcomers += 1;
      }
      const score = Number(entry?.score);
      if (Number.isFinite(score)) {
        scoreTotal += score;
        countedScores += 1;
      }
      if (entry?.status === 'pending' || entry?.status === 'notified') {
        pending += 1;
      }
    });

    return {
      newcomerShare: newcomers / queueEntries.length,
      averageScore: countedScores ? scoreTotal / countedScores : null,
      pending,
    };
  }, [queueEntries]);

  const auditEvents = useMemo(() => {
    if (!auditData) {
      return [];
    }
    if (Array.isArray(auditData)) {
      return auditData;
    }
    const source = Array.isArray(auditData?.items)
      ? auditData.items
      : Array.isArray(auditData?.events)
      ? auditData.events
      : [];
    return source.filter((event) => {
      const topic = `${event?.topic ?? event?.type ?? ''}`.toLowerCase();
      return topic.includes('auto') || topic.includes('queue') || topic.includes('fairness');
    });
  }, [auditData]);

  useEffect(() => {
    if (!project || formInitialisedRef.current) {
      return;
    }
    const settings = ensureObject(project.autoAssignSettings);
    const fairness = ensureObject(settings.fairness);

    setFormState((prev) => ({
      limit: Number.isFinite(Number(settings.limit)) ? Number(settings.limit) : prev.limit,
      expiresInMinutes: Number.isFinite(Number(settings.expiresInMinutes))
        ? Number(settings.expiresInMinutes)
        : prev.expiresInMinutes,
      projectValue:
        Number.isFinite(Number(settings.projectValue)) && Number(settings.projectValue) > 0
          ? Number(settings.projectValue)
          : project?.budgetAmount ?? prev.projectValue,
      fairnessMaxAssignments: Number.isFinite(Number(fairness.maxAssignments))
        ? Number(fairness.maxAssignments)
        : prev.fairnessMaxAssignments,
      ensureNewcomer: fairness.ensureNewcomer ?? fairness.ensuredNewcomer ?? prev.ensureNewcomer,
    }));

    const presetWeights = ensureObject(settings.weights ?? settings.weightPreset);
    if (Object.keys(presetWeights).length) {
      setWeights((prev) => ({ ...prev, ...presetWeights }));
    }

    formInitialisedRef.current = true;
  }, [project]);

  useEffect(() => {
    if (!canView) {
      return;
    }
    const payload = {
      projectId,
      queueSize: queueEntries.length,
      newcomerShare: fairnessMetrics.newcomerShare,
      averageScore: fairnessMetrics.averageScore,
      pending: fairnessMetrics.pending,
    };
    const serialised = JSON.stringify(payload);
    if (fairnessSnapshotRef.current === serialised) {
      return;
    }
    fairnessSnapshotRef.current = serialised;
    analytics.track('web_project_auto_match_fairness_snapshot', payload, { source: 'web_app' });
  }, [canView, fairnessMetrics, projectId, queueEntries.length]);

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
          'web_project_auto_match_regenerated',
          {
            projectId,
            limit: Number(formState.limit) || null,
            ensureNewcomer: Boolean(formState.ensureNewcomer),
          },
          { source: 'web_app' },
        );
        await Promise.all([refreshQueue({ force: true }), refreshProject({ force: true }), refreshAudit({ force: true })]);
        const successMessage = 'Queue regenerated successfully.';
        setFeedback({ type: 'success', message: successMessage });
        showToast(successMessage, 'success');
      } catch (error) {
        const message = error?.message || 'Unable to regenerate the queue right now. Please try again shortly.';
        setFeedback({
          type: 'error',
          message,
        });
        showToast(message, 'error');
      } finally {
        setSaving(false);
      }
    },
    [canView, formState, normalizedWeights, projectId, refreshAudit, refreshProject, refreshQueue, showToast],
  );

  const handleQueueAction = useCallback(
    async (entry, payload, successMessage, analyticsEvent) => {
      if (!entry?.id) {
        return;
      }
      setEntryActions((prev) => ({ ...prev, [entry.id]: true }));
      try {
        await updateQueueEntry(entry.id, payload);
        analytics.track(
          analyticsEvent,
          { projectId, entryId: entry.id, status: payload.status ?? null },
          { source: 'web_app' },
        );
        showToast(successMessage, 'success');
        await refreshQueue({ force: true });
      } catch (error) {
        showToast(error?.message || 'Unable to update the queue entry.', 'error');
      } finally {
        setEntryActions((prev) => ({ ...prev, [entry.id]: false }));
      }
    },
    [projectId, refreshQueue, showToast],
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
          const skills = ensureArray(entry.freelancer?.skills ?? metadata.skills)
            .map((skill) => `${skill}`.trim())
            .filter(Boolean)
            .slice(0, 3);
          const entryLoading = Boolean(entryActions[entry.id]);
          return (
            <article
              key={entry.id ?? `${entry.freelancerId}-${index}`}
              className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
            >
              <div className="absolute right-6 top-6 hidden gap-2 text-xs group-hover:flex">
                <button
                  type="button"
                  onClick={() =>
                    handleQueueAction(
                      entry,
                      { status: 'notified' },
                      'Reminder sent to freelancer.',
                      'web_project_auto_match_entry_notified',
                    )
                  }
                  disabled={entryLoading}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:opacity-50"
                  title="Send another invitation reminder"
                >
                  Remind
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQueueAction(
                      entry,
                      { status: 'dropped', reasonCode: 'manual_removal', reasonLabel: 'Removed by operator' },
                      'Freelancer removed from queue.',
                      'web_project_auto_match_entry_removed',
                    )
                  }
                  disabled={entryLoading}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                  title="Remove this freelancer from the queue"
                >
                  Remove
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span title={entry.freelancer?.displayName || entry.freelancer?.firstName || 'Freelancer'} className="inline-flex">
                    <UserAvatar
                      name={entry.freelancer?.displayName ?? `${entry.freelancer?.firstName ?? 'Freelancer'} ${entry.freelancer?.lastName ?? ''}`.trim()}
                      seed={`freelancer-${entry.freelancerId}`}
                      size="sm"
                      showGlow={false}
                    />
                  </span>
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
                    {skills.length ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        {skills.map((skill) => (
                          <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}
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
              {Object.keys(entry.weights || {}).length ? (
                <div className="mt-4 rounded-3xl border border-slate-200 bg-surfaceMuted/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Weight contribution</p>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    {Object.entries(entry.weights)
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div key={key} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <p className="font-semibold text-slate-600">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-slate-500">{formatPercentage(Number(value))}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
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
      {toast ? (
        <div
          className={`fixed right-6 top-6 z-50 rounded-3xl border px-4 py-3 text-sm shadow-soft ${
            toast.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ) : null}
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
                  refreshAudit({ force: true });
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
                      {project?.autoAssignEnabled ? 'Auto-assign enabled' : 'Auto-assign disabled'}
                    </dd>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/80 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Velocity</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">{formatDuration(queueVelocityMinutes)}</dd>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/80 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Acceptance</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">
                      {formatPercentage(queueAcceptanceRate)}
                    </dd>
                  </div>
                </dl>
                {projectError ? (
                  <p className="mt-4 text-sm text-rose-600">{projectError.message || 'Unable to load project details.'}</p>
                ) : null}
              </div>

              <form className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-soft" onSubmit={handleGenerateQueue}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Regeneration settings</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Fairness-first queue controls</h3>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={saving}
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
                <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-surfaceMuted/60 px-4 py-3 text-sm text-slate-600">
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
                <div className="mt-4 space-y-3 rounded-3xl border border-slate-200 bg-surfaceMuted/60 p-4">
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
                <dl className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-4">
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
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Newcomer share</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">
                      {formatPercentage(fairnessMetrics.newcomerShare)}
                    </dd>
                  </div>
                </dl>
                <dl className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Average score</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">
                      {fairnessMetrics.averageScore != null ? fairnessMetrics.averageScore.toFixed(2) : '—'}
                    </dd>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Open invites</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">{fairnessMetrics.pending}</dd>
                  </div>
                </dl>
                {queueError ? (
                  <p className="mt-4 text-sm text-rose-600">{queueError.message || 'Unable to sync queue status.'}</p>
                ) : null}
              </div>

              <div className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Fairness audit log</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Recent rotations &amp; overrides</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Every queue regeneration and fairness adjustment is captured for compliance-ready reporting.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refreshAudit({ force: true })}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    disabled={auditLoading}
                  >
                    {auditLoading ? 'Refreshing…' : 'Refresh log'}
                  </button>
                </div>
                {auditError ? (
                  <p className="mt-4 text-sm text-rose-600">{auditError.message || 'Unable to load fairness events.'}</p>
                ) : null}
                {auditLoading && !auditEvents.length ? (
                  <div className="mt-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
                    ))}
                  </div>
                ) : null}
                {!auditLoading && !auditEvents.length ? (
                  <p className="mt-4 text-sm text-slate-500">
                    Fairness events will appear once the queue has been regenerated or manually adjusted.
                  </p>
                ) : null}
                {auditEvents.length ? (
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {auditEvents.slice(0, 6).map((event) => (
                      <li key={event.id ?? event.reference ?? event.createdAt} className="rounded-3xl border border-slate-200 bg-surfaceMuted/60 p-4">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {event.title || event.name || event.type || 'Queue event'}
                          </span>
                          <span>{event.createdAt ? formatRelativeTime(event.createdAt) : 'Just now'}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {event.description || event.summary || 'Fairness instrumentation captured this change.'}
                        </p>
                      </li>
                    ))}
                  </ul>
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
