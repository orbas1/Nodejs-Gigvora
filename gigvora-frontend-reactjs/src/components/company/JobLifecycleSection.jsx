import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

function formatNumber(value, { fallback = '—', decimals = null, style = 'number' } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (style === 'currency') {
    const fractionDigits = decimals ?? (numeric < 100 ? 2 : 0);
    return `$${numeric.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  }
  if (decimals != null) {
    return numeric.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return numeric.toLocaleString();
}

function formatPercent(value, fallback = '—') {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  return `${Number(value).toFixed(1)}%`;
}

function StagePerformanceTable({ items }) {
  if (!items?.length) {
    return (
      <p className="text-sm text-slate-500">
        Configure your ATS stages and capture interviewer feedback to unlock lifecycle analytics.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Stage</th>
            <th scope="col" className="px-4 py-3">SLA</th>
            <th scope="col" className="px-4 py-3">Avg duration</th>
            <th scope="col" className="px-4 py-3">Advance rate</th>
            <th scope="col" className="px-4 py-3">Pending</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((stage) => {
            const slaDelta = stage.slaDeltaHours;
            const slaBadgeTone = slaDelta != null && slaDelta > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600';
            const progress = Math.min(Math.max(stage.advanceRate ?? 0, 0), 100);
            return (
              <tr key={stage.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{stage.name}</div>
                  {stage.guideUrl ? (
                    <a
                      href={stage.guideUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Stage guide
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {stage.slaHours != null ? `${formatNumber(stage.slaHours, { decimals: 0 })} hrs` : '—'}
                  {slaDelta != null ? (
                    <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${slaBadgeTone}`}>
                      {slaDelta > 0 ? `+${formatNumber(slaDelta, { decimals: 1 })} hrs` : `${formatNumber(slaDelta, { decimals: 1 })} hrs`}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {stage.averageDurationHours != null
                    ? `${formatNumber(stage.averageDurationHours, { decimals: 1 })} hrs`
                    : '—'}
                  {stage.medianDecisionHours != null ? (
                    <p className="text-xs text-slate-400">Median {formatNumber(stage.medianDecisionHours, { decimals: 1 })} hrs</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${progress >= 50 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{formatPercent(stage.advanceRate)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Rejections {formatPercent(stage.rejectionRate)} · Holds {formatPercent(stage.holdRate)}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {formatNumber(stage.pendingReviews)}
                  <p className="text-xs text-slate-400">Throughput {formatNumber(stage.throughput)}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ApprovalQueue({ queue }) {
  if (!queue?.items?.length) {
    return (
      <p className="text-sm text-slate-500">
        No approvals are pending. Hiring managers and finance partners have cleared their review queue.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {queue.items.map((item) => {
        const statusTone = item.isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600';
        return (
          <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.approverRole}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.createdAt ? `Waiting ${formatRelativeTime(item.createdAt)}` : 'Awaiting review'}
                  {item.dueAt ? ` · Due ${formatRelativeTime(item.dueAt)}` : ''}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone}`}
                title={item.dueAt ? formatAbsolute(item.dueAt) : undefined}
              >
                <ClockIcon className="h-3.5 w-3.5" />
                {item.isOverdue ? 'Overdue' : item.status.replace(/_/g, ' ')}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CampaignInsights({ campaigns }) {
  if (!campaigns?.topChannels?.length) {
    return (
      <p className="text-sm text-slate-500">
        Publish requisitions to Gigvora, job boards, or referral programs to unlock channel performance analytics.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.topChannels.map((channel) => {
        const width = Math.min(Math.max(channel.conversionRate ?? 0, 0), 100);
        return (
          <div key={channel.channel} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold text-slate-900">{channel.channel}</p>
              <p className="text-slate-500">{formatNumber(channel.applications)} applications</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-600">{formatPercent(channel.conversionRate)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {formatNumber(channel.hires)} hires · CPA {formatNumber(channel.spend / Math.max(channel.applications, 1), { style: 'currency', decimals: 2 })}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function FunnelOverview({ funnel }) {
  if (!funnel?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Pipeline conversion</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {funnel.map((stage) => (
          <li key={stage.status} className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-700">{stage.label}</span>
            <span className="text-xs text-slate-500">
              {formatNumber(stage.count)} · {formatPercent(stage.cumulativeConversion)} overall · {formatPercent(stage.conversionFromPrevious)} stage
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationsList({ recommendations }) {
  if (!recommendations?.length) {
    return (
      <p className="text-sm text-slate-500">
        As data flows into your ATS, Gigvora Intelligence will suggest actions to accelerate hiring.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {recommendations.map((item) => (
        <li key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
          {item.action ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-600">{item.action}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export default function JobLifecycleSection({ jobLifecycle, recommendations = [], lookbackDays = 30 }) {
  const metrics = [
    {
      label: 'Active requisitions',
      value: formatNumber(jobLifecycle?.atsHealth?.activeRequisitions),
      caption: `${formatNumber(jobLifecycle?.stagePerformance?.length ?? 0)} stages configured`,
      Icon: ChartBarIcon,
    },
    {
      label: 'Avg stage duration',
      value:
        jobLifecycle?.averageStageDurationHours != null
          ? `${formatNumber(jobLifecycle.averageStageDurationHours, { decimals: 1 })} hrs`
          : '—',
      caption:
        jobLifecycle?.atsHealth?.velocity?.averageDaysToDecision != null
          ? `${jobLifecycle.atsHealth.velocity.averageDaysToDecision} day decision velocity`
          : 'Capture decisions to monitor velocity',
      Icon: ClockIcon,
    },
    {
      label: 'Pending approvals',
      value: formatNumber(jobLifecycle?.pendingApprovals),
      caption:
        jobLifecycle?.overdueApprovals
          ? `${formatNumber(jobLifecycle.overdueApprovals)} overdue`
          : 'All approvals on track',
      tone: jobLifecycle?.overdueApprovals ? 'alert' : 'default',
      Icon: ExclamationTriangleIcon,
    },
    {
      label: 'Campaign spend',
      value: formatNumber(jobLifecycle?.campaigns?.totalSpend, { style: 'currency' }),
      caption:
        jobLifecycle?.campaigns?.averageCostPerApplication != null
          ? `Avg CPA ${formatNumber(jobLifecycle.campaigns.averageCostPerApplication, { style: 'currency', decimals: 2 })}`
          : 'No spend recorded this window',
      Icon: BoltIcon,
    },
    {
      label: 'Upcoming interviews',
      value: formatNumber(jobLifecycle?.atsHealth?.upcomingInterviews),
      caption:
        jobLifecycle?.atsHealth?.rescheduleCount
          ? `${formatNumber(jobLifecycle.atsHealth.rescheduleCount)} reschedules`
          : 'Schedules stable',
      Icon: SparklesIcon,
    },
  ];

  return (
    <section
      id="job-lifecycle-ats-intelligence"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Job lifecycle & ATS intelligence</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Run a collaborative applicant tracking system with visibility from requisition intake to offer acceptance.
            Insights below reflect the past {lookbackDays} days.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          <SparklesIcon className="h-4 w-4" />
          ATS intelligence
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.Icon ?? ChartBarIcon;
          const toneClass =
            metric.tone === 'alert'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-blue-100 bg-blue-50 text-blue-700';
          return (
            <div
              key={metric.label}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                  Insight
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{metric.value}</p>
              <p className="mt-2 text-xs text-slate-500">{metric.caption}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Stage performance</h3>
          <p className="mt-1 text-sm text-slate-500">
            Monitor SLA adherence, decision velocity, and throughput for every stage in your hiring workflow.
          </p>
          <div className="mt-4">
            <StagePerformanceTable items={jobLifecycle?.stagePerformance} />
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Approval queue</h3>
            <p className="mt-1 text-sm text-slate-500">
              Finance and hiring manager approvals still in flight. Automated nudges keep requisitions moving.
            </p>
            <div className="mt-4">
              <ApprovalQueue queue={jobLifecycle?.approvalQueue} />
            </div>
          </div>
          <FunnelOverview funnel={jobLifecycle?.funnel} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Campaign intelligence</h3>
          <p className="mt-1 text-sm text-slate-500">
            Optimise sourcing spend across Gigvora, job boards, referrals, and private talent pools.
          </p>
          <div className="mt-4">
            <CampaignInsights campaigns={jobLifecycle?.campaigns} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recommended actions</h3>
          <p className="mt-1 text-sm text-slate-500">
            Data-backed guidance from Gigvora Intelligence tailored to your current lifecycle signals.
          </p>
          <div className="mt-4">
            <RecommendationsList recommendations={recommendations} />
          </div>
        </div>
      </div>

      {jobLifecycle?.recentActivity ? (
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-700">
          <p className="font-semibold uppercase tracking-wide">Recent lifecycle activity</p>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <p>
              <span className="font-semibold text-blue-900">{formatNumber(jobLifecycle.recentActivity.approvalsCompleted)}</span>
              <br /> Approvals completed
            </p>
            <p>
              <span className="font-semibold text-blue-900">{formatNumber(jobLifecycle.recentActivity.campaignsTracked)}</span>
              <br /> Campaign performance reports
            </p>
            <p>
              <span className="font-semibold text-blue-900">{formatNumber(jobLifecycle.recentActivity.interviewsScheduled)}</span>
              <br /> Interviews scheduled
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
