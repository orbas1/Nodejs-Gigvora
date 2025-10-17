import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import JobManagementBoard from '../../../components/agency/jobManagement/JobManagementBoard.jsx';
import useSession from '../../../hooks/useSession.js';

const MENU_SECTIONS = [
  {
    label: 'Jobs',
    items: [
      { name: 'Home', sectionId: 'agency-job-home' },
      { name: 'Board', sectionId: 'agency-job-board' },
      { name: 'Detail', sectionId: 'agency-job-detail' },
    ],
  },
];

export default function AgencyJobManagementPage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Agency team';
  const [searchParams, setSearchParams] = useSearchParams();
  const [workspaceDraft, setWorkspaceDraft] = useState(() => searchParams.get('workspaceId') || '');

  useEffect(() => {
    setWorkspaceDraft(searchParams.get('workspaceId') || '');
  }, [searchParams]);

  const workspaceId = searchParams.get('workspaceId') || undefined;
  const jobId = searchParams.get('jobId') || undefined;

  const handleJobSelectionChange = useCallback(
    (nextJobId) => {
      const next = new URLSearchParams(searchParams);
      if (workspaceId) {
        next.set('workspaceId', workspaceId);
      } else {
        next.delete('workspaceId');
      }
      if (nextJobId) {
        next.set('jobId', String(nextJobId));
      } else {
        next.delete('jobId');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, workspaceId],
  );

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Job hub"
      subtitle="Applications & interviews"
      description="Manage openings, candidates, and comms without leaving the workspace."
      menuSections={MENU_SECTIONS}
      availableDashboards={['agency', 'user', 'freelancer', 'company', 'headhunter']}
    >
      <section id="agency-job-home" className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Workspace</p>
              <h1 className="text-2xl font-semibold text-slate-900">Hi {displayName}</h1>
              <p className="text-sm text-slate-500">Switch workspaces to move between client teams.</p>
            </div>
            <form
              className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto"
              onSubmit={(event) => {
                event.preventDefault();
                const next = new URLSearchParams(searchParams);
                if (workspaceDraft) {
                  next.set('workspaceId', workspaceDraft.trim());
                } else {
                  next.delete('workspaceId');
                }
                next.delete('jobId');
                setSearchParams(next, { replace: true });
              }}
            >
              <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Workspace ID</span>
                <input
                  value={workspaceDraft}
                  onChange={(event) => setWorkspaceDraft(event.target.value)}
                  placeholder="agency_main_workspace"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
              >
                Switch
              </button>
            </form>
          </div>
        </div>
        <JobManagementBoard
          workspaceId={workspaceId}
          jobId={jobId}
          onJobSelectionChange={handleJobSelectionChange}
        />
      </section>
    </DashboardLayout>
  );
}
