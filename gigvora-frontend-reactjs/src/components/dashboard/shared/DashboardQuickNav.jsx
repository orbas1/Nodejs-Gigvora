import PropTypes from 'prop-types';

function formatBadge(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return null;
    }
    if (!Number.isFinite(value)) {
      return null;
    }
    if (value > 999) {
      return `${Math.round(value / 100) / 10}k`;
    }
  }

  return String(value);
}

export default function DashboardQuickNav({ sections, activeItemId, onSelect }) {
  if (!Array.isArray(sections) || !sections.length) {
    return null;
  }

  return (
    <nav
      className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur"
      aria-label="Quick dashboard navigation"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick jump</p>
      <div className="mt-4 space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.id === activeItemId;
                const badge = formatBadge(item.badge);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect?.(item)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? 'border-transparent bg-accent text-white shadow-sm'
                        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="truncate font-semibold">{item.name}</span>
                    {badge ? (
                      <span
                        className={`ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

DashboardQuickNav.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          sectionId: PropTypes.string,
        }),
      ).isRequired,
    }),
  ),
  activeItemId: PropTypes.string,
  onSelect: PropTypes.func,
};

DashboardQuickNav.defaultProps = {
  sections: [],
  activeItemId: undefined,
  onSelect: undefined,
};
