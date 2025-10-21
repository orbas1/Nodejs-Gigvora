import PropTypes from 'prop-types';
import DataStatus from '../../DataStatus.jsx';
import ProjectWorkspaceContainer from '../../projectWorkspace/ProjectWorkspaceContainer.jsx';

function SectionHeader({ title, subtitle, cta }) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Project workspace</p>
        <h2 className="mt-1 text-3xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">{subtitle}</p>
      </div>
      {cta ? <div className="flex items-center gap-2">{cta}</div> : null}
    </header>
  );
}

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  cta: PropTypes.node,
};

SectionHeader.defaultProps = {
  cta: null,
};

export default function UserProjectWorkspaceSection({
  userId,
  loading,
  error,
  lastUpdated,
  fromCache,
  onRefresh,
  session,
  children,
}) {
  return (
    <section id="client-project-workspace" className="space-y-6 rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white p-6 shadow-sm">
      <SectionHeader
        title="Command centre for delivery"
        subtitle="Provision workspaces, orchestrate milestones, and keep every stakeholder aligned with compliance-ready controls."
        cta={
          <button
            type="button"
            onClick={() => onRefresh?.({ force: true })}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
          >
            Refresh
          </button>
        }
      />

      <DataStatus loading={loading} error={error} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={onRefresh} statusLabel="Workspace sync" />

      <div className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-inner">
        <ProjectWorkspaceContainer userId={userId} session={session} />
      </div>

      {children ? <div className="space-y-6">{children}</div> : null}
    </section>
  );
}

UserProjectWorkspaceSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  fromCache: PropTypes.bool,
  onRefresh: PropTypes.func,
  session: PropTypes.object,
  children: PropTypes.node,
};

UserProjectWorkspaceSection.defaultProps = {
  loading: false,
  error: null,
  lastUpdated: null,
  fromCache: false,
  onRefresh: null,
  session: null,
  children: null,
};
