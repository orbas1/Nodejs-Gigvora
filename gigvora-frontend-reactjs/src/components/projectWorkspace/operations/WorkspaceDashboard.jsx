import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const STATUS_TOKENS = {
  on_track: {
    label: 'On track',
    tone: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    halo: 'from-emerald-500/20 to-emerald-500/0',
  },
  at_risk: {
    label: 'At risk',
    tone: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    halo: 'from-amber-500/20 to-amber-500/0',
  },
  blocked: {
    label: 'Blocked',
    tone: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-700',
    halo: 'from-rose-500/20 to-rose-500/0',
  },
  accelerating: {
    label: 'Accelerating',
    tone: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700',
    halo: 'from-indigo-500/20 to-indigo-500/0',
  },
};

const DEFAULT_WIDGET_ORDER = ['health', 'velocity', 'tasks', 'milestones', 'activity', 'files'];

const WIDGET_LABELS = {
  health: 'Programme pulse',
  velocity: 'Momentum analytics',
  tasks: 'Priority lane',
  milestones: 'Milestone radar',
  activity: 'Signal stream',
  files: 'File vault glance',
};

function formatNumber(value, options = {}) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    notation: options.compact ? 'compact' : 'standard',
  });
  return formatter.format(value);
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) {
    return '—';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(bytes);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: size < 10 && unitIndex > 0 ? 1 : 0,
  });

  return `${formatter.format(size)} ${units[unitIndex]}`;
}

function WidgetChrome({ id, title, subtitle, actions, onMove, disableMoveLeft, disableMoveRight, children }) {
  return (
    <section
      className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm"
      data-widget-id={id}
    >
      <div className="flex flex-col gap-2 border-b border-slate-100 p-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onMove?.('left')}
              disabled={disableMoveLeft}
              className="rounded-full border border-slate-200 px-3 py-1 font-medium transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-30"
            >
              Move left
            </button>
            <button
              type="button"
              onClick={() => onMove?.('right')}
              disabled={disableMoveRight}
              className="rounded-full border border-slate-200 px-3 py-1 font-medium transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-30"
            >
              Move right
            </button>
          </div>
          {actions}
        </div>
      </div>
      <div className="flex-1 p-6 pt-5">{children}</div>
    </section>
  );
}

WidgetChrome.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  onMove: PropTypes.func,
  disableMoveLeft: PropTypes.bool,
  disableMoveRight: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

function MetricBadge({ label, value, change, unit, intent }) {
  const formatted = value == null ? '—' : `${formatNumber(value, { compact: true })}${unit ? unit : ''}`;
  const delta = (() => {
    if (!change || Number.isNaN(Number(change))) return null;
    const numeric = Number(change);
    const direction = numeric > 0 ? '▲' : numeric < 0 ? '▼' : '■';
    const tone = numeric > 0 ? 'text-emerald-600' : numeric < 0 ? 'text-rose-600' : 'text-slate-500';
    return (
      <span className={clsx('ml-2 inline-flex items-center gap-1 text-xs font-medium', tone)}>
        {direction}
        {Math.abs(numeric)}%
      </span>
    );
  })();
  return (
    <div
      className={clsx(
        'flex flex-col gap-1 rounded-2xl border px-5 py-4 transition',
        intent === 'critical'
          ? 'border-rose-200 bg-rose-50/60'
          : intent === 'focus'
          ? 'border-amber-200 bg-amber-50/60'
          : 'border-slate-200 bg-white/70 hover:border-slate-300',
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-2xl font-semibold text-slate-900">{formatted}</span>
      {delta}
    </div>
  );
}

MetricBadge.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  change: PropTypes.number,
  unit: PropTypes.string,
  intent: PropTypes.oneOf(['default', 'critical', 'focus']),
};

MetricBadge.defaultProps = {
  value: undefined,
  change: undefined,
  unit: '',
  intent: 'default',
};

function ActivityItem({ item }) {
  return (
    <li className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>{item.actor}</span>
        <time dateTime={item.timestamp}>{formatDate(item.timestamp)}</time>
      </div>
      <p className="text-slate-700">{item.message}</p>
      {item.related ? (
        <div className="text-xs text-slate-500">{item.related}</div>
      ) : null}
    </li>
  );
}

ActivityItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    message: PropTypes.string.isRequired,
    actor: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    related: PropTypes.string,
  }).isRequired,
};

