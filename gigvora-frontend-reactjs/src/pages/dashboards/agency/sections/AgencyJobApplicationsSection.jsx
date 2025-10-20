import PropTypes from 'prop-types';
import JobApplicationWorkspaceContainer from '../../../../components/jobApplications/JobApplicationWorkspaceContainer.jsx';

export default function AgencyJobApplicationsSection({ ownerId }) {
  return (
    <section id="agency-job-applications" className="space-y-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Talent</p>
          <h2 className="text-3xl font-semibold text-slate-900">Agency job applications</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Centralise every outbound pitch, saved role, interview loop, and follow-up note across your delivery pods.
          </p>
        </div>
      </header>

      {ownerId ? (
        <div className="rounded-4xl border border-slate-100 bg-slate-50/70 p-4 shadow-inner">
          <JobApplicationWorkspaceContainer userId={ownerId} />
        </div>
      ) : (
        <div className="rounded-4xl border border-amber-200 bg-amber-50/70 p-6 text-sm text-amber-700">
          Assign an agency owner to unlock the job application control centre.
        </div>
      )}
    </section>
  );
}

AgencyJobApplicationsSection.propTypes = {
  ownerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

AgencyJobApplicationsSection.defaultProps = {
  ownerId: null,
};
