import { ArrowTrendingUpIcon, BriefcaseIcon, BuildingOffice2Icon, UsersIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../../components/DataStatus.jsx';

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 });

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(numeric);
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return percentFormatter.format(numeric);
}

function formatScore(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return `${numeric.toFixed(1)}`;
}

function MetricCard({ icon: Icon, title, value, caption }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {caption ? <p className="mt-2 text-xs text-slate-500">{caption}</p> : null}
        </div>
        {Icon ? (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function CompactList({ title, items, emptyLabel }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              {item.caption ? <p className="text-xs text-slate-500">{item.caption}</p> : null}
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
            {emptyLabel}
          </li>
        )}
      </ul>
    </div>
  );
}

export default function AgencyOverviewPanel({ data, loading, error, onRefresh }) {
  const utilization = data?.operations?.overview?.utilization ?? {};
  const clientHealth = data?.operations?.overview?.clientHealth ?? {};
  const alerts = Array.isArray(data?.operations?.overview?.alerts) ? data.operations.overview.alerts : [];
  const resourceSummary = data?.operations?.projectsWorkspace?.workspaceOrchestrator?.summary ?? {};

  const focusMetrics = [
    {
      id: 'utilization',
      title: 'Utilisation',
      value: formatPercent(utilization.rate),
      caption: `${formatNumber(utilization.benchCount)} on bench`,
      icon: ArrowTrendingUpIcon,
    },
    {
      id: 'clients',
      title: 'Active clients',
      value: formatNumber(clientHealth.activeClients),
      caption: `${formatNumber(clientHealth.atRiskEngagements)} engagements flagged`,
      icon: BuildingOffice2Icon,
    },
    {
      id: 'projects',
      title: 'Live projects',
      value: formatNumber(data?.summary?.projects?.active ?? data?.summary?.projects?.total),
      caption: `${formatNumber(resourceSummary?.dependencies ?? 0)} dependencies`,
      icon: BriefcaseIcon,
    },
    {
      id: 'team',
      title: 'Active members',
      value: formatNumber(data?.summary?.members?.active ?? data?.summary?.members?.total),
      caption: `${formatScore(data?.summary?.quality?.averageClientSatisfaction)} client CSAT`,
      icon: UsersIcon,
    },
  ];

  const clientSignals = [
    {
      id: 'csat',
      title: 'Client satisfaction',
      caption:
        clientHealth.csatScore != null
          ? `${formatScore(clientHealth.csatScore)}/5 average score`
          : 'Surveys will appear once submitted',
    },
    {
      id: 'qa',
      title: 'QA health',
      caption:
        clientHealth.qaScore != null
          ? `${formatScore(clientHealth.qaScore)}/5 QA index`
          : 'Quality reviews will populate automatically',
    },
  ];

  const priorityAlerts = alerts.slice(0, 4).map((alert, index) => ({
    id: alert.referenceId ?? index,
    title: alert.title ?? 'Operational alert',
    caption: alert.message ?? '',
  }));

  const assignmentHighlights = (utilization.assignments ?? []).slice(0, 4).map((assignment, index) => ({
    id: assignment.id ?? index,
    title: assignment.title ?? assignment.role ?? 'Assignment',
    caption: assignment.summary ?? assignment.account ?? null,
  }));

  return (
    <section id="agency-overview" className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Agency control room</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Keep delivery and growth in sync</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Monitor utilisation, client satisfaction, and live project load at a glance. Surface the actions that keep
            benches healthy and engagements on track.
          </p>
        </div>
        <DataStatus
          loading={loading}
          error={error}
          onRefresh={onRefresh}
          lastUpdated={data?.refreshedAt}
          statusLabel="Operational snapshot"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {focusMetrics.map((metric) => (
          <MetricCard key={metric.id} icon={metric.icon} title={metric.title} value={metric.value} caption={metric.caption} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Client health</h2>
          </div>
          <div className="mt-5 grid gap-4">
            {clientSignals.map((signal) => (
              <div key={signal.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{signal.title}</p>
                <p className="text-xs text-slate-500">{signal.caption}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">At-risk engagements</p>
              <p className="text-xs text-slate-500">
                {formatNumber(clientHealth.atRiskEngagements)} projects need attention this week.
              </p>
            </div>
          </div>
        </div>

        <CompactList
          title="Operations alerts"
          items={priorityAlerts}
          emptyLabel="No blocking alerts. Delivery signals stay green."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Bench & capacity</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Weekly capacity</p>
              <p className="text-xs text-slate-500">
                {utilization.averageWeeklyCapacity ? `${formatNumber(utilization.averageWeeklyCapacity)} hrs per member` : 'Capacity planning updates populate once schedules sync.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Bench hours</p>
              <p className="text-xs text-slate-500">
                {utilization.benchHours ? `${formatNumber(utilization.benchHours)} hrs available to redeploy` : 'Bench hours will populate from utilisation tracking.'}
              </p>
            </div>
          </div>
        </div>
        <CompactList
          title="Featured assignments"
          items={assignmentHighlights}
          emptyLabel="Assignments surface here once teams match to upcoming engagements."
        />
      </div>
    </section>
  );
}
