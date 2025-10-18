import PropTypes from 'prop-types';

export default function GigWorkspaceShell({
  items,
  activeId,
  onSelect,
  header,
  children,
  footer,
}) {
  return (
    <div className="grid h-full min-h-[640px] w-full grid-cols-1 gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          {header}
        </div>
        <nav className="flex flex-col gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex h-12 items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                item.disabled
                  ? 'cursor-not-allowed border-transparent bg-slate-100 text-slate-400'
                  : activeId === item.id
                  ? 'border-accent bg-accentSoft text-accent shadow-sm'
                  : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => {
                if (!item.disabled) {
                  onSelect(item.id);
                }
              }}
              disabled={item.disabled}
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-3 inline-flex items-center justify-center rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
      </aside>
      <div className="min-h-[540px] rounded-3xl border border-slate-100 bg-slate-50/60 p-6">{children}</div>
    </div>
  );
}

GigWorkspaceShell.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      disabled: PropTypes.bool,
    }),
  ).isRequired,
  activeId: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  header: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
};

GigWorkspaceShell.defaultProps = {
  header: null,
  footer: null,
};
