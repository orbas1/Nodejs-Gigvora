import PropTypes from 'prop-types';
import { ShieldCheckIcon, UserGroupIcon, KeyIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function formatPercent(value, { fallback = '0%', digits = 1 } = {}) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const formatted = (numeric * 100).toFixed(digits);
  return `${formatted}%`;
}

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Math.round(numeric));
}

export default function TwoFactorSummaryCards({ summary = {}, coverage = {}, activeChallenges = 0 }) {
  const cards = [
    {
      id: 'admin-coverage',
      label: 'Admin coverage',
      value: formatPercent(summary.adminCoverageRate ?? coverage.adminCoverageRate ?? 0),
      caption: `${formatNumber(coverage.adminCovered ?? summary.adminsProtected ?? 0)} of ${formatNumber(
        coverage.adminCount ?? summary.adminsTotal ?? 0,
      )} admins secured`,
      icon: ShieldCheckIcon,
    },
    {
      id: 'overall-coverage',
      label: 'Workspace coverage',
      value: formatPercent(summary.overallCoverageRate ?? coverage.overallCoverageRate ?? 0),
      caption: `${formatNumber(coverage.overallCovered ?? 0)} accounts protected across the network`,
      icon: UserGroupIcon,
    },
    {
      id: 'pending-enrollments',
      label: 'Pending approvals',
      value: formatNumber(summary.pendingEnrollments ?? 0),
      caption: 'Hardware keys and authenticator apps waiting for review',
      icon: KeyIcon,
    },
    {
      id: 'active-bypasses',
      label: 'Active bypasses',
      value: formatNumber(summary.activeBypasses ?? 0),
      caption: `${formatNumber(activeChallenges ?? summary.activeChallenges ?? 0)} active MFA challenges today`,
      icon: ExclamationTriangleIcon,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.id}
            className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-500">{card.caption}</p>
          </article>
        );
      })}
    </section>
  );
}

TwoFactorSummaryCards.propTypes = {
  summary: PropTypes.shape({
    adminCoverageRate: PropTypes.number,
    overallCoverageRate: PropTypes.number,
    pendingEnrollments: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    activeBypasses: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    adminsProtected: PropTypes.number,
    adminsTotal: PropTypes.number,
    activeChallenges: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  coverage: PropTypes.shape({
    adminCoverageRate: PropTypes.number,
    adminCovered: PropTypes.number,
    adminCount: PropTypes.number,
    overallCoverageRate: PropTypes.number,
    overallCovered: PropTypes.number,
  }),
  activeChallenges: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

TwoFactorSummaryCards.defaultProps = {
  summary: {},
  coverage: {},
  activeChallenges: 0,
};
