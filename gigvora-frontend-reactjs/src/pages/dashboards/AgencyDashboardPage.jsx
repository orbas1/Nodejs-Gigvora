import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AgencyOverviewSection from '../../components/agency/AgencyOverviewSection.jsx';
import useSession from '../../hooks/useSession.js';

const MENU_SECTIONS = [
  {
    label: 'Agency cockpit',
    items: [
      {
        id: 'agency-overview',
        name: 'Agency overview',
        description: 'Revenue, focus, and team health.',
        sectionId: 'agency-overview',
      },
      {
        id: 'agency-focus',
        name: 'Focus & signals',
        description: 'What the team is working on next.',
        sectionId: 'agency-focus',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        id: 'agency-disputes',
        name: 'Disputes',
        description: 'Resolve cases fast.',
        href: '/dashboard/agency/disputes',
      },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user'];

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Agency team';

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency control tower"
      subtitle="Orchestrate delivery, growth, and trust"
      description="A single place to align your agency—revenue, delivery, talent, and dispute operations."
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <AgencyOverviewSection displayName={displayName} />

        <section id="agency-dispute-summary" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Dispute workspace</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-600">Queue, evidence, and escrow controls in one view.</p>
            </div>
            <Link
              to="/dashboard/agency/disputes"
              className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Open workspace
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Queue',
                description: 'Assign, prioritise, and filter without leaving the page.',
              },
              {
                title: 'Evidence',
                description: 'Log events with attachments and full actor history.',
              },
              {
                title: 'Escrow',
                description: 'Release or refund funds directly from the case.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
