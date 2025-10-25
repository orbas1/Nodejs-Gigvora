import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowPathIcon, ClipboardDocumentIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import useRoleAccess from '../hooks/useRoleAccess.js';
import AccessRestricted from '../components/AccessRestricted.jsx';
import { enqueueProjectAssignments, fetchProjectQueue } from '../services/autoAssign.js';
import projectsService from '../services/projects.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';
import { formatCurrency } from '../utils/currency.js';
import useProjectQueueStream from '../hooks/useProjectQueueStream.js';
import { getAutoAssignStatusPreset, formatAutoAssignStatus } from '../utils/autoAssignStatus.js';

const ALLOWED_MEMBERSHIPS = ['company', 'agency', 'admin'];
const WEIGHT_PRESET = {
  recency: 24,
  rating: 18,
  completionRecency: 16,
  completionQuality: 20,
  earningsBalance: 12,
  inclusion: 10,
};

const EVENT_LABELS = {
  created: 'Project created',
  auto_assign_enabled: 'Auto-match enabled',
  auto_assign_disabled: 'Auto-match disabled',
  auto_assign_queue_generated: 'Queue regenerated',
  auto_assign_queue_regenerated: 'Queue regenerated',
  auto_assign_queue_exhausted: 'Queue exhausted',
  auto_assign_queue_failed: 'Queue regeneration failed',
};

function ensureObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
}

function normalizeWeights(weights) {
  const merged = { ...WEIGHT_PRESET, ...(weights || {}) };
  const total = Object.values(merged).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [key, Math.max(0, Number(value || 0)) / total]),
  );
}

function denormalizeWeights(weightConfig) {
  if (!weightConfig || typeof weightConfig !== 'object') {
    return null;
  }
  const mapped = Object.entries(weightConfig).reduce((acc, [key, value]) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric >= 0) {
      acc[key] = numeric <= 1 ? Math.round(numeric * 100) : Math.round(numeric);
    }
    return acc;
  }, {});
  return Object.keys(mapped).length ? mapped : null;
}

