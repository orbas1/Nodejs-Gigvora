import PropTypes from 'prop-types';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function WorkspaceShell({ sections, activeSection, onSectionChange, footer, children }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="hidden gap-2 sm:flex">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={classNames(
                  'flex-1 rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition',
                  activeSection === section.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 sm:hidden">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={classNames(
                  'flex-1 min-w-[140px] rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition',
                  activeSection === section.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
        {footer ? <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">{footer}</div> : null}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

WorkspaceShell.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  activeSection: PropTypes.string.isRequired,
  onSectionChange: PropTypes.func.isRequired,
  footer: PropTypes.node,
  children: PropTypes.node,
};
