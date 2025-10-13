import {
  ArrowTrendingUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import { classNames } from '../../utils/classNames.js';

const STATUS_STYLES = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  draft: 'border-slate-200 bg-slate-100 text-slate-600',
  paused: 'border-amber-200 bg-amber-50 text-amber-700',
  archived: 'border-slate-200 bg-slate-100 text-slate-500',
};

const RISK_LABELS = {
  confident: { label: 'Confident', tone: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  watch: { label: 'Watch closely', tone: 'text-amber-600 bg-amber-50 border-amber-200' },
  at_risk: { label: 'At risk', tone: 'text-rose-600 bg-rose-50 border-rose-200' },
};

function LoadingState({ className = '' }) {
  return (
    <div className={classNames('animate-pulse space-y-5', className)}>
      <div className="h-6 w-48 rounded-full bg-slate-200/70" />
      <div className="h-4 w-full rounded-full bg-slate-200/70" />
      <div className="h-4 w-2/3 rounded-full bg-slate-200/70" />
      <div className="h-2 w-full rounded-full bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-24 rounded-2xl bg-slate-200/60" />
        <div className="h-24 rounded-2xl bg-slate-200/60" />
      </div>
    </div>
  );
}

export default function ClientPortalSummary({
  portal,
  timelineSummary,
  scopeSummary,
  decisionSummary,
  loading = false,
  error = null,
  onRetry,
  className = '',
}) {
  if (loading) {
    return (
      <section className={classNames('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8', className)}>
        <LoadingState />
      </section>
    );
  }

  if (error) {
    return (
      <section className={classNames('rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm sm:p-8', className)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 text-rose-500" />
            <div>
              <h2 className="text-lg font-semibold">We couldn&apos;t load your client portal data</h2>
              <p className="mt-1 text-sm text-rose-600/80">{error.message ?? 'Please try again in a moment.'}</p>
            </div>
          </div>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100"
            >
              Retry
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  const status = portal?.status ?? 'draft';
  const statusStyles = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const healthScore = typeof portal?.healthScore === 'number' ? portal.healthScore : null;
  const riskLevel = portal?.riskLevel ?? 'watch';
  const riskConfig = RISK_LABELS[riskLevel] ?? RISK_LABELS.watch;
  const progressPercent = Math.max(
    0,
    Math.min(100, Number(timelineSummary?.progressPercent ?? 0)),
  );
  const totalMilestones = timelineSummary?.totalCount ?? 0;
  const completedMilestones = timelineSummary?.completedCount ?? 0;
  const nextMilestone = timelineSummary?.upcomingMilestones?.[0] ?? null;
  const lastDecisionAt = decisionSummary?.lastDecisionAt ?? null;
  const completionRatio = scopeSummary?.completionRatio ?? 0;
  const stakeholders = Array.isArray(portal?.stakeholders) ? portal.stakeholders : [];

  const metrics = [
    {
      name: 'Delivery progress',
      value: `${completedMilestones}/${totalMilestones} complete`,
      helper: `${progressPercent}% of milestones closed`,
      icon: ArrowTrendingUpIcon,
    },
    {
      name: 'Next milestone',
      value: nextMilestone ? nextMilestone.title : 'All milestones clear',
      helper: nextMilestone?.dueDate
        ? `Due ${formatRelativeTime(nextMilestone.dueDate)} (${formatAbsolute(nextMilestone.dueDate, { dateStyle: 'medium' })})`
        : 'No upcoming milestone scheduled',
      icon: ClockIcon,
    },
    {
      name: 'Scope coverage',
      value: `${completionRatio}% delivered`,
      helper: `${scopeSummary?.deliveredCount ?? 0} of ${scopeSummary?.totalCount ?? 0} scope items shipped`,
      icon: ShieldCheckIcon,
    },
    {
      name: 'Last decision',
      value: lastDecisionAt ? formatRelativeTime(lastDecisionAt) : 'Awaiting decision',
      helper: lastDecisionAt ? formatAbsolute(lastDecisionAt, { dateStyle: 'medium' }) : 'No shared decisions yet',
      icon: UsersIcon,
    },
  ];

  return (
    <section className={classNames('rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8', className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={classNames(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                statusStyles,
              )}
            >
              {status.replace('_', ' ')}
            </span>
            {healthScore != null ? (
              <span
                className={classNames(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                  riskConfig.tone,
                )}
              >
                <ShieldCheckIcon className="h-4 w-4" />
                Health {healthScore}
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500/80">{riskConfig.label}</span>
              </span>
            ) : null}
            {portal?.project?.title ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
                Project: {portal.project.title}
              </span>
            ) : null}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{portal?.title ?? 'Client portal'}</h2>
            {portal?.summary ? (
              <p className="mt-2 max-w-3xl text-sm text-slate-600">{portal.summary}</p>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>Milestone progress</span>
              <span>
                {completedMilestones}/{totalMilestones} complete
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {stakeholders.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stakeholders</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stakeholders.slice(0, 6).map((stakeholder) => (
                  <span
                    key={`${stakeholder.email ?? stakeholder.name}`}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                  >
                    <UsersIcon className="h-4 w-4 text-blue-500" />
                    <span>{stakeholder.name}</span>
                    {stakeholder.role ? (
                      <span className="text-[10px] uppercase tracking-wide text-slate-400">{stakeholder.role}</span>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm sm:p-6 lg:max-w-xs">
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.name} className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <metric.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{metric.name}</p>
                  <p className="text-sm font-semibold text-slate-900">{metric.value}</p>
                  <p className="text-xs text-slate-500">{metric.helper}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
