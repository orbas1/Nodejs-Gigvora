import PropTypes from 'prop-types';

function joinClasses(...values) {
  return values
    .flat()
    .filter(Boolean)
    .join(' ');
}

const TREND_TONE_CLASSES = {
  increase: 'bg-emerald-50 text-emerald-600',
  decrease: 'bg-rose-50 text-rose-600',
  neutral: 'bg-slate-100 text-slate-500',
};

export default function DashboardStatPill({
  icon: Icon,
  label,
  value,
  description,
  trend,
  className,
  iconBackgroundClassName,
  iconClassName,
  href,
  onSelect,
  ariaLabel,
  badge,
}) {
  const hasTrend = Boolean(trend?.label);
  const trendTone = TREND_TONE_CLASSES[trend?.direction] ?? TREND_TONE_CLASSES.neutral;
  const isInteractive = Boolean(href || onSelect);

  const containerClasses = joinClasses(
    'group relative flex items-start gap-3 rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm transition',
    isInteractive
      ? 'hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
      : '',
    className,
  );

  const content = (
    <>
      {Icon ? (
        <div
          className={joinClasses(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-white transition group-hover:scale-105',
            iconBackgroundClassName ?? 'bg-slate-900/90',
          )}
        >
          <Icon className={joinClasses('h-5 w-5', iconClassName)} aria-hidden="true" />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          {badge ? (
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="truncate text-lg font-semibold text-slate-900">{value}</p>
        {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>

      {hasTrend ? (
        <span
          className={joinClasses(
            'ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
            trendTone,
          )}
        >
          {trend?.direction === 'increase'
            ? '▲'
            : trend?.direction === 'decrease'
            ? '▼'
            : '●'}
          <span>{trend.label}</span>
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a href={href} className={containerClasses} aria-label={ariaLabel ?? label}>
        {content}
      </a>
    );
  }

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={containerClasses}
        aria-label={ariaLabel ?? label}
      >
        {content}
      </button>
    );
  }

  return <div className={containerClasses}>{content}</div>;
}

DashboardStatPill.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string,
  trend: PropTypes.shape({
    label: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(['increase', 'decrease', 'neutral']),
  }),
  className: PropTypes.string,
  iconBackgroundClassName: PropTypes.string,
  iconClassName: PropTypes.string,
  href: PropTypes.string,
  onSelect: PropTypes.func,
  ariaLabel: PropTypes.string,
  badge: PropTypes.string,
};

DashboardStatPill.defaultProps = {
  icon: null,
  description: undefined,
  trend: undefined,
  className: undefined,
  iconBackgroundClassName: undefined,
  iconClassName: undefined,
  href: undefined,
  onSelect: undefined,
  ariaLabel: undefined,
  badge: undefined,
};
