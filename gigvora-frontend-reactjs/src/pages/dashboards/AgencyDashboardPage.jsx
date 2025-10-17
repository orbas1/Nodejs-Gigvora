import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import CreationStudioSection from '../../components/agencyCreationStudio/CreationStudioSection.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import useSession from '../../hooks/useSession.js';

const OVERVIEW_METRICS = [
  { id: 'clients', label: 'Clients', value: 18, hint: '4 onboarding' },
  { id: 'projects', label: 'Projects', value: 42, hint: '8 in kickoff' },
  { id: 'talent', label: 'Bench', value: '63%', hint: '120 hours open' },
];

const TEAM_TASKS = [
  { id: 'advocacy', title: 'Client sync', description: 'Check health scores and follow-ups.' },
  { id: 'payments', title: 'Finance sweep', description: 'Approve payouts and invoices.' },
  { id: 'growth', title: 'Pipeline huddle', description: 'Confirm demos and outreach.' },
];

const BENCH_SIGNALS = [
  { id: 'design', label: 'Design pod', tone: 'emerald', status: 'Room to book' },
  { id: 'marketing', label: 'Growth squad', tone: 'amber', status: 'Watch load' },
  { id: 'engineering', label: 'Build team', tone: 'rose', status: 'At limit' },
];

const BENCH_TONE_CLASSES = {
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
};

const FINANCE_SUMMARY = [
  { id: 'run-rate', label: 'Run rate', value: '$1.84M', hint: '+12% QoQ' },
  { id: 'invoiced', label: 'Invoiced', value: '$310K', hint: '3 awaiting sign-off' },
  { id: 'payouts', label: 'Payouts', value: '$245K', hint: 'Cleared overnight' },
];

const availableDashboards = ['agency', 'company', 'freelancer', 'user', 'mentor', 'headhunter'];

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const displayName = useMemo(() => session?.name ?? session?.firstName ?? 'Agency team', [session]);

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency hub"
      subtitle="Operate launches, teams, and cash flow"
      description=""
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={availableDashboards}
    >
      <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">
        <section id="agency-overview" className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Welcome</p>
            <h1 className="text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
            <p className="max-w-2xl text-sm text-slate-600">Your live pulse on clients, delivery, launches, and cash.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {OVERVIEW_METRICS.map((metric) => (
              <div
                key={metric.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <CreationStudioSection />

        <section id="team-focus" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Team focus</h2>
              <span className="text-xs uppercase tracking-wide text-slate-400">Weekly rhythm</span>
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

          <div id="bench-signals" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-900">Bench signals</h2>
            <div className="mt-4 space-y-3">
              {BENCH_SIGNALS.map((signal) => (
                <div
                  key={signal.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3"
                >
                  <p className="text-sm text-slate-600">{signal.label}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      BENCH_TONE_CLASSES[signal.tone] ?? 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {signal.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="finance-snapshot" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
            <p className="mt-2 text-sm text-slate-600">Ping ops for finance or compliance help in the shared channel.</p>
            <a
              href="/inbox"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Message operations
            </a>
          </div>
        </section>

        <section id="marketplace-leadership" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Marketplace leadership</h2>
              <p className="text-sm text-slate-600">Quick checks on studios, partners, advocacy, and automation.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Pulse report</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Studio pipeline</p>
              <p className="mt-1 text-xs text-slate-500">13 briefs in discovery · 6 awaiting client approval</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Advocacy flywheel</p>
              <p className="mt-1 text-xs text-slate-500">5 stories ready for spotlight · 9 referrals pending nurture</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Partner programs</p>
              <p className="mt-1 text-xs text-slate-500">4 alliances activated · 3 in due diligence</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Marketing automation</p>
              <p className="mt-1 text-xs text-slate-500">Next campaign: Launchpad momentum · send scheduled tomorrow</p>
            </div>
          </div>
        </section>

        <section id="ads-operations" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Gigvora ads</h2>
              <p className="text-sm text-slate-600">Track pacing, tests, and channel mix for paid work.</p>
            </div>
            <a
              href="/dashboard/agency#creation-studio"
              className="text-xs font-semibold text-accent transition hover:text-accentDark"
            >
              Manage placements
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Active campaigns</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">7</p>
              <p className="text-xs text-slate-500">3 prospecting · 4 retargeting</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Spend this week</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">$8.4K</p>
              <p className="text-xs text-slate-500">32% pacing vs budget</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Top performer</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Launchpad success carousel</p>
              <p className="text-xs text-slate-500">CTR 4.2% · CPL $38</p>
            </div>
          </div>
        </section>

        <section id="projects-workspace" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Project workspaces</h2>
            <p className="text-sm text-slate-600">
              Monitor delivery pods, dependencies, and client experience. Surface risks before they become blockers.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">In delivery</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">24</p>
              <p className="text-xs text-slate-500">3 marked at risk</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Next retros</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">5</p>
              <p className="text-xs text-slate-500">Auto-generated for Friday</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Budget in play</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">$420K</p>
              <p className="text-xs text-slate-500">Spending velocity on track</p>
            </div>
          </div>
        </section>

        <section id="gig-programs" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">Gig programs</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Studio pipeline</p>
              <p className="text-xs text-slate-500">11 briefs in scope review · 5 fulfilment in progress</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Marketplace health</p>
              <p className="text-xs text-slate-500">CSAT 4.7 · Avg. SLA 36h</p>
            </div>
          </div>
        </section>

        <section id="payments-distribution" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">Payments distribution</h2>
          <p className="mt-1 text-sm text-slate-600">
            Keep escrow balances, payout batches, and vendor invoices on time with automated reconciliations.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Upcoming batches</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">3</p>
              <p className="text-xs text-slate-500">Clears within 48h</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Escrow balance</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">$612K</p>
              <p className="text-xs text-slate-500">$92K earmarked for vendors</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Invoices pending</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">7</p>
              <p className="text-xs text-slate-500">Send approvals today</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