function FilesGlance({ files }) {
  if (!files.length) {
    return <p className="text-sm text-slate-500">No files uploaded yet. Start curating your workspace vault.</p>;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {files.map((file) => (
        <li key={file.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">
              {file.type} · v{file.version ?? 1} · {formatFileSize(file.size)}
            </p>
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{formatDate(file.updatedAt)}</span>
        </li>
      ))}
    </ul>
  );
}

FilesGlance.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      size: PropTypes.number,
      version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),
};

FilesGlance.defaultProps = {
  files: [],
};

function buildMetricBadges(metrics = {}, storage) {
  const items = [];

  if (metrics.progressPercent != null) {
    items.push({
      id: 'progress',
      label: 'Delivery progress',
      value: Number(metrics.progressPercent),
      unit: '%',
      change: metrics.velocityScore == null ? undefined : Number(metrics.velocityScore),
      intent: 'default',
    });
  }

  if (metrics.budgetActual != null && metrics.budgetAllocated != null) {
    const allocation = Number(metrics.budgetAllocated) || 0;
    const actual = Number(metrics.budgetActual) || 0;
    const usedPercent = allocation ? Number(((actual / allocation) * 100).toFixed(1)) : null;
    const intent = usedPercent != null && usedPercent > 100 ? 'critical' : usedPercent != null && usedPercent > 85 ? 'focus' : 'default';
    items.push({
      id: 'budget',
      label: 'Budget utilised',
      value: usedPercent,
      unit: usedPercent != null ? '%' : '',
      change: metrics.budgetVariance == null ? undefined : Number((metrics.budgetVariance * 100).toFixed(1)),
      intent,
    });
  }

  if (metrics.pendingApprovals != null) {
    items.push({
      id: 'approvals',
      label: 'Pending approvals',
      value: Number(metrics.pendingApprovals),
      intent: metrics.pendingApprovals > 0 ? 'focus' : 'default',
    });
  }

  if (metrics.unreadMessages != null) {
    items.push({
      id: 'conversations',
      label: 'Unread updates',
      value: Number(metrics.unreadMessages),
      intent: metrics.unreadMessages > 5 ? 'focus' : 'default',
    });
  }

  if (storage?.usedPercent != null) {
    items.push({
      id: 'storage',
      label: 'Vault usage',
      value: Number(storage.usedPercent),
      unit: '%',
      intent: storage.usedPercent > 90 ? 'critical' : storage.usedPercent > 75 ? 'focus' : 'default',
    });
  }

  return items.length ? items.slice(0, 5) : [{ id: 'progress', label: 'Delivery progress', value: null, unit: '%', intent: 'default' }];
}

function deriveHealthSummary(workspace = {}, metrics = {}, brief, approvals = [], timelineEntries = []) {
  const status = workspace.status ?? metrics.riskLevel ?? 'on_track';
  const focusAreas = [];

  if (Array.isArray(brief?.objectives)) {
    brief.objectives
      .filter((objective) => objective)
      .slice(0, 3)
      .forEach((objective, index) => {
        if (typeof objective === 'string') {
          focusAreas.push({ id: `objective-${index}`, label: objective, description: brief.summary ?? '' });
        } else if (objective?.title) {
          focusAreas.push({ id: `objective-${objective.title}-${index}`, label: objective.title, description: objective.description ?? '' });
        }
      });
  }

  if (!focusAreas.length && timelineEntries.length) {
    timelineEntries
      .slice()
      .sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0))
      .slice(0, 2)
      .forEach((entry) => {
        focusAreas.push({
          id: `timeline-${entry.id}`,
          label: entry.title,
          description: entry.ownerName ? `Owner: ${entry.ownerName}` : '',
        });
      });
  }

  const risks = approvals
    .filter((approval) => approval.status !== 'approved')
    .slice(0, 3)
    .map((approval) => ({
      id: `approval-${approval.id}`,
      label: approval.title,
      owner: approval.ownerName ?? approval.reviewerName ?? '',
      mitigation: approval.dueAt ? `Due ${formatDate(approval.dueAt)}` : approval.stage ?? '',
    }));

  const summary = workspace.notes || brief?.summary || 'Workspace signals are available once the delivery engine begins sending telemetry.';
  const score = metrics.healthScore ?? workspace.healthScore ?? null;

  return { status, score, summary, focusAreas, risks };
}

