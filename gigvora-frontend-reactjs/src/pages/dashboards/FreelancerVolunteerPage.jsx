import RequireRole from '../../components/routing/RequireRole.jsx';
import VolunteeringManagementSection from './freelancer/sections/volunteering/VolunteeringManagementSection.jsx';

function VolunteerContent() {
  return (
    <div className="min-h-screen bg-surfaceMuted pb-20">
      <div className="mx-auto max-w-6xl space-y-10 px-4 pt-12 sm:px-6 lg:px-8">
        <header className="space-y-3 border-b border-slate-200 pb-8">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Volunteer</p>
          <h1 className="text-3xl font-semibold text-slate-900">Run pro bono engagements with confidence</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Track every application, response, agreement, and expense in one workspace built for high-trust volunteering.
          </p>
        </header>
        <VolunteeringManagementSection />
      </div>
    </div>
  );
}

export default function FreelancerVolunteerPage() {
  return (
    <RequireRole allowedRoles={['freelancer']}>
      <VolunteerContent />
    </RequireRole>
  );
}
