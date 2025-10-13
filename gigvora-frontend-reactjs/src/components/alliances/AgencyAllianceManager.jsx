import {
  ArrowPathIcon,
  BoltIcon,
  ChartBarIcon,
  ChartPieIcon,
  ClockIcon,
  DocumentCheckIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';

function formatHours(value) {
  if (value == null) return '0h';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0h';
  return `${Math.round(numeric * 10) / 10}h`;
}

function formatPercent(value) {
  if (value == null) return '0%';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0%';
  return `${Math.round(numeric * 10) / 10}%`;
}

function formatCurrency(value, currency = 'USD') {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return `${currency} 0`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function AllianceSummaryCard({ allianceSummary }) {
  const { alliance, membership, metrics, pods } = allianceSummary;
  const statusBadgeClasses = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    planned: 'bg-amber-100 text-amber-700 border-amber-200',
    paused: 'bg-rose-100 text-rose-700 border-rose-200',
    closed: 'bg-slate-100 text-slate-500 border-slate-200',
  }[alliance.status] ?? 'bg-slate-100 text-slate-500 border-slate-200';

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{alliance.name}</h3>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClasses}`}>
              <span className="inline-block h-2 w-2 rounded-full bg-current opacity-60" />
              {alliance.status}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{alliance.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
          <span>Alliance type: <strong className="font-semibold text-slate-700">{alliance.allianceType.replace('_', ' ')}</strong></span>
          <span>Next review: <strong className="font-semibold text-slate-700">{formatDate(metrics.nextReviewAt)}</strong></span>
          {membership?.revenueSharePercent != null ? (
            <span>
              Revenue share: <strong className="font-semibold text-slate-700">{formatPercent(membership.revenueSharePercent)}</strong>
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-3 text-blue-700">
            <ChartBarIcon className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Pods</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-blue-900">{metrics.totalPods}</p>
          <p className="text-xs text-blue-700/80">Active pods orchestrating alliance delivery.</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <BoltIcon className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Active rate cards</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">{metrics.activeRateCards}</p>
          <p className="text-xs text-emerald-700/80">Live commercial packages approved across partners.</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-center gap-3 text-amber-700">
            <ClockIcon className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Committed hours</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-amber-900">{formatHours(membership?.commitmentHours)}</p>
          <p className="text-xs text-amber-700/80">Weekly pledge from you into this alliance.</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <div className="flex items-center gap-3 text-rose-700">
            <FireIcon className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Approvals pending</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-rose-900">{metrics.pendingApprovals}</p>
          <p className="text-xs text-rose-700/80">Rate card or revenue split approvals awaiting action.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Alliance pods</h4>
            <span className="text-xs text-slate-400">{pods.length} pods</span>
          </div>
          <div className="mt-3 space-y-3">
            {pods.map((pod) => (
              <div key={pod.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{pod.name}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{pod.podType}</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600">{formatCurrency(pod.backlogValue)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{pod.focusArea}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
                    <DocumentCheckIcon className="h-4 w-4" />
                    Lead: {pod.leadMember?.user ? `${pod.leadMember.user.firstName} ${pod.leadMember.user.lastName}` : 'Unassigned'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                    Capacity target {pod.capacityTarget ?? '—'} squads
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-600">
                  {pod.members?.map((member) => (
                    <div key={`${pod.id}-${member.allianceMemberId}`} className="flex items-center justify-between">
                      <span>
                        {member.member?.user
                          ? `${member.member.user.firstName} ${member.member.user.lastName}`
                          : member.member?.workspace?.name ?? `Member #${member.allianceMemberId}`}
                      </span>
                      <span className="text-slate-400">
                        {formatHours(member.weeklyCommitmentHours)} • Target {member.utilizationTarget ?? '—'}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!pods.length ? <p className="text-xs text-slate-400">No pods configured yet.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Rate cards</h4>
            <span className="text-xs text-slate-400">Grouped by service line</span>
          </div>
          <div className="mt-3 space-y-3">
            {allianceSummary.rateCardGroups.map((group) => (
              <div key={`${group.serviceLine}-${group.deliveryModel ?? 'default'}`} className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">{group.serviceLine}</p>
                    <p className="text-xs uppercase tracking-wide text-blue-600/80">{group.deliveryModel ?? 'standard package'}</p>
                  </div>
                  <div className="text-right text-xs text-blue-700/80">
                    <p className="font-semibold text-blue-900">{formatCurrency(group.latest.rate, group.latest.currency)}</p>
                    <p>per {group.latest.unit}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-blue-700/80">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5">
                    v{group.latest.version}
                  </span>
                  <span>Effective {formatDate(group.latest.effectiveFrom)}</span>
                  {group.pendingApprovals?.length ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                      <ArrowPathIcon className="h-4 w-4" /> {group.pendingApprovals.length} awaiting approval
                    </span>
                  ) : null}
                </div>
                {group.history?.length ? (
                  <div className="mt-3 rounded-2xl border border-blue-100 bg-white/80 p-3 text-xs text-blue-700/70">
                    <p className="font-semibold text-blue-800">History</p>
                    <ul className="mt-2 space-y-1">
                      {group.history.map((entry) => (
                        <li key={`${group.serviceLine}-v${entry.version}`} className="flex items-center justify-between">
                          <span>
                            v{entry.version} • {formatCurrency(entry.rate, entry.currency)} / {entry.unit}
                          </span>
                          <span>{formatDate(entry.effectiveFrom)} → {formatDate(entry.effectiveTo)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
            {!allianceSummary.rateCardGroups.length ? <p className="text-xs text-slate-400">No rate cards captured yet.</p> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Revenue splits</h4>
            <ChartPieIcon className="h-5 w-5 text-slate-400" />
          </div>
          <ul className="mt-3 space-y-3 text-xs text-slate-600">
            {allianceSummary.revenueSplits.map((split) => (
              <li key={`${split.id}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span className="capitalize">{split.splitType.replace('_', ' ')}</span>
                  <span className="text-xs font-normal text-slate-500">Status: {split.status.replace('_', ' ')}</span>
                </div>
                <p className="mt-2 text-slate-600">Effective {formatDate(split.effectiveFrom)}</p>
                <pre className="mt-2 overflow-x-auto rounded-xl bg-white/80 p-3 text-[11px] text-slate-500">
                  {JSON.stringify(split.terms, null, 2)}
                </pre>
              </li>
            ))}
            {!allianceSummary.revenueSplits.length ? <p className="text-xs text-slate-400">No revenue splits configured yet.</p> : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Resource calendar</h4>
            <ClockIcon className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Week of</th>
                  <th className="px-3 py-2">Planned</th>
                  <th className="px-3 py-2">Booked</th>
                  <th className="px-3 py-2">Available</th>
                  <th className="px-3 py-2">Utilization</th>
                  <th className="px-3 py-2">Key contributors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/80 text-xs text-slate-600">
                {allianceSummary.resourceCalendar.map((week) => (
                  <tr key={`${allianceSummary.alliance.id}-${week.weekStartDate}`}>
                    <td className="px-3 py-2 font-medium text-slate-700">{formatDate(week.weekStartDate)}</td>
                    <td className="px-3 py-2">{formatHours(week.plannedHours)}</td>
                    <td className="px-3 py-2">{formatHours(week.bookedHours)}</td>
                    <td className="px-3 py-2">{formatHours(week.availableHours)}</td>
                    <td className="px-3 py-2">{formatPercent(week.utilizationRate)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {week.members.slice(0, 3).map((member) => (
                          <span key={member.memberId} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            {member.memberName} ({formatPercent(member.utilizationRate)})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {!allianceSummary.resourceCalendar.length ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                      No resource entries captured yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceHeatmap({ weeks }) {
  if (!weeks.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-400">
        Resource heatmap will populate once allocations begin flowing in.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Alliance bandwidth heatmap</h3>
        <span className="text-xs text-slate-400">{weeks.length} week trend</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-600">
          <thead className="bg-slate-100 uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Week of</th>
              <th className="px-3 py-2">Total planned</th>
              <th className="px-3 py-2">Total booked</th>
              <th className="px-3 py-2">Available</th>
              <th className="px-3 py-2">Utilization</th>
              <th className="px-3 py-2">Top allocations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {weeks.map((week) => (
              <tr key={week.weekStartDate}>
                <td className="px-3 py-2 font-medium text-slate-700">{formatDate(week.weekStartDate)}</td>
                <td className="px-3 py-2">{formatHours(week.totalPlannedHours)}</td>
                <td className="px-3 py-2">{formatHours(week.totalBookedHours)}</td>
                <td className="px-3 py-2">{formatHours(week.availableHours)}</td>
                <td className="px-3 py-2">{formatPercent(week.utilizationRate)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {week.allocations.slice(0, 3).map((allocation) => (
                      <span key={`${week.weekStartDate}-${allocation.allianceId}`} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                        <FireIcon className="h-4 w-4" />
                        {allocation.allianceName} ({formatPercent(allocation.utilizationRate)})
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AgencyAllianceManager({ data, loading, error, onRefresh, fromCache, lastUpdated }) {
  const alliances = Array.isArray(data?.alliances) ? data.alliances : [];
  const weeks = data?.resourceHeatmap?.weeks ?? [];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Agency alliance manager</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Collaborate with partner agencies, track shared pods, govern rate cards, and visualise resource utilisation for every alliance you lead.
          </p>
        </div>
        <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={onRefresh} />
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          <p className="font-semibold">We couldn&apos;t load alliance data.</p>
          <p className="mt-1 text-rose-600/80">{error.message ?? 'Please try refreshing or check your network connection.'}</p>
        </div>
      ) : null}

      {loading && !alliances.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-400">
          Loading alliance intelligence…
        </div>
      ) : null}

      {!loading && !alliances.length && !error ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center">
          <ChartBarIcon className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            You&apos;re not yet part of any agency alliances. Invite a partner workspace to kick off your first alliance pod.
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        {alliances.map((allianceSummary) => (
          <AllianceSummaryCard key={allianceSummary.alliance.id} allianceSummary={allianceSummary} />
        ))}
      </div>

      <ResourceHeatmap weeks={weeks} />
    </section>
  );
}
