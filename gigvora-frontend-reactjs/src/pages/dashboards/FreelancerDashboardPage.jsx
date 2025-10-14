import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import { fetchFreelancerDashboard } from '../../services/freelancer.js';
import { formatRelativeTime } from '../../utils/date.js';

const DEFAULT_FREELANCER_ID = 2;
const availableDashboards = ['freelancer', 'user', 'agency', 'company'];

function formatNumber(value, { fractionDigits = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  const numeric = Number(value);
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(numeric);
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(0);
  }

  const numeric = Number(value);
  const hasDecimals = Math.abs(numeric) < 1000 && Math.round(numeric) !== numeric;

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(numeric);
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Number(value).toFixed(1)}%`;
}

function formatStatus(value) {
  if (!value) return 'Unknown';
  return value
    .toString()
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function buildProfileCard(profile, summary) {
  if (!profile) {
    return {
      name: 'Freelancer',
      role: 'Independent talent',
      initials: 'FR',
      status: 'Active member',
      badges: [],
      metrics: [],
    };
  }

  const initials = profile.name
    ? profile.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('')
    : 'FR';

  const availabilityStatus = profile.availability?.status
    ? `Availability: ${formatStatus(profile.availability.status)}`
    : null;

  const badges = [];
  if (profile.statusFlags?.length) {
    badges.push(...profile.statusFlags.slice(0, 2).map(formatStatus));
  }
  if (summary?.activeClients) {
    badges.push(`${formatNumber(summary.activeClients)} active clients`);
  }

  const metricBadges = [];
  if (summary?.rating) {
    metricBadges.push({ label: 'Quality score', value: summary.rating.toFixed(1) });
  }
  if (summary?.completionRate != null) {
    metricBadges.push({ label: 'Completion rate', value: formatPercent(summary.completionRate) });
  }
  if (summary?.gigEngagements != null) {
    metricBadges.push({ label: 'Active gigs', value: formatNumber(summary.gigEngagements) });
  }
  if (summary?.activeProjects != null) {
    metricBadges.push({ label: 'Projects', value: formatNumber(summary.activeProjects) });
  }

  const title = profile.freelancerProfile?.title ?? profile.headline ?? 'Independent professional';

  return {
    name: profile.name ?? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim(),
    role: title,
    initials: profile.initials ?? (initials || 'FR'),
    status: availabilityStatus ?? 'Operating at scale',
    badges,
    metrics: metricBadges,
  };
}

function buildMenuSections(summary, queueMetrics) {
  const invites = summary?.queuePending ?? 0;
  const activeProjects = summary?.activeProjects ?? 0;
  const gigs = summary?.gigEngagements ?? 0;
  const acceptanceRate = summary?.completionRate != null ? formatPercent(summary.completionRate) : '0%';

  return [
    {
      label: 'Service delivery',
      items: [
        {
          name: 'Project workspace',
          description: `${formatNumber(activeProjects)} live projects with ${formatNumber(
            queueMetrics?.counts?.accepted ?? 0,
          )} confirmed collaborators.`,
          tags: ['projects'],
        },
        {
          name: 'Gig operations',
          description: `${formatNumber(gigs)} active gigs · ${formatNumber(
            summary?.gigRequests ?? 0,
          )} new requests in queue.`,
          tags: ['gigs'],
        },
        {
          name: 'Client communications',
          description: `${formatNumber(summary?.activeClients ?? 0)} active client relationships monitored.`,
          tags: ['crm'],
        },
      ],
    },
    {
      label: 'Pipeline & automation',
      items: [
        {
          name: 'Auto-assign queue',
          description: `${formatNumber(invites)} invites awaiting response · average score ${
            queueMetrics?.averageScore ? queueMetrics.averageScore.toFixed(2) : '0.00'
          }.`,
          tags: ['auto-assign'],
        },
        {
          name: 'Workflow automations',
          description: `Completion rate tracking at ${acceptanceRate}. Keep streaks alive with timely responses.`,
        },
        {
          name: 'Support & compliance',
          description: `${formatNumber(summary?.activeClients ?? 0)} clients monitored · ${formatNumber(
            summary?.queueAccepted ?? 0,
          )} active deliverables.`,
        },
      ],
    },
    {
      label: 'Growth & insights',
      items: [
        {
          name: 'Revenue intelligence',
          description: `${formatCurrency(summary?.monthlyRevenue ?? 0, summary?.currency ?? 'USD')} booked this month.`,
          tags: ['revenue'],
        },
        {
          name: 'Client advocacy',
          description: `${formatNumber(summary?.activeClients ?? 0)} accounts with real-time sentiment monitoring.`,
        },
        {
          name: 'Learning & assets',
          description: 'Training nudges and engagement jobs curated for momentum.',
        },
      ],
    },
  ];
}

function buildSummaryCards(summary) {
  const currency = summary?.currency ?? 'USD';
  return [
    {
      label: 'Monthly revenue',
      value: formatCurrency(summary?.monthlyRevenue ?? 0, currency),
      description: 'Released payouts over the last 30 days.',
    },
    {
      label: 'Outstanding payouts',
      value: formatCurrency(summary?.outstandingPayouts ?? 0, currency),
      description: `${formatCurrency(summary?.inEscrow ?? 0, currency)} currently held in escrow.`,
    },
    {
      label: 'Queue invites awaiting action',
      value: formatNumber(summary?.queuePending ?? 0),
      description: `${formatNumber(summary?.queueNotified ?? 0)} reminders sent across priority tiers.`,
    },
    {
      label: 'Client satisfaction',
      value: summary?.rating != null ? summary.rating.toFixed(1) : '4.8',
      description: 'Rolling quality score based on post-delivery reviews.',
    },
  ];
}

function buildOpportunityRows(entries) {
  return entries.slice(0, 5).map((entry) => ({
    id: entry.id,
    name: entry.projectName ?? entry.target?.title ?? `Opportunity #${entry.targetId}`,
    status: formatStatus(entry.status),
    score: entry.score != null ? entry.score.toFixed(2) : '0.00',
    responseDueInHours:
      entry.responseDueInHours != null
        ? `${entry.responseDueInHours}h`
        : entry.expiresAt
        ? formatRelativeTime(entry.expiresAt)
        : '—',
    breakdown: entry.breakdown,
    targetType: entry.targetType,
  }));
}

