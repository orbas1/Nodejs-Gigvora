import PropTypes from 'prop-types';
import ProjectGigManagementContainer from '../../projectGigManagement/ProjectGigManagementContainer.jsx';

export default function UserGigWorkspaceSection({ userId }) {
  return (
    <section
      id="client-gig-workspace"
      className="space-y-6 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Gig workspace</p>
          <h2 className="text-3xl font-semibold text-slate-900">Production-grade gig management</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Launch orders, manage submissions, collaborate on revisions, and settle escrow checkpoints without leaving the
            dashboard.
          </p>
        </div>
      </header>

      <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-inner">
        <ProjectGigManagementContainer userId={userId} />
      </div>
    </section>
  );
}

UserGigWorkspaceSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