function deriveMilestones(timelineEntries = []) {
  return timelineEntries
    .slice()
    .sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0))
    .slice(0, 4)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      dueDate: entry.endAt ?? entry.startAt,
      owner: entry.ownerName ?? '',
      progress: entry.progressPercent == null ? null : Number(entry.progressPercent),
      status: entry.status ?? null,
    }));
}

function deriveTaskDeck(tasks = []) {
  return tasks
    .slice()
    .sort((a, b) => new Date(a.endDate || a.startDate || 0) - new Date(b.endDate || b.startDate || 0))
    .slice(0, 4)
    .map((task) => ({
      id: task.id,
      title: task.title,
      owner: task.ownerName ?? '',
      status: task.status ?? '',
      dueDate: task.endDate ?? task.startDate ?? null,
      priority: task.priority ?? task.metadata?.priority ?? null,
    }));
}

function deriveFileDeck(files = []) {
  return files
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.uploadedAt || 0) - new Date(a.updatedAt || a.uploadedAt || 0))
    .slice(0, 4)
    .map((file) => ({
      id: file.id,
      name: file.name,
      type: file.fileType ?? file.type ?? 'File',
      size: file.sizeBytes ?? file.size ?? 0,
      version: file.version ?? 1,
      updatedAt: file.updatedAt ?? file.uploadedAt ?? null,
    }));
}

function deriveActivityFallback(conversations = []) {
  return conversations
    .flatMap((conversation) =>
      (conversation.messages ?? [])
        .slice()
        .sort((a, b) => new Date(b.postedAt || b.createdAt || 0) - new Date(a.postedAt || a.createdAt || 0))
        .slice(0, 2)
        .map((message) => ({
          id: `conversation-${conversation.id}-message-${message.id ?? message.postedAt}`,
          actor: message.authorName ?? conversation.topic ?? 'Workspace',
          message: message.body ?? '',
          related: conversation.topic ?? '',
          timestamp: message.postedAt ?? message.createdAt ?? null,
        })),
    )
    .filter((item) => item.message)
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 8);
}

function buildQuickActions(project, workspace) {
  const projectName = project?.title ?? 'workspace';
  return [
    {
      id: 'refresh-dashboard',
      label: 'Refresh dashboard',
      description: `Sync the latest telemetry for ${projectName}.`,
    },
    {
      id: 'review-timeline',
      label: 'Review delivery timeline',
      description: 'Open the delivery schedule to adjust milestones and owners.',
    },
    {
      id: 'share-digest',
      label: 'Share executive digest',
      description: 'Distribute a curated summary to executive sponsors.',
    },
  ];
}

