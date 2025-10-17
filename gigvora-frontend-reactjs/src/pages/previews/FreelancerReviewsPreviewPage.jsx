import SessionContext from '../../context/SessionContext.jsx';
import ReviewManagementSection from '../dashboards/freelancer/sections/ReviewManagementSection.jsx';

const DEMO_SESSION = {
  id: 'demo-freelancer',
  name: 'Demo Freelancer',
  email: 'demo@gigvora.com',
  memberships: ['freelancer'],
  roles: ['freelancer'],
  freelancerId: 'demo-freelancer',
  isAuthenticated: true,
};

export default function FreelancerReviewsPreviewPage() {
  return (
    <SessionContext.Provider value={{ session: DEMO_SESSION, isAuthenticated: true }}>
      <div className="min-h-screen bg-surfaceMuted py-12">
        <div className="mx-auto w-full max-w-6xl space-y-10 px-6">
          <header className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Preview</p>
            <h1 className="text-2xl font-semibold text-slate-900">Freelancer reviews</h1>
          </header>
          <ReviewManagementSection />
        </div>
      </div>
    </SessionContext.Provider>
  );
}
