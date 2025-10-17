import { Link } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';

const OVERVIEW_METRICS = [
  { id: 'clients', label: 'Active clients', value: '18', helper: '4 onboarding now' },
  { id: 'projects', label: 'Projects in delivery', value: '42', helper: '8 kicking off this week' },
  { id: 'capacity', label: 'Bench capacity', value: '63%', helper: 'Plan 120 open hours' },
];

const TEAM_NOTES = [
  { id: 'advocacy', title: 'Client advocacy sync', helper: 'Review NPS signals and assign follow-ups.' },
  { id: 'payments', title: 'Finance review', helper: 'Clear payouts and unblock vendor invoices.' },
  { id: 'growth', title: 'Growth pipeline', helper: 'Align pitch schedule for next week demos.' },
];

const FINANCE_SNAPSHOT = [
  { id: 'run-rate', label: 'Revenue run-rate', value: '$1.84M', helper: '+12% vs last quarter' },
  { id: 'invoiced', label: 'Invoices sent', value: '$310K', helper: 'Awaiting 3 approvals' },
  { id: 'payouts', label: 'Payouts processed', value: '$245K', helper: 'Cleared overnight' },
];

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Agency team';

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency control tower"
      subtitle={`Good to see you, ${displayName}`}
      description="Monitor client health, delivery momentum, and capacity in one place."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      activeMenuItem="agency-control-tower"
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {OVERVIEW_METRICS.map((metric) => (
          <div
            key={metric.id}
            className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Team focus</h2>
              <Link to="/inbox" className="text-sm font-semibold text-accent hover:text-accentDark">
                Post update
              </Link>
            </div>
            <ol className="mt-4 space-y-3">
              {TEAM_NOTES.map((task, index) => (
                <li key={task.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.helper}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Bench signals</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Product design squad</p>
                <p className="mt-2 text-sm text-emerald-700">Under capacity · 24 hours open</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Growth marketing pod</p>
                <p className="mt-2 text-sm text-amber-700">Monitor utilisation · 6 hours variance</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Engineering guild</p>
                <p className="mt-2 text-sm text-rose-700">Over capacity · triage blockers</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Finance snapshot</h2>
            <ul className="mt-4 space-y-3">
              {FINANCE_SNAPSHOT.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.helper}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Need support?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Finance and compliance can help unblock vendor payouts or contract reviews within the hour.
            </p>
            <Link
              to="/inbox"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Message operations
            </Link>
          </div>
        </aside>
      </section>
    </DashboardLayout>
  );
}
