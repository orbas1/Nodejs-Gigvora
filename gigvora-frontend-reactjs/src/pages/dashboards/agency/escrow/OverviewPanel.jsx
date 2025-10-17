import { ArrowPathIcon, BanknotesIcon, ClockIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../../../components/DataStatus.jsx';
import { useEscrow } from './EscrowContext.jsx';
import { formatCurrency, formatNumber } from './formatters.js';

function StatCard({ title, value, icon: Icon, accent }) {
  return (
    <button
      type="button"
      className="group flex flex-1 items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
        <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      </div>
      <span className={`rounded-2xl ${accent} p-3 text-white`}>
        <Icon className="h-6 w-6" />
      </span>
    </button>
  );
}

export default function OverviewPanel() {
  const { state, refreshOverview, openActivityDrawer, openTransactionWizard } = useEscrow();
  const { overview } = state;
  const data = overview.data;

  const upcoming = data?.summary?.upcoming ?? [];
  const currencyTotals = data?.summary?.currencyTotals ?? [];
  const alerts = data?.summary?.alerts ?? [];
  const recentTransactions = data?.recentTransactions ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-8 text-white shadow-lg lg:flex-row">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Escrow</p>
          <h1 className="mt-3 text-3xl font-semibold">
            {data?.workspace?.name || 'Agency escrow'}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {formatCurrency(data?.summary?.totals?.inEscrow ?? 0)} held across {data?.accountsSummary?.currencies?.length ?? 0}{' '}
            currencies
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={refreshOverview}
            className="rounded-full border border-slate-500/40 px-5 py-2 text-sm font-semibold text-white transition hover:border-slate-100/80"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => openTransactionWizard()}
            className="rounded-full bg-white/95 px-6 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white"
          >
            New move
          </button>
        </div>
      </header>

      <DataStatus
        loading={overview.loading}
        error={overview.error}
        empty={!overview.loading && !data}
        className="min-h-[12rem]"
      >
        {data ? (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 lg:grid-cols-4">
              <StatCard
                title="In escrow"
                value={formatCurrency(data.summary?.totals?.inEscrow ?? 0)}
                icon={BanknotesIcon}
                accent="bg-emerald-500"
              />
              <StatCard
                title="Released"
                value={formatCurrency(data.summary?.totals?.released ?? 0)}
                icon={RocketLaunchIcon}
                accent="bg-sky-500"
              />
              <StatCard
                title="Refunded"
                value={formatCurrency(data.summary?.totals?.refunded ?? 0)}
                icon={ArrowPathIcon}
                accent="bg-amber-500"
              />
              <StatCard
                title="Active moves"
                value={formatNumber(data.summary?.counts?.awaitingRelease ?? 0)}
                icon={ClockIcon}
                accent="bg-violet-500"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Upcoming releases</h2>
                  <button
                    type="button"
                    onClick={() => openActivityDrawer('Upcoming releases', { type: 'releases', items: upcoming })}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Expand
                  </button>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {upcoming.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openActivityDrawer('Upcoming releases', { type: 'releases', items: upcoming })}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300"
                    >
                      <p className="text-sm font-semibold text-slate-900">{item.milestoneLabel || item.reference}</p>
                      <p className="text-xs text-slate-500">{item.scheduledReleaseAt ? new Date(item.scheduledReleaseAt).toLocaleString() : 'Awaiting'}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatCurrency(item.amount, item.currencyCode)}
                      </p>
                    </button>
                  ))}
                  {upcoming.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      No upcoming releases yet.
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Currency mix</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {currencyTotals.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-slate-500">
                      No flow yet
                    </li>
                  ) : (
                    currencyTotals.map((item) => (
                      <li key={item.currency} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                        <span className="font-semibold text-slate-900">{item.currency}</span>
                        <span className="text-sm text-slate-600">
                          {formatCurrency(item.inEscrow, item.currency)} in escrow
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Recent moves</h2>
                  <button
                    type="button"
                    onClick={() => openTransactionWizard()}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Log move
                  </button>
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  {recentTransactions.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-slate-500">
                      Nothing yet
                    </li>
                  ) : (
                    recentTransactions.map((transaction) => (
                      <li key={transaction.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{transaction.reference}</p>
                          <p className="text-xs text-slate-500 capitalize">{transaction.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(transaction.amount, transaction.currencyCode)}
                          </p>
                          <p className="text-xs text-slate-500">{new Date(transaction.createdAt).toLocaleString()}</p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Alerts</h2>
                  <button
                    type="button"
                    onClick={() => openActivityDrawer('Alerts', { type: 'alerts', items: alerts })}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    View
                  </button>
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  {alerts.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-slate-500">
                      All clear
                    </li>
                  ) : (
                    alerts.slice(0, 3).map((alert) => (
                      <li key={alert.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <p className="text-xs text-amber-600">{alert.caption}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Guardrails</h2>
              <div className="mt-4 grid gap-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Auto release</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {data.settings?.autoReleaseEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Release after</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatNumber(data.settings?.autoReleaseAfterDays ?? 0)} days
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dual approval</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {data.settings?.requireDualApproval ? 'Required' : 'Optional'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Alert threshold</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatCurrency(data.settings?.holdLargePaymentsThreshold ?? 0)}
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </DataStatus>
    </div>
  );
}
