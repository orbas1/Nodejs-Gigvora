import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import useFinanceControlTower from '../../hooks/useFinanceControlTower.js';

function formatCurrency(amount = 0, currency = 'USD') {
  if (!Number.isFinite(Number(amount))) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatPercent(value, { suffix = '', precision = 1 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const numeric = Number(value);
  const formatted = `${numeric > 0 ? '+' : ''}${numeric.toFixed(precision)}%`;
  return suffix ? `${formatted} ${suffix}` : formatted;
}

function formatDateTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatCount(count) {
  if (count == null) return '0';
  return Number(count).toLocaleString('en-US');
}

export default function FinanceControlTowerFeature({ userId, currency: preferredCurrency }) {
  const { data, error, loading, refresh, fromCache, lastUpdated } = useFinanceControlTower({ userId });

  const summary = data?.summary ?? {};
  const revenueSummary = summary.monthToDateRevenue ?? {};
  const taxSummary = summary.taxReadyBalance ?? {};
  const expenseSummary = summary.trackedExpenses ?? {};
  const runwaySummary = summary.savingsRunway ?? {};
  const overviewCurrency =
    preferredCurrency || revenueSummary.currency || taxSummary.currency || expenseSummary.currency || 'USD';

  const latestExport = taxSummary.latestExport ?? data?.taxExports?.[0] ?? null;
  const revenueBreakdown = data?.revenueBreakdown ?? [];
  const expenses = data?.expenses ?? [];
  const savingsGoals = data?.savingsGoals ?? [];
  const payoutSplits = data?.payoutSplits ?? { batch: null, entries: [] };
  const forecasts = data?.forecasts ?? [];

  const lastUpdatedLabel = formatDateTime(lastUpdated ?? data?.generatedAt ?? null);

  const summaryCards = useMemo(
    () => [
      {
        key: 'mtd-revenue',
        name: 'Month-to-date revenue',
        value: formatCurrency(revenueSummary.amount ?? 0, revenueSummary.currency || overviewCurrency),
        change: formatPercent(revenueSummary.changePercentage, { suffix: 'vs last month' }),
        icon: ChartBarIcon,
      },
      {
        key: 'tax-ready',
        name: 'Tax-ready balance',
        value: formatCurrency(taxSummary.amount ?? 0, taxSummary.currency || overviewCurrency),
        change: taxSummary.fiscalYear ? `FY ${taxSummary.fiscalYear} taxable income` : 'Ready for export',
        icon: Squares2X2Icon,
      },
      {
        key: 'expenses',
        name: 'Tracked expenses',
        value: formatCurrency(expenseSummary.amount ?? 0, expenseSummary.currency || overviewCurrency),
        change: `Across ${formatCount(expenseSummary.count ?? 0)} categorized receipts`,
        icon: BanknotesIcon,
      },
      {
        key: 'runway',
        name: 'Savings runway',
        value:
          runwaySummary.months == null
            ? '—'
            : `${Number(runwaySummary.months).toFixed(1)} months`,
        change: `${formatCurrency(runwaySummary.reserveAmount ?? 0, runwaySummary.currency || overviewCurrency)} reserve`,
        icon: ArrowTrendingUpIcon,
      },
    ],
    [revenueSummary, taxSummary, expenseSummary, runwaySummary, overviewCurrency],
  );

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Financial health snapshot</p>
          <p className="text-xs text-slate-500">
            {fromCache ? 'Showing cached metrics. ' : ''}
            {lastUpdatedLabel ? `Last refreshed ${lastUpdatedLabel}.` : 'Live metrics generated on demand.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {latestExport?.downloadUrl ? (
            <a
              href={latestExport.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100"
            >
              <CloudArrowDownIcon className="h-4 w-4" />
              Download tax export
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => refresh({ force: true })}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load the finance control tower data right now. {error.message ?? 'Please try again shortly.'}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.key} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.name}</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-1 text-xs text-slate-500">{card.change}</p>
              </div>
              <span className="rounded-2xl bg-blue-50 p-2 text-blue-600">
                <card.icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Revenue mix</h4>
            <span className="text-xs font-medium uppercase tracking-wide text-blue-600">{`Active streams (${revenueBreakdown.length})`}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Breakdown of this quarter&apos;s invoices with live sync to tax categories.
          </p>
          <ul className="mt-4 space-y-3">
            {revenueBreakdown.length ? (
              revenueBreakdown.map((stream) => {
                const sharePercent = Math.round((stream.share ?? 0) * 100);
                return (
                  <li key={stream.type} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between text-sm text-slate-700">
                      <span className="font-medium capitalize">{stream.label ?? stream.type}</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(stream.amount ?? 0, stream.currency || overviewCurrency)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{`${sharePercent}% of revenue`}</span>
                      <span>{formatPercent(stream.changePercentage, { suffix: 'MoM' })}</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                        style={{ width: `${Math.min(100, Math.max(0, sharePercent))}%` }}
                      />
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No revenue entries have been recorded yet this month.
              </li>
            )}
          </ul>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Instant payout splits</h4>
            <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-blue-600">
              <ArrowsRightLeftIcon className="h-4 w-4" />
              {payoutSplits.batch ? 'Active' : 'No batch'}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Assign teammate shares per milestone and release in one click.
          </p>
          {payoutSplits.entries?.length ? (
            <ul className="mt-4 space-y-3 text-sm">
              {payoutSplits.entries.map((split) => (
                <li key={`${split.teammateName}-${split.amount}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div>
                    <p className="font-medium text-slate-900">{split.teammateName}</p>
                    <p className="text-xs text-slate-500">{split.teammateRole || 'Contributor'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {split.sharePercentage == null ? '—' : `${Number(split.sharePercentage).toFixed(0)}%`}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(split.amount ?? 0, split.currency || overviewCurrency)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              No payout batches have been completed yet.
            </div>
          )}
          <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
            {payoutSplits.batch?.executedAt
              ? `Last split executed ${formatDateTime(payoutSplits.batch.executedAt)}`
              : 'Schedule your first instant split to collaborate faster.'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Expense ledger</h4>
            <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
              {expenseSummary.count ? `${formatCount(expenseSummary.count)} receipts` : 'Receipt inbox'}
            </span>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {expenses.length ? (
              expenses.map((expense) => (
                <li key={`${expense.category}-${expense.occurredAt}`} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{expense.category}</p>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(expense.amount ?? 0, expense.currency || overviewCurrency)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{expense.cadence || 'Ad hoc'}</p>
                  {expense.notes ? <p className="mt-2 text-xs text-slate-500">{expense.notes}</p> : null}
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No expenses have been captured for this period yet.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Savings automations</h4>
            <span className="text-xs font-medium uppercase tracking-wide text-blue-600">Smart goals</span>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {savingsGoals.length ? (
              savingsGoals.map((goal) => (
                <li key={goal.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{goal.name}</p>
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">{goal.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Target {formatCurrency(goal.targetAmount ?? 0, goal.currency || overviewCurrency)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Automation: {goal.automationType ? goal.automationType.replace('_', ' ') : 'Manual'}
                    {goal.automationAmount
                      ? ` · ${formatCurrency(goal.automationAmount, goal.currency || overviewCurrency)}`
                      : ''}
                  </p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400"
                      style={{ width: `${Math.min(100, Math.max(0, Math.round(goal.progress ?? 0)))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {formatCurrency(goal.currentAmount ?? 0, goal.currency || overviewCurrency)} saved
                  </p>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                Set up savings automations to build your runway.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">Predictive forecasts</h4>
          <span className="text-xs font-medium uppercase tracking-wide text-blue-600">Updated hourly</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Scenario planning across retainers and one-off gigs keeps cash flow predictable and highlights when to activate new outreach.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {forecasts.length ? (
            forecasts.map((scenario) => (
              <div key={scenario.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {scenario.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatCurrency(scenario.projectedAmount ?? 0, scenario.currency || overviewCurrency)}
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  {scenario.confidence == null
                    ? 'Confidence pending'
                    : `${Math.round(Number(scenario.confidence) * 100)}% probability`}
                </p>
                {scenario.notes ? <p className="mt-2 text-xs text-slate-500">{scenario.notes}</p> : null}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Forecasts will appear once revenue projections are configured.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

FinanceControlTowerFeature.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currency: PropTypes.string,
};

FinanceControlTowerFeature.defaultProps = {
  userId: undefined,
  currency: undefined,
};
