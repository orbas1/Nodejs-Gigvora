import { Link } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';
import AgencyDashboardLayout from './agency/AgencyDashboardLayout.jsx';
import { AGENCY_DASHBOARD_MENU } from '../../constants/agencyDashboardMenu.js';

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

  const workspace = {
    name: `${displayName}'s workspace`,
  };

  return (
    <AgencyDashboardLayout
      workspace={workspace}
      menuSections={AGENCY_DASHBOARD_MENU}
      activeMenuItem="agency-overview"
      description="Track client delivery, utilisation, and finance telemetry with actionable next steps."
    >
      <div className="space-y-12">
        <section id="agency-overview" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Mission control</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600">
                  Keep an eye on client satisfaction, delivery readiness, and revenue pacing from this control panel. Use the
                  quick actions to broadcast updates or assign owners in seconds.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {OVERVIEW_METRICS.map((metric) => (
                  <div
                    key={metric.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
                    <p className="text-xs text-slate-500">{metric.hint}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard/agency/escrow"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                Open escrow mission control
              </Link>
              <Link
                to="/inbox"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
              >
                Broadcast update
              </Link>
            </div>
          </div>
        </section>

        <section id="agency-projects" className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Team focus</h2>
                <Link to="/inbox" className="text-sm font-semibold text-accent hover:text-accentDark">
                  Assign owner
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
              <h2 className="text-xl font-semibold text-slate-900">Bench capacity</h2>
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
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
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
                Finance and compliance respond within one hour. Flag blockers and we will unblock contracts, payouts, or vendor checks fast.
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

        <section id="agency-compliance" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Compliance pulses</h2>
              <p className="text-sm text-slate-600">
                Stay audit ready with the latest contract renewals, NDAs, and KYC refresh tasks.
              </p>
            </div>
            <Link to="/trust-center" className="text-sm font-semibold text-accent hover:text-accentDark">
              View trust center
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">KYC refresh</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">4 vendors</p>
              <p className="text-xs text-slate-500">Due this week</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contracts expiring</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">3 retainers</p>
              <p className="text-xs text-slate-500">Renew before Friday</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Security attestations</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">SOC 2 draft</p>
              <p className="text-xs text-slate-500">In review with compliance</p>
            </div>
          </div>
        </section>

        <section id="agency-automation" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Automation experiments</h2>
              <p className="text-sm text-slate-600">Review queue automations, AI summaries, and partner hand-offs ready to enable.</p>
            </div>
            <Link to="/auto-assign" className="text-sm font-semibold text-accent hover:text-accentDark">
              Manage auto-assign
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Escalation routing</p>
              <p className="mt-2 text-xs text-slate-500">Pilot automation for support tickets that touch finance or contracts.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">AI project recaps</p>
              <p className="mt-2 text-xs text-slate-500">Summaries posted in #client-wins every Friday at 4pm.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Bench nudges</p>
              <p className="mt-2 text-xs text-slate-500">Automated alerts when utilisation drops below 60% for any squad.</p>
            </div>
          </div>
        </section>
      </div>
    </AgencyDashboardLayout>
  );
}
