import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import DashboardInboxSection from '../../components/dashboard/messaging/DashboardInboxSection.jsx';
import useSession from '../../hooks/useSession.js';
import JobApplicationWorkspaceContainer from '../../components/jobApplications/JobApplicationWorkspaceContainer.jsx';
import JobManagementWorkspace from '../../components/jobs/JobManagementWorkspace.jsx';

const INSIGHTS = [
  {
    id: 'pipeline',
    title: 'Active mandates',
    value: '6',
    detail: '3 in interview stage • 2 awaiting proposals',
  },
  {
    id: 'introductions',
    title: 'Warm introductions',
    value: '12',
    detail: 'Last 7 days across fintech and climate accounts',
  },
  {
    id: 'placements',
    title: 'Recent placements',
    value: '4',
    detail: 'Average time-to-fill 18 days',
  },
];

const ACTIONS = [
  {
    id: 'check-in',
    title: 'Schedule hiring manager sync',
    description: 'Align expectations and surface blockers for the top priority roles.',
  },
  {
    id: 'sourcing',
    title: 'Refresh sourcing list',
    description: 'Search the Gigvora network for fresh talent across design and growth disciplines.',
  },
  {
    id: 'report',
    title: 'Send weekly status report',
    description: 'Share conversion stats, candidate feedback, and next steps with stakeholders.',
  },
];

const ALLOWED_ROLES = ['headhunter'];

const AVAILABLE_DASHBOARDS = [
  { id: 'headhunter', label: 'Headhunter', href: '/dashboard/headhunter' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
];

const MENU_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { id: 'headhunter-overview', name: 'Overview', sectionId: 'headhunter-overview' },
      { id: 'headhunter-inbox', name: 'Inbox', sectionId: 'headhunter-inbox', href: '/inbox' },
      { id: 'headhunter-job-hub', name: 'Job hub', sectionId: 'headhunter-job-hub' },
      { id: 'headhunter-job-publisher', name: 'Listings', sectionId: 'headhunter-job-publisher' },
    ],
  },
];

export default function HeadhunterDashboardPage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Headhunter';
  const handleOpenPublisher = () => {
    if (typeof window === 'undefined') {
      return;
    }
    const anchor = document.getElementById('headhunter-job-publisher');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="headhunter"
        title="Headhunter HQ"
        subtitle="Mandates & relationships"
        description="Monitor outreach momentum, upcoming interviews, and placement health in one workspace."
        menuSections={MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
      >
        <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
          <section id="headhunter-overview" className="space-y-8 border-b border-slate-200 pb-8">
            <header className="space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Headhunter HQ</p>
              <h1 className="text-3xl font-semibold text-slate-900">Good morning, {displayName}</h1>
            </header>
            <div className="grid gap-4 sm:grid-cols-3">
              {INSIGHTS.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{insight.title}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{insight.value}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{insight.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <h2 className="text-xl font-semibold text-slate-900">Today&apos;s priorities</h2>
                <ol className="mt-6 space-y-4">
                  {ACTIONS.map((action, index) => (
                    <li key={action.id} className="flex gap-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{action.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <h2 className="text-xl font-semibold text-slate-900">Partnership health</h2>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-600">Atlas Labs</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Green</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-600">Nova Retail</p>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Watch</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-600">Helios Tech</p>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">At risk</span>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900">Candidate spotlight</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Jordan W. just wrapped a contract with a 28% uplift in qualified pipeline. Share their profile with your climate tech clients.
                </p>
                <Link
                  to="/search"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  Browse talent
                </Link>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-blue-100 p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900">Need anything?</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Drop a note in the client success channel to coordinate interviews or escalate feedback.
                </p>
                <Link
                  to="/inbox"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Message success team
                </Link>
              </div>
            </aside>
          </section>

          <DashboardInboxSection
            id="headhunter-inbox"
            eyebrow="Messaging"
            title="Unified inbox"
            description="Respond to clients and candidates without leaving your HQ. The messaging workspace mirrors the floating dock for a seamless experience."
            statusLabel="Inbox status"
          />
          {session?.id ? (
            <section id="headhunter-job-hub" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">Job hub</h2>
                <button
                  type="button"
                  onClick={handleOpenPublisher}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  New listing
                </button>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <JobApplicationWorkspaceContainer userId={session.id} onCreateJob={handleOpenPublisher} />
              </div>
            </section>
          ) : null}

          <section
            id="headhunter-job-publisher"
            className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-slate-900">Job listings</h2>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Draft &amp; publish
              </span>
            </div>
            <JobManagementWorkspace />
          </section>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
