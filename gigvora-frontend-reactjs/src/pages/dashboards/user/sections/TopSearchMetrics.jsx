import PropTypes from 'prop-types';
import { ChartBarIcon, BellAlertIcon, MapIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../../../utils/date.js';

function MetricTile({ icon: Icon, label, value, footnote }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accentSoft text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      {footnote ? <p className="text-xs text-slate-400">{footnote}</p> : null}
    </div>
  );
}

MetricTile.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  footnote: PropTypes.node,
};

MetricTile.defaultProps = {
  footnote: null,
};

export default function TopSearchMetrics({ stats }) {
  const totals = stats?.totals ?? {};
  const schedule = stats?.schedule ?? {};
  const keywordHighlights = stats?.keywordHighlights ?? [];

  const nextRunLabel = schedule.nextRunAt ? formatRelativeTime(schedule.nextRunAt) : '—';
  const lastRunLabel = schedule.lastTriggeredAt ? formatRelativeTime(schedule.lastTriggeredAt) : 'Never';
  const overdue = schedule.overdue ?? 0;
  const dueSoon = schedule.dueSoon ?? 0;

  return (
    <section className="grid gap-4 lg:grid-cols-4">
      <MetricTile
        icon={ChartBarIcon}
        label="Total"
        value={totals.saved ?? 0}
        footnote={`${keywordHighlights.length} keywords`}
      />
      <MetricTile
        icon={BellAlertIcon}
        label="Alerts"
        value={`${totals.withEmailAlerts ?? 0} / ${totals.withInAppAlerts ?? 0}`}
        footnote="Email / In-app"
      />
      <MetricTile
        icon={MapIcon}
        label="Remote"
        value={totals.remoteEnabled ?? 0}
        footnote="Remote-friendly"
      />
      <MetricTile
        icon={ClockIcon}
        label="Runs"
        value={overdue + dueSoon}
        footnote={`Next ${nextRunLabel} • Last ${lastRunLabel}`}
      />
    </section>
  );
}

TopSearchMetrics.propTypes = {
  stats: PropTypes.shape({
    totals: PropTypes.shape({
      saved: PropTypes.number,
      withEmailAlerts: PropTypes.number,
      withInAppAlerts: PropTypes.number,
      remoteEnabled: PropTypes.number,
    }),
    schedule: PropTypes.shape({
      nextRunAt: PropTypes.string,
      lastTriggeredAt: PropTypes.string,
      overdue: PropTypes.number,
      dueSoon: PropTypes.number,
    }),
    keywordHighlights: PropTypes.array,
  }),
};

TopSearchMetrics.defaultProps = {
  stats: null,
};
