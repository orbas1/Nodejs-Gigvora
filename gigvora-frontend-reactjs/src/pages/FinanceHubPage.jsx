import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import AccessRestricted from '../components/AccessRestricted.jsx';
import useSession from '../hooks/useSession.js';
import useFinanceControlTower from '../hooks/useFinanceControlTower.js';
import { hasFinanceOperationsAccess } from '../utils/permissions.js';

export function coerceNumber(value, defaultValue = 0) {
  if (value == null || value === '') {
    return defaultValue;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function coerceDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value) {
    return [];
  }
  if (typeof value === 'object') {
    return Object.values(value);
  }
  return [];
}

export function formatCurrency(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(coerceNumber(amount));
  } catch (error) {
    const value = coerceNumber(amount).toFixed(0);
    return `${currency} ${value}`;
  }
}

export function formatPercent(value, { minimumFractionDigits = 0 } = {}) {
  const numeric = coerceNumber(value);
  return `${numeric.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  })}%`;
}

export function formatDateTime(value) {
  const date = coerceDate(value);
  if (!date) {
    return 'Ready to release';
  }
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseFinanceOverview(payload = {}) {
  try {
    const summarySource = payload.summary ?? payload.metrics ?? {};
    const automationSource = payload.automation ?? {};
    const currency = summarySource.currency ?? automationSource.currency ?? payload.currency ?? 'USD';

    const summary = {
      currency,
      inEscrow: coerceNumber(summarySource.inEscrow ?? summarySource.totalInEscrow ?? payload.inEscrowTotal),
      pendingRelease: coerceNumber(summarySource.pendingRelease ?? summarySource.pendingReleases),
      disputeHold: coerceNumber(summarySource.disputeHold ?? summarySource.onHold ?? payload.disputeHold),
      releasedThisWeek: coerceNumber(
        summarySource.releasedThisWeek ?? summarySource.releasedLast7Days ?? summarySource.releasedThisWeekValue,
      ),
      netCashFlow7d: coerceNumber(summarySource.netCashFlow7d ?? summarySource.netOutflow7d ?? summarySource.netCashflow7d),
      forecast30d: coerceNumber(summarySource.forecast30d ?? summarySource.forecastedReleases30d),
    };

    const automation = {
      autoReleaseRate: coerceNumber(
        summarySource.autoReleaseRate ?? automationSource.autoReleaseRate ?? summarySource.automationRate,
      ),
      manualReviewRate: coerceNumber(
        summarySource.manualReviewRate ?? automationSource.manualReviewRate ?? automationSource.manualRate,
      ),
      disputeRate: coerceNumber(summarySource.disputeRate ?? automationSource.disputeRate),
      averageClearanceHours: coerceNumber(
        summarySource.averageClearanceHours ?? automationSource.averageClearanceHours ?? summarySource.avgClearanceHours,
      ),
      flaggedTransactions: Math.max(
        0,
        Math.round(coerceNumber(summarySource.flaggedTransactions ?? automationSource.flaggedTransactions ?? 0)),
      ),
    };

    const accounts = ensureArray(payload.accounts ?? payload.escrowAccounts).map((account) => ({
      id: account.id ?? account.accountId ?? account.name ?? account.label,
      name: account.name ?? account.label ?? 'Escrow account',
      institution: account.institution ?? account.bank ?? 'Financial partner',
      balance: coerceNumber(account.balance ?? account.currentBalance),
      currency: account.currency ?? account.currencyCode ?? currency,
      safeguarding: coerceNumber(account.safeguarding ?? account.safeguarded ?? account.safeguardingBalance),
      pendingTransfers: coerceNumber(account.pendingTransfers ?? account.pending),
      status: (account.status ?? account.health ?? 'healthy').toLowerCase(),
      lastReconciledAt: coerceDate(account.lastReconciledAt ?? account.lastReconciled),
    }));

    const releaseQueue = ensureArray(payload.releaseQueue ?? payload.upcomingReleases ?? payload.payouts).map((release) => ({
      id: release.id ?? release.reference ?? `release-${Math.random().toString(36).slice(2, 8)}`,
      reference: release.reference ?? release.id ?? 'Escrow',
      vendor: release.vendor ?? release.vendorName ?? release.recipient ?? 'Vendor',
      milestone: release.milestone ?? release.milestoneLabel ?? release.phase ?? 'Milestone',
      scheduledAt: coerceDate(release.scheduledAt ?? release.scheduledReleaseAt ?? release.targetDate),
      amount: coerceNumber(release.amount ?? release.netAmount),
      currency: release.currency ?? release.currencyCode ?? currency,
      automation: (release.automation ?? release.automationTag ?? 'manual').toLowerCase(),
      risk: (release.risk ?? release.health ?? 'on_track').toLowerCase(),
      requiresEvidence: Boolean(release.requiresEvidence ?? release.needsEvidence),
    }));

    const disputeQueue = ensureArray(payload.disputeQueue ?? payload.activeDisputes).map((dispute) => ({
      id: dispute.id ?? dispute.caseId ?? `dispute-${Math.random().toString(36).slice(2, 8)}`,
      reference: dispute.reference ?? dispute.transactionReference ?? dispute.orderId ?? 'Escrow',
      counterparty: dispute.counterparty ?? dispute.customer ?? dispute.client ?? 'Counterparty',
      stage: (dispute.stage ?? 'investigation').replace(/_/g, ' '),
      openedAt: coerceDate(dispute.openedAt ?? dispute.opened ?? dispute.createdAt),
      priority: (dispute.priority ?? 'medium').toLowerCase(),
      amount: coerceNumber(dispute.amount),
      currency: dispute.currency ?? dispute.currencyCode ?? currency,
      summary: dispute.summary ?? dispute.notes ?? 'Dispute in review',
      slaHours: coerceNumber(dispute.slaHours ?? dispute.responseSlaHours),
    }));

    const complianceTasks = ensureArray(payload.complianceTasks ?? payload.tasks ?? payload.followUps).map((task) => ({
      id: task.id ?? task.key ?? `task-${Math.random().toString(36).slice(2, 8)}`,
      title: task.title ?? task.summary ?? 'Compliance task',
      owner: task.owner ?? task.assignee ?? 'Finance operations',
      dueDate: coerceDate(task.dueDate ?? task.due ?? task.deadline),
      severity: (task.severity ?? task.urgency ?? 'medium').toLowerCase(),
      status: (task.status ?? 'open').toLowerCase(),
      tags: ensureArray(task.tags ?? task.labels).map((tag) => `${tag}`),
    }));

    const cashflow = ensureArray(payload.cashflow ?? payload.cashflowBuckets ?? payload.forecasts).map((bucket, index) => ({
      id: bucket.id ?? bucket.label ?? `cashflow-${index}`,
      label: bucket.label ?? bucket.period ?? `Period ${index + 1}`,
      inflow: coerceNumber(bucket.inflow ?? bucket.inflows),
      outflow: coerceNumber(bucket.outflow ?? bucket.outflows),
      net: coerceNumber(
        bucket.net ?? coerceNumber(bucket.inflow ?? bucket.inflows) - coerceNumber(bucket.outflow ?? bucket.outflows),
      ),
    }));

    return {
      summary,
      automation,
      accounts,
      releaseQueue,
      disputeQueue,
      complianceTasks,
      cashflow,
    };
  } catch (error) {
    console.error('Unable to normalise finance overview payload', error);
    return null;
  }
}

const FALLBACK_OVERVIEW = Object.freeze(
  parseFinanceOverview({
    summary: {
      currency: 'USD',
      inEscrow: 328_400,
      pendingRelease: 128_950,
      disputeHold: 54_200,
      releasedThisWeek: 72_800,
      netCashFlow7d: 18_400,
      forecast30d: 214_600,
      autoReleaseRate: 0.82,
      manualReviewRate: 0.18,
      disputeRate: 0.06,
      averageClearanceHours: 6.4,
      flaggedTransactions: 3,
    },
    automation: {
      autoReleaseRate: 0.82,
      manualReviewRate: 0.18,
      disputeRate: 0.06,
      averageClearanceHours: 6.4,
      flaggedTransactions: 3,
    },
    accounts: [
      {
        id: 'primary-escrow',
        name: 'Prime Trust escrow',
        institution: 'Prime Trust',
        balance: 214_000,
        currency: 'USD',
        safeguarding: 178_000,
        pendingTransfers: 24_000,
        status: 'healthy',
        lastReconciledAt: '2024-03-14T18:00:00Z',
      },
      {
        id: 'eur-operating',
        name: 'Barclays client money (EUR)',
        institution: 'Barclays',
        balance: 74_800,
        currency: 'EUR',
        safeguarding: 61_200,
        pendingTransfers: 8_400,
        status: 'attention',
        lastReconciledAt: '2024-03-13T20:00:00Z',
      },
      {
        id: 'stripe-payouts',
        name: 'Stripe treasury buffer',
        institution: 'Stripe',
        balance: 39_600,
        currency: 'USD',
        safeguarding: 32_400,
        pendingTransfers: 5_100,
        status: 'healthy',
        lastReconciledAt: '2024-03-15T07:00:00Z',
      },
    ],
    releaseQueue: [
      {
        id: 'REL-9812',
        reference: 'ESC-9812',
        vendor: 'Northshore Creative',
        milestone: 'Brand sprint phase 2',
        scheduledAt: '2024-03-18T16:00:00Z',
        amount: 18_400,
        currency: 'USD',
        automation: 'auto_release',
        risk: 'on_track',
        requiresEvidence: false,
      },
      {
        id: 'REL-9821',
        reference: 'ESC-9821',
        vendor: 'Atlas Labs',
        milestone: 'ML Ops pilot — final acceptance',
        scheduledAt: '2024-03-20T12:30:00Z',
        amount: 32_600,
        currency: 'USD',
        automation: 'manual_review',
        risk: 'attention',
        requiresEvidence: true,
      },
      {
        id: 'REL-9833',
        reference: 'ESC-9833',
        vendor: 'Helios Research Collective',
        milestone: 'Quarterly retainer drawdown',
        scheduledAt: null,
        amount: 24_800,
        currency: 'USD',
        automation: 'auto_release',
        risk: 'on_track',
        requiresEvidence: false,
      },
    ],
    disputeQueue: [
      {
        id: 'DSP-4032',
        reference: 'ESC-8721',
        counterparty: 'Atlas Studios',
        stage: 'mediation',
        openedAt: '2024-03-11T09:00:00Z',
        priority: 'high',
        amount: 9_200,
        currency: 'USD',
        summary: 'Awaiting revised scope of work before releasing funds held in escrow.',
        slaHours: 24,
      },
      {
        id: 'DSP-4050',
        reference: 'ESC-8811',
        counterparty: 'Lumen Partners',
        stage: 'investigation',
        openedAt: '2024-03-15T13:15:00Z',
        priority: 'medium',
        amount: 6_400,
        currency: 'USD',
        summary: 'Customer reported incomplete deliverables; evidence requested from vendor.',
        slaHours: 48,
      },
    ],
    complianceTasks: [
      {
        id: 'TASK-1',
        title: 'Reconcile multi-currency safeguarding balances',
        owner: 'Finance ops',
        dueDate: '2024-03-17',
        severity: 'high',
        status: 'open',
        tags: ['reconciliation', 'multi-currency'],
      },
      {
        id: 'TASK-2',
        title: 'Send arbitration evidence checklist to Atlas Studios',
        owner: 'Trust & safety',
        dueDate: '2024-03-16',
        severity: 'medium',
        status: 'in_progress',
        tags: ['dispute', 'evidence'],
      },
    ],
    cashflow: [
      { id: 'week', label: 'This week', inflow: 68_200, outflow: 49_800, net: 18_400 },
      { id: 'next-week', label: 'Next 7 days', inflow: 74_600, outflow: 58_100, net: 16_500 },
      { id: 'thirty-day', label: '30-day outlook', inflow: 214_600, outflow: 186_900, net: 27_700 },
    ],
  }) ?? {
    summary: {
      currency: 'USD',
      inEscrow: 0,
      pendingRelease: 0,
      disputeHold: 0,
      releasedThisWeek: 0,
      netCashFlow7d: 0,
      forecast30d: 0,
    },
    automation: { autoReleaseRate: 0, manualReviewRate: 0, disputeRate: 0, averageClearanceHours: 0, flaggedTransactions: 0 },
    accounts: [],
    releaseQueue: [],
    disputeQueue: [],
    complianceTasks: [],
    cashflow: [],
  },
);

function riskTone(risk = '') {
  if (risk.includes('attention') || risk.includes('overdue')) {
    return 'text-amber-700 bg-amber-100';
  }
  if (risk.includes('risk') || risk.includes('critical')) {
    return 'text-rose-700 bg-rose-100';
  }
  return 'text-emerald-700 bg-emerald-100';
}

function severityTone(severity = '') {
  if (severity.includes('high') || severity.includes('critical')) {
    return 'bg-rose-100 text-rose-700';
  }
  if (severity.includes('medium')) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-emerald-100 text-emerald-700';
}

export default function FinanceHubPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const financeAccess = hasFinanceOperationsAccess(session);

  const {
    data,
    loading,
    error,
    fromCache,
    lastUpdated,
    refresh,
  } = useFinanceControlTower({ enabled: financeAccess });

  const normalisedData = useMemo(() => (data ? parseFinanceOverview(data) : null), [data]);
  const overview = normalisedData ?? (financeAccess && !loading ? FALLBACK_OVERVIEW : null);
  const currency = overview?.summary.currency ?? 'USD';
  const usingFallback = overview === FALLBACK_OVERVIEW && !normalisedData;

  const summaryCards = useMemo(() => {
    if (!overview) {
      return [];
    }
    return [
      {
        label: 'Funds in escrow',
        value: formatCurrency(overview.summary.inEscrow, currency),
        caption: 'Segregated across multi-bank safeguarding accounts',
      },
      {
        label: 'Pending release',
        value: formatCurrency(overview.summary.pendingRelease, currency),
        caption: 'Awaiting milestone approval or auto-release windows',
      },
      {
        label: 'On hold in disputes',
        value: formatCurrency(overview.summary.disputeHold, currency),
        caption: 'Frozen while trust & safety mediates counter-parties',
      },
      {
        label: 'Released this week',
        value: formatCurrency(overview.summary.releasedThisWeek, currency),
        caption: 'Cleared to providers within the last seven days',
      },
    ];
  }, [overview, currency]);

  const automationMetrics = useMemo(() => {
    if (!overview) {
      return [];
    }
    return [
      {
        label: 'Auto-release rate',
        value: formatPercent(overview.automation.autoReleaseRate * 100, { minimumFractionDigits: 1 }),
        caption: 'Transactions flowing straight through scheduled automations',
      },
      {
        label: 'Manual review',
        value: formatPercent(overview.automation.manualReviewRate * 100, { minimumFractionDigits: 1 }),
        caption: 'Queued for finance operations validation before payout',
      },
      {
        label: 'Average clearance',
        value: `${coerceNumber(overview.automation.averageClearanceHours).toFixed(1)} hrs`,
        caption: 'Mean time from milestone acceptance to release',
      },
      {
        label: 'Flagged transactions',
        value: overview.automation.flaggedTransactions,
        caption: 'Escrows escalated by anomaly detection or policy rules',
      },
    ];
  }, [overview]);

  const maxCashflow = useMemo(() => {
    if (!overview || overview.cashflow.length === 0) {
      return 0;
    }
    return Math.max(
      ...overview.cashflow.map((entry) => Math.max(Math.abs(entry.net), Math.abs(entry.inflow), Math.abs(entry.outflow))),
    );
  }, [overview]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <AccessRestricted
          tone="sky"
          badge="Finance workspace"
          title="Sign in to view finance telemetry"
          description="Use your workspace account to review payments, escrow balances, and dispute health."
          actionLabel="Go to login"
          onAction={() => navigate('/login')}
        />
      </div>
    );
  }

  if (!financeAccess) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <AccessRestricted
          title="Finance permissions required"
          description="Your profile lacks finance workspace access. Contact your workspace admin to request finance or company operations membership."
          badge="Restricted"
          actionLabel="Contact support"
          actionHref="mailto:support@gigvora.com?subject=Finance%20access%20request"
        />
      </div>
    );
  }

  if (loading && !overview) {
    return (
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="absolute -left-12 top-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-soft">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="mt-6 h-8 w-32 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!overview) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <AccessRestricted
          tone="amber"
          title="Finance overview unavailable"
          description="We could not load finance telemetry and no cached snapshot is available. Refresh the page or contact support if it persists."
          actionLabel="Retry"
          onAction={() => refresh({ force: true })}
        />
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_60%)]" aria-hidden="true" />
      <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-emerald-200/40 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6">
        <PageHeader
          eyebrow="Operations"
          title="Finance control tower"
          description="Monitor payments, escrow safeguards, dispute caseloads, and automation health from a single command centre."
        />
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            <span className="rounded-full bg-accent/10 px-4 py-1 text-accent">Payments</span>
            <span className="rounded-full bg-emerald-100 px-4 py-1 text-emerald-700">Escrow</span>
            <span className="rounded-full bg-rose-100 px-4 py-1 text-rose-700">Disputes</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {lastUpdated ? (
              <span className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-slate-500 shadow-soft">
                Last updated {lastUpdated.toLocaleTimeString()}
              </span>
            ) : null}
            {fromCache ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 shadow-soft">
                Serving cached snapshot
              </span>
            ) : null}
            {usingFallback ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-soft">
                Offline telemetry
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => refresh({ force: true })}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-4 py-2 text-sm font-semibold text-accent shadow-soft transition hover:border-accent hover:text-accentDark"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh metrics'}
            </button>
            <Link
              to="/trust-center"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800"
            >
              Open trust centre
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm font-semibold text-rose-700 shadow-soft">
            Unable to synchronise with the finance API. Showing the most recent safe snapshot until connectivity returns.
          </div>
        ) : null}

        <div className="mt-10 space-y-10">
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft transition hover:-translate-y-1 hover:border-accent/50"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-4 text-3xl font-black text-slate-900">{card.value}</p>
                <p className="mt-2 text-xs text-slate-500">{card.caption}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Escrow accounts</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Balances ring-fenced across global banking partners with safeguarding coverage.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {overview.accounts.length} accounts
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {overview.accounts.map((account) => (
                  <article
                    key={account.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 transition hover:border-accent/40 hover:bg-white"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{account.name}</p>
                        <p className="text-xs text-slate-500">{account.institution}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${severityTone(account.status)}`}>
                        {account.status === 'attention' ? 'Needs attention' : account.status === 'healthy' ? 'Healthy' : account.status}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
                      <div>
                        <dt className="font-semibold text-slate-500">Balance</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">
                          {formatCurrency(account.balance, account.currency ?? currency)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Safeguarding</dt>
                        <dd className="mt-1">{formatCurrency(account.safeguarding, account.currency ?? currency)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Pending transfers</dt>
                        <dd className="mt-1">{formatCurrency(account.pendingTransfers, account.currency ?? currency)}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs text-slate-400">
                      {account.lastReconciledAt
                        ? `Last reconciled ${new Date(account.lastReconciledAt).toLocaleDateString()}`
                        : 'Awaiting reconciliation log'}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Automation health</h2>
              <p className="mt-1 text-sm text-slate-500">
                Signal how automation and anomaly detection are performing across recent payouts.
              </p>
              <dl className="mt-5 grid gap-4">
                {automationMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</dt>
                    <dd className="mt-2 text-2xl font-black text-slate-900">{metric.value}</dd>
                    <p className="mt-1 text-xs text-slate-500">{metric.caption}</p>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Release pipeline</h2>
                  <p className="mt-1 text-sm text-slate-500">Upcoming payouts with automation and evidence requirements.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {overview.releaseQueue.length} queued
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {overview.releaseQueue.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                    No upcoming releases. Finance automations will populate this queue as milestones progress.
                  </div>
                ) : (
                  overview.releaseQueue.map((release) => (
                    <article key={release.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{release.vendor}</p>
                          <p className="text-xs text-slate-500">{release.milestone}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${riskTone(release.risk)}`}>
                            {release.risk.replace(/_/g, ' ')}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                            {release.automation.replace(/_/g, ' ')}
                          </span>
                          {release.requiresEvidence ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
                              Evidence required
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
                        <div>
                          <p className="font-semibold text-slate-600">Reference</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{release.reference}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-600">Scheduled</p>
                          <p className="mt-1">{formatDateTime(release.scheduledAt)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-600">Amount</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatCurrency(release.amount, release.currency ?? currency)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          to="/trust-center"
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                        >
                          Review evidence in trust centre
                        </Link>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-emerald-700"
                        >
                          Mark for manual release
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Active disputes</h2>
                  <p className="mt-1 text-sm text-slate-500">Track escalations pausing payouts while mediation completes.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {overview.disputeQueue.length} open
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {overview.disputeQueue.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                    No disputes are currently holding funds. Escrow automations will resume as cases resolve.
                  </div>
                ) : (
                  overview.disputeQueue.map((dispute) => (
                    <article key={dispute.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Case {dispute.id}</p>
                        <h3 className="text-sm font-semibold text-slate-900">{dispute.counterparty}</h3>
                        <p className="text-xs text-slate-500">{dispute.summary}</p>
                      </div>
                      <dl className="mt-3 grid gap-3 text-xs text-slate-500">
                        <div className="flex items-center justify-between">
                          <dt className="font-semibold text-slate-600">Stage</dt>
                          <dd className="capitalize">{dispute.stage}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="font-semibold text-slate-600">Amount</dt>
                          <dd className="font-semibold text-slate-900">
                            {formatCurrency(dispute.amount, dispute.currency ?? currency)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="font-semibold text-slate-600">Priority</dt>
                          <dd className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${severityTone(dispute.priority)}`}>
                            {dispute.priority}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="font-semibold text-slate-600">SLA</dt>
                          <dd>{dispute.slaHours ? `${dispute.slaHours} hrs` : 'Monitor queue'}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                        >
                          Add evidence note
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-rose-700"
                        >
                          Escalate to arbitration
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Compliance follow-ups</h2>
                  <p className="mt-1 text-sm text-slate-500">Prioritise evidence collection and reconciliation guardrails.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {overview.complianceTasks.length} tasks
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {overview.complianceTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                    All compliance actions are clear. Finance automation continues to monitor for new alerts.
                  </div>
                ) : (
                  overview.complianceTasks.map((task) => (
                    <article key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                          <p className="text-xs text-slate-500">Owned by {task.owner}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${severityTone(task.severity)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {task.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded-full bg-white px-3 py-1 font-semibold text-slate-500">
                            #{tag}
                          </span>
                        ))}
                        {task.dueDate ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Cashflow outlook</h2>
              <p className="mt-1 text-sm text-slate-500">Forward-looking inflows and outflows across upcoming release windows.</p>
              <div className="mt-6 space-y-4">
                {overview.cashflow.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                    Cashflow projections populate once finance telemetry syncs with live engagements.
                  </div>
                ) : (
                  overview.cashflow.map((bucket) => {
                    const width = maxCashflow ? Math.min(100, Math.round((Math.abs(bucket.net) / maxCashflow) * 100)) : 0;
                    const tone = bucket.net >= 0 ? 'bg-emerald-500' : 'bg-rose-500';
                    return (
                      <article key={bucket.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">{bucket.label}</p>
                          <p className={`text-sm font-semibold ${bucket.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(bucket.net, currency)}
                          </p>
                        </div>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div className={`h-full ${tone}`} style={{ width: `${width || 4}%` }} />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>Inflow {formatCurrency(bucket.inflow, currency)}</span>
                          <span>Outflow {formatCurrency(bucket.outflow, currency)}</span>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
