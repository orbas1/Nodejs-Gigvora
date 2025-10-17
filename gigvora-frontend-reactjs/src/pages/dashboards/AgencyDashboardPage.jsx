import { Link } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';
import AgencyDashboardSidebar from '../../components/dashboard/agency/AgencyDashboardSidebar.jsx';
import MentoringSessionManagement from '../../components/dashboard/agency/MentoringSessionManagement.jsx';

const OVERVIEW_METRICS = [
  { id: 'clients', label: 'Active clients', value: 18, hint: '4 onboarding this month' },
  { id: 'projects', label: 'Managed projects', value: 42, hint: '8 in kickoff' },
  { id: 'talent', label: 'Bench capacity', value: '63%', hint: 'Plan for 120 open hours' },
];

const TEAM_TASKS = [
  { id: 'advocacy', title: 'Client sync', hint: 'Review NPS and set follow-ups.' },
  { id: 'payments', title: 'Finance check', hint: 'Clear payouts and vendor bills.' },
  { id: 'growth', title: 'Growth standup', hint: 'Align on next demo targets.' },
];

const FINANCE_SUMMARY = [
  { id: 'run-rate', label: 'Revenue run-rate', value: '$1.84M', hint: '+12% vs last quarter' },
  { id: 'invoiced', label: 'Invoices sent', value: '$310K', hint: 'Awaiting 3 approvals' },
  { id: 'payouts', label: 'Payouts processed', value: '$245K', hint: 'Cleared overnight' },
];

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Agency team';

  const sidebarSections = [
    { id: 'agency-overview', label: 'Overview' },
    { id: 'agency-focus', label: 'Focus' },
    { id: 'agency-bench', label: 'Bench' },
    { id: 'agency-finance', label: 'Finance' },
    { href: '/dashboard/agency/mentoring', label: 'Mentor' },
  ];

  return (
    <div className="min-h-screen bg-surfaceMuted pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
          <AgencyDashboardSidebar sections={sidebarSections} />
          <div className="space-y-10">
            <section id="agency-overview" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Agency control tower</p>
                  <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
                  <p className="mt-3 max-w-3xl text-sm text-slate-600">
                    Track health at a glance and jump straight into the work that needs attention.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {OVERVIEW_METRICS.map((metric) => (
                    <div
                      key={metric.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-0.5 hover:border-accent/60"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                      <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="agency-focus" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Focus</h2>
                <Link to="/inbox" className="text-sm font-semibold text-accent hover:text-accentDark">
                  Update
                </Link>
              </div>
              <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                {TEAM_TASKS.map((task, index) => (
                  <li key={task.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <span>Today</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.hint}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="agency-bench" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-900">Bench</h2>
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
            </section>

            <section id="agency-finance" className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <h2 className="text-xl font-semibold text-slate-900">Finance</h2>
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
                  Coordinate with finance or compliance in the shared channel. We’ll help unblock vendors, approvals, or contract
                  questions within the hour.
                </p>
                <Link
                  to="/inbox"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Message operations
                </Link>
              </div>
            </section>

            <MentoringSessionManagement />
          </div>
        </div>
      </div>
    </div>
  );
}