function formatEventType(eventType) {
  if (!eventType) {
    return 'Project event';
  }
  if (EVENT_LABELS[eventType]) {
    return EVENT_LABELS[eventType];
  }
  return eventType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function describeEventDetails(event) {
  const payload = ensureObject(event?.payload);
  switch (event?.eventType) {
    case 'created': {
      const budget =
        payload.budgetAmount != null
          ? formatCurrency(payload.budgetAmount, payload.budgetCurrency ?? 'USD')
          : null;
      return [payload.status ? `Status ${payload.status}` : null, budget]
        .filter(Boolean)
        .join(' • ');
    }
    case 'auto_assign_enabled':
    case 'auto_assign_queue_generated':
    case 'auto_assign_queue_exhausted':
    case 'auto_assign_disabled': {
      const limit = payload.limit ?? payload.settings?.limit;
      const expires = payload.expiresInMinutes ?? payload.settings?.expiresInMinutes;
      const newcomerToggle = ensureObject(payload.fairness).ensureNewcomer === false ? 'Newcomer opt-out' : null;
      const pieces = [
        limit != null ? `Limit ${limit}` : null,
        expires != null ? `Expires ${expires}m` : null,
        newcomerToggle,
      ].filter(Boolean);
      return pieces.join(' • ');
    }
    default:
      return null;
  }
}

function toValidDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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
  const [queueSnapshot, setQueueSnapshot] = useState({ entries: [], summary: null, regeneration: null, timestamp: null });
  const [weights, setWeights] = useState(WEIGHT_PRESET);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedEntryId, setCopiedEntryId] = useState(null);
  const copyTimeoutRef = useRef(null);

  const normalizedWeights = useMemo(() => normalizeWeights(weights), [weights]);

  const projectKey = useMemo(() => `project:auto-match:${projectId}`, [projectId]);
  const queueKey = useMemo(() => `project:auto-match:${projectId}:queue`, [projectId]);
  const eventsKey = useMemo(() => `project:auto-match:${projectId}:events`, [projectId]);

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
    ({ signal }) => fetchProjectQueue(projectId, { signal }),
    { ttl: 1000 * 30, dependencies: [projectId], enabled: canView },
  );

  const {
    data: eventsData,
    error: eventsError,
    loading: eventsLoading,
    lastUpdated: eventsUpdatedAt,
    refresh: refreshEvents,
  } = useCachedResource(
    eventsKey,
    ({ signal }) =>
      projectsService
        .fetchProjectEvents(projectId, { signal, limit: 40 })
        .then((response) => response?.events ?? []),
    { ttl: 1000 * 60, dependencies: [projectId], enabled: canView },
  );

  const project = projectData ?? null;
  const queueEntries = Array.isArray(queueSnapshot.entries) ? queueSnapshot.entries : [];
  const queueSummary = queueSnapshot.summary ?? null;
  const queueRegeneration = useMemo(() => {
    if (!queueSnapshot.regeneration || typeof queueSnapshot.regeneration !== 'object') {
      return null;
    }
    const resolved = ensureObject(queueSnapshot.regeneration);
    return Object.keys(resolved).length ? resolved : null;
  }, [queueSnapshot.regeneration]);
  const sortedQueueEntries = useMemo(() => {
    return queueEntries
      .slice()
      .sort((a, b) => (a?.position ?? Number.POSITIVE_INFINITY) - (b?.position ?? Number.POSITIVE_INFINITY));
  }, [queueEntries]);
  const events = useMemo(() => {
    if (!Array.isArray(eventsData)) {
      return [];
    }
    return eventsData
      .slice()
      .sort((a, b) => {
        const aTime = toValidDate(a?.createdAt)?.getTime() ?? 0;
        const bTime = toValidDate(b?.createdAt)?.getTime() ?? 0;
        return bTime - aTime;
      });
  }, [eventsData]);

  useEffect(() => {
    if (!queueData) {
      if (!queueLoading && !queueError) {
        setQueueSnapshot((prev) => ({ ...prev, entries: [], summary: null, regeneration: null }));
      }
      return;
    }
    setQueueSnapshot({
      entries: Array.isArray(queueData.entries) ? queueData.entries : [],
      summary: queueData.summary ?? null,
      regeneration: queueData.regeneration ?? null,
      timestamp: queueUpdatedAt ? toValidDate(queueUpdatedAt) ?? new Date() : null,
    });
  }, [queueData, queueLoading, queueError, queueUpdatedAt]);

  useProjectQueueStream(projectId, {
    enabled: canView,
    onQueue: (payload) => {
      if (!payload) {
        return;
      }
      setQueueSnapshot((prev) => ({
        entries: Array.isArray(payload.entries) ? payload.entries : prev.entries,
        summary: payload.summary ?? prev.summary,
        regeneration: payload.regeneration ?? prev.regeneration,
        timestamp: toValidDate(payload.timestamp) ?? prev.timestamp ?? new Date(),
      }));
    },
  });

  const statusSummary = useMemo(() => {
    if (queueSummary?.statusCounts) {
      return queueSummary.statusCounts;
    }
    return queueEntries.reduce(
      (acc, entry) => {
        const statusKey = typeof entry?.status === 'string' ? entry.status.toLowerCase() : 'pending';
        acc[statusKey] = (acc[statusKey] || 0) + 1;
        return acc;
      },
      {},
    );
  }, [queueEntries, queueSummary]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!project) {
      return;
    }
    const settings = ensureObject(project.autoAssignSettings);
    const fairness = ensureObject(settings.fairness);
    const resolvedProjectValueRaw =
      settings.projectValue ?? project.autoAssignSettings?.projectValue ?? project.budgetAmount ?? null;
    const numericProjectValue = Number(resolvedProjectValueRaw);

    setFormState((prev) => {
      const next = {
        ...prev,
        limit: settings.limit ?? prev.limit,
        expiresInMinutes: settings.expiresInMinutes ?? prev.expiresInMinutes,
        ensureNewcomer: fairness.ensureNewcomer !== false,
      };
      if (fairness.maxAssignments != null || fairness.maxAssignmentsForPriority != null) {
        const rawMax = fairness.maxAssignments ?? fairness.maxAssignmentsForPriority;
        const numericMax = Number(rawMax);
        next.fairnessMaxAssignments = Number.isFinite(numericMax) ? numericMax : prev.fairnessMaxAssignments;
      }
      if ((!prev.projectValue || prev.projectValue === '') && Number.isFinite(numericProjectValue)) {
        next.projectValue = String(Math.max(0, Math.round(numericProjectValue)));
      }
      return next;
    });

    const sliderWeights = denormalizeWeights(settings.weights);
    if (sliderWeights) {
      setWeights((prev) => ({ ...prev, ...sliderWeights }));
    }
  }, [project]);

  const queueRegenerationDetails = useMemo(() => {
    if (!queueRegeneration) {
      return null;
    }
    const actor = ensureObject(queueRegeneration.actor);
    const actorName = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();
    const actorLabel = actorName || actor.email || null;

    return {
      ...queueRegeneration,
      actor,
      actorLabel,
      occurredAt: toValidDate(queueRegeneration.occurredAt),
    };
  }, [queueRegeneration]);

  const queueMetadata = useMemo(() => {
    const baseSummary = queueSummary || {};
    const summaryGeneratedAt = toValidDate(baseSummary.generatedAt);
    const summaryExpiresAt = toValidDate(baseSummary.expiresAt);
    const summaryGeneratedBy = baseSummary.generatedBy ?? null;

    if (queueRegenerationDetails) {
      return {
        generatedAt: queueRegenerationDetails.occurredAt ?? summaryGeneratedAt,
        expiresAt: summaryExpiresAt,
        generatedBy: queueRegenerationDetails.actorId ?? summaryGeneratedBy,
        regeneration: queueRegenerationDetails,
      };
    }

    if (!sortedQueueEntries.length) {
      return { generatedAt: summaryGeneratedAt, expiresAt: summaryExpiresAt, generatedBy: summaryGeneratedBy, regeneration: null };
    }

    const generatedAtRaw = sortedQueueEntries
      .map((entry) => entry?.metadata?.generatedAt)
      .find((value) => value);
    const expiresAtRaw = sortedQueueEntries.map((entry) => entry?.expiresAt).find((value) => value);
    const generatedByEntry = sortedQueueEntries
      .map((entry) => entry?.metadata?.generatedBy)
      .find((value) => value != null);

    return {
      generatedAt: summaryGeneratedAt ?? toValidDate(generatedAtRaw),
      expiresAt: summaryExpiresAt ?? toValidDate(expiresAtRaw),
      generatedBy: summaryGeneratedBy ?? generatedByEntry ?? null,
      regeneration: null,
    };
  }, [queueSummary, sortedQueueEntries, queueRegenerationDetails]);

  const fairnessSummary = useMemo(() => {
    const fallback = () => {
      if (!sortedQueueEntries.length) {
        return { ensured: 0, newcomers: 0, returning: 0, averageScore: 0, averageScoreLabel: '0.00' };
      }
      let ensured = 0;
      let newcomers = 0;
      let returning = 0;
      let scoreTotal = 0;
      sortedQueueEntries.forEach((entry) => {
        const fairness = ensureObject(entry?.metadata?.fairness);
        if (fairness.ensuredNewcomer) {
          ensured += 1;
        }
        const assignmentCount = Number(entry?.breakdown?.totalAssigned ?? 0);
        if (!Number.isFinite(assignmentCount) || assignmentCount <= 0) {
          newcomers += 1;
        } else {
          returning += 1;
        }
        const scoreValue = Number(entry?.score ?? 0);
        if (Number.isFinite(scoreValue)) {
          scoreTotal += scoreValue;
        }
      });
      const averageScoreRaw = sortedQueueEntries.length ? scoreTotal / sortedQueueEntries.length : 0;
      const roundedAverage = Number(averageScoreRaw.toFixed(2));
      return {
        ensured,
        newcomers,
        returning,
        averageScore: roundedAverage,
        averageScoreLabel: averageScoreRaw.toFixed(2),
      };
    };

    if (queueSummary) {
      const baseAverage = Number(queueSummary.averageScore);
      const resolvedAverage = Number.isFinite(baseAverage) ? Number(baseAverage.toFixed(2)) : null;
      const fallbackSummary = fallback();
      return {
        ensured: queueSummary.ensuredNewcomers ?? fallbackSummary.ensured,
        newcomers: queueSummary.newcomers ?? fallbackSummary.newcomers,
        returning: queueSummary.returning ?? fallbackSummary.returning,
        averageScore: resolvedAverage ?? fallbackSummary.averageScore,
        averageScoreLabel:
          resolvedAverage != null
            ? resolvedAverage.toFixed(2)
            : fallbackSummary.averageScoreLabel,
      };
    }

    return fallback();
  }, [queueSummary, sortedQueueEntries]);

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
    [canView, formState, normalizedWeights, projectId, refreshProject, refreshQueue],
  );

  const handleCopyEmail = useCallback(
    async (entry, entryKey) => {
      const email = entry?.freelancer?.email?.trim();
      if (!email) {
        setFeedback({
          type: 'error',
          message: 'Freelancer contact information is unavailable for copying.',
        });
        return;
      }

      let copied = false;
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(email);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }

      if (!copied && typeof document !== 'undefined') {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = email;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          copied = document.execCommand('copy');
          document.body.removeChild(textarea);
        } catch (error) {
          copied = false;
        }
      }

      if (!copied) {
        setFeedback({
          type: 'error',
          message: 'We could not copy the email address. Try copying it from the profile instead.',
        });
        return;
      }

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      setCopiedEntryId(entryKey);
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedEntryId(null);
      }, 3000);
    },
    [],
  );

  const renderQueue = () => {
    if (queueLoading && !queueEntries.length) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="mt-4 h-4 w-1/2 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-full rounded bg-slate-200" />
            </div>
          ))}
        </div>
      );
    }

    if (!queueEntries.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
          {queueLoading
            ? 'Rebalancing your queue…'
            : events.length
            ? 'No live invitations. The last regeneration exhausted the queue.'
            : 'No matches yet. Generate the queue to invite high-fit freelancers into rotation.'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sortedQueueEntries.map((entry, index) => {
          const entryKey = entry.id ?? `${entry.freelancerId}-${index}`;
          const statusKey = typeof entry?.status === 'string' ? entry.status.toLowerCase() : 'default';
          const statusPreset = getAutoAssignStatusPreset(statusKey);
          const breakdown = ensureObject(entry?.breakdown);
          const metadata = ensureObject(entry?.metadata);
          const fairness = ensureObject(metadata.fairness);
          const projectName = entry.projectName ?? project?.title ?? `Project ${projectId}`;
          const canViewProfile = Boolean(entry?.freelancerId);
          const canViewQueue = Boolean(entry?.freelancerId);
          const canCopyEmail = Boolean(entry?.freelancer?.email);
          const showActions = canViewProfile || canViewQueue || canCopyEmail;
          const isCopied = copiedEntryId === entryKey;
          return (
            <article
              key={entryKey}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft focus-within:border-accent/60"
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
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide ${statusPreset.badgeClass}`}
                  >
                    {statusPreset.label}
                  </span>
                  {showActions ? (
                    <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      {canViewProfile ? (
                        <div className="relative group/action">
                          <Link
                            to={`/profile/${entry.freelancerId}`}
                            aria-label="View freelancer profile"
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-sm group-hover/action:block">
                            View profile
                          </span>
                        </div>
                      ) : null}
                      {canViewQueue ? (
                        <div className="relative group/action">
                          <Link
                            to={`/auto-assign/queue?freelancerId=${entry.freelancerId}`}
                            aria-label="Open freelancer queue detail"
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-sm group-hover/action:block">
                            Queue overview
                          </span>
                        </div>
                      ) : null}
                      {canCopyEmail ? (
                        <div className="relative group/action">
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(entry, entryKey)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                            aria-label="Copy freelancer email"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-sm group-hover/action:block">
                            Copy email
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
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
              {isCopied ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
                  Email copied to clipboard.
                </div>
              ) : null}
            </article>
          );
        })}
        <div className="space-y-2 rounded-3xl border border-slate-200 bg-surfaceMuted/60 px-4 py-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {queueMetadata.generatedAt
                ? `Generated ${formatRelativeTime(queueMetadata.generatedAt)}`
                : 'Awaiting first regeneration'}
            </span>
            {queueMetadata.expiresAt ? (
              <span>Expires {formatRelativeTime(queueMetadata.expiresAt)}</span>
            ) : null}
          </div>
          {queueMetadata.regeneration ? (
            <div
              className={`flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2 ${
                queueMetadata.regeneration.status === 'failed'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : queueMetadata.regeneration.status === 'exhausted'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              <span className="font-semibold uppercase tracking-[0.18em]">
                {queueMetadata.regeneration.status === 'failed'
                  ? 'Regeneration failed'
                  : queueMetadata.regeneration.status === 'exhausted'
                  ? 'Queue exhausted'
                  : 'Regeneration successful'}
              </span>
              {queueMetadata.regeneration.occurredAt ? (
                <span>
                  · {formatRelativeTime(queueMetadata.regeneration.occurredAt)}
                </span>
              ) : null}
              {queueMetadata.regeneration.actorLabel ? (
                <span>
                  · Triggered by {queueMetadata.regeneration.actorLabel}
                  {queueMetadata.regeneration.actor?.email &&
                  queueMetadata.regeneration.actorLabel !== queueMetadata.regeneration.actor.email
                    ? ` (${queueMetadata.regeneration.actor.email})`
                    : ''}
                </span>
              ) : null}
              {queueMetadata.regeneration.reason ? (
                <span className="basis-full text-[11px] font-medium">
                  Reason: {queueMetadata.regeneration.reason}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
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
                loading={queueLoading || eventsLoading}
                fromCache={false}
                lastUpdated={queueSnapshot.timestamp ?? queueUpdatedAt ?? eventsUpdatedAt ?? projectUpdatedAt}
                onRefresh={() => {
                  refreshQueue({ force: true });
                  refreshProject({ force: true });
                  refreshEvents({ force: true });
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
                        ? formatAutoAssignStatus(project.autoAssignStatus)
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
                    <p className="text-xs text-slate-500">
                      Keeps the invitation wave actionable for operations. Most teams rotate 6–12 freelancers per cycle.
                    </p>
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
                    <p className="text-xs text-slate-500">
                      Invitations auto-expire to make room for the next rotation once this window passes.
                    </p>
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
                    <p className="text-xs text-slate-500">
                      Used when weighting earnings balance for freelancers who have not yet worked with this project cohort.
                    </p>
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
                    <p className="text-xs text-slate-500">
                      Limits how many times the same freelancer can lead before another newcomer is prioritised.
                    </p>
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

              <div className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Fairness signals</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Rotation safeguards</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Monitor how many newcomers were prioritised and whether scoring remains balanced across the wave.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-surfaceMuted/70 px-3 py-1 text-xs font-semibold text-slate-600">
                    Avg score {fairnessSummary.averageScoreLabel}
                  </span>
                </div>
                <dl className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ensured newcomers</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">{fairnessSummary.ensured}</dd>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">First-time invites</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">{fairnessSummary.newcomers}</dd>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Returning freelancers</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-900">{fairnessSummary.returning}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-slate-500">
                  {fairnessSummary.ensured
                    ? 'Newcomer guarantees were applied during the latest regeneration.'
                    : 'No newcomer guarantee was applied during the latest regeneration.'}
                </p>
              </div>

              <div className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Audit log</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Recent auto-assign activity</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Trace queue changes and configuration updates to maintain compliance visibility across operations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refreshEvents({ force: true })}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    disabled={eventsLoading}
                  >
                    {eventsLoading ? 'Syncing…' : 'Refresh log'}
                  </button>
                </div>
                {eventsError ? (
                  <p className="mt-4 text-sm text-rose-600">{eventsError.message || 'Unable to load audit events.'}</p>
                ) : null}
                {eventsLoading && !events.length ? (
                  <div className="mt-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-surfaceMuted/60 px-4 py-3">
                        <div className="h-3 w-32 rounded bg-slate-200" />
                        <div className="mt-2 h-3 w-20 rounded bg-slate-200" />
                      </div>
                    ))}
                  </div>
                ) : null}
                {!eventsLoading && !events.length && !eventsError ? (
                  <p className="mt-4 text-sm text-slate-500">
                    Project events will appear once the workspace begins generating auto-match activity.
                  </p>
                ) : null}
                {events.length ? (
                  <ul className="mt-4 space-y-3">
                    {events.slice(0, 6).map((event) => {
                      const key = event.id ?? `${event.eventType}-${event.createdAt}`;
                      const details = describeEventDetails(event);
                      return (
                        <li key={key} className="rounded-3xl border border-slate-200 bg-surfaceMuted/60 px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{formatEventType(event.eventType)}</p>
                              {details ? <p className="mt-1 text-xs text-slate-500">{details}</p> : null}
                            </div>
                            <span className="text-xs text-slate-400">{formatRelativeTime(event.createdAt)}</span>
                          </div>
                        </li>
                      );
                    })}
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
