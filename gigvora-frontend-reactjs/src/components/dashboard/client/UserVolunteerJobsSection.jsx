import PropTypes from 'prop-types';
import VolunteeringManagementSection from '../../volunteeringManagement/VolunteeringManagementSection.jsx';

export default function UserVolunteerJobsSection({ userId, data, onRefresh }) {
  const applicationCount = Array.isArray(data?.applications) ? data.applications.length : 0;
  const openContracts = Array.isArray(data?.openContracts) ? data.openContracts.length : 0;

  return (
    <section
      id="user-volunteer-jobs"
      className="space-y-6 rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-500">Volunteer missions</p>
          <h2 className="text-3xl font-semibold text-slate-900">Community programmes and civic impact</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Coordinate volunteering applications, responses, contracts, and spend tracking inside the same workspace you use for
            gigs and projects.
          </p>
        </div>
        <div className="grid gap-2 rounded-2xl border border-teal-200 bg-white/80 px-4 py-3 text-xs font-semibold text-teal-700 shadow-sm">
          <span>{applicationCount} applications</span>
          <span>{openContracts} active contracts</span>
        </div>
      </div>
      <VolunteeringManagementSection userId={userId} data={data} onRefresh={onRefresh} />
    </section>
  );
}

UserVolunteerJobsSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  data: PropTypes.object,
  onRefresh: PropTypes.func,
};

UserVolunteerJobsSection.defaultProps = {
  data: null,
  onRefresh: null,
};
