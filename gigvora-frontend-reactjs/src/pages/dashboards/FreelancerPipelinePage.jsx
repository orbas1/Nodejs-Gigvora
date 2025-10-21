import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';

const STAGES = [
  {
    id: 'ready',
    title: 'Ready to start',
    description: 'Confirm your profile, rates, and availability so you can move quickly when invited.',
  },
  {
    id: 'applied',
    title: 'Applied',
    description: 'Follow up with hiring managers within 24 hours and share tailored project highlights.',
  },
  {
    id: 'interviewing',
    title: 'Interviewing',
    description: 'Prepare talking points that emphasise outcomes, metrics, and collaboration style.',
  },
  {
    id: 'offer',
    title: 'Offer',
    description: 'Loop in your talent partner to review terms and surface any blockers early.',
  },
  {
    id: 'kickoff',
    title: 'Kickoff',
    description: 'Meet the client team, agree on the delivery plan, and track milestones in Gigvora.',
  },
];

const ALLOWED_ROLES = ['freelancer'];

export default function FreelancerPipelinePage() {
  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="freelancer"
        title="Pipeline"
        subtitle="Keep opportunities moving"
        description="Monitor every stage from application through kickoff so you and your talent partner stay perfectly aligned."
        menuSections={MENU_GROUPS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="pipeline"
      >
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
          <header className="space-y-3 border-b border-slate-200 pb-8">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Pipeline</p>
            <h1 className="text-3xl font-semibold text-slate-900">Keep opportunities moving</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Track where every application sits, review the suggested next action, and coordinate with your talent partner so
              nothing slips through the cracks.
            </p>
          </header>

          <section className="space-y-6">
            {STAGES.map((stage, index) => (
              <article
                key={stage.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60 sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900">{stage.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{stage.description}</p>
                </div>
                <Link
                  to="/inbox"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Talk with talent team
                </Link>
              </article>
            ))}
          </section>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
