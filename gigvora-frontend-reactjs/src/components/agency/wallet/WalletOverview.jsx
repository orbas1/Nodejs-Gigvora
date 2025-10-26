import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  BellAlertIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import WalletStatusPill from '../../wallet/WalletStatusPill.jsx';
import {
  formatCurrency,
  formatCompactCurrency,
  formatDateTime,
  formatStatus,
} from '../../wallet/walletFormatting.js';

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function Sparkline({ points, accent, id }) {
  const safePoints = points.length > 1 ? points : [0, ...points];
  const max = safePoints.reduce((acc, value) => Math.max(acc, value), 0);
  const min = safePoints.reduce((acc, value) => Math.min(acc, value), 0);
  const range = max - min || 1;

  const path = safePoints
    .map((point, index) => {
      const x = (index / (safePoints.length - 1 || 1)) * 100;
      const relative = (point - min) / range;
      const y = 100 - relative * 100;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" role="presentation" aria-hidden="true" className="h-16 w-full">
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} V 100 L 0 100 Z`} fill={`url(#${id}-gradient)`} opacity="0.6" />
      <path d={path} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

Sparkline.propTypes = {
  points: PropTypes.arrayOf(PropTypes.number).isRequired,
  accent: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

function StatCard({ icon: Icon, label, primary, helper, pill }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{primary}</p>
          {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
        </div>
        {Icon ? (
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-600 transition group-hover:scale-105">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {pill ? <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">{pill}</div> : null}
    </div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  primary: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  pill: PropTypes.node,
};

StatCard.defaultProps = {
  icon: null,
  helper: null,
  pill: null,
};

function SegmentCard({ segment, currency }) {
  const available = formatCurrency(segment.available ?? segment.availableBalance ?? 0, segment.currency ?? currency);
  const held = formatCurrency(segment.onHold ?? segment.pending ?? segment.pendingHoldBalance ?? 0, segment.currency ?? currency);
  const exposure = normalizeNumber(segment.exposure ?? segment.riskExposure);
  const threshold = normalizeNumber(segment.alertThreshold ?? 0);
  const health = threshold > 0 ? Math.min(100, Math.round((exposure / threshold) * 100)) : 0;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-semibold text-slate-900">{segment.label}</h4>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{segment.subtitle}</p>
        </div>
        <WalletStatusPill value={segment.status ?? segment.health ?? 'active'} />
      </div>
      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Available</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{available}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">On hold</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{held}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Exposure</p>
          <p className="mt-1 text-sm font-semibold text-amber-600">{formatCurrency(exposure, segment.currency ?? currency)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Health</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${health}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-500">{health}%</span>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-3 text-xs text-slate-500">
        {segment.description || 'Monitor liquidity against operating limits and auto-escalate if thresholds breach.'}
      </div>
    </div>
  );
}

SegmentCard.propTypes = {
  segment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    available: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    availableBalance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onHold: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pending: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pendingHoldBalance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    exposure: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    riskExposure: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    alertThreshold: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    health: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    currency: PropTypes.string,
  }).isRequired,
  currency: PropTypes.string.isRequired,
};

function AlertCard({ alert }) {
  const tone = String(alert.severity ?? alert.level ?? 'info').toLowerCase();
  const palette =
    tone === 'critical'
      ? 'border-rose-200 bg-rose-50/70 text-rose-700'
      : tone === 'warning'
      ? 'border-amber-200 bg-amber-50/70 text-amber-700'
      : 'border-slate-200 bg-white text-slate-700';

  return (
    <div className={`flex flex-col gap-2 rounded-3xl border p-4 shadow-sm ${palette}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BellAlertIcon className="h-4 w-4" aria-hidden="true" />
          <span>{alert.title ?? alert.label ?? 'Wallet alert'}</span>
        </div>
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {formatDateTime(alert.createdAt ?? alert.raisedAt)}
        </span>
      </div>
      <p className="text-sm">{alert.message ?? alert.description ?? 'Monitor this notice and take action if required.'}</p>
      {alert.cta ? (
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span>{alert.cta}</span>
          {alert.href ? (
            <a
              href={alert.href}
              className="inline-flex items-center gap-1 text-blue-600 transition hover:text-blue-800"
            >
              Open
              <ArrowUpRightIcon className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

AlertCard.propTypes = {
  alert: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    label: PropTypes.string,
    message: PropTypes.string,
    description: PropTypes.string,
    cta: PropTypes.string,
    href: PropTypes.string,
    createdAt: PropTypes.string,
    raisedAt: PropTypes.string,
    severity: PropTypes.string,
    level: PropTypes.string,
  }).isRequired,
};

function UpcomingItem({ payout, currency }) {
  const amount = formatCurrency(payout.amount ?? payout.total ?? 0, payout.currencyCode ?? payout.currency ?? currency);
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-900">{payout.label ?? payout.destination ?? 'Scheduled payout'}</p>
        <p className="text-xs text-slate-500">{formatStatus(payout.status ?? payout.state ?? 'scheduled')}</p>
      </div>
      <div className="text-right">
        <p className="text-base font-semibold text-slate-900">{amount}</p>
        <p className="text-xs text-slate-500">{formatDateTime(payout.scheduledFor ?? payout.expectedAt ?? payout.createdAt)}</p>
      </div>
    </div>
  );
}

UpcomingItem.propTypes = {
  payout: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    destination: PropTypes.string,
    status: PropTypes.string,
    state: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currencyCode: PropTypes.string,
    currency: PropTypes.string,
    scheduledFor: PropTypes.string,
    expectedAt: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  currency: PropTypes.string.isRequired,
};

export default function WalletOverview({
  overview,
  workspaceLabel,
  loading,
  error,
  onRefresh,
  onViewTransactions,
  onSchedulePayout,
  onManageCompliance,
}) {
  const totals = overview?.totals ?? {};
  const currency = totals.currency ?? overview?.currency ?? 'USD';
  const refreshedAt = overview?.refreshedAt ?? overview?.updatedAt;
  const compliance = overview?.compliance ?? {};
  const upcomingPayouts = overview?.upcomingPayouts ?? overview?.nextPayouts ?? [];
  const alerts = (overview?.alerts ?? overview?.notices ?? []).slice(0, 4);

  const segments = useMemo(() => {
    if (Array.isArray(overview?.segments) && overview.segments.length) {
      return overview.segments;
    }
    if (Array.isArray(overview?.accountSegments) && overview.accountSegments.length) {
      return overview.accountSegments;
    }
    return [
      {
        id: 'operating',
        label: 'Operating balance',
        subtitle: 'Core treasury funds',
        available: totals.availableBalance,
        onHold: totals.pendingHoldBalance,
        exposure: overview?.exposure?.operating,
        alertThreshold: overview?.thresholds?.operating,
        status: overview?.statuses?.operating ?? overview?.compliance?.operating,
        description: 'Primary wallet for disbursing payouts and covering daily program spend.',
      },
      {
        id: 'escrow',
        label: 'Escrow & reserves',
        subtitle: 'Contract protections',
        available: overview?.escrow?.available,
        onHold: overview?.escrow?.held,
        exposure: overview?.escrow?.exposure,
        alertThreshold: overview?.thresholds?.escrow,
        status: overview?.escrow?.status,
        description: 'Funds reserved for active gigs and milestones awaiting release.',
      },
      {
        id: 'compliance',
        label: 'Compliance buffers',
        subtitle: 'Safeguards & offsets',
        available: overview?.buffers?.available,
        onHold: overview?.buffers?.pending,
        exposure: overview?.buffers?.exposure,
        alertThreshold: overview?.thresholds?.buffers,
        status: overview?.buffers?.status,
        description: 'Liquidity ring-fenced for audits, chargebacks, and regulatory reserves.',
      },
    ].filter((segment) =>
      [segment.available, segment.onHold, segment.exposure].some((value) => value != null),
    );
  }, [overview, totals.availableBalance, totals.pendingHoldBalance]);

  const netFlowPoints = useMemo(() => {
    const source = overview?.netFlows ?? overview?.dailyNetFlow ?? overview?.activity?.netFlows ?? [];
    if (Array.isArray(source) && source.every((item) => typeof item === 'number')) {
      return source;
    }
    if (Array.isArray(source)) {
      return source.map((item) => normalizeNumber(item.amount ?? item.value ?? 0));
    }
    return [];
  }, [overview]);

  const trend = netFlowPoints.length
    ? normalizeNumber(netFlowPoints[netFlowPoints.length - 1]) - normalizeNumber(netFlowPoints[0])
    : 0;

  const quickMetrics = [
    {
      key: 'total',
      label: 'Total balance',
      primary: formatCurrency(totals.totalBalance ?? 0, currency),
      helper: `${formatStatus(totals.accountCount ? `${totals.accountCount} accounts` : '1 account')} · ${
        refreshedAt ? formatDateTime(refreshedAt) : 'Live'
      }`,
      icon: BanknotesIcon,
    },
    {
      key: 'available',
      label: 'Ready to deploy',
      primary: formatCurrency(totals.availableBalance ?? totals.freeBalance ?? 0, currency),
      helper: formatCompactCurrency(totals.pendingPayouts?.amount ?? overview?.pendingPayouts?.amount ?? 0, currency),
      icon: SparklesIcon,
      pill:
        trend > 0 ? (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <ArrowUpRightIcon className="h-3 w-3" aria-hidden="true" />
            Trending +{formatCompactCurrency(trend, currency)}
          </span>
        ) : null,
    },
    {
      key: 'holds',
      label: 'In reserve',
      primary: formatCurrency(totals.pendingHoldBalance ?? totals.reservedBalance ?? 0, currency),
      helper: `${formatStatus(overview?.riskTier ?? compliance?.riskTier ?? 'standard')} risk · ${
        formatStatus(compliance?.watchlistStatus ?? 'clear')
      }`,
      icon: ShieldCheckIcon,
    },
  ];

  const statusBadges = [
    overview?.complianceStatus,
    overview?.ledgerIntegrity,
    overview?.appStoreCompliant === false ? 'app_store_review' : 'app_store_ready',
    compliance?.status,
  ].filter(Boolean);

  return (
    <section className="space-y-8" aria-labelledby="wallet-overview-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet overview</p>
          <h2 id="wallet-overview-title" className="mt-2 text-2xl font-semibold text-slate-900">
            {workspaceLabel ?? 'Network treasury'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Real-time liquidity, compliance posture, and payout momentum across the Gigvora ecosystem.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusBadges.map((value) => (
            <WalletStatusPill key={value} value={value} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onRefresh?.({ force: true })}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
        </button>
        <button
          type="button"
          onClick={() => onViewTransactions?.()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-900 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <ChartBarIcon className="h-4 w-4" aria-hidden="true" /> View transactions
        </button>
        <button
          type="button"
          onClick={() => onSchedulePayout?.()}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
        >
          Schedule payout
        </button>
        <button
          type="button"
          onClick={() => onManageCompliance?.()}
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
        >
          Compliance center
        </button>
        {refreshedAt ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Updated {formatDateTime(refreshedAt)}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700 shadow-sm">
          Snapshot unavailable. Please retry.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {quickMetrics.map((metric) => (
          <StatCard key={metric.key} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cash flow velocity</h3>
              <p className="mt-1 text-xs text-slate-500">
                Net inflows across the last sprint. Positive motion indicates surplus capacity for new gigs.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Momentum</p>
              <p className={`text-lg font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend >= 0 ? '+' : '−'}
                {formatCompactCurrency(Math.abs(trend), currency)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Sparkline points={netFlowPoints} accent="#2563eb" id="wallet-netflow" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Operational posture</h3>
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-start justify-between gap-3">
              <dt>Dual approvals</dt>
              <dd className="text-right font-semibold text-slate-900">
                {formatStatus(compliance?.dualControlEnabled ? 'enabled' : 'disabled')}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt>Risk tier</dt>
              <dd className="text-right font-semibold text-slate-900">
                {formatStatus(overview?.riskTier ?? compliance?.riskTier ?? 'standard')}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt>KYC coverage</dt>
              <dd className="text-right font-semibold text-slate-900">
                {formatStatus(compliance?.kycStatus ?? 'complete')}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt>AML screenings</dt>
              <dd className="text-right font-semibold text-slate-900">
                {formatStatus(compliance?.amlStatus ?? 'clear')}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {segments.length ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Segments</h3>
            <span className="text-xs text-slate-500">
              {segments.length} wallet {segments.length === 1 ? 'segment' : 'segments'}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {segments.map((segment) => (
              <SegmentCard key={segment.id} segment={segment} currency={segment.currency ?? currency} />
            ))}
          </div>
        </div>
      ) : null}

      {alerts.length ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Alerts & nudges</h3>
            <span className="text-xs text-slate-500">Stay ahead of exceptions</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {alerts.map((alert) => (
              <AlertCard key={alert.id ?? alert.title ?? alert.message} alert={alert} />
            ))}
          </div>
        </div>
      ) : null}

      {upcomingPayouts.length ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming payouts</h3>
            <span className="text-xs text-slate-500">Automations & manual requests</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {upcomingPayouts.slice(0, 4).map((payout) => (
              <UpcomingItem key={payout.id ?? payout.reference ?? payout.label} payout={payout} currency={currency} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

WalletOverview.propTypes = {
  overview: PropTypes.object,
  workspaceLabel: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  onRefresh: PropTypes.func,
  onViewTransactions: PropTypes.func,
  onSchedulePayout: PropTypes.func,
  onManageCompliance: PropTypes.func,
};

WalletOverview.defaultProps = {
  overview: null,
  workspaceLabel: null,
  loading: false,
  error: null,
  onRefresh: undefined,
  onViewTransactions: undefined,
  onSchedulePayout: undefined,
  onManageCompliance: undefined,
};
