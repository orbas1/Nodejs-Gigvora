import PropTypes from 'prop-types';
import DashboardStatPill from './DashboardStatPill.jsx';

export default function DashboardInsightsBand({
  title,
  subtitle,
  insights,
  loading,
  onRefresh,
}) {
  if (!Array.isArray(insights) || insights.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-4xl border border-slate-100 bg-gradient-to-br from-white/80 via-white to-blue-50/60 p-6 shadow-lg backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_55%)]" aria-hidden="true" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:from-blue-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            aria-busy={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh insights'}
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => (
          <DashboardStatPill
            key={insight.id ?? insight.label}
            icon={insight.icon}
            label={insight.label}
            value={insight.value}
            description={insight.description}
            trend={insight.trend}
            iconBackgroundClassName={insight.iconBackgroundClassName}
            iconClassName={insight.iconClassName}
            href={insight.href}
            onSelect={insight.onSelect}
            ariaLabel={insight.ariaLabel}
            badge={insight.badge}
            className="h-full"
          />
        ))}
      </div>
    </div>
  );
}

DashboardInsightsBand.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
    insights: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        icon: PropTypes.elementType,
        label: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        description: PropTypes.string,
        trend: PropTypes.shape({
          label: PropTypes.string.isRequired,
          direction: PropTypes.oneOf(['increase', 'decrease', 'neutral']),
        }),
        iconBackgroundClassName: PropTypes.string,
        iconClassName: PropTypes.string,
        href: PropTypes.string,
        onSelect: PropTypes.func,
        ariaLabel: PropTypes.string,
        badge: PropTypes.string,
      }),
    ),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

DashboardInsightsBand.defaultProps = {
  title: 'Cross-marketplace insights',
  subtitle: undefined,
  insights: [],
  loading: false,
  onRefresh: undefined,
};
