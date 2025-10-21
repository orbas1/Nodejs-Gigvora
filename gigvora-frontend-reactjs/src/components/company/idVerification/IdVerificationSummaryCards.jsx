import PropTypes from 'prop-types';
import {
  ClockIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../../utils/date.js';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return Number(value).toLocaleString();
}

function formatHours(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  if (numeric < 1) {
    return `${(numeric * 60).toFixed(0)} min`;
  }
  return `${numeric.toFixed(1)} h`;
}

const cardStyles = {
  slate: {
    border: 'border-slate-200',
    background: 'bg-white',
    badge: 'bg-slate-100 text-slate-600',
    icon: 'text-slate-500',
  },
  amber: {
    border: 'border-amber-200',
    background: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-800',
    icon: 'text-amber-600',
  },
  indigo: {
    border: 'border-indigo-200',
    background: 'bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-800',
    icon: 'text-indigo-600',
  },
  emerald: {
    border: 'border-emerald-200',
    background: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-800',
    icon: 'text-emerald-600',
  },
  rose: {
    border: 'border-rose-200',
    background: 'bg-rose-50',
    badge: 'bg-rose-100 text-rose-800',
    icon: 'text-rose-600',
  },
};

function SummaryCard({ label, value, helper, icon: Icon, tone = 'slate', active = false, onSelect }) {
  const styles = cardStyles[tone] ?? cardStyles.slate;
  const borderRing = active ? 'ring-2 ring-offset-2 ring-accent border-transparent' : styles.border;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex h-full flex-col justify-between rounded-3xl border ${borderRing} ${styles.background} p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-4xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-2xl ${styles.badge} p-2 transition group-hover:scale-110`}>
          <Icon className={`h-5 w-5 ${styles.icon}`} />
        </div>
      </div>
      {helper ? <p className="mt-4 text-xs font-medium text-slate-500">{helper}</p> : null}
    </button>
  );
}

export default function IdVerificationSummaryCards({ stats = {}, loading = false, activeSegment = 'all', onSelect }) {
  const counts = stats.countsByStatus ?? {};
  const awaitingCount = (counts.pending ?? 0) + (counts.submitted ?? 0);
  const inReviewCount = counts.in_review ?? 0;
  const verifiedCount = counts.verified ?? 0;
  const attentionCount = (counts.rejected ?? 0) + (counts.expired ?? 0);

  const oldestPendingHelper = stats.oldestPending?.submittedAt
    ? `Oldest ${formatRelativeTime(stats.oldestPending.submittedAt)}`
    : '';

  const cards = [
    {
      key: 'new',
      label: 'New',
      value: loading ? '—' : formatNumber(awaitingCount),
      helper: loading ? 'Syncing queue…' : oldestPendingHelper,
      icon: ClockIcon,
      tone: 'amber',
    },
    {
      key: 'review',
      label: 'Review',
      value: loading ? '—' : formatNumber(inReviewCount),
      helper: loading
        ? 'Syncing reviewers…'
        : stats.averageReviewHours
        ? `Avg ${formatHours(stats.averageReviewHours)}`
        : '',
      icon: ShieldCheckIcon,
      tone: 'indigo',
    },
    {
      key: 'done',
      label: 'Done',
      value: loading ? '—' : formatNumber(verifiedCount),
      helper: loading ? '—' : `${formatNumber(stats.verifiedThisWeek ?? 0)} this week`,
      icon: CheckCircleIcon,
      tone: 'emerald',
    },
    {
      key: 'flagged',
      label: 'Flagged',
      value: loading ? '—' : formatNumber(attentionCount),
      helper: loading ? '—' : `${formatNumber(stats.submittedThisWeek ?? 0)} new`,
      icon: ExclamationTriangleIcon,
      tone: 'rose',
    },
  ];

  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard
          key={card.key}
          {...card}
          active={activeSegment === card.key}
          onSelect={() => onSelect?.(card.key)}
        />
      ))}
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  tone: PropTypes.oneOf(Object.keys(cardStyles)),
  active: PropTypes.bool,
  onSelect: PropTypes.func,
};

SummaryCard.defaultProps = {
  helper: null,
  tone: 'slate',
  active: false,
  onSelect: undefined,
};

IdVerificationSummaryCards.propTypes = {
  stats: PropTypes.shape({
    countsByStatus: PropTypes.object,
    oldestPending: PropTypes.shape({ submittedAt: PropTypes.string }),
    averageReviewHours: PropTypes.number,
    verifiedThisWeek: PropTypes.number,
    submittedThisWeek: PropTypes.number,
  }),
  loading: PropTypes.bool,
  activeSegment: PropTypes.string,
  onSelect: PropTypes.func,
};

IdVerificationSummaryCards.defaultProps = {
  stats: {},
  loading: false,
  activeSegment: 'all',
  onSelect: undefined,
};