function buildMomentumNarrative(metrics = {}, healthSummary, taskDeck = []) {
  const segments = [];

  if (metrics.velocityScore != null) {
    const velocity = Number(metrics.velocityScore);
    segments.push(
      `Velocity index is holding at ${formatNumber(velocity, { minimumFractionDigits: 0 })}, keeping delivery aligned with the planned glidepath.`,
    );
  } else {
    segments.push('Velocity telemetry is syncing—refresh shortly for the latest throughput read.');
  }

  if (metrics.progressPercent != null) {
    const progress = Number(metrics.progressPercent);
    const descriptor = progress >= 90 ? 'nearing completion' : progress >= 60 ? 'progressing steadily' : 'still early in execution';
    segments.push(`Programme progress is ${formatNumber(progress, { minimumFractionDigits: 0 })}% ${descriptor}.`);
  }

  if (metrics.budgetVariance != null) {
    const variance = Number(metrics.budgetVariance);
    if (variance > 0) {
      segments.push(`Budget burn is ${formatNumber(variance * 100)}% favourable against plan.`);
    } else if (variance < 0) {
      segments.push(`Budget variance is ${formatNumber(Math.abs(variance) * 100)}% over plan—review mitigation options.`);
    }
  }

  const flaggedTasks = taskDeck.filter((task) => task.priority === 'high' || task.status === 'blocked');
  if (flaggedTasks.length) {
    segments.push(`${flaggedTasks.length} priority tasks need immediate attention to maintain momentum.`);
  }

  if (healthSummary?.risks?.length) {
    const nextRisk = healthSummary.risks[0];
    segments.push(`Top risk: ${nextRisk.label}${nextRisk.owner ? ` · owner ${nextRisk.owner}` : ''}.`);
  }

  if (!segments.length) {
    return 'Telemetry will generate a momentum story once enough data syncs from delivery and collaboration tools.';
  }

  return segments.join(' ');
}

