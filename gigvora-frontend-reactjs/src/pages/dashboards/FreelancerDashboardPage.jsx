import { useMemo } from 'react';
import {
  BellAlertIcon,
  BoltIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  LifebuoyIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import RoleGate from '../../components/access/RoleGate.jsx';
import useRoleAccess from '../../hooks/useRoleAccess.js';
import { fetchFreelancerDashboard } from '../../services/freelancer.js';
import { formatRelativeTime } from '../../utils/date.js';

const DEFAULT_FREELANCER_ID = 2;
const AVAILABLE_DASHBOARDS = [
  { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
  { id: 'freelancer-pipeline', label: 'Pipeline HQ', href: '/dashboard/freelancer/pipeline' },
  { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
];

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

function buildProfileCard(profile, summary, session) {
  if (!profile && !session) {
    return {
      name: 'Freelancer',
      role: 'Independent talent',
      initials: 'FR',
      status: 'Active member',
      badges: [],
      metrics: [],
    };
  }

  const displayName = session?.name ?? profile?.name ?? `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();
  const initialsSource = session?.name ?? profile?.name;
  const initials = (initialsSource ?? displayName ?? 'Freelancer')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .trim() || 'FR';

  const availabilityStatus = profile?.availability?.status
    ? `Availability: ${formatStatus(profile.availability.status)}`
    : session?.status ?? null;

  const badges = [];
  if (profile?.statusFlags?.length) {
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

  const title = session?.title
    ? `Freelance ${session.title}`
    : profile?.freelancerProfile?.title ?? profile?.headline ?? 'Independent professional';

  return {
    name: displayName || 'Freelancer',
    role: title,
    initials,
    status: availabilityStatus ?? 'Operating at scale',
    badges,
    metrics: metricBadges,
    avatarUrl: session?.avatarSeed
      ? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(session.avatarSeed)}`
      : profile?.avatarUrl ?? null,
  };
}

function buildMenuSections({ summary, queueMetrics, opportunities, projects, transactions, supportCases, engagementTasks, notifications }) {
  const invites = summary?.queuePending ?? opportunities.length ?? 0;
  const activeProjects = summary?.activeProjects ?? projects.length ?? 0;
  const monthlyRevenue = summary?.monthlyRevenue ?? 0;
  const currency = summary?.currency ?? 'USD';
  const openCases = supportCases.length ?? 0;
  const pendingTasks = engagementTasks.length ?? 0;
  const unreadAlerts = notifications.filter((item) => item?.isUnread).length ?? 0;
  const averageScore = queueMetrics?.averageScore ? queueMetrics.averageScore.toFixed(2) : '0.00';

  return [
    {
      id: 'mission-control',
      label: 'Mission control',
      items: [
        {
          id: 'overview',
          sectionId: 'overview',
          name: 'Mission overview',
          description: `${formatNumber(activeProjects)} live projects · ${formatNumber(summary?.activeClients ?? 0)} active clients`,
          icon: HomeModernIcon,
        },
      ],
    },
    {
      id: 'service-delivery',
      label: 'Service delivery',
      items: [
        {
          id: 'opportunity-pipeline',
          sectionId: 'opportunity-pipeline',
          name: 'Opportunity pipeline',
          description: `${formatNumber(invites)} invites · avg score ${averageScore}`,
          icon: QueueListIcon,
        },
        {
          id: 'active-projects',
          sectionId: 'active-projects',
          name: 'Project delivery',
          description: `${formatNumber(projects.length)} engagements with telemetry`,
          icon: ClipboardDocumentCheckIcon,
        },
      ],
    },
    {
      id: 'commerce-finance',
      label: 'Commerce & finance',
      items: [
        {
          id: 'financial-overview',
          sectionId: 'financial-overview',
          name: 'Finance & escrow',
          description: `${formatCurrency(monthlyRevenue, currency)} booked in the last 30 days`,
          icon: CurrencyDollarIcon,
        },
      ],
    },
    {
      id: 'client-success',
      label: 'Client success',
      items: [
        {
          id: 'client-success',
          sectionId: 'client-success',
          name: 'Support desk',
          description: `${formatNumber(openCases)} active cases`,
          icon: LifebuoyIcon,
        },
        {
          id: 'growth-automation',
          sectionId: 'growth-automation',
          name: 'Growth & automations',
          description: `${formatNumber(pendingTasks)} engagement jobs queued`,
          icon: BoltIcon,
        },
      ],
    },
    {
      id: 'signals',
      label: 'Signals',
      items: [
        {
          id: 'notifications',
          sectionId: 'notifications',
          name: 'Signals & alerts',
          description: `${formatNumber(unreadAlerts)} unread signals`,
          icon: BellAlertIcon,
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
    assignments: project.assignments ?? { accepted: 0, pending: 0, notified: 0 },
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
  return items.slice(0, 6).map((notification) => ({
    id: notification.id,
    title: notification.title,
    category: formatStatus(notification.category),
    deliveredAt: notification.deliveredAt ? formatRelativeTime(notification.deliveredAt) : null,
    isUnread: notification.isUnread,
  }));
}

export default function FreelancerDashboardPage() {
  const { session, hasAccess } = useRoleAccess(['freelancer']);
  const freelancerId = session?.freelancerId ?? session?.id ?? null;
  const normalizedFreelancerId = freelancerId ?? DEFAULT_FREELANCER_ID;
  const shouldFetch = hasAccess && freelancerId != null;

  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    `dashboard:freelancer:${normalizedFreelancerId}`,
    ({ signal }) => fetchFreelancerDashboard(normalizedFreelancerId, { signal }),
    { ttl: 1000 * 60, dependencies: [normalizedFreelancerId], enabled: shouldFetch },
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

  const profileCard = useMemo(
    () => buildProfileCard(data?.profile ?? null, summary, session ?? null),
    [data?.profile, session, summary],
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

  const menuSections = useMemo(
    () =>
      buildMenuSections({
        summary,
        queueMetrics,
        opportunities: queueEntries,
        projects,
        transactions,
        supportCases,
        engagementTasks,
        notifications: notificationRows,
      }),
    [summary, queueMetrics, queueEntries, projects, transactions, supportCases, engagementTasks, notificationRows],
  );

  const heroTitle = 'Freelancer mission control';
  const heroSubtitle = 'Operate your Gigvora business with enterprise-grade telemetry.';
  const heroDescription =
    'Monitor projects, gigs, finances, and client sentiment in one cockpit built for elite independents.';

  return (
    <RoleGate allowedRoles={['freelancer']} featureName="Freelancer mission control">
      <DashboardLayout
        currentDashboard="freelancer"
        title={heroTitle}
        subtitle={heroSubtitle}
        description={heroDescription}
        menuSections={menuSections}
        sections={[]}
        profile={profileCard}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="overview"
      >
        <div className="space-y-10">
          <section id="overview" className="space-y-6">
            {!shouldFetch ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Link your freelancer workspace to unlock live mission control data. Some telemetry is hidden until your ID is
                verified.
              </div>
            ) : null}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <DataStatus
                loading={loading}
                fromCache={fromCache}
                lastUpdated={lastUpdated}
                onRefresh={() => refresh({ force: true })}
              />
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
          </section>

          <section id="opportunity-pipeline" className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Opportunity pipeline</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Auto-assign invites, referrals, and gig leads awaiting your response.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {formatNumber(queueEntries.length)} in review
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
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

          <section id="active-projects" className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft sm:p-8">
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
                          {project.assignments.accepted ?? 0} accepted · {project.assignments.pending ?? 0} pending ·{' '}
                          {project.assignments.notified ?? 0} notified
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

          <section id="financial-overview" className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft sm:p-8">
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
                      {formatCurrency(ledger.released ?? 0, ledger.currency ?? summary?.currency ?? 'USD')}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-3">
                    <dt className="font-medium text-slate-700">Outstanding payouts</dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {formatCurrency(ledger.outstanding ?? 0, ledger.currency ?? summary?.currency ?? 'USD')}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-3">
                    <dt className="font-medium text-slate-700">Average assignment value</dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {ledger.avgAssignedValue != null
                        ? formatCurrency(ledger.avgAssignedValue, ledger.currency ?? summary?.currency ?? 'USD')
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

          <section id="client-success" className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Support & compliance</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Track escalations, NDAs, and service-level risks requiring your input.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {formatNumber(supportRows.length)} open cases
              </div>
            </div>
            <ul className="mt-6 space-y-3">
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
          </section>

          <section id="growth-automation" className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft sm:p-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Engagement jobs</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Automations and nudges that keep clients warm and renewals on track.
                </p>
                {nextAction ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <p className="font-semibold">Next action: {nextAction.title ?? nextAction.action}</p>
                    {nextAction.dueAt ? (
                      <p className="text-xs">Due {formatRelativeTime(nextAction.dueAt)}</p>
                    ) : null}
                  </div>
                ) : null}
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {taskRows.length ? (
                    taskRows.map((task) => (
                      <li key={task.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800">{task.action}</p>
                          <p className="text-xs text-slate-400">
                            {task.status} ·{' '}
                            {task.dueInDays != null
                              ? `${Math.abs(task.dueInDays)} days ${task.dueInDays >= 0 ? 'ago' : 'ahead'}`
                              : 'Due soon'}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          P{task.priority}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-slate-500">
                      No pending engagement automations. New nudges appear here as soon as signals trigger them.
                    </li>
                  )}
                </ul>
              </div>

              <div id="notifications">
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Signals & alerts</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Real-time updates from gigs, projects, finance, and trust & safety programs.
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {notificationRows.length ? (
                    notificationRows.map((note) => (
                      <li key={note.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800">{note.title}</p>
                          <p className="text-xs text-slate-400">
                            {note.category}
                            {note.deliveredAt ? ` · ${note.deliveredAt}` : ''}
                          </p>
                        </div>
                        {note.isUnread ? <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" /> : null}
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-slate-500">
                      No new notifications. You&rsquo;re fully up to date.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </RoleGate>
  );
}
