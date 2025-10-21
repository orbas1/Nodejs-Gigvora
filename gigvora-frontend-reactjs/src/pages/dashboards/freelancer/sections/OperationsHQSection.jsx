import { useMemo } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerOperationsHQ from '../../../../hooks/useFreelancerOperationsHQ.js';

const STATUS_COLORS = {
  active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  invited: 'text-blue-600 bg-blue-50 border-blue-200',
  available: 'text-slate-600 bg-slate-50 border-slate-200',
  requested: 'text-amber-600 bg-amber-50 border-amber-200',
  pending: 'text-amber-600 bg-amber-50 border-amber-200',
  declined: 'text-rose-600 bg-rose-50 border-rose-200',
};

function formatStatus(value) {
  if (!value) {
    return 'Unknown';
  }
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return `${value}`;
  }
}

function formatTime(value) {
  if (!value) {
    return null;
  }
  try {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    return `${value}`;
  }
}

function ProgressIndicator({ value }) {
  const clamped = Math.max(0, Math.min(100, Number(value ?? 0)));
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600">{clamped}%</span>
    </div>
  );
}

function MembershipCard({ membership, onRequest, busy }) {
  const statusKey = membership.status?.toLowerCase?.() ?? 'available';
  const statusClass = STATUS_COLORS[statusKey] ?? STATUS_COLORS.available;
  const isRequestable = statusKey === 'available';
  const isInvited = statusKey === 'invited';

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{membership.name}</p>
            <p className="text-xs text-slate-500">{membership.role}</p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass}`}>
            {isInvited ? <SparklesIcon className="h-3.5 w-3.5" /> : <ShieldCheckIcon className="h-3.5 w-3.5" />}
            {formatStatus(membership.status)}
          </span>
        </div>
        <p className="text-sm text-slate-600">{membership.description}</p>
        {membership.lastReviewedAt ? (
          <p className="text-xs text-slate-500">Reviewed {formatDate(membership.lastReviewedAt)}</p>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {isInvited ? 'Accept invite from your email inbox.' : 'Managed by operations automation.'}
        </div>
        {isRequestable ? (
          <button
            type="button"
            onClick={() => onRequest(membership.id)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BoltIcon className="h-4 w-4" />
            Request access
          </button>
        ) : null}
      </div>
    </article>
  );
}

function WorkflowCard({ workflow }) {
  const tone = workflow.status === 'at-risk' ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-blue-600 bg-blue-50 border-blue-200';
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{workflow.title}</p>
          <p className="text-xs text-slate-500">Due {formatTime(workflow.dueAt) ?? 'Not scheduled'}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone}`}>
          {workflow.status === 'at-risk' ? <ExclamationTriangleIcon className="h-3.5 w-3.5" /> : <ClockIcon className="h-3.5 w-3.5" />}
          {formatStatus(workflow.status)}
        </span>
      </div>
      <ProgressIndicator value={workflow.completion} />
      {Array.isArray(workflow.blockers) && workflow.blockers.length ? (
        <ul className="space-y-1 text-xs text-rose-600">
          {workflow.blockers.map((blocker) => (
            <li key={blocker} className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-3 w-3" />
              <span>{blocker}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function NoticeCard({ notice, onAcknowledge, busy }) {
  const toneClass =
    notice.tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : notice.tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';

  return (
    <article className={`rounded-2xl border px-4 py-3 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{notice.title}</p>
          <p className="mt-1 text-sm">{notice.message}</p>
          <p className="mt-2 text-xs opacity-80">Raised {formatTime(notice.createdAt) ?? 'recently'}</p>
        </div>
        {notice.acknowledged ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            Acknowledged
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onAcknowledge(notice.id)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-75"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Mark done
          </button>
        )}
      </div>
    </article>
  );
}

export default function OperationsHQSection() {
  const { session } = useSession();
  const freelancerId =
    session?.freelancerId ?? session?.profileId ?? session?.userId ?? session?.id ?? null;

  const {
    memberships,
    workflows,
    notices,
    metrics,
    compliance,
    loading,
    error,
    requestMembership,
    syncOperations,
    acknowledgeNotice,
    requestState,
    acknowledgingId,
    refresh,
    fromCache,
    lastUpdated,
  } = useFreelancerOperationsHQ({ freelancerId, enabled: Boolean(freelancerId) });

  const metricCards = useMemo(
    () => [
      {
        id: 'workflows',
        label: 'Active workflows',
        value: metrics?.activeWorkflows ?? 0,
        icon: BuildingOffice2Icon,
      },
      {
        id: 'compliance',
        label: 'Compliance score',
        value: metrics?.complianceScore ? `${metrics.complianceScore}%` : '—',
        icon: ShieldCheckIcon,
      },
      {
        id: 'automation',
        label: 'Automation coverage',
        value: metrics?.automationCoverage ? `${metrics.automationCoverage}%` : '—',
        icon: BoltIcon,
      },
      {
        id: 'escalations',
        label: 'Escalations',
        value: metrics?.escalations ?? 0,
        icon: ExclamationTriangleIcon,
      },
    ],
    [metrics],
  );

  const complianceItems = useMemo(
    () => [
      {
        id: 'outstanding',
        label: 'Outstanding tasks',
        value: compliance?.outstandingTasks ?? 0,
        tone: compliance?.outstandingTasks ? 'text-amber-600' : 'text-emerald-600',
      },
      {
        id: 'approvals',
        label: 'Approvals this month',
        value: compliance?.recentApprovals ?? 0,
        tone: 'text-blue-600',
      },
      {
        id: 'next-review',
        label: 'Next review',
        value: formatDate(compliance?.nextReviewAt),
        tone: 'text-slate-600',
      },
    ],
    [compliance],
  );

  const busyRequest = requestState.status === 'submitting';

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => refresh({ force: true })}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {fromCache ? 'Sync cache' : 'Refresh'}
      </button>
      <button
        type="button"
        onClick={() => syncOperations()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <SparklesIcon className="h-4 w-4" />
        Run automation
      </button>
    </div>
  );

  return (
    <SectionShell
      id="operations-hq"
      title="Freelancer Operations HQ"
      description="Coordinate memberships, compliance, and automation to keep engagements production ready."
      actions={actions}
    >
      <DataStatus loading={loading} error={error} lastUpdated={lastUpdated} />

      {!freelancerId ? (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          <p className="font-semibold">Link your freelancer profile</p>
          <p className="mt-2 text-sm">
            Switch to a freelancer workspace profile to access automation controls and compliance tooling.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <div key={card.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="text-lg font-semibold text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Workspace memberships</p>
                <p className="mt-1 text-sm text-slate-600">
                  Manage which operational programmes you participate in and request new access on-demand.
                </p>
              </div>
              {requestState.status === 'success' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  <CheckCircleIcon className="h-4 w-4" />
                  Request sent
                </span>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {memberships.map((membership) => (
                <MembershipCard
                  key={membership.id}
                  membership={membership}
                  onRequest={requestMembership}
                  busy={busyRequest}
                />
              ))}
            </div>
            {requestState.status === 'error' ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {requestState.error?.message ?? 'Unable to submit membership request.'}
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Workflow control centre</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Last sync {formatTime(metrics?.lastSyncedAt) ?? '—'}
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {workflows.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
              {workflows.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No active workflows. Automations will generate tasks when new engagements start.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Compliance readiness</p>
              <LockClosedIcon className="h-5 w-5 text-slate-400" />
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {complianceItems.map((item) => (
                <li key={item.id} className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 ${item.tone}`}>
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Operational notices</p>
            <div className="mt-4 space-y-3">
              {notices.length === 0 ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  All clear. Automations will raise alerts when new actions are required.
                </p>
              ) : null}
              {notices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onAcknowledge={acknowledgeNotice}
                  busy={acknowledgingId === notice.id}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}
