import { formatCurrency, formatDate, formatHours } from './helpers.js';

function MetricCard({ label, value, accent = 'blue', onClick }) {
  const accentStyles = {
    blue: 'from-blue-500/10 via-white to-blue-100 border-blue-200 text-blue-700',
    emerald: 'from-emerald-500/10 via-white to-emerald-100 border-emerald-200 text-emerald-700',
    violet: 'from-violet-500/10 via-white to-violet-100 border-violet-200 text-violet-700',
    slate: 'from-slate-500/10 via-white to-slate-100 border-slate-200 text-slate-700',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-3xl border bg-gradient-to-br p-6 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${accentStyles[accent]}`}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="mt-3 block text-2xl font-semibold text-slate-900 group-hover:translate-x-1 transition">{value}</span>
    </button>
  );
}

function ApplicationSummary({ applications = [], onSelect }) {
  const topApplications = applications.slice(0, 3);
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Latest applications</h3>
        <button
          type="button"
          onClick={() => onSelect?.('apply')}
          className="rounded-full px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
        >
          Open
        </button>
      </div>
      <ul className="mt-4 space-y-3">
        {topApplications.length === 0 ? (
          <li className="text-sm text-slate-500">Nothing filed yet.</li>
        ) : (
          topApplications.map((application) => (
            <li
              key={application.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                <span className="font-medium text-slate-900">{application.title}</span>
                <span className="text-xs text-slate-500">{application.status}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>{application.organizationName}</span>
                <span>{formatDate(application.appliedAt)}</span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function ContractSummary({ contracts = {}, onSelect }) {
  const openContracts = contracts.open ?? [];
  const finishedContracts = contracts.finished ?? [];
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Contracts</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSelect?.('deals')}
            className="rounded-full px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
          >
            Deals
          </button>
          <button
            type="button"
            onClick={() => onSelect?.('spend')}
            className="rounded-full px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
          >
            Spend
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-4 text-sm text-slate-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open</p>
          <ul className="mt-2 space-y-2">
            {openContracts.length === 0 ? (
              <li className="text-xs text-slate-500">No active work.</li>
            ) : (
              openContracts.slice(0, 3).map((contract) => (
                <li key={contract.id} className="flex justify-between rounded-2xl bg-slate-50 px-4 py-2 text-xs">
                  <span className="font-medium text-slate-900">{contract.title}</span>
                  <span className="text-slate-500">{formatHours(contract.hoursCommitted)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Finished</p>
          <ul className="mt-2 space-y-2">
            {finishedContracts.length === 0 ? (
              <li className="text-xs text-slate-500">None closed yet.</li>
            ) : (
              finishedContracts.slice(0, 3).map((contract) => (
                <li key={contract.id} className="flex justify-between rounded-2xl bg-emerald-50 px-4 py-2 text-xs">
                  <span className="font-medium text-emerald-700">{contract.title}</span>
                  <span className="text-emerald-600">{formatDate(contract.endDate)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SpendSummary({ spend = {}, onSelect }) {
  const entries = spend.entries ?? [];
  const totals = spend.totals ?? { lifetime: 0, yearToDate: 0 };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Spend</h3>
        <button
          type="button"
          onClick={() => onSelect?.('spend')}
          className="rounded-full px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
        >
          Manage
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-600">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-semibold text-slate-500">Year</dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">
            {formatCurrency(totals.yearToDate, entries[0]?.currencyCode ?? 'USD')}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-semibold text-slate-500">Lifetime</dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">
            {formatCurrency(totals.lifetime, entries[0]?.currencyCode ?? 'USD')}
          </dd>
        </div>
      </dl>
      <ul className="mt-4 space-y-2 text-xs text-slate-500">
        {entries.slice(0, 5).map((entry) => (
          <li key={entry.id} className="flex justify-between rounded-2xl bg-emerald-50/60 px-4 py-2 text-xs">
            <span className="font-medium text-emerald-700">{entry.description}</span>
            <span className="text-emerald-600">{formatCurrency(entry.amount, entry.currencyCode)}</span>
          </li>
        ))}
        {entries.length === 0 ? <li>No spend yet.</li> : null}
      </ul>
    </div>
  );
}

export default function OverviewPanel({ metrics, workspace, onSelectView }) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active apps" value={metrics?.activeApplications ?? 0} onClick={() => onSelectView?.('apply')} />
          <MetricCard label="Interviews" value={metrics?.interviewsScheduled ?? 0} accent="emerald" onClick={() => onSelectView?.('reply')} />
          <MetricCard label="Open deals" value={metrics?.openContracts ?? 0} accent="violet" onClick={() => onSelectView?.('deals')} />
          <MetricCard label="Hours" value={formatHours(metrics?.hoursCommitted)} accent="slate" onClick={() => onSelectView?.('deals')} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ApplicationSummary applications={workspace?.applications ?? []} onSelect={onSelectView} />
          <ContractSummary contracts={workspace?.contracts} onSelect={onSelectView} />
        </div>
      </div>
      <SpendSummary spend={workspace?.spend} onSelect={onSelectView} />
    </div>
  );
}
