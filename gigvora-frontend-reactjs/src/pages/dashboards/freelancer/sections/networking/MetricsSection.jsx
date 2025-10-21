import SectionShell from '../../SectionShell.jsx';

function StatCard({ title, value, hint, tone = 'slate' }) {
  const toneClasses = {
    slate: 'border-slate-200 bg-white text-slate-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    violet: 'border-violet-200 bg-violet-50 text-violet-900',
  };
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        toneClasses[tone] ?? toneClasses.slate
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-600">{hint}</p> : null}
    </div>
  );
}

function WeeklyActivityChart({ data }) {
  if (!data?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        Weekly activity will appear once sessions start recording insights.
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => Math.max(item.bookings, item.connections, item.spendCents / 100 || 0)), 1);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-end gap-4">
        {data.map((item) => {
          const bookingHeight = Math.max(4, Math.round((item.bookings / maxValue) * 100));
          const connectionHeight = Math.max(4, Math.round((item.connections / maxValue) * 100));
          const spendHeight = Math.max(4, Math.round(((item.spendCents / 100) / maxValue) * 100));
          return (
            <div key={item.week} className="flex w-full flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end justify-center gap-1">
                <span
                  className="inline-flex w-3 rounded-full bg-blue-400"
                  style={{ height: `${bookingHeight}%` }}
                  title={`${item.bookings} bookings`}
                />
                <span
                  className="inline-flex w-3 rounded-full bg-emerald-400"
                  style={{ height: `${connectionHeight}%` }}
                  title={`${item.connections} contacts`}
                />
                <span
                  className="inline-flex w-3 rounded-full bg-violet-400"
                  style={{ height: `${spendHeight}%` }}
                  title={`$${Math.round(item.spendCents / 100)} spend`}
                />
              </div>
              <p className="text-xs font-medium text-slate-600">{item.week}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-blue-400" /> Bookings
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-emerald-400" /> Connections
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-violet-400" /> Spend
        </div>
      </div>
    </div>
  );
}

function TopSessionsTable({ sessions }) {
  if (!sessions?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        Top sessions will appear once bookings and spend start flowing in.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Session
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Bookings
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Spend
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Last activity
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sessions.map((session) => (
            <tr key={session.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{session.title}</p>
                <p className="text-xs text-slate-500 capitalize">{session.status?.replace(/_/g, ' ')}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">{session.bookings}</td>
              <td className="px-4 py-3 text-slate-700">{session.spendFormatted}</td>
              <td className="px-4 py-3 text-slate-500">
                {session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MetricsSection({ metrics, ordersSummary, adsInsights }) {
  const conversions = metrics?.conversions ?? {};
  const spend = metrics?.spend ?? {};
  const weeklyActivity = metrics?.weeklyActivity ?? [];
  const topSessions = metrics?.topSessions ?? [];
  const insights = adsInsights ?? {};
  const orderSpend = ordersSummary?.spend ?? {};

  return (
    <SectionShell
      id="network-metrics"
      title="Network metrics"
      description="Signals across attendance, spend, and campaign performance to keep growth healthy."
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard
          title="Attendance rate"
          value={`${conversions.attendanceRate ?? 0}%`}
          hint={`${conversions.cancellationRate ?? 0}% cancellation rate`}
          tone="blue"
        />
        <StatCard
          title="Follow-up efficiency"
          value={`${conversions.followUpRate ?? 0}%`}
          hint={`Close rate ${conversions.connectionCloseRate ?? 0}%`}
          tone="emerald"
        />
        <StatCard
          title="Average spend"
          value={spend.averageSpendFormatted ?? '—'}
          hint={`Total ${spend.totalSpendFormatted ?? '—'}`}
          tone="violet"
        />
        <StatCard
          title="Campaign reach"
          value={insights.totalImpressions ? `${insights.totalImpressions.toLocaleString()} impressions` : '—'}
          hint={`${insights.totalClicks ?? 0} clicks · ${insights.activeCampaigns ?? 0} active`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WeeklyActivityChart data={weeklyActivity} />
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Order health</h3>
            <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Total orders</dt>
                <dd className="text-lg font-semibold text-slate-900">{ordersSummary?.totals?.total ?? 0}</dd>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3">
                <dt className="text-xs uppercase tracking-wide text-emerald-600">Paid</dt>
                <dd className="text-lg font-semibold text-emerald-700">{ordersSummary?.totals?.paid ?? 0}</dd>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3">
                <dt className="text-xs uppercase tracking-wide text-amber-600">Pending</dt>
                <dd className="text-lg font-semibold text-amber-700">{ordersSummary?.totals?.pending ?? 0}</dd>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3">
                <dt className="text-xs uppercase tracking-wide text-blue-600">Lifetime spend</dt>
                <dd className="text-lg font-semibold text-blue-700">{orderSpend?.totalSpendFormatted ?? '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Campaign performance</h3>
            <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Spend to date</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{insights.totalSpendFormatted ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Average CPC</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">
                  {insights.averageCpc ? `$${Number(insights.averageCpc).toFixed(2)}` : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <TopSessionsTable sessions={topSessions} />
    </SectionShell>
  );
}