export default function WorkspaceDashboard({
  title,
  project,
  workspace,
  metrics,
  brief,
  approvals,
  timelineEntries,
  tasks,
  activity,
  files,
  conversations,
  storage,
  quickActions,
  onQuickAction,
  onWidgetReorder,
  initialHiddenWidgets,
}) {
  const [widgetOrder, setWidgetOrder] = useState(() => DEFAULT_WIDGET_ORDER.filter((id) => id !== 'velocity').concat('velocity'));
  const [hiddenWidgets, setHiddenWidgets] = useState(() => new Set(initialHiddenWidgets ?? []));

  const metricBadges = useMemo(() => buildMetricBadges(metrics, storage), [metrics, storage]);
  const healthSummary = useMemo(
    () => deriveHealthSummary(workspace, metrics, brief, approvals, timelineEntries ?? []),
    [workspace, metrics, brief, approvals, timelineEntries],
  );
  const milestoneCards = useMemo(
    () => (timelineEntries?.length ? deriveMilestones(timelineEntries) : []),
    [timelineEntries],
  );
  const taskDeck = useMemo(() => deriveTaskDeck(tasks ?? []), [tasks]);
  const activityItems = useMemo(() => {
    if (activity?.length) {
      return activity;
    }
    return deriveActivityFallback(conversations ?? []);
  }, [activity, conversations]);
  const fileDeck = useMemo(() => deriveFileDeck(files ?? []), [files]);
  const resolvedActions = useMemo(
    () => (quickActions?.length ? quickActions : buildQuickActions(project, workspace)),
    [quickActions, project, workspace],
  );
  const momentumNarrative = useMemo(
    () => buildMomentumNarrative(metrics ?? {}, healthSummary, taskDeck),
    [metrics, healthSummary, taskDeck],
  );

  const statusToken = STATUS_TOKENS[healthSummary.status] ?? STATUS_TOKENS.on_track;

  const visibleWidgets = useMemo(() => {
    return widgetOrder.filter((id) => !hiddenWidgets.has(id));
  }, [widgetOrder, hiddenWidgets]);

  function handleReorder(widgetId, direction) {
    setWidgetOrder((prev) => {
      const next = [...prev];
      const index = next.indexOf(widgetId);
      if (index === -1) return prev;
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return prev;
      }
      const reordered = [...next];
      reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, widgetId);
      onWidgetReorder?.(reordered);
      return reordered;
    });
  }

  function toggleWidget(widgetId) {
    setHiddenWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(widgetId)) {
        next.delete(widgetId);
      } else {
        next.add(widgetId);
      }
      return next;
    });
  }

  const focusHighlights = useMemo(() => {
    const soonest = milestoneCards
      .slice()
      .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
      .slice(0, 2);
    return [
      ...soonest.map((item) => ({
        id: `milestone-${item.id}`,
        label: item.title,
        meta: `${item.dueDate ? `Due ${formatDate(item.dueDate)}` : 'Scheduled'}${item.owner ? ` · ${item.owner}` : ''}`,
      })),
      ...(healthSummary.risks ?? []).map((risk) => ({
        id: `risk-${risk.id}`,
        label: risk.label,
        meta: `${risk.owner ? `Owner ${risk.owner}` : 'Owner TBC'}${risk.mitigation ? ` · ${risk.mitigation}` : ''}`,
      })),
    ];
  }, [milestoneCards, healthSummary]);

  return (
    <article className="flex flex-col gap-10 rounded-[40px] bg-slate-50/70 p-8 shadow-lg shadow-slate-900/5">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Project workspace</p>
          <h2 className="text-3xl font-semibold text-slate-900">{title ?? 'Executive project cockpit'}</h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Monitor programme health, unblock delivery, and keep every stakeholder aligned without leaving the workspace.
            Widgets can be reordered, hidden, and personalised per persona to mirror the polish of leading executive platforms.
          </p>
        </div>
        <div className="w-full max-w-xs rounded-3xl border border-slate-200 bg-white/80 p-5 text-sm text-slate-600 shadow-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
            <span>Status</span>
            <span>Score</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', statusToken.badge)}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {statusToken.label}
            </span>
            <span className="text-3xl font-semibold text-slate-900">{formatNumber(healthSummary.score)}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">{healthSummary.summary}</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricBadges.map((metric) => (
          <MetricBadge key={metric.id} {...metric} intent={metric.intent ?? 'default'} />
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
        <div className="flex flex-wrap gap-2">
          {resolvedActions.map((action) => (
            <button
              type="button"
              key={action.id}
              onClick={() => onQuickAction?.(action)}
              className="group flex flex-col rounded-2xl border border-slate-200 px-4 py-3 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">{action.label}</span>
              <span className="text-xs text-slate-500">{action.description}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          {visibleWidgets.map((widgetId) => (
            <button
              key={widgetId}
              type="button"
              onClick={() => toggleWidget(widgetId)}
              className="rounded-full border border-slate-200 px-3 py-1 transition hover:border-slate-300 hover:text-slate-900"
            >
              Hide {WIDGET_LABELS[widgetId] ?? widgetId}
            </button>
          ))}
          {[...hiddenWidgets].map((widgetId) => (
            <button
              key={`show-${widgetId}`}
              type="button"
              onClick={() => toggleWidget(widgetId)}
              className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600 transition hover:border-emerald-300"
            >
              Show {WIDGET_LABELS[widgetId] ?? widgetId}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {visibleWidgets.map((widgetId, index) => {
          const disableMoveLeft = index === 0;
          const disableMoveRight = index === visibleWidgets.length - 1;

          if (widgetId === 'health') {
            return (
              <WidgetChrome
                key="health"
                id="health"
                title="Programme pulse"
                subtitle="Signals curated across delivery, sentiment, and governance rituals"
                onMove={(direction) => handleReorder('health', direction)}
                disableMoveLeft={disableMoveLeft}
                disableMoveRight={disableMoveRight}
              >
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50">
                  <div className={clsx('absolute inset-0 bg-gradient-to-br', statusToken.halo)} aria-hidden="true" />
                  <div className="relative grid gap-6 p-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Focus areas</h4>
                      {healthSummary.focusAreas.length ? (
                        <ul className="space-y-3">
                          {healthSummary.focusAreas.map((item) => (
                            <li key={item.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                              <p className="text-xs text-slate-500">{item.description}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Focus areas will populate as workspace objectives and delivery milestones sync from the brief.
                        </p>
                      )}
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Emerging risks</h4>
                      {healthSummary.risks.length ? (
                        <ul className="space-y-3">
                          {healthSummary.risks.map((risk) => (
                            <li key={risk.id} className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-700">
                              <p className="font-semibold">{risk.label}</p>
                              <p className="text-xs">Owner: {risk.owner}</p>
                              <p className="text-xs">Mitigation: {risk.mitigation}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-emerald-600">All tracks are green. Keep reinforcing strong rituals.</p>
                      )}
                    </div>
                  </div>
                </div>
              </WidgetChrome>
            );
          }

          if (widgetId === 'velocity') {
            return (
              <WidgetChrome
                key="velocity"
                id="velocity"
                title="Momentum analytics"
                subtitle="Velocity, quality, and sentiment blended into a weekly trend line"
                onMove={(direction) => handleReorder('velocity', direction)}
                disableMoveLeft={disableMoveLeft}
                disableMoveRight={disableMoveRight}
              >

                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {metricBadges.slice(0, 3).map((metric) => {
                      const change = metric.change == null ? null : Number(metric.change);
                      return (
                        <div key={metric.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-400">{metric.label}</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {formatNumber(metric.value)}
                            {metric.unit}
                          </p>
                          <p
                            className={clsx(
                              'text-xs font-medium',
                              change == null
                                ? 'text-slate-400'
                                : change > 0
                                ? 'text-emerald-600'
                                : change < 0
                                ? 'text-rose-600'
                                : 'text-slate-500',
                            )}
                          >
                            {change == null
                              ? 'Awaiting delta'
                              : `${change > 0 ? '▲' : change < 0 ? '▼' : '■'} ${Math.abs(change)}%`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-3xl border border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-6">
                    <h4 className="text-sm font-semibold text-slate-900">Momentum narrative</h4>
                    <p className="mt-2 text-sm text-slate-600">{momentumNarrative}</p>
                  </div>
                </div>
              </WidgetChrome>
            );
          }

          if (widgetId === 'tasks') {
            return (
              <WidgetChrome
                key="tasks"
                id="tasks"
                title="Priority lane"
                subtitle="Critical tasks curated across squads and rituals"
                onMove={(direction) => handleReorder('tasks', direction)}
                disableMoveLeft={disableMoveLeft}
                disableMoveRight={disableMoveRight}
                actions={<span className="text-xs text-slate-500">{taskDeck.length} spotlight tasks</span>}
              >
                {taskDeck.length ? (
                  <ul className="space-y-3">
                    {taskDeck.map((task) => (
                      <li key={task.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {task.priority ?? 'Priority TBC'}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>Owner {task.owner || 'Unassigned'}</span>
                          <span>{task.status || 'Status pending'}</span>
                          <time dateTime={task.dueDate}>Due {formatDate(task.dueDate)}</time>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => onQuickAction?.({ id: 'task-complete', task })}
                            className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300"
                          >
                            Mark ready
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickAction?.({ id: 'task-huddle', task })}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                          >
                            Open huddle
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    Priority tasks will appear here once squads flag blockers or delivery commitments in the workspace.
                  </p>
                )}
              </WidgetChrome>
            );
          }

          if (widgetId === 'milestones') {
            return (
              <WidgetChrome
                key="milestones"
                id="milestones"
                title="Milestone radar"
                subtitle="Countdown and accountability matrix"
                onMove={(direction) => handleReorder('milestones', direction)}
                disableMoveLeft={disableMoveLeft}
                disableMoveRight={disableMoveRight}
              >
                {milestoneCards.length ? (
                  <ul className="space-y-3">
                    {milestoneCards.map((milestone) => (
                      <li key={milestone.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                          <span>{milestone.title}</span>
                          <time dateTime={milestone.dueDate} className="text-xs font-medium text-slate-500">
                            Due {formatDate(milestone.dueDate)}
                          </time>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Owner: {milestone.owner || 'Unassigned'}</p>
                        <div className="mt-3 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                            style={{ width: `${Math.min(Math.max(milestone.progress ?? 0, 0), 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    Key delivery milestones will surface here once the timeline is populated in the workspace planner.
                  </p>
                )}
              </WidgetChrome>
            );
          }

          if (widgetId === 'activity') {
            return (
              <WidgetChrome
                key="activity"
                id="activity"
                title="Signal stream"
                subtitle="Real-time highlights curated for executives and partners"
                onMove={(direction) => handleReorder('activity', direction)}
                disableMoveLeft={disableMoveLeft}
                disableMoveRight={disableMoveRight}
              >
                {activityItems.length ? (
                  <ul className="space-y-3">
                    {activityItems.map((item) => (
                      <ActivityItem key={item.id} item={item} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    Activity updates will stream in as conversations and approvals progress across the workspace.
                  </p>
                )}
              </WidgetChrome>
            );
          }

          if (widgetId === 'files') {
            return (
              <WidgetChrome
                key="files"
                id="files"
                title="File vault glance"
                subtitle="Latest artefacts, approvals, and executive-ready assets"
                onMove={(direction) => handleReorder('files', direction)}
                disableMoveLeft={disableMoveLeft}
                disableMoveRight={disableMoveRight}
                actions={<span className="text-xs text-slate-500">{fileDeck.length} curated files</span>}
              >
                <FilesGlance files={fileDeck.slice(0, 4)} />
              </WidgetChrome>
            );
          }

          return null;
        })}
      </section>

      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Highlights</h3>
          {focusHighlights.length ? (
            <ul className="mt-3 space-y-2">
              {focusHighlights.map((highlight) => (
                <li
                  key={highlight.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-600"
                >
                  <p className="font-semibold text-slate-900">{highlight.label}</p>
                  <p className="text-xs text-slate-500">{highlight.meta}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Highlights will populate with upcoming milestones and risk signals once data streams in from the workspace.
            </p>
          )}
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-6 text-white">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">Executive broadcast</h3>
            <p className="mt-2 text-sm leading-6 text-indigo-100">
              Summaries, artefacts, and calls-to-action sync automatically into the workspace digest—perfect for weekly sponsor
              briefings or investor notes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onQuickAction?.({ id: 'broadcast-digest' })}
            className="self-start rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
          >
            Generate digest
          </button>
        </div>
      </section>
    </article>
  );
}

WorkspaceDashboard.propTypes = {
  title: PropTypes.string,
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
  }),
  workspace: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.oneOf(Object.keys(STATUS_TOKENS)),
    healthScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    notes: PropTypes.string,
  }),
  metrics: PropTypes.shape({
    progressPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    velocityScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    budgetActual: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    budgetAllocated: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    budgetVariance: PropTypes.number,
    pendingApprovals: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    unreadMessages: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  brief: PropTypes.shape({
    summary: PropTypes.string,
    objectives: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          title: PropTypes.string,
          description: PropTypes.string,
        }),
      ]),
    ),
  }),
  approvals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string,
      ownerName: PropTypes.string,
      reviewerName: PropTypes.string,
      dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      stage: PropTypes.string,
    }),
  ),
  timelineEntries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      startAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      endAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      ownerName: PropTypes.string,
      progressPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      status: PropTypes.string,
    }),
  ),
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      ownerName: PropTypes.string,
      status: PropTypes.string,
      startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      priority: PropTypes.string,
      metadata: PropTypes.object,
    }),
  ),
  activity: PropTypes.arrayOf(ActivityItem.propTypes.item),
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      fileType: PropTypes.string,
      type: PropTypes.string,
      sizeBytes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      uploadedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    }),
  ),
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      topic: PropTypes.string,
      messages: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          body: PropTypes.string,
          authorName: PropTypes.string,
          postedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
          createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        }),
      ),
    }),
  ),
  storage: PropTypes.shape({
    usedPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  quickActions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  onQuickAction: PropTypes.func,
  onWidgetReorder: PropTypes.func,
  initialHiddenWidgets: PropTypes.arrayOf(PropTypes.string),
};

WorkspaceDashboard.defaultProps = {
  title: undefined,
  project: undefined,
  workspace: undefined,
  metrics: undefined,
  brief: undefined,
  approvals: undefined,
  timelineEntries: undefined,
  tasks: undefined,
  activity: undefined,
  files: undefined,
  conversations: undefined,
  storage: undefined,
  quickActions: undefined,
  onQuickAction: undefined,
  onWidgetReorder: undefined,
  initialHiddenWidgets: undefined,
};
