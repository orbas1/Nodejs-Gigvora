import PropTypes from 'prop-types';

export default function TimelineShell({
  view,
  onViewChange,
  views,
  summary,
  actions,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-6 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-4 md:grid-cols-3">
          {summary.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-slate-700"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</span>
              <span className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <nav className="flex gap-2 rounded-full bg-slate-100 p-1">
            {views.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
          {actions}
        </div>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

TimelineShell.propTypes = {
  view: PropTypes.string.isRequired,
  onViewChange: PropTypes.func.isRequired,
  views: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  summary: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  ),
  actions: PropTypes.node,
  children: PropTypes.node,
};

TimelineShell.defaultProps = {
  summary: [],
  actions: null,
  children: null,
};
