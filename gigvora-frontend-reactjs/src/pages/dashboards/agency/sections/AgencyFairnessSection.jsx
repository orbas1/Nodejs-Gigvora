import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import DashboardInsightsBand from '../../../../components/dashboard/shared/DashboardInsightsBand.jsx';
import DashboardAlertBanner from '../../../../components/dashboard/shared/DashboardAlertBanner.jsx';
import DashboardCollapsibleSection from '../../../../components/dashboard/shared/DashboardCollapsibleSection.jsx';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Number(value));
}

function formatPercentage(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Number(value).toFixed(0)}%`;
}

function formatHours(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const hours = Number(value);
  if (hours < 24) {
    return `${hours.toFixed(1)} hrs`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)} days`;
}

export default function AgencyFairnessSection({
  orders,
  autoMatch,
  boardMetrics,
  gigStats,
  onReviewPipeline,
}) {
  const activeOrders = useMemo(() => orders.filter((order) => order?.status !== 'completed'), [orders]);
  const newcomerEligible = useMemo(
    () =>
      activeOrders.filter((order) => {
        const metadata = order?.metadata ?? order?.settings ?? {};
        const fairness = metadata.fairness ?? metadata.autoAssign?.fairness ?? {};
        return fairness.ensureNewcomer || fairness.ensuredNewcomer;
      }),
    [activeOrders],
  );

  const dueSoon = useMemo(() => {
    const now = Date.now();
    const sevenDays = 1000 * 60 * 60 * 24 * 7;
    return activeOrders.filter((order) => {
      if (!order?.dueAt) {
        return false;
      }
      const due = new Date(order.dueAt).getTime();
      if (Number.isNaN(due)) {
        return false;
      }
      return due - now <= sevenDays && due >= now;
    });
  }, [activeOrders]);

  const readyCount = autoMatch?.readyCount ?? (Array.isArray(autoMatch?.candidates) ? autoMatch.candidates.length : 0);
  const atRiskCount = boardMetrics?.atRisk ?? boardMetrics?.riskHigh ?? 0;
  const averageTurnaround = gigStats?.averageTurnaroundHours ?? gigStats?.averageTurnaround ?? null;

  const fairnessScore = useMemo(() => {
    const denominator = activeOrders.length || 1;
    const mitigated = Math.max(0, denominator - atRiskCount);
    return Math.max(0, Math.min(100, Math.round((mitigated / denominator) * 100)));
  }, [activeOrders.length, atRiskCount]);

  const staffingCoverage = useMemo(() => {
    if (dueSoon.length === 0) {
      return 100;
    }
    const coverage = Math.min(1, readyCount / dueSoon.length) * 100;
    return Math.round(coverage);
  }, [dueSoon.length, readyCount]);

  const insights = useMemo(
    () => [
      {
        id: 'fairness-score',
        icon: ShieldCheckIcon,
        label: 'Fairness score',
        value: formatPercentage(fairnessScore),
        description: `${formatNumber(mitigatedEngagements(activeOrders.length, atRiskCount))} engagements meeting rotation guardrails`,
      },
      {
        id: 'newcomer-slots',
        icon: UsersIcon,
        label: 'Newcomer slots in flight',
        value: formatNumber(newcomerEligible.length),
        description: 'Orders reserving slots for first-time collaborators.',
      },
      {
        id: 'staffing-coverage',
        icon: ArrowTrendingUpIcon,
        label: 'Staffing coverage',
        value: formatPercentage(staffingCoverage),
        description: `${formatNumber(readyCount)} specialists ready vs. ${formatNumber(dueSoon.length)} deliverables due soon.`,
      },
      {
        id: 'turnaround',
        icon: ClockIcon,
        label: 'Average turnaround',
        value: formatHours(averageTurnaround),
        description: 'Median production time for the latest gig completions.',
      },
    ],
    [
      fairnessScore,
      newcomerEligible.length,
      staffingCoverage,
      readyCount,
      dueSoon.length,
      averageTurnaround,
      activeOrders.length,
      atRiskCount,
    ],
  );

  const alerts = useMemo(() => {
    const list = [];
    if (atRiskCount > 0) {
      list.push({
        tone: 'warning',
        title: `${formatNumber(atRiskCount)} engagements flagged for mitigation`,
        message: 'Prioritise coaching and QA reviews for the gigs raised by the workspace board.',
      });
    }
    if (staffingCoverage < 75 && dueSoon.length > 0) {
      list.push({
        tone: 'highlight',
        title: 'Invite additional specialists to protect delivery velocity',
        message: `Only ${formatPercentage(staffingCoverage)} of deliverables due this week have matching specialists queued.`,
      });
    }
    if ((gigStats?.awaitingReview ?? 0) > 0) {
      list.push({
        tone: 'info',
        title: `${formatNumber(gigStats.awaitingReview)} submissions await agency review`,
        message: 'Approve or request revisions promptly to keep auto-match fairness signals fresh.',
      });
    }
    return list;
  }, [atRiskCount, staffingCoverage, dueSoon.length, gigStats?.awaitingReview]);

  return (
    <DashboardCollapsibleSection
      id="agency-fairness"
      anchorId="agency-fairness"
      title="Fairness guardrails & staffing forecast"
      badge="Operations"
      description="Audit fairness safeguards, rotation health, and near-term staffing demand across gig programmes."
      tone="slate"
    >
      <DashboardInsightsBand
        title="Rotation and staffing insights"
        subtitle="Monitor fairness guardrails while balancing delivery demand."
        insights={insights}
      />

      {alerts.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {alerts.map((alert) => (
            <DashboardAlertBanner
              key={`${alert.tone}-${alert.title}`}
              tone={alert.tone}
              title={alert.title}
              message={alert.message}
              actions={
                onReviewPipeline
                  ? [
                      <button
                        key="review"
                        type="button"
                        onClick={onReviewPipeline}
                        className="inline-flex items-center rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white/30"
                      >
                        Review pipeline
                      </button>,
                    ]
                  : null
              }
            />
          ))}
        </div>
      ) : null}
    </DashboardCollapsibleSection>
  );
}

function mitigatedEngagements(total, atRisk) {
  const denominator = total || 1;
  return Math.max(0, denominator - atRisk);
}

AgencyFairnessSection.propTypes = {
  orders: PropTypes.arrayOf(PropTypes.object),
  autoMatch: PropTypes.object,
  boardMetrics: PropTypes.object,
  gigStats: PropTypes.object,
  onReviewPipeline: PropTypes.func,
};

AgencyFairnessSection.defaultProps = {
  orders: [],
  autoMatch: {},
  boardMetrics: {},
  gigStats: {},
  onReviewPipeline: undefined,
};