function buildProjectCards(projects, currency) {
  return projects.slice(0, 4).map((project) => ({
    id: project.id,
    title: project.title,
    status: formatStatus(project.status),
    revenue: formatCurrency(project.revenue ?? 0, project.budgetCurrency ?? currency ?? 'USD'),
    outstanding: formatCurrency(project.outstanding ?? 0, project.budgetCurrency ?? currency ?? 'USD'),
    assignments: project.assignments,
    description: project.description ?? '',
  }));
}

function buildTransactions(transactions, currency) {
  return transactions.slice(0, 5).map((transaction) => ({
    id: transaction.id,
    reference: transaction.reference,
    status: formatStatus(transaction.status),
    amount: formatCurrency(transaction.netAmount ?? transaction.amount, transaction.currency ?? currency ?? 'USD'),
    milestone: transaction.milestoneLabel ?? 'Milestone',
    releasedAt: transaction.releasedAt ? formatRelativeTime(transaction.releasedAt) : null,
    targetName: transaction.target?.title ?? transaction.target?.name ?? null,
  }));
}

function buildSupportCases(cases) {
  return cases.slice(0, 4).map((record) => ({
    id: record.id,
    status: formatStatus(record.status),
    priority: formatStatus(record.priority),
    reason: record.reason,
    escalatedAt: record.escalatedAt ? formatRelativeTime(record.escalatedAt) : null,
    threadSubject: record.thread?.subject ?? 'Support case',
  }));
}

function buildEngagementTasks(tasks) {
  return tasks.slice(0, 5).map((task) => ({
    id: task.id,
    status: formatStatus(task.status),
    priority: task.priority,
    action: task.action,
    dueInDays: task.dueInDays,
  }));
}

function buildNotifications(items) {
  return items.slice(0, 4).map((notification) => ({
    id: notification.id,
    title: notification.title,
    category: formatStatus(notification.category),
    deliveredAt: notification.deliveredAt ? formatRelativeTime(notification.deliveredAt) : null,
    isUnread: notification.isUnread,
  }));
}

