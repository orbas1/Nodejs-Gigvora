import PropTypes from 'prop-types';

function SummaryCard({ label, value, tone }) {
  return (
    <div
      className={`rounded-3xl border px-4 py-5 shadow-sm transition ${
        tone === 'accent'
          ? 'border-accent/50 bg-accentSoft/60 text-accent'
          : tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['default', 'accent', 'success']),
};

SummaryCard.defaultProps = {
  tone: 'default',
};

function ActionButton({ onClick, children, variant }) {
  const base =
    'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent';
  if (variant === 'primary') {
    return (
      <button type="button" onClick={onClick} className={`${base} bg-accent text-white hover:bg-accentDark`}>
        {children}
      </button>
    );
  }
  if (variant === 'neutral') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} border border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 hover:text-slate-900`}
    >
      {children}
    </button>
  );
}

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'neutral', 'ghost']),
};

ActionButton.defaultProps = {
  variant: 'neutral',
};

function AllowedRoles({ roles }) {
  if (!roles?.length) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <span
          key={role}
          className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700"
        >
          {role}
        </span>
      ))}
    </div>
  );
}

AllowedRoles.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string),
};

AllowedRoles.defaultProps = {
  roles: [],
};

export default function ProjectGigManagementSection({
  summaryCards,
  modules,
  onOpenModule,
  onCreateProject,
  onCreateGig,
  onLaunchWizard,
  viewOnlyNote,
  allowedRoles,
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Project &amp; gig workspace</h2>
          <p className="text-sm text-slate-500">Launch builds, track vendors, and keep escrow tidy.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton variant="primary" onClick={onCreateProject}>
            New project
          </ActionButton>
          <ActionButton variant="neutral" onClick={onCreateGig}>
            Log gig
          </ActionButton>
          {onLaunchWizard ? (
            <ActionButton variant="ghost" onClick={onLaunchWizard}>
              Wizard
            </ActionButton>
          ) : null}
        </div>
      </div>

      {viewOnlyNote ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-800 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">{viewOnlyNote}</p>
            <AllowedRoles roles={allowedRoles} />
          </div>
        </div>
      ) : null}

      {summaryCards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.id ?? card.label} label={card.label} value={card.value} tone={card.tone ?? 'default'} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {modules.map((module) => (
          <section
            key={module.id}
            className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            id={`project-module-${module.id}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{module.label}</h3>
              <ActionButton variant="neutral" onClick={() => onOpenModule(module.id)}>
                Open
              </ActionButton>
            </div>
            <div className="grid gap-3">{module.preview}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

ProjectGigManagementSection.propTypes = {
  summaryCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
      tone: PropTypes.oneOf(['default', 'accent', 'success']),
    }),
  ),
  modules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      preview: PropTypes.node,
    }),
  ),
  onOpenModule: PropTypes.func.isRequired,
  onCreateProject: PropTypes.func.isRequired,
  onCreateGig: PropTypes.func.isRequired,
  onLaunchWizard: PropTypes.func,
  viewOnlyNote: PropTypes.string,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

ProjectGigManagementSection.defaultProps = {
  summaryCards: [],
  modules: [],
  onLaunchWizard: null,
  viewOnlyNote: null,
  allowedRoles: [],
};
