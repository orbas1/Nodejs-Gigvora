import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { AGENCY_DASHBOARD_MENU_SECTIONS, AGENCY_DASHBOARD_ALTERNATES } from './agency/menuConfig.js';

const OVERVIEW_METRICS = [
  { id: 'clients', label: 'Active clients', value: 18, hint: '4 onboarding this month' },
  { id: 'projects', label: 'Managed projects', value: 42, hint: '8 in kickoff' },
  { id: 'talent', label: 'Bench capacity', value: '63%', hint: 'Plan for 120 open hours' },
];

const TEAM_TASKS = [
  {
    id: 'advocacy',
    title: 'Client advocacy sync',
    description: 'Review NPS signals and queue follow-ups with account owners.',
  },
  {
    id: 'payments',
    title: 'Finance review',
    description: 'Reconcile open payouts and approve this week’s vendor invoices.',
  },
  {
    id: 'growth',
    title: 'Growth pipeline',
    description: 'Share the latest pitch deck and align on next-week demos.',
  },
];

const FINANCE_SUMMARY = [
  { id: 'run-rate', label: 'Revenue run-rate', value: '$1.84M', hint: '+12% vs last quarter' },
  { id: 'invoiced', label: 'Invoices sent', value: '$310K', hint: 'Awaiting 3 approvals' },
  { id: 'payouts', label: 'Payouts processed', value: '$245K', hint: 'Cleared overnight' },
];

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Agency team';

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency command center"
      subtitle="Control tower for growth, delivery, and finance"
      description="Keep your clients delighted, balance the bench, and unblock the team with one connected workspace."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AGENCY_DASHBOARD_ALTERNATES}
      activeMenuItem="agency-overview"
    >
      <div className="space-y-12">
        <section id="agency-overview" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Agency control tower</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              Track client health, revenue momentum, and the team’s next actions. Keep the bench balanced and highlight wins to leadership.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {OVERVIEW_METRICS.map((metric) => (
                <div
                  key={metric.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="project-operations" className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Team focus</h2>
                <Link to="/dashboard/agency/inbox" className="text-sm font-semibold text-accent hover:text-accentDark">
                  Share update
                </Link>
              </div>
              <ol className="mt-6 space-y-4">
                {TEAM_TASKS.map((task, index) => (
                  <li key={task.id} className="flex gap-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-900">Bench signals</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">Product design squad</p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Under capacity</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">Growth marketing</p>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Monitor</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">Engineering guild</p>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Over capacity</span>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div id="finance-oversight" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Finance snapshot</h2>
              <ul className="mt-4 space-y-3">
                {FINANCE_SUMMARY.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                    <p className="text-xs text-slate-500">{item.hint}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Need support?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Coordinate with finance or compliance in the shared channel. We’ll help unblock vendors, approvals, or contract questions within the hour.
              </p>
              <Link
                to="/dashboard/agency/inbox"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Open inbox
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
}