export default function FreelancerDashboardPage() {
  const freelancerId = DEFAULT_FREELANCER_ID;
  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
  } = useCachedResource(
    `dashboard:freelancer:${freelancerId}`,
    ({ signal }) => fetchFreelancerDashboard(freelancerId, { signal }),
    { ttl: 1000 * 60 },
  );

  const summary = data?.summary ?? {};
  const queueEntries = Array.isArray(data?.queue?.entries) ? data.queue.entries : [];
  const queueMetrics = data?.queue?.metrics ?? {};
  const projects = Array.isArray(data?.projects?.active) ? data.projects.active : [];
  const timeline = Array.isArray(data?.projects?.timeline) ? data.projects.timeline : [];
  const transactions = Array.isArray(data?.finances?.transactions) ? data.finances.transactions : [];
  const ledger = data?.finances?.ledger ?? {};
  const supportCases = Array.isArray(data?.support?.cases) ? data.support.cases : [];
  const engagementTasks = Array.isArray(data?.tasks?.engagements) ? data.tasks.engagements : [];
  const nextAction = data?.tasks?.nextAction ?? null;
  const notifications = Array.isArray(data?.notifications?.recent) ? data.notifications.recent : [];

  const profileCard = useMemo(() => buildProfileCard(data?.profile, summary), [data?.profile, summary]);

  const menuSections = useMemo(
    () => buildMenuSections(summary, queueMetrics),
    [summary, queueMetrics],
  );

  const summaryCards = useMemo(() => buildSummaryCards(summary), [summary]);
  const opportunityRows = useMemo(() => buildOpportunityRows(queueEntries), [queueEntries]);
  const projectCards = useMemo(
    () => buildProjectCards(projects, summary?.currency),
    [projects, summary?.currency],
  );
  const transactionRows = useMemo(
    () => buildTransactions(transactions, summary?.currency),
    [transactions, summary?.currency],
  );
  const supportRows = useMemo(() => buildSupportCases(supportCases), [supportCases]);
  const taskRows = useMemo(() => buildEngagementTasks(engagementTasks), [engagementTasks]);
  const notificationRows = useMemo(() => buildNotifications(notifications), [notifications]);

  const heroTitle = 'Freelancer Operations HQ';
  const heroSubtitle = 'Service business cockpit';
  const heroDescription =
    'Monitor projects, gigs, finances, and client sentiment in a single command center designed for elite independents.';

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title={heroTitle}
      subtitle={heroSubtitle}
      description={heroDescription}
      menuSections={menuSections}
      sections={[]}
      profile={profileCard}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={() => refresh({ force: true })} />
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
              {error.message ?? 'Unable to load freelancer dashboard.'}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_18px_45px_-25px_rgba(37,99,235,0.25)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-1 text-sm text-slate-500">{card.description}</p>
            </div>
          ))}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Opportunity pipeline</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Auto-assign invites, gig requests, and collaboration slots awaiting your response.
              </p>
            </div>
            {nextAction ? (
              <div className="rounded-2xl border border-accent/30 bg-accentSoft px-4 py-2 text-xs font-medium uppercase tracking-wide text-accent">
                {nextAction.dueInHours != null
                  ? `${nextAction.label} · respond within ${nextAction.dueInHours}h`
                  : nextAction.label}
              </div>
            ) : null}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Response window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opportunityRows.length ? (
                  opportunityRows.map((row) => (
                    <tr key={row.id} className="hover:bg-accentSoft/40">
                      <td className="px-4 py-3 text-slate-800">
                        <div className="font-medium">{row.name}</div>
                        {row.breakdown ? (
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                            {row.breakdown.expertise != null ? `Expertise ${Math.round(row.breakdown.expertise * 100)}%` : null}
                            {row.breakdown.fairness != null ? `Fairness ${Math.round(row.breakdown.fairness * 100)}%` : null}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatStatus(row.targetType)}</td>
                      <td className="px-4 py-3 text-slate-600">{row.status}</td>
                      <td className="px-4 py-3 text-slate-600">{row.score}</td>
                      <td className="px-4 py-3 text-slate-600">{row.responseDueInHours}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No live opportunities in the queue. Refresh to capture new invites.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Active projects</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Delivery health, assignment mix, and revenue exposure across projects you lead.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {formatNumber(projects.length)} total tracked
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {projectCards.length ? (
              projectCards.map((project) => (
                <div key={project.id} className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
                      <p className="text-sm text-slate-500">{project.description}</p>
                    </div>
                    <span className="rounded-full border border-accent/30 bg-accentSoft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                      {project.status}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Revenue released</dt>
                      <dd className="mt-1 font-semibold text-slate-900">{project.revenue}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Outstanding</dt>
                      <dd className="mt-1 font-semibold text-slate-900">{project.outstanding}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Assignments</dt>
                      <dd className="mt-1 text-slate-600">
                        {project.assignments.accepted} accepted · {project.assignments.pending} pending ·{' '}
                        {project.assignments.notified} notified
                      </dd>
                    </div>
                  </dl>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
                Projects will populate here once you accept an auto-assign invite or launch a gig delivery.
              </div>
            )}
          </div>

          {timeline.length ? (
            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent delivery events</h3>
              <ul className="mt-3 space-y-3">
                {timeline.slice(0, 4).map((event) => (
                  <li key={event.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-accent" />
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-800">
                        {formatStatus(event.eventType)} · {event.project?.title ?? `Project #${event.projectId}`}
                      </p>
                      {event.createdAt ? (
                        <p className="text-xs text-slate-400">{formatRelativeTime(event.createdAt)}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Financial overview</h2>
              <p className="mt-2 text-sm text-slate-600">
                Escrow balances, recent payouts, and forecast visibility.
              </p>
              <dl className="mt-6 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-3">
                  <dt className="font-medium text-slate-700">Released to date</dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {formatCurrency(ledger.released ?? 0, ledger.currency ?? 'USD')}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-3">
                  <dt className="font-medium text-slate-700">Outstanding payouts</dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {formatCurrency(ledger.outstanding ?? 0, ledger.currency ?? 'USD')}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-3">
                  <dt className="font-medium text-slate-700">Average assignment value</dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {ledger.avgAssignedValue != null
                      ? formatCurrency(ledger.avgAssignedValue, ledger.currency ?? 'USD')
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent transactions</h3>
              <ul className="mt-3 space-y-3">
                {transactionRows.length ? (
                  transactionRows.map((row) => (
                    <li key={row.id} className="rounded-2xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-600">
                      <div className="flex items-center justify-between text-slate-800">
                        <span className="font-medium">{row.milestone}</span>
                        <span className="font-semibold text-slate-900">{row.amount}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        <span>{row.status}</span>
                        {row.targetName ? <span>· {row.targetName}</span> : null}
                        {row.releasedAt ? <span>· {row.releasedAt}</span> : null}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-slate-500">
                    Transactions will appear as soon as payouts or deposits are recorded.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Support & compliance</h2>
              <p className="mt-2 text-sm text-slate-600">
                Track escalations, NDAs, and service-level risks requiring your input.
              </p>
              <ul className="mt-4 space-y-3">
                {supportRows.length ? (
                  supportRows.map((record) => (
                    <li key={record.id} className="rounded-2xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-600">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-800">{record.threadSubject}</span>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
                          {record.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-500">{record.reason}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-400">
                        <span>{record.status}</span>
                        {record.escalatedAt ? <span>· {record.escalatedAt}</span> : null}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-slate-500">
                    No active support cases. You will be notified when compliance items need attention.
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Growth actions</h2>
              <p className="mt-2 text-sm text-slate-600">
                Engagement nudges, training prompts, and alerts to keep momentum high.
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white/95 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Engagement jobs</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {taskRows.length ? (
                      taskRows.map((task) => (
                        <li key={task.id} className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-800">{task.action}</p>
                            <p className="text-xs text-slate-400">
                              {task.status} · {task.dueInDays != null ? `${Math.abs(task.dueInDays)} days ${task.dueInDays >= 0 ? 'ago' : 'ahead'}` : 'Due soon'}
                            </p>
                          </div>
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            P{task.priority}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-center text-slate-500">No pending engagement automations.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/95 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notifications</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {notificationRows.length ? (
                      notificationRows.map((note) => (
                        <li key={note.id} className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-800">{note.title}</p>
                            <p className="text-xs text-slate-400">
                              {note.category}
                              {note.deliveredAt ? ` · ${note.deliveredAt}` : ''}
                            </p>
                          </div>
                          {note.isUnread ? (
                            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" />
                          ) : null}
                        </li>
                      ))
                    ) : (
                      <li className="text-center text-slate-500">No new notifications.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
import { useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { AVAILABLE_DASHBOARDS, MENU_GROUPS } from './freelancer/menuConfig.js';
import { DEFAULT_PROFILE } from './freelancer/sampleData.js';
import RoleGate from '../../components/access/RoleGate.jsx';
import useRoleAccess from '../../hooks/useRoleAccess.js';
import {
  AutomationSection,
  DeliveryOperationsSection,
  FinanceComplianceSection,
  GigMarketplaceOperationsSection,
  GigStudioSection,
  GrowthPartnershipSection,
  NetworkSection,
  OperationalQuickAccessSection,
  OperationsHQSection,
  OverviewSection,
  PlanningSection,
  ProfileShowcaseSection,
  ProjectLabSection,
  ProjectWorkspaceExcellenceSection,
  ReferencesSection,
  SupportSection,
  TaskManagementSection,
  WorkspaceSettingsSection,
} from './freelancer/sections/index.js';

const SECTION_RENDERERS = {
  'profile-overview': ({ profile }) => <OverviewSection profile={profile ?? DEFAULT_PROFILE} />,
  'operations-hq': () => <OperationsHQSection />,
  'delivery-ops': () => <DeliveryOperationsSection />,
  planning: () => <PlanningSection />,
  'project-excellence': () => <ProjectWorkspaceExcellenceSection />,
  'project-lab': () => <ProjectLabSection />,
  'task-management': () => <TaskManagementSection />,
  'gig-studio': () => <GigStudioSection />,
  'gig-marketplace': () => <GigMarketplaceOperationsSection />,
  automation: () => <AutomationSection />,
  'finance-compliance': () => <FinanceComplianceSection />,
  'workspace-settings': () => <WorkspaceSettingsSection />,
  'profile-showcase': () => <ProfileShowcaseSection />,
  references: () => <ReferencesSection />,
  network: () => <NetworkSection />,
  'growth-partnerships': () => <GrowthPartnershipSection />,
  'quick-access': () => <OperationalQuickAccessSection />,
  support: () => <SupportSection />,
};

export default function FreelancerDashboardPage() {
  const [activeSection, setActiveSection] = useState('profile-overview');
  const { session } = useRoleAccess(['freelancer']);

  const menuSections = useMemo(() => MENU_GROUPS, []);
  const profile = useMemo(() => {
    if (!session) {
      return DEFAULT_PROFILE;
    }
    const name = session.name ?? DEFAULT_PROFILE.name;
    const initials = name
      .split(' ')
      .map((part) => part?.[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || DEFAULT_PROFILE.initials;

    return {
      ...DEFAULT_PROFILE,
      name,
      role: session.title ? `Freelance ${session.title}` : DEFAULT_PROFILE.role,
      initials,
      avatarUrl: session.avatarSeed
        ? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(session.avatarSeed)}`
        : DEFAULT_PROFILE.avatarUrl,
    };
  }, [session]);

  const availableDashboards = useMemo(
    () => [
      { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
      { id: 'freelancer-pipeline', label: 'Pipeline HQ', href: '/dashboard/freelancer/pipeline' },
      { id: 'company', label: 'Company', href: '/dashboard/company' },
      { id: 'headhunter', label: 'Headhunter', href: '/dashboard/headhunter' },
    ],
    [],
  );

  const renderSection = (SECTION_RENDERERS[activeSection] ?? SECTION_RENDERERS['profile-overview'])({
    profile,
  });

  return (
    <RoleGate allowedRoles={['freelancer']} featureName="Freelancer mission control">
      <DashboardLayout
        currentDashboard="freelancer"
        title="Freelancer mission control"
        subtitle="Operate your Gigvora business with enterprise-grade tooling"
        description="Switch between delivery, growth, brand, and governance with a single, purposeful cockpit."
        menuSections={menuSections}
        profile={profile}
        availableDashboards={availableDashboards.length ? availableDashboards : AVAILABLE_DASHBOARDS}
        activeMenuItem={activeSection}
        onMenuItemSelect={(itemId) => setActiveSection(itemId)}
      >
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">{renderSection}</div>
      </DashboardLayout>
    </RoleGate>
  );
}

