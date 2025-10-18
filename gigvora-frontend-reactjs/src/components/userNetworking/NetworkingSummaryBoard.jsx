import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';
import formatDateTime from '../../utils/formatDateTime.js';
import classNames from '../../utils/classNames.js';
import {
  formatMoneyFromCents,
  formatNumber,
  formatStatusLabel,
  resolveSessionLabel,
  resolveConnectionName,
} from './utils.js';

function MetricCard({ label, value, hint }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  hint: PropTypes.node,
};

MetricCard.defaultProps = {
  hint: null,
};

function MiniCard({ title, meta, actionLabel, onAction, tone }) {
  return (
    <div
      className={classNames(
        'flex flex-col gap-2 rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5',
        tone === 'accent' ? 'border-accent/40 bg-accentSoft/60' : 'border-slate-200 bg-white',
      )}
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {meta ? <p className="text-xs text-slate-500">{meta}</p> : null}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

MiniCard.propTypes = {
  title: PropTypes.string.isRequired,
  meta: PropTypes.string,
  actionLabel: PropTypes.string.isRequired,
  onAction: PropTypes.func.isRequired,
  tone: PropTypes.oneOf(['default', 'accent']),
};

MiniCard.defaultProps = {
  meta: '',
  tone: 'default',
};

export default function NetworkingSummaryBoard({ summary, bookings, purchases, connections, onOpenTab }) {
  const totalSpend = formatMoneyFromCents(summary.totalSpendCents ?? 0, summary.currency ?? 'USD');
  const pendingSpend = formatMoneyFromCents(summary.pendingSpendCents ?? 0, summary.currency ?? 'USD');
  const refundedSpend = formatMoneyFromCents(summary.refundedCents ?? 0, summary.currency ?? 'USD');
  const averageScore =
    summary.averageSatisfaction != null ? `${Number(summary.averageSatisfaction).toFixed(1)}/5` : '—';

  const nextBooking = bookings.find((booking) => {
    const start = booking.session?.startTime ? new Date(booking.session.startTime) : null;
    return start && start.getTime() > Date.now();
  });

  const lastPurchase = purchases[0];
  const latestConnection = connections[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Sessions"
          value={formatNumber(summary.sessionsBooked ?? 0)}
          hint={`${formatNumber(summary.upcomingSessions ?? 0)} upcoming · ${formatNumber(summary.completedSessions ?? 0)} done`}
        />
        <MetricCard label="Spend" value={totalSpend} hint={`Pending ${pendingSpend} · Refunded ${refundedSpend}`} />
        <MetricCard
          label="Score"
          value={averageScore}
          hint={`${formatNumber(summary.checkedInCount ?? summary.bookings?.checkedInCount ?? 0)} check-ins`}
        />
        <MetricCard
          label="People"
          value={formatNumber(summary.connectionsTracked ?? 0)}
          hint={`${formatNumber(Object.values(summary.followStatusCounts ?? {}).reduce((acc, count) => acc + count, 0))} statuses`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MiniCard
          title={
            nextBooking
              ? resolveSessionLabel(nextBooking.session, nextBooking.sessionId)
              : 'No upcoming session'
          }
          meta={
            nextBooking
              ? `${formatStatusLabel(nextBooking.status)} · ${
                  nextBooking.session?.startTime
                    ? `${formatRelativeTime(nextBooking.session.startTime)} • ${formatDateTime(
                        nextBooking.session.startTime,
                      )}`
                    : 'Scheduled'
                }`
              : 'Plan your next booking.'
          }
          actionLabel="Sessions"
          onAction={() => onOpenTab('Sessions')}
          tone="accent"
        />

        <MiniCard
          title={
            lastPurchase
              ? `${formatMoneyFromCents(lastPurchase.amountCents, lastPurchase.currency)} · ${
                  resolveSessionLabel(lastPurchase.session, lastPurchase.sessionId)
                }`
              : 'No spend logged'
          }
          meta={
            lastPurchase
              ? `${formatStatusLabel(lastPurchase.status)} · ${formatRelativeTime(lastPurchase.purchasedAt)}`
              : 'Track purchases to prove ROI.'
          }
          actionLabel="Spend"
          onAction={() => onOpenTab('Spend')}
        />

        <MiniCard
          title={
            latestConnection
              ? resolveConnectionName(latestConnection)
              : 'No saved contacts'
          }
          meta={
            latestConnection
              ? `${formatStatusLabel(latestConnection.followStatus)} · ${formatRelativeTime(latestConnection.connectedAt)}`
              : 'Log people you meet to follow up.'
          }
          actionLabel="People"
          onAction={() => onOpenTab('People')}
        />
      </div>
    </div>
  );
}

NetworkingSummaryBoard.propTypes = {
  summary: PropTypes.shape({
    sessionsBooked: PropTypes.number,
    upcomingSessions: PropTypes.number,
    completedSessions: PropTypes.number,
    totalSpendCents: PropTypes.number,
    pendingSpendCents: PropTypes.number,
    refundedCents: PropTypes.number,
    averageSatisfaction: PropTypes.number,
    connectionsTracked: PropTypes.number,
    followStatusCounts: PropTypes.object,
    checkedInCount: PropTypes.number,
    bookings: PropTypes.shape({
      upcomingCount: PropTypes.number,
      checkedInCount: PropTypes.number,
    }),
    currency: PropTypes.string,
  }).isRequired,
  bookings: PropTypes.arrayOf(PropTypes.object),
  purchases: PropTypes.arrayOf(PropTypes.object),
  connections: PropTypes.arrayOf(PropTypes.object),
  onOpenTab: PropTypes.func.isRequired,
};

NetworkingSummaryBoard.defaultProps = {
  bookings: [],
  purchases: [],
  connections: [],
};
