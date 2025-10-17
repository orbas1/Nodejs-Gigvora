import DataStatus from '../../../components/DataStatus.jsx';
import { formatCurrency, formatHours, formatPercent } from '../utils.js';

const SUMMARY_SECTIONS = [
  { key: 'openContracts', label: 'Open deals' },
  { key: 'finishedContracts', label: 'Finished' },
  { key: 'pendingApplications', label: 'Reviews' },
  { key: 'hiredVolunteers', label: 'Placed' },
  { key: 'responseRate', label: 'Rate' },
  { key: 'averageResponseHours', label: 'Response time' },
  { key: 'monthToDateSpend', label: 'Spend' },
];

export default function OverviewPane({
  summary = {},
  contracts = {},
  applications = [],
  responses = [],
  spendTotals = {},
  loading,
  error,
  lastUpdated,
  onRefresh,
  defaultCurrency = 'USD',
  onViewContract,
  onViewApplication,
  onViewResponse,
}) {
  const openContracts = contracts.open ?? [];

  return (
    <section className="flex h-full flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Workspace</h2>
          <p className="text-sm text-slate-500">Snapshot updated {lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          Refresh
        </button>
      </header>

      <DataStatus loading={loading} error={error} />

      <div className="grid gap-4 lg:grid-cols-3">
        {SUMMARY_SECTIONS.map((summaryItem) => {
          let value = summary[summaryItem.key];
          if (summaryItem.key === 'averageResponseHours') {
            value = formatHours(summary.averageResponseHours);
          } else if (summaryItem.key === 'monthToDateSpend') {
            value = formatCurrency(summary.monthToDateSpend, defaultCurrency);
          } else if (summaryItem.key === 'responseRate') {
            value = formatPercent(summary.responseRate);
          }
          if (typeof value === 'number') {
            value = value.toLocaleString();
          }
          if (!value && value !== 0) {
            value = '—';
          }
          return (
            <div key={summaryItem.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{summaryItem.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
            </div>
          );
        })}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Lifetime</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {formatCurrency(summary.lifetimeSpend, defaultCurrency)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Active deals</h3>
            <span className="text-sm text-slate-500">{openContracts.length} live</span>
          </header>
          <ul className="mt-4 space-y-4">
            {openContracts.slice(0, 4).map((contract) => (
              <li key={contract.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onViewContract(contract)}
                    className="text-left text-sm font-semibold text-slate-900 hover:text-slate-700"
                  >
                    {contract.title}
                  </button>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{contract.status}</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div>
                    <dt className="font-medium text-slate-600">Volunteers</dt>
                    <dd className="mt-1 text-slate-900">{contract.volunteerCount ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Spend</dt>
                    <dd className="mt-1 text-slate-900">
                      {formatCurrency({ amount: contract.spendToDate, currency: contract.currency }, defaultCurrency)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
            {openContracts.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                {loading ? 'Loading…' : 'No open deals'}
              </li>
            ) : null}
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Pipeline</h3>
            <span className="text-sm text-slate-500">{applications.length} records</span>
          </header>
          <ul className="mt-4 space-y-4">
            {applications.slice(0, 5).map((application) => (
              <li key={application.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onViewApplication(application)}
                    className="text-left text-sm font-semibold text-slate-900 hover:text-slate-700"
                  >
                    {application.volunteerName}
                  </button>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {application.stage || 'Unassigned'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{application.contractTitle || 'No deal linked'}</p>
              </li>
            ))}
            {applications.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                {loading ? 'Loading…' : 'No applications yet'}
              </li>
            ) : null}
          </ul>
        </article>
      </div>

      <article className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft lg:grid-cols-[1.4fr_1fr]">
        <div>
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Latest replies</h3>
            <span className="text-sm text-slate-500">{responses.length} logged</span>
          </header>
          <ul className="mt-4 space-y-3">
            {responses.slice(0, 5).map((response) => (
              <li key={response.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onViewResponse(response)}
                    className="text-left text-sm font-semibold text-slate-900 hover:text-slate-700"
                  >
                    {response.responderName || 'Team member'}
                  </button>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {response.responseType || 'Update'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{response.summary}</p>
              </li>
            ))}
            {responses.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                {loading ? 'Loading…' : 'No responses logged'}
              </li>
            ) : null}
          </ul>
        </div>
        <aside className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <h4 className="text-sm font-semibold text-slate-900">Spend</h4>
          <dl className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Total</dt>
              <dd className="font-semibold text-slate-900">
                {formatCurrency(spendTotals.total, defaultCurrency)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Month</dt>
              <dd className="font-semibold text-slate-900">
                {formatCurrency(spendTotals.month, defaultCurrency)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Pending</dt>
              <dd className="font-semibold text-slate-900">
                {formatCurrency(spendTotals.pending, defaultCurrency)}
              </dd>
            </div>
          </dl>
        </aside>
      </article>

      <footer className="text-xs text-slate-500">Volunteers are free. Keep spend entries for programme costs only.</footer>
    </section>
  );
}
