import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import UserManagementTable from './UserManagementTable.jsx';
import RoleAssignmentModal from './RoleAssignmentModal.jsx';

const numberFormatter = new Intl.NumberFormat('en-US');
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  if (numeric >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)}M`;
  }
  if (numeric >= 1_000) {
    return `${(numeric / 1_000).toFixed(1)}K`;
  }
  return numberFormatter.format(numeric);
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0%';
  const ratio = numeric > 1 ? numeric / 100 : numeric;
  return percentFormatter.format(ratio);
}

function deriveMetrics(overview) {
  const metrics = overview?.metrics ?? {};
  const compliance = overview?.compliance ?? {};
  const experience = overview?.experience ?? {};

  return [
    {
      key: 'activeMembers',
      label: 'Active members',
      value: formatNumber(metrics.activeMembers ?? overview?.activeMembers),
      delta: formatPercent(metrics.activeMemberGrowth ?? overview?.activeMemberGrowth ?? 0.06),
      tone: 'from-blue-500/90 via-blue-600/90 to-indigo-600/90',
      caption: 'Rolling 30 day engagement across every workspace.',
    },
    {
      key: 'netRetention',
      label: 'Net retention',
      value: formatPercent(metrics.netRetention ?? overview?.netRetention ?? 0.94),
      delta: formatPercent(metrics.netRetentionDelta ?? overview?.netRetentionDelta ?? 0.02),
      tone: 'from-emerald-500/90 via-emerald-600/90 to-emerald-700/90',
      caption: 'Composite of renewals, seat expansion, and contraction.',
    },
    {
      key: 'slaReliability',
      label: 'SLA reliability',
      value: formatPercent(compliance.slaReliability ?? overview?.slaReliability ?? 0.982),
      delta: formatPercent(compliance.incidentChange ?? overview?.incidentChange ?? -0.01),
      tone: 'from-purple-500/90 via-purple-600/90 to-purple-700/90',
      caption: 'Percentage of support cases resolved within contractual windows.',
    },
    {
      key: 'trustScore',
      label: 'Trust score',
      value: (experience.trustScore ?? overview?.trustScore ?? 94).toString(),
      delta: formatPercent(experience.trustDelta ?? overview?.trustDelta ?? 0.04),
      tone: 'from-amber-500/90 via-amber-600/90 to-amber-700/90',
      caption: 'Composite of verification, moderation, and sentiment signals.',
    },
  ];
}

function deriveAlerts(overview) {
  const alerts = overview?.alerts ?? overview?.risks ?? [];
  if (alerts.length > 0) return alerts;
  const defaultAlerts = [
    {
      id: 'sla-breach',
      severity: 'high',
      title: 'Escalated SLA breach in Enterprise Hub',
      description: '3 escalations exceeded the 2-hour response commitment. Assign owner and schedule incident review.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'policy-update',
      severity: 'medium',
      title: 'Policy update awaiting sign-off',
      description: 'The new creator monetisation policy needs legal approval before rolling out globally.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  ];
  return defaultAlerts;
}

function deriveUsers(overview) {
  if (Array.isArray(overview?.priorityMembers)) {
    return overview.priorityMembers;
  }
  if (Array.isArray(overview?.userDirectory?.items)) {
    return overview.userDirectory.items;
  }
  if (Array.isArray(overview?.directory?.items)) {
    return overview.directory.items;
  }
  return [];
}

function deriveRoleCatalog(overview) {
  if (Array.isArray(overview?.roleCatalog)) {
    return overview.roleCatalog;
  }
  return [
    {
      id: 'global-admin',
      name: 'Global administrator',
      shortcode: 'GA',
      description: 'Full access across every workspace including billing, governance, and developer platform.',
      category: 'Platform',
      riskLevel: 'critical',
      riskScore: 50,
      exclusiveGroup: 'control-plane',
      permissions: [
        { id: 'manage-platform-settings', name: 'Manage platform settings', level: 'manage', description: 'Update platform-wide settings, feature flags, and release tracks.' },
        { id: 'impersonate-members', name: 'Impersonate members', level: 'manage', description: 'Debug and support members directly through impersonation tools.' },
      ],
      governanceWindows: ['Quarterly review'],
      segments: ['Core'],
    },
    {
      id: 'compliance-lead',
      name: 'Compliance lead',
      shortcode: 'CL',
      description: 'Own moderation queues, incident workflows, and legal attestations.',
      category: 'Risk & Compliance',
      riskLevel: 'high',
      riskScore: 30,
      permissions: [
        { id: 'view-audit-log', name: 'View audit trail', level: 'view', description: 'Review every critical change performed by admins or automation.' },
        { id: 'manage-policies', name: 'Manage policies', level: 'edit', description: 'Draft, approve, and publish governance policies.' },
      ],
      governanceWindows: ['Monthly compliance review'],
      segments: ['Governance'],
    },
    {
      id: 'community-ops',
      name: 'Community operations',
      shortcode: 'CO',
      description: 'Moderate reviews, manage community escalations, and nurture ambassadors.',
      category: 'Engagement',
      riskLevel: 'medium',
      riskScore: 18,
      permissions: [
        { id: 'moderate-community', name: 'Moderate community', level: 'edit', description: 'Act on reports, remove content, and sanction accounts.' },
        { id: 'manage-ambassadors', name: 'Manage ambassadors', level: 'manage', description: 'Approve and manage ambassador programs.' },
      ],
      exclusiveGroup: 'moderation',
      segments: ['Community'],
    },
    {
      id: 'finance-analyst',
      name: 'Finance analyst',
      shortcode: 'FA',
      description: 'Access treasury dashboards, reconciliation pipelines, and payouts.',
      category: 'Financial Operations',
      riskLevel: 'medium',
      riskScore: 16,
      permissions: [
        { id: 'view-escrow-ledger', name: 'View escrow ledger', level: 'view', description: 'Monitor balances, release thresholds, and settlement windows.' },
        { id: 'manage-invoices', name: 'Manage invoices', level: 'edit', description: 'Approve, dispute, and void invoices.' },
      ],
      segments: ['Finance'],
    },
  ];
}

function deriveOperationalMoments(overview) {
  const compliance = overview?.compliance ?? {};
  const pipelines = overview?.pipelines ?? {};
  const creatorOps = overview?.creatorOperations ?? {};
  return [
    {
      id: 'sla-health',
      label: 'SLA health',
      value: formatPercent(compliance.slaReliability ?? 0.982),
      change: formatPercent(compliance.incidentChange ?? -0.01),
      caption: 'On-track across premium accounts. One critical incident pending root cause analysis.',
      icon: ShieldCheckIcon,
    },
    {
      id: 'pipeline-volume',
      label: 'Pipeline volume',
      value: formatNumber(pipelines.activeDeals ?? 184),
      change: formatPercent(pipelines.dealMomentum ?? 0.08),
      caption: 'Deal velocity trending upward thanks to refreshed onboarding experience.',
      icon: ChartBarIcon,
    },
    {
      id: 'creator-nps',
      label: 'Creator NPS',
      value: (creatorOps.nps ?? 62).toString(),
      change: formatPercent(creatorOps.delta ?? 0.05),
      caption: 'High marks from new cohort after concierge onboarding and faster payouts.',
      icon: SparklesIcon,
    },
  ];
}

function deriveActionTiles(overview) {
  const quickActions = overview?.quickActions;
  if (Array.isArray(quickActions) && quickActions.length > 0) {
    return quickActions;
  }
  return [
    {
      id: 'review-incidents',
      label: 'Review incidents',
      description: 'Investigate escalated SLA breaches, assign owners, and notify leadership.',
      href: '/admin/incidents',
    },
    {
      id: 'optimize-onboarding',
      label: 'Optimize onboarding',
      description: 'Launch the new guided onboarding for verified mentors and agencies.',
      href: '/admin/onboarding',
    },
    {
      id: 'refresh-policies',
      label: 'Refresh policies',
      description: 'Coordinate with legal to publish the monetisation policy update.',
      href: '/admin/policies',
    },
  ];
}

export default function AdminDashboard({ overview, loading, onRefresh }) {
  const metrics = useMemo(() => deriveMetrics(overview), [overview]);
  const alerts = useMemo(() => deriveAlerts(overview), [overview]);
  const users = useMemo(() => deriveUsers(overview), [overview]);
  const roleCatalog = useMemo(() => deriveRoleCatalog(overview), [overview]);
  const operationalMoments = useMemo(() => deriveOperationalMoments(overview), [overview]);
  const actionTiles = useMemo(() => deriveActionTiles(overview), [overview]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);

  const handleAssignRoles = (user) => {
    setSelectedUser(user);
    setRoleModalOpen(true);
  };

  const handleSubmitRoles = async ({ roleIds, notifyUser, scopeAllWorkspaces, notes }) => {
    setSavingRoles(true);
    try {
      // Integrate with existing admin services once available. For now we emit a custom event for analytics pipelines.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('admin:role-assign', {
            detail: {
              user: selectedUser,
              roleIds,
              notifyUser,
              scopeAllWorkspaces,
              notes,
            },
          }),
        );
      }
    } finally {
      setSavingRoles(false);
      setRoleModalOpen(false);
    }
  };

  const initialAssignments = useMemo(() => {
    if (!selectedUser) return [];
    return selectedUser.roles ?? selectedUser.roleIds ?? [];
  }, [selectedUser]);

  return (
    <section className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Command Center</p>
          <h2 className="mt-2 text-4xl font-semibold text-slate-900">Enterprise operations pulse</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-500">
            Monitor platform health, act on escalations, and orchestrate every governance lever with a console built for executive-grade oversight.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
        >
          <ArrowPathIcon className="h-5 w-5" aria-hidden="true" /> Refresh data
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className={clsx(
              'relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-blue-100/40',
              'before:absolute before:-right-16 before:-top-16 before:h-40 before:w-40 before:rounded-full before:bg-gradient-to-br before:from-blue-500/20 before:via-blue-400/10 before:to-transparent',
            )}
          >
            <div className={clsx('rounded-t-[32px] bg-gradient-to-r px-6 py-6 text-white', metric.tone)}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
              <p className="mt-2 text-xs font-medium text-white/80">{metric.caption}</p>
            </div>
            <div className="flex items-center gap-2 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              {metric.delta} vs last period
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-blue-100/30">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Operational command queue</h3>
              <p className="text-xs text-slate-400">Prioritised incidents, approvals, and automation insights.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              <BoltIcon className="h-4 w-4" aria-hidden="true" /> Live feed
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {alerts.map((alert) => (
              <li key={alert.id ?? alert.title} className="flex flex-col gap-3 px-6 py-5 transition hover:bg-blue-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'inline-flex items-center justify-center rounded-2xl p-2',
                        alert.severity === 'high'
                          ? 'bg-rose-100 text-rose-600'
                          : alert.severity === 'medium'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-blue-100 text-blue-600',
                      )}
                    >
                      <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{alert.description}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  </p>
                </div>
                {alert.actions?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {alert.actions.map((action) => (
                      <a
                        key={action.href ?? action.label}
                        href={action.href ?? '#'}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                      >
                        {action.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex h-full flex-col gap-4 rounded-[32px] border border-slate-200 bg-white px-6 py-6 shadow-xl shadow-blue-100/30">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Operational health</h3>
          <p className="text-xs text-slate-500">
            View the heartbeat of compliance, revenue operations, and creator success in one glance.
          </p>
          <div className="space-y-4">
            {operationalMoments.map((moment) => (
              <div key={moment.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                      <moment.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{moment.label}</p>
                      <p className="text-xs text-slate-500">{moment.caption}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-900">{moment.value}</p>
                    <p className="text-xs text-emerald-600">{moment.change} vs last period</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <UserManagementTable users={users} loading={loading} onAssignRoles={handleAssignRoles} />

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-blue-100/40">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Strategic action tiles</h3>
            <p className="text-xs text-slate-400">Launch the next wave of improvements without leaving the dashboard.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            <InformationCircleIcon className="h-4 w-4" aria-hidden="true" /> Suggested next steps
          </span>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3">
          {actionTiles.map((action) => (
            <a
              key={action.id}
              href={action.href ?? '#'}
              className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-lg"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                <p className="mt-2 text-sm text-slate-500">{action.description}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                Explore
                <GlobeAltIcon className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </div>

      <RoleAssignmentModal
        open={roleModalOpen}
        user={selectedUser}
        availableRoles={roleCatalog}
        initialAssignments={initialAssignments}
        loading={savingRoles}
        onClose={() => setRoleModalOpen(false)}
        onSubmit={handleSubmitRoles}
      />
    </section>
  );
}

AdminDashboard.propTypes = {
  overview: PropTypes.shape({
    metrics: PropTypes.object,
    compliance: PropTypes.object,
    experience: PropTypes.object,
    alerts: PropTypes.array,
    risks: PropTypes.array,
    quickActions: PropTypes.array,
    roleCatalog: PropTypes.array,
    userDirectory: PropTypes.shape({ items: PropTypes.array }),
    directory: PropTypes.shape({ items: PropTypes.array }),
    priorityMembers: PropTypes.array,
  }),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

AdminDashboard.defaultProps = {
  overview: null,
  loading: false,
  onRefresh: undefined,
};
