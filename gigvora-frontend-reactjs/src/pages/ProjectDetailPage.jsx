import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import projectsService from '../services/projects.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';
import ProjectOperationsSection from '../components/projects/ProjectOperationsSection.jsx';
import ProjectWorkspaceSection from '../components/projects/ProjectWorkspaceSection.jsx';
import { useProjectManagementAccess } from '../hooks/useAuthorization.js';
import useSession from '../hooks/useSession.js';

const DEFAULT_WEIGHTS = {
  recency: 0.25,
  rating: 0.2,
  completionQuality: 0.2,
  earningsBalance: 0.15,
  inclusion: 0.2,
};

function formatCurrency(amount, currency) {
  if (amount == null) {
    return 'TBC';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `${amount} ${currency ?? ''}`.trim();
  }
}

function formatQueueStatus(status) {
  if (!status) return 'Inactive';
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { canManageProjects, denialReason } = useProjectManagementAccess();
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [formState, setFormState] = useState(null);

  const project = overview?.project ?? null;
  const queueEntries = overview?.queueEntries ?? [];

  const weightsTotal = useMemo(() => {
    if (!formState) return 0;
    return Object.values(formState.weights).reduce((sum, value) => sum + Number(value || 0), 0);
  }, [formState]);

  const normalizedWeights = useMemo(() => {
    if (!formState || !weightsTotal) {
      return DEFAULT_WEIGHTS;
    }
    return Object.fromEntries(
      Object.entries(formState.weights).map(([key, value]) => [key, Number(value || 0) / weightsTotal]),
    );
  }, [formState, weightsTotal]);

  const lastQueueRefresh = useMemo(() => {
    if (!project?.autoAssignLastRunAt) {
      return null;
    }
    return formatRelativeTime(project.autoAssignLastRunAt);
  }, [project?.autoAssignLastRunAt]);

  const loadData = useCallback(async () => {
    if (!projectId || !canManageProjects) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [overviewResponse, eventsResponse] = await Promise.all([
        projectsService.fetchProject(projectId),
        projectsService.fetchProjectEvents(projectId, { limit: 40 }),
      ]);
      setOverview(overviewResponse);
      setEvents(eventsResponse?.events ?? []);
      const currentProject = overviewResponse.project ?? {};
      setFormState({
        title: currentProject.title ?? '',
        description: currentProject.description ?? '',
        status: currentProject.status ?? 'planning',
        location: currentProject.location ?? '',
        budgetAmount:
          currentProject.budgetAmount == null ? '' : Number(currentProject.budgetAmount ?? 0).toFixed(2),
        budgetCurrency: currentProject.budgetCurrency ?? 'USD',
        autoAssignEnabled: Boolean(currentProject.autoAssignEnabled),
        limit: currentProject.autoAssignSettings?.limit ?? 6,
        expiresInMinutes: currentProject.autoAssignSettings?.expiresInMinutes ?? 240,
        fairnessMaxAssignments: currentProject.autoAssignSettings?.fairness?.maxAssignments ?? 1,
        ensureNewcomer: currentProject.autoAssignSettings?.fairness?.ensureNewcomer !== false,
        weights: {
          ...DEFAULT_WEIGHTS,
          ...(currentProject.autoAssignSettings?.weights ?? {}),
        },
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, canManageProjects]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!canManageProjects) {
    return (
      <section className="relative overflow-hidden py-20">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.3),_transparent_65%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl space-y-8 px-6">
          <PageHeader
            eyebrow="Projects"
            title="Project workspace locked"
            description="You need an operations, agency, or admin role to view this workspace."
          />
          <div className="rounded-4xl border border-amber-200 bg-amber-50/70 p-8 text-sm text-amber-900 shadow-sm">
            <p className="text-base font-semibold text-amber-900">Access required</p>
            <p className="mt-3 leading-relaxed">{denialReason}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="mailto:operations@gigvora.com?subject=Project workspace access request"
                className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-5 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400"
              >
                Email operations team
                <span aria-hidden="true">→</span>
              </a>
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Return to projects
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const handleFieldChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWeightChange = (field) => (event) => {
    const value = Number(event.target.value);
    setFormState((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [field]: value,
      },
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formState) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: formState.title,
        description: formState.description,
        status: formState.status,
        location: formState.location,
        budgetAmount:
          formState.budgetAmount === '' ? null : Number.parseFloat(formState.budgetAmount ?? 0),
        budgetCurrency: formState.budgetCurrency,
        autoAssign: formState.autoAssignEnabled
          ? {
              enabled: true,
              regenerateQueue: true,
              settings: {
                limit: Number(formState.limit) || undefined,
                expiresInMinutes: Number(formState.expiresInMinutes) || undefined,
                fairness: {
                  ensureNewcomer: formState.ensureNewcomer,
                  maxAssignments: Number(formState.fairnessMaxAssignments) || 0,
                },
                weights: normalizedWeights,
              },
            }
          : { enabled: false },
        actorId: session?.userId ?? session?.id ?? session?.profileId ?? undefined,
      };

      await projectsService.updateProject(projectId, payload);
      analytics.track(
        'web_project_details_saved',
        {
          projectId,
          autoAssignEnabled: formState.autoAssignEnabled,
          limit: Number(formState.limit) || null,
        },
        { source: 'web_app' },
      );
      await loadData();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!projectId || !formState?.autoAssignEnabled) return;
    setSaving(true);
    setError(null);
    try {
      await projectsService.updateProject(projectId, {
        autoAssign: {
          enabled: true,
          regenerateQueue: true,
          settings: {
            limit: Number(formState.limit) || undefined,
            expiresInMinutes: Number(formState.expiresInMinutes) || undefined,
            fairness: {
              ensureNewcomer: formState.ensureNewcomer,
              maxAssignments: Number(formState.fairnessMaxAssignments) || 0,
            },
            weights: normalizedWeights,
          },
        },
        actorId: session?.userId ?? session?.id ?? session?.profileId ?? undefined,
      });
      analytics.track(
        'web_project_queue_regenerated',
        { projectId, limit: Number(formState.limit) || null },
        { source: 'web_app' },
      );
      await loadData();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(191,219,254,0.4),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl space-y-10 px-6">
        <PageHeader
          eyebrow="Projects"
          title={project ? project.title : 'Project overview'}
          description={
            project
              ? 'Manage scopes, budgets, and auto-assign queues in one place so every freelancer rotation stays fair.'
              : 'Loading the latest project signals…'
          }
          meta={
            <DataStatus
              loading={loading}
              fromCache={false}
              lastUpdated={project?.updatedAt ?? null}
              onRefresh={loadData}
            />
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
            >
              ← Back
            </button>
            {project ? (
              <Link
                to={`/projects/${project.id}/auto-match`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Auto-match workspace
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
          {project ? (
            <div className="inline-flex flex-wrap items-center gap-3 rounded-full border border-accent/20 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-soft">
              <span>Auto-assign {project.autoAssignEnabled ? 'enabled' : 'disabled'}</span>
              <span className="rounded-full bg-surfaceMuted/80 px-3 py-1 text-slate-500">
                {formatQueueStatus(project.autoAssignStatus)}
              </span>
              <span className="rounded-full bg-surfaceMuted/80 px-3 py-1 text-slate-500">
                Queue size {project.autoAssignLastQueueSize ?? 0}
              </span>
              <span className="rounded-full bg-surfaceMuted/80 px-3 py-1 text-slate-500">
                {lastQueueRefresh ? `Last refresh ${lastQueueRefresh}` : 'Queue not generated yet'}
              </span>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error.message || 'Unable to save the latest changes right now.'}
          </div>
        ) : null}

        <form
          onSubmit={handleSave}
          className="grid gap-8 rounded-4xl border border-slate-200 bg-white/95 p-8 shadow-lg lg:grid-cols-[1.1fr,0.9fr]"
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="space-y-1 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">Project title</span>
                <input
                  type="text"
                  required
                  value={formState?.title ?? ''}
                  onChange={handleFieldChange('title')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Global growth analytics"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">Status</span>
                <select
                  value={formState?.status ?? 'planning'}
                  onChange={handleFieldChange('status')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="planning">Planning</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">Location</span>
                <input
                  type="text"
                  value={formState?.location ?? ''}
                  onChange={handleFieldChange('location')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Remote • GMT+2"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">Description</span>
                <textarea
                  required
                  rows={4}
                  value={formState?.description ?? ''}
                  onChange={handleFieldChange('description')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Outline objectives, milestones, and rituals."
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">Budget amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState?.budgetAmount ?? ''}
                  onChange={handleFieldChange('budgetAmount')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">Currency</span>
                <input
                  type="text"
                  value={formState?.budgetCurrency ?? 'USD'}
                  onChange={handleFieldChange('budgetCurrency')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 uppercase focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-surfaceMuted/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Project summary</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Current budget</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(project?.budgetAmount ?? null, project?.budgetCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Queue window</span>
                  <span>{formState?.expiresInMinutes ?? 0} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-assign</span>
                  <span>
                    {formState?.autoAssignEnabled
                      ? formatQueueStatus(project?.autoAssignStatus)
                      : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fairness priority</span>
                  <span>
                    ≤ {formState?.fairnessMaxAssignments ?? 0} active assignments &bull;{' '}
                    {formState?.ensureNewcomer ? 'Newcomers prioritised' : 'Rotation only'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last queue refresh</span>
                  <span>{lastQueueRefresh ?? 'Not yet generated'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <fieldset className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
              <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Auto-assign configuration
              </legend>
              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Enable weighted auto-assign</p>
                  <p className="text-xs text-slate-500">
                    Rotates freelancers with fairness scoring across recency, quality, and earnings balance.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formState?.autoAssignEnabled ?? false}
                  onChange={handleFieldChange('autoAssignEnabled')}
                  className="h-6 w-12 rounded-full border border-slate-300 bg-white text-accent focus:ring-accent"
                />
              </label>
              {formState?.autoAssignEnabled ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                    <label className="space-y-1">
                      <span className="font-semibold text-slate-900">Queue size</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formState?.limit ?? 0}
                        onChange={handleFieldChange('limit')}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-semibold text-slate-900">Response window (minutes)</span>
                      <input
                        type="number"
                        min="30"
                        max="1440"
                        value={formState?.expiresInMinutes ?? 0}
                        onChange={handleFieldChange('expiresInMinutes')}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 rounded-3xl border border-slate-200 bg-surfaceMuted/40 p-4 text-xs text-slate-500">
                    <div className="flex items-center justify-between font-semibold text-slate-500">
                      <span>Weighting</span>
                      <span>Total {Math.round((weightsTotal || 0) * 100)}%</span>
                    </div>
                    {[
                      ['recency', 'Last assignment recency'],
                      ['rating', 'Quality rating'],
                      ['completionQuality', 'Completion rate'],
                      ['earningsBalance', 'Earnings balance'],
                      ['inclusion', 'New freelancer boost'],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-semibold text-slate-900">{label}</span>
                          <span className="text-slate-400">
                            {Math.round((normalizedWeights[key] || 0) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={formState?.weights?.[key] ?? 0}
                          onChange={handleWeightChange(key)}
                          className="w-full accent-accent"
                        />
                      </label>
                    ))}
                  </div>
                  <label className="space-y-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">Max assignments for fairness priority</span>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={formState?.fairnessMaxAssignments ?? 0}
                      onChange={handleFieldChange('fairnessMaxAssignments')}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={formState?.ensureNewcomer ?? false}
                      onChange={handleFieldChange('ensureNewcomer')}
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    <span>Always reserve the first slot for newcomers when available</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={saving || loading}
                    className="inline-flex items-center gap-2 rounded-full border border-accent px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Regenerate queue
                  </button>
                </div>
              ) : null}
            </fieldset>

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-surfaceMuted/60 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Queue snapshot
                </h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                  {queueEntries.length} queued
                </span>
              </div>
              {queueEntries.length ? (
                <ul className="space-y-3">
                  {queueEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-xs text-slate-600"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={`${entry.freelancer?.firstName ?? 'Freelancer'} ${entry.freelancer?.lastName ?? ''}`.trim()}
                          seed={entry.freelancer?.id ?? entry.id}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {entry.freelancer?.firstName} {entry.freelancer?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Score {(entry.score * 100).toFixed(1)} • {entry.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500">Priority {entry.priorityBucket}</p>
                        <p className="text-xs text-slate-400">
                          Newcomer boost {Math.round((entry.breakdown?.newFreelancerScore ?? 0) * 100)}%
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500">
                  No freelancers in the queue yet. Adjust the weighting or regenerate once new talent opts in.
                </p>
              )}
            </div>

            {projectId ? <ProjectWorkspaceSection projectId={projectId} /> : null}

            {projectId ? <ProjectOperationsSection projectId={projectId} /> : null}

            <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Activity log</h2>
              {events.length ? (
                <ul className="space-y-3">
                  {events.map((event) => (
                    <li key={event.id} className="rounded-3xl border border-slate-200 bg-surfaceMuted/40 px-4 py-3 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{event.eventType.replace(/_/g, ' ')}</span>
                        <span className="text-slate-400">{formatRelativeTime(event.createdAt)}</span>
                      </div>
                      {event.payload?.changes ? (
                        <ul className="mt-2 space-y-1">
                          {event.payload.changes.map((change, index) => (
                            <li key={`${event.id}-${change.field}-${index}`} className="text-slate-500">
                              <span className="font-semibold text-slate-600">{change.field}</span>: {String(change.previous ?? '—')} → {String(change.current ?? '—')}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Project events will appear here once activity begins.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                to="/projects"
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || loading || !formState}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
