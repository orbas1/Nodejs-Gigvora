import { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, CurrencyDollarIcon, LifebuoyIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { fetchAdminDashboard } from '../../services/admin.js';
import AdCouponManager from '../../components/admin/AdCouponManager.jsx';

const MENU_SECTIONS = [
  {
    label: 'Command modules',
    items: [
      {
        name: 'Member health',
        description: 'Growth, activation, and readiness scores across the Gigvora network.',
        tags: ['growth', 'activation'],
      },
      {
        name: 'Financial governance',
        description: 'Escrow flows, fee capture, and treasury risk posture.',
        tags: ['finance'],
      },
      {
        name: 'Risk & trust',
        description: 'Dispute lifecycle, escalations, and marketplace safety monitoring.',
        tags: ['compliance'],
      },
      {
        name: 'Support operations',
        description: 'Service desk load, SLAs, and sentiment guardrails.',
      },
      {
        name: 'Engagement & comms',
        description: 'Platform analytics, event telemetry, and notification delivery.',
      },
      {
        name: 'Launchpad performance',
        description: 'Talent placements, interview runway, and employer demand.',
      },
    ],
  },
  {
    label: 'Quick tools',
    items: [
      {
        name: 'Data exports',
        description: 'Pull CSV snapshots or schedule secure S3 drops.',
        tags: ['csv', 'api'],
      },
      {
        name: 'Incident response',
        description: 'Runbooks for security, privacy, and marketplace outages.',
      },
      {
        name: 'Audit center',
        description: 'Trace admin actions, approvals, and configuration changes.',
      },
    ],
  },
];

const USER_TYPE_LABELS = {
  user: 'Members',
  company: 'Companies',
  freelancer: 'Freelancers',
  agency: 'Agencies',
  admin: 'Admins',
};

const numberFormatter = new Intl.NumberFormat('en-US');

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(Math.round(numeric));
}

function formatCurrency(value, currency = 'USD') {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(0);
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  });
  return formatter.format(numeric);
}

