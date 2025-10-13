import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

const STATUS_TOKENS = {
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_delivery: 'bg-blue-50 text-blue-700 border-blue-200',
  committed: 'bg-slate-100 text-slate-600 border-slate-200',
  proposed: 'bg-amber-50 text-amber-700 border-amber-200',
  out_of_scope: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch (error) {
    return `$${Number(amount).toFixed(0)}`;
  }
}

export default function ClientPortalScopeSummary({ scope = {}, className = '' }) {
  const items = Array.isArray(scope.items) ? scope.items : [];
  const summary = scope.summary ?? {};

  const metrics = [
    {
      name: 'Total scope items',
      value: summary.totalCount ?? items.length,
      helper: `${summary.committedCount ?? 0} committed · ${summary.proposedCount ?? 0} proposed`,
      icon: ListBulletIcon,
    },
    {
      name: 'Delivered effort',
      value: `${summary.deliveredEffortHours ?? 0} hrs`,
      helper: `${summary.totalEffortHours ?? 0} hrs total`,
      icon: ClipboardDocumentCheckIcon,
    },
    {
      name: 'Budget allocation',
      value: formatCurrency(summary.totalValueAmount ?? null, items[0]?.valueCurrency ?? 'USD'),
      helper: 'Across committed & delivered scope',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Completion ratio',
      value: `${summary.completionRatio ?? 0}%`,
      helper: `${summary.deliveredCount ?? 0} items launched`,
      icon: ChartBarIcon,
    },
  ];

  return (
    <section className={classNames('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Scope guardrails</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Every promise, proposal, and optional add-on in one ledger. Clients can see what&apos;s in motion, what&apos;s delivered, and what requires a change request.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <metric.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{metric.name}</p>
                <p className="text-sm font-semibold text-slate-900">{metric.value}</p>
                <p className="text-xs text-slate-500">{metric.helper}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Deliverable</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Effort</th>
              <th className="px-4 py-3 text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((item) => {
              const statusStyle = STATUS_TOKENS[item.status] ?? STATUS_TOKENS.committed;
              return (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-4 text-slate-900">
                    <p className="font-medium">{item.title}</p>
                    {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
                    {item.metadata?.proposalId ? (
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">Proposal {item.metadata.proposalId}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{item.category ?? '—'}</td>
                  <td className="px-4 py-4">
                    <span
                      className={classNames(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                        statusStyle,
                      )}
                    >
                      {item.status?.replace('_', ' ')}
                    </span>
                    {item.lastDecisionAt ? (
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                        Decision {new Date(item.lastDecisionAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-right text-slate-600">{item.effortHours != null ? `${item.effortHours} hrs` : '—'}</td>
                  <td className="px-4 py-4 text-right text-slate-600">
                    {item.valueAmount != null ? formatCurrency(item.valueAmount, item.valueCurrency ?? 'USD') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!items.length ? (
          <div className="bg-slate-50 p-6 text-center text-sm text-slate-500">
            No scope items yet. Add deliverables from the project workspace to keep everyone aligned.
          </div>
        ) : null}
      </div>
    </section>
  );
}
