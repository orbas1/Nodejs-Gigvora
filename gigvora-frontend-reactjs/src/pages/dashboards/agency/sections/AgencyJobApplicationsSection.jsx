import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import JobApplicationWorkspaceContainer from '../../../../components/jobApplications/JobApplicationWorkspaceContainer.jsx';

export default function AgencyJobApplicationsSection({ ownerId }) {
  const navigate = useNavigate();

  return (
    <section id="agency-job-applications" className="space-y-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold text-slate-900">Agency job hub</h2>
        <button
          type="button"
          onClick={() => navigate('/dashboard/agency/job-management')}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          Open listings
        </button>
      </header>

      {ownerId ? (
        <div className="rounded-4xl border border-slate-100 bg-slate-50/70 p-4 shadow-inner">
          <JobApplicationWorkspaceContainer
            userId={ownerId}
            onCreateJob={() => navigate('/dashboard/agency/job-management#create')}
          />
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