function formatPercent(value, fractionDigits = 1) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${numeric.toFixed(fractionDigits)}%`;
}

function formatDurationMinutes(minutes) {
  const numeric = Number(minutes ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '—';
  }
  if (numeric >= 1440) {
    return `${(numeric / 1440).toFixed(1)} days`;
  }
  if (numeric >= 60) {
    return `${(numeric / 60).toFixed(1)} hrs`;
  }
  return `${numeric.toFixed(0)} mins`;
}

function humanizeLabel(value) {
  if (!value) return '—';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatRelativeTime(value) {
  if (!value) {
    return 'moments ago';
  }
  const timestamp = new Date(value);
  const diffMs = Date.now() - timestamp.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 1) {
    return 'moments ago';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return timestamp.toLocaleDateString();
}

function calculatePercentages(dictionary = {}) {
  const entries = Object.entries(dictionary);
  const total = entries.reduce((sum, [, value]) => sum + Number(value ?? 0), 0);
  return entries.map(([key, value]) => {
    const numeric = Number(value ?? 0);
    const percent = total > 0 ? Math.round((numeric / total) * 100) : 0;
    return { key, value: numeric, percent, label: humanizeLabel(key) };
  });
}

function SummaryCard({ label, value, caption, delta, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-blue-100/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {delta ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-600">{delta}</p> : null}
          {caption ? <p className="mt-2 text-xs text-slate-500">{caption}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusList({ title, items, emptyLabel = 'No data yet.' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900">{formatNumber(item.value)}</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                  style={{ width: `${Math.min(item.percent, 100)}%` }}
                />
              </div>
              <p className="text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {item.percent}% share
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

function RecentList({ title, rows, columns, emptyLabel }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-600">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                {columns.map((column) => (
                  <th key={column.key} className="whitespace-nowrap px-3 py-2 font-semibold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-slate-100">
                  {columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchAdminDashboard()
      .then((response) => {
        if (!active) return;
        setData(response);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Unable to load admin telemetry at this time.');
        setData(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshIndex]);

  const profile = useMemo(() => {
    const totals = data?.summary?.totals ?? {};
    const support = data?.support ?? {};
    const trust = data?.trust ?? {};
    const financials = data?.financials ?? {};

    return {
      name: 'Jordan Kim',
      role: 'Chief Platform Administrator',
      initials: 'JK',
      status: data ? `Last refresh ${formatRelativeTime(data.refreshedAt)}` : 'Loading metrics…',
      badges: ['Super admin', 'Security cleared'],
      metrics: [
        { label: 'Members', value: formatNumber(totals.totalUsers ?? 0) },
        { label: 'Support backlog', value: formatNumber(support.openCases ?? 0) },
        { label: 'Open disputes', value: formatNumber(trust.openDisputes ?? 0) },
        { label: 'Gross volume', value: formatCurrency(financials.grossEscrowVolume ?? 0) },
      ],
    };
  }, [data]);

  const summaryCards = useMemo(() => {
    if (!data) return [];
    const totals = data.summary?.totals ?? {};
    const growth = data.summary?.growth ?? {};
    const financials = data.financials ?? {};
    const support = data.support ?? {};
    const trust = data.trust ?? {};

    return [
      {
        label: 'Total members',
        value: formatNumber(totals.totalUsers ?? 0),
        caption: `${formatNumber(totals.activeProfiles ?? 0)} active profiles / ${formatPercent(totals.averageProfileCompletion ?? 0)} completion avg`,
        delta: `+${formatNumber(growth.totalNewUsers ?? 0)} new in ${data.lookbackDays} days`,
        icon: UsersIcon,
      },
      {
        label: 'Escrow gross volume',
        value: formatCurrency(financials.grossEscrowVolume ?? 0),
        caption: `Fees captured ${formatCurrency(financials.escrowFees ?? 0)} • Pending release ${formatCurrency(financials.pendingReleaseTotal ?? 0)}`,
        delta: `Net ${formatCurrency(financials.netEscrowVolume ?? 0)}`,
        icon: CurrencyDollarIcon,
      },
      {
        label: 'Support workload',
        value: formatNumber(support.openCases ?? 0),
        caption: `First reply ${formatDurationMinutes(support.averageFirstResponseMinutes)} • Resolution ${formatDurationMinutes(support.averageResolutionMinutes)}`,
        delta: `${formatNumber(support.casesByPriority?.urgent ?? 0)} urgent tickets`,
        icon: LifebuoyIcon,
      },
      {
        label: 'Trust & safety',
        value: formatNumber(trust.openDisputes ?? 0),
        caption: `${formatNumber(trust.disputesByPriority?.high ?? 0)} high priority • ${formatNumber(trust.disputesByStage?.mediation ?? 0)} in mediation`,
        delta: `${formatNumber(trust.disputesByPriority?.urgent ?? 0)} urgent cases`,
        icon: ShieldCheckIcon,
      },
    ];
  }, [data]);

  const handleRefresh = () => {
    setRefreshIndex((index) => index + 1);
  };

  const renderLoadingState = (
    <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 p-8 text-center text-sm text-blue-700">
      Synchronising telemetry from the platform. This typically takes just a moment…
    </div>
  );

  const renderErrorState = (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      <p className="font-semibold">We couldn’t load the admin dashboard.</p>
      <p className="mt-2">{error}</p>
      <button
        type="button"
        onClick={handleRefresh}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 transition hover:border-red-300 hover:bg-red-50"
      >
        <ArrowPathIcon className="h-4 w-4" /> Try again
      </button>
    </div>
  );

  const renderDashboardSections = data ? (
    <div className="space-y-10">
      <AdCouponManager />
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* Member health */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Member health</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Monitor network growth, profile completion, and trust signals to keep the marketplace balanced and high quality.
            </p>
          </div>
          <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Last {data.lookbackDays} days
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Member distribution</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(data.summary?.totals?.userBreakdown ?? {}).map(([type, count]) => (
                <div key={type} className="rounded-xl border border-white/60 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{USER_TYPE_LABELS[type] ?? humanizeLabel(type)}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(count)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Profile readiness</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active profiles</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(data.summary?.totals?.activeProfiles ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">High trust (≥80)</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(data.summary?.totals?.highTrustProfiles ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Avg completion</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatPercent(data.summary?.totals?.averageProfileCompletion ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Verified references</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(data.summary?.totals?.verifiedReferences ?? 0)}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">New signups</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Object.entries(data.summary?.growth?.newUsers ?? {}).map(([type, count]) => (
              <div key={type} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{USER_TYPE_LABELS[type] ?? humanizeLabel(type)}</p>
                <p className="mt-1 text-xl font-semibold text-blue-800">{formatNumber(count)}</p>
                <p className="text-[11px] uppercase tracking-wide text-blue-500">{`Joined in ${data.lookbackDays} days`}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial governance */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Financial governance</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Escrow balances, fee capture, and transaction mix to monitor marketplace liquidity and treasury performance.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700 transition hover:border-blue-300 hover:bg-white"
          >
            <ArrowPathIcon className="h-4 w-4" /> Refresh data
          </button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <StatusList
            title="Transactions by status"
            items={calculatePercentages(data.financials?.transactionsByStatus ?? {})}
            emptyLabel="No transactions recorded yet."
          />
          <StatusList
            title="Escrow accounts"
            items={calculatePercentages(data.financials?.accountsByStatus ?? {})}
            emptyLabel="No accounts created yet."
          />
        </div>
        <RecentList
          title="Recent escrow activity"
          rows={(data.financials?.recentTransactions ?? []).map((txn) => ({
            reference: txn.reference,
            type: humanizeLabel(txn.type),
            status: humanizeLabel(txn.status),
            amount: formatCurrency(txn.amount, txn.currencyCode ?? 'USD'),
            netAmount: formatCurrency(txn.netAmount, txn.currencyCode ?? 'USD'),
            createdAt: formatDateTime(txn.createdAt),
          }))}
          columns={[
            { key: 'reference', label: 'Reference' },
            { key: 'type', label: 'Type' },
            { key: 'status', label: 'Status' },
            { key: 'amount', label: 'Gross' },
            { key: 'netAmount', label: 'Net' },
            { key: 'createdAt', label: 'Created' },
          ]}
          emptyLabel="Escrow activity will appear here once transactions are initiated."
        />
      </section>

      {/* Trust and safety */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Risk & trust</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Track dispute load, prioritisation, and lifecycle stages to keep resolution teams ahead of potential escalations.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {formatNumber(data.trust?.openDisputes ?? 0)} open cases
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <StatusList title="Disputes by stage" items={calculatePercentages(data.trust?.disputesByStage ?? {})} />
          <StatusList title="Disputes by priority" items={calculatePercentages(data.trust?.disputesByPriority ?? {})} />
        </div>
        <RecentList
          title="Latest dispute updates"
          rows={(data.trust?.recentDisputes ?? []).map((dispute) => ({
            id: `#${dispute.id}`,
            stage: humanizeLabel(dispute.stage),
            priority: humanizeLabel(dispute.priority),
            status: humanizeLabel(dispute.status),
            amount: dispute.transaction ? formatCurrency(dispute.transaction.amount, dispute.transaction.currencyCode ?? 'USD') : '—',
            updatedAt: formatDateTime(dispute.updatedAt),
          }))}
          columns={[
            { key: 'id', label: 'Dispute' },
            { key: 'stage', label: 'Stage' },
            { key: 'priority', label: 'Priority' },
            { key: 'status', label: 'Status' },
            { key: 'amount', label: 'Amount' },
            { key: 'updatedAt', label: 'Updated' },
          ]}
          emptyLabel="Resolved disputes will reduce from this feed automatically."
        />
      </section>

      {/* Support operations */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Support operations</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              SLA adherence, backlog shape, and latest escalations ensure every member receives timely responses.
            </p>
          </div>
          <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {formatNumber(data.support?.openCases ?? 0)} cases in flight
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <StatusList title="Cases by status" items={calculatePercentages(data.support?.casesByStatus ?? {})} />
          <StatusList title="Cases by priority" items={calculatePercentages(data.support?.casesByPriority ?? {})} />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Service levels</p>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Average first response</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatDurationMinutes(data.support?.averageFirstResponseMinutes)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Average resolution</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{formatDurationMinutes(data.support?.averageResolutionMinutes)}</dd>
              </div>
            </dl>
          </div>
          <RecentList
            title="Recent escalations"
            rows={(data.support?.recentCases ?? []).map((supportCase) => ({
              id: `#${supportCase.id}`,
              status: humanizeLabel(supportCase.status),
              priority: humanizeLabel(supportCase.priority),
              escalatedAt: formatDateTime(supportCase.escalatedAt),
              firstResponseAt: formatDateTime(supportCase.firstResponseAt),
              resolvedAt: formatDateTime(supportCase.resolvedAt),
            }))}
            columns={[
              { key: 'id', label: 'Case' },
              { key: 'status', label: 'Status' },
              { key: 'priority', label: 'Priority' },
              { key: 'escalatedAt', label: 'Escalated' },
              { key: 'firstResponseAt', label: 'First reply' },
              { key: 'resolvedAt', label: 'Resolved' },
            ]}
            emptyLabel="Escalations will populate as support cases move through the queue."
          />
        </div>
      </section>

      {/* Analytics & notifications */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Engagement & communications</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Real-time telemetry, actor mix, and notification delivery ensure product teams can respond quickly to usage signals.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {formatNumber(data.analytics?.eventsLastWindow ?? 0)} events / {data.eventWindowDays}-day window
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <StatusList
            title="Events by actor"
            items={calculatePercentages(data.analytics?.eventsByActorType ?? {})}
            emptyLabel="No analytics events recorded yet."
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Top events</p>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              {(data.analytics?.topEvents ?? []).map((event, index) => (
                <li key={event.eventName} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                  <span className="font-medium text-slate-700">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                      {index + 1}
                    </span>
                    {event.eventName}
                  </span>
                  <span className="text-slate-500">{formatNumber(event.count)}</span>
                </li>
              ))}
              {!data.analytics?.topEvents?.length ? <li className="text-sm text-slate-500">No event telemetry yet.</li> : null}
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Daily volume</p>
            <div className="mt-4 space-y-2">
              {(data.analytics?.dailyEvents ?? []).map((entry) => (
                <div key={entry.date} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{formatDate(entry.date)}</span>
                    <span className="font-semibold text-slate-900">{formatNumber(entry.count)}</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(entry.count * 5, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {!data.analytics?.dailyEvents?.length ? <p className="text-sm text-slate-500">Events will chart here automatically.</p> : null}
            </div>
          </div>
        </div>
        <RecentList
          title="Latest analytics events"
          rows={(data.analytics?.latestEvents ?? []).map((event) => ({
            eventName: event.eventName,
            actorType: humanizeLabel(event.actorType),
            userId: event.userId ? `User ${event.userId}` : '—',
            entityType: event.entityType ? humanizeLabel(event.entityType) : '—',
            occurredAt: formatDateTime(event.occurredAt),
          }))}
          columns={[
            { key: 'eventName', label: 'Event' },
            { key: 'actorType', label: 'Actor' },
            { key: 'userId', label: 'Subject' },
            { key: 'entityType', label: 'Entity' },
            { key: 'occurredAt', label: 'Occurred' },
          ]}
          emptyLabel="Events will appear here as soon as telemetry is captured."
        />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Notification delivery</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {Object.entries(data.notifications?.byStatus ?? {}).map(([status, count]) => (
              <div key={status} className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{humanizeLabel(status)}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(count)}</p>
              </div>
            ))}
            <div className="rounded-xl border border-red-100 bg-red-50/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Critical pending</p>
              <p className="mt-1 text-xl font-semibold text-red-700">{formatNumber(data.notifications?.criticalOpen ?? 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Launchpad performance */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Launchpad performance</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Understand placements, interviews, and employer demand across the Experience Launchpad programme.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Conversion {formatPercent(data.launchpad?.totals?.conversionRate ?? 0)}
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Pipeline health</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(data.launchpad?.pipeline ?? {}).map(([stage, count]) => (
                <div key={stage} className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{humanizeLabel(stage)}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(count)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Placements</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(data.launchpad?.placements ?? {}).map(([status, count]) => (
                <div key={status} className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{humanizeLabel(status)}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(count)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <RecentList
            title="Upcoming interviews"
            rows={(data.launchpad?.upcomingInterviews ?? []).map((interview) => ({
              id: `#${interview.id}`,
              candidate: interview.applicant ? `${interview.applicant.firstName} ${interview.applicant.lastName}` : '—',
              scheduled: formatDateTime(interview.interviewScheduledAt),
              status: humanizeLabel(interview.status),
            }))}
            columns={[
              { key: 'id', label: 'Interview' },
              { key: 'candidate', label: 'Candidate' },
              { key: 'scheduled', label: 'Scheduled' },
              { key: 'status', label: 'Status' },
            ]}
            emptyLabel="Interview schedules will appear as the programme books conversations."
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Employer demand</p>
            <div className="mt-4 space-y-3">
              {(data.launchpad?.employerBriefs ?? []).map((brief) => (
                <div key={brief.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="font-semibold text-blue-800">{brief.companyName ?? 'Employer brief'}</p>
                  <p className="text-sm text-blue-700">{humanizeLabel(brief.status)}</p>
                  <p className="text-xs uppercase tracking-wide text-blue-500">Updated {formatRelativeTime(brief.updatedAt)}</p>
                </div>
              ))}
              {!data.launchpad?.employerBriefs?.length ? <p className="text-sm text-slate-500">Employer briefs will populate as demand is logged.</p> : null}
            </div>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-700">Opportunities by source</p>
              <div className="mt-3 space-y-2">
                {Object.entries(data.launchpad?.opportunities ?? {}).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between text-sm text-slate-600">
                    <span>{humanizeLabel(source)}</span>
                    <span className="font-semibold text-slate-900">{formatNumber(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  ) : null;

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Gigvora Admin Control Tower"
      subtitle="Enterprise governance & compliance"
      description="Centralize every lever that powers Gigvora—from member growth and financial operations to trust, support, analytics, and the launchpad." 
      menuSections={MENU_SECTIONS}
      sections={[]}
      profile={profile}
      availableDashboards={[
        'admin',
        'user',
        'freelancer',
        'company',
        'agency',
        'headhunter',
      ]}
    >
      {loading ? renderLoadingState : error ? renderErrorState : renderDashboardSections}
    </DashboardLayout>
  );
}
