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
              {file.type} · v{file.version ?? 1} · {formatNumber(file.size ?? 0, { compact: true })}B
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

const DEFAULT_METRICS = [
  { id: 'velocity', label: 'Velocity', value: 26, unit: 'pts/wk', change: 8 },
  { id: 'engagement', label: 'Engagement', value: 86, unit: '%', change: 5 },
  { id: 'budgetBurn', label: 'Budget burn', value: 48, unit: '%', change: -3 },
];

const DEFAULT_HEALTH = {
  status: 'on_track',
  score: 84,
  summary:
    'Delivery cadence is strong. Momentum is compounding across design, engineering, and go-to-market workstreams.',
  focusAreas: [
    { id: 'retrospective', label: 'Retrospective insights', description: 'Share highlights from last sprint showcase.' },
    { id: 'handover', label: 'Client handover', description: 'Prepare the launch readiness packet by Thursday.' },
  ],
  risks: [
    {
      id: 'scope-creep',
      label: 'Scope alignment',
      owner: 'Nina Patel',
      mitigation: 'Confirm priorities during Monday governance stand-up.',
    },
  ],
};

const DEFAULT_MILESTONES = [
  {
    id: 'ux-polish',
    title: 'Experience polish freeze',
    dueDate: new Date().setDate(new Date().getDate() + 4),
    owner: 'Design Studio',
    progress: 72,
  },
  {
    id: 'pilot',
    title: 'Pilot activation cohort',
    dueDate: new Date().setDate(new Date().getDate() + 11),
    owner: 'Program Ops',
    progress: 35,
  },
];

const DEFAULT_TASKS = [
  { id: 'brief', title: 'Publish executive summary', owner: 'Jordan', status: 'In review', dueDate: new Date(), priority: 'High' },
  {
    id: 'handoff',
    title: 'Capture implementation footage',
    owner: 'Mia',
    status: 'In progress',
    dueDate: new Date().setDate(new Date().getDate() + 1),
    priority: 'Medium',
  },
];

const DEFAULT_ACTIVITY = [
  {
    id: 'feed-1',
    actor: 'Jordan Hicks',
    message: 'Shared launch checklist with finance approvals and QA sign-off notes.',
    related: 'Launch readiness',
    timestamp: new Date(),
  },
  {
    id: 'feed-2',
    actor: 'Workspace Automations',
    message: 'Velocity nudged above target — celebrate in Friday update.',
    related: 'Performance pulse',
    timestamp: new Date().setHours(new Date().getHours() - 6),
  },
];

const DEFAULT_FILES = [
  {
    id: 'deck',
    name: 'Executive alignment deck',
    type: 'Presentation',
    size: 9_400_000,
    version: 4,
    updatedAt: new Date(),
  },
  {
    id: 'roadmap',
    name: 'Roadmap canvas',
    type: 'Whiteboard',
    size: 1_200_000,
    version: 7,
    updatedAt: new Date().setDate(new Date().getDate() - 2),
  },
];

const DEFAULT_QUICK_ACTIONS = [
  { id: 'create-update', label: 'Compose executive update', description: 'Summarise wins, risks, and next bets for sponsors.' },
  { id: 'schedule-review', label: 'Schedule governance review', description: 'Lock a session with stakeholders to review readiness.' },
  { id: 'request-support', label: 'Request specialised support', description: 'Bring in finance, legal, or marketing to unblock scope.' },
];

export default function WorkspaceDashboard({
  title,
  metrics,
  projectHealth,
  milestones,
  tasks,
  activity,
  files,
  quickActions,
  onQuickAction,
  onWidgetReorder,
  initialHiddenWidgets,
}) {
  const [widgetOrder, setWidgetOrder] = useState(() => DEFAULT_WIDGET_ORDER.filter((id) => id !== 'velocity').concat('velocity'));
  const [hiddenWidgets, setHiddenWidgets] = useState(() => new Set(initialHiddenWidgets ?? []));

  const mergedMetrics = metrics?.length ? metrics : DEFAULT_METRICS;
  const mergedHealth = projectHealth ?? DEFAULT_HEALTH;
  const mergedMilestones = milestones?.length ? milestones : DEFAULT_MILESTONES;
  const mergedTasks = tasks?.length ? tasks : DEFAULT_TASKS;
  const mergedActivity = activity?.length ? activity : DEFAULT_ACTIVITY;
  const mergedFiles = files ?? DEFAULT_FILES;
  const mergedActions = quickActions?.length ? quickActions : DEFAULT_QUICK_ACTIONS;

  const statusToken = STATUS_TOKENS[mergedHealth.status] ?? STATUS_TOKENS.on_track;

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
    const soonest = mergedMilestones
      .slice()
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2);
    return [
      ...soonest.map((item) => ({
        id: `milestone-${item.id}`,
        label: item.title,
        meta: `Due ${formatDate(item.dueDate)} · ${item.owner}`,
      })),
      ...mergedHealth.risks.map((risk) => ({
        id: `risk-${risk.id}`,
        label: risk.label,
        meta: `Owner ${risk.owner} · ${risk.mitigation}`,
      })),
    ];
  }, [mergedMilestones, mergedHealth]);

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
            <span className="text-3xl font-semibold text-slate-900">{formatNumber(mergedHealth.score)}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">{mergedHealth.summary}</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mergedMetrics.map((metric) => (
          <MetricBadge key={metric.id} {...metric} intent={metric.intent ?? 'default'} />
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
        <div className="flex flex-wrap gap-2">
          {mergedActions.map((action) => (
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
              Hide {widgetId}
            </button>
          ))}
          {[...hiddenWidgets].map((widgetId) => (
            <button
              key={`show-${widgetId}`}
              type="button"
              onClick={() => toggleWidget(widgetId)}
              className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600 transition hover:border-emerald-300"
            >
              Show {widgetId}
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
                      <ul className="space-y-3">
                        {mergedHealth.focusAreas.map((item) => (
                          <li key={item.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.description}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Emerging risks</h4>
                      {mergedHealth.risks.length ? (
                        <ul className="space-y-3">
                          {mergedHealth.risks.map((risk) => (
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
                    {mergedMetrics.map((metric) => (
                      <div key={metric.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-400">{metric.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {formatNumber(metric.value)}
                          {metric.unit}
                        </p>
                        <p
                          className={clsx(
                            'text-xs font-medium',
                            metric.change > 0
                              ? 'text-emerald-600'
                              : metric.change < 0
                              ? 'text-rose-600'
                              : 'text-slate-500',
                          )}
                        >
                          {metric.change > 0 ? '▲' : metric.change < 0 ? '▼' : '■'} {Math.abs(metric.change)}%
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-3xl border border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-6">
                    <h4 className="text-sm font-semibold text-slate-900">Momentum narrative</h4>
                    <p className="mt-2 text-sm text-slate-600">
                      Delivery velocity has exceeded target for two consecutive weeks while QA pass rate remains above 97%. Team
                      sentiment is trending positive after integrating synchronous design/dev rituals.
                    </p>
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
                actions={<span className="text-xs text-slate-500">{mergedTasks.length} spotlight tasks</span>}
              >
                <ul className="space-y-3">
                  {mergedTasks.map((task) => (
                    <li key={task.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {task.priority}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Owner {task.owner}</span>
                        <span>{task.status}</span>
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
                <ul className="space-y-3">
                  {mergedMilestones.map((milestone) => (
                    <li key={milestone.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                        <span>{milestone.title}</span>
                        <time dateTime={milestone.dueDate} className="text-xs font-medium text-slate-500">
                          Due {formatDate(milestone.dueDate)}
                        </time>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Owner: {milestone.owner}</p>
                      <div className="mt-3 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                          style={{ width: `${Math.min(Math.max(milestone.progress ?? 0, 0), 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
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
                <ul className="space-y-3">
                  {mergedActivity.map((item) => (
                    <ActivityItem key={item.id} item={item} />
                  ))}
                </ul>
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
                actions={<span className="text-xs text-slate-500">{mergedFiles.length} curated files</span>}
              >
                <FilesGlance files={mergedFiles.slice(0, 4)} />
              </WidgetChrome>
            );
          }

          return null;
        })}
      </section>

      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Highlights</h3>
          <ul className="mt-3 space-y-2">
            {focusHighlights.map((highlight) => (
              <li key={highlight.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{highlight.label}</p>
                <p className="text-xs text-slate-500">{highlight.meta}</p>
              </li>
            ))}
          </ul>
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
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.number,
      change: PropTypes.number,
      unit: PropTypes.string,
      intent: PropTypes.oneOf(['default', 'critical', 'focus']),
    }),
  ),
  projectHealth: PropTypes.shape({
    status: PropTypes.oneOf(Object.keys(STATUS_TOKENS)),
    score: PropTypes.number,
    summary: PropTypes.string,
    focusAreas: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string,
      }),
    ),
    risks: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        owner: PropTypes.string,
        mitigation: PropTypes.string,
      }),
    ),
  }),
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      owner: PropTypes.string,
      progress: PropTypes.number,
    }),
  ),
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      owner: PropTypes.string,
      status: PropTypes.string,
      dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      priority: PropTypes.string,
    }),
  ),
  activity: PropTypes.arrayOf(ActivityItem.propTypes.item),
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      size: PropTypes.number,
      version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    }),
  ),
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
  metrics: undefined,
  projectHealth: undefined,
  milestones: undefined,
  tasks: undefined,
  activity: undefined,
  files: undefined,
  quickActions: undefined,
  onQuickAction: undefined,
  onWidgetReorder: undefined,
  initialHiddenWidgets: undefined,
};
