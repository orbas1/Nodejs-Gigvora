import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import VolunteeringSummaryCards from '../../components/company/volunteering/VolunteeringSummaryCards.jsx';
import VolunteeringPostBoard from '../../components/company/volunteering/VolunteeringPostBoard.jsx';
import VolunteeringPeopleWorkspace from '../../components/company/volunteering/VolunteeringPeopleWorkspace.jsx';
import VolunteeringInterviewBoard from '../../components/company/volunteering/VolunteeringInterviewBoard.jsx';
import VolunteeringContractLedger from '../../components/company/volunteering/VolunteeringContractLedger.jsx';
import VolunteeringSpendTracker from '../../components/company/volunteering/VolunteeringSpendTracker.jsx';
import VolunteeringApplicationDrawer from '../../components/company/volunteering/VolunteeringApplicationDrawer.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { useCompanyVolunteeringManagement } from '../../hooks/useCompanyVolunteeringManagement.js';
import { useSession } from '../../context/SessionContext.jsx';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const LOOKBACK_OPTIONS = [30, 60, 90, 120, 180];
const VIEWS = [
  { id: 'summary', label: 'Summary' },
  { id: 'posts', label: 'Posts' },
  { id: 'people', label: 'People' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'spend', label: 'Spend' },
];

function buildWorkspaceProfile(workspace) {
  if (!workspace) {
    return null;
  }
  const name = workspace.name ?? 'Volunteer workspace';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return {
    name,
    role: 'Volunteer operations',
    initials: initials || 'VO',
    status: workspace.statusLabel ?? workspace.status ?? 'Active',
    badges: workspace.badges ?? [],
  };
}

function flattenApplications(posts = []) {
  return posts.flatMap((post) =>
    (post.applications ?? []).map((application) => ({
      ...application,
      post,
    })),
  );
}

function flattenContracts(applications = []) {
  return applications.flatMap((application) =>
    (application.contracts ?? []).map((contract) => ({
      ...contract,
      applicationId: application.id,
      application,
      post: application.post ?? null,
      spendEntries: (contract.spendEntries ?? []).map((entry) => ({
        ...entry,
        contractId: contract.id,
      })),
    })),
  );
}

function flattenSpend(contracts = []) {
  return contracts.flatMap((contract) =>
    (contract.spendEntries ?? []).map((entry) => ({
      ...entry,
      contractId: contract.id,
      contract,
      application: contract.application,
    })),
  );
}

function flattenInterviews(applications = []) {
  return applications.flatMap((application) =>
    (application.interviews ?? []).map((interview) => ({
      ...interview,
      applicationId: interview.applicationId ?? application.id,
      application,
    })),
  );
}

export default function CompanyVolunteeringManagementPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const workspaceIdParam = searchParams.get('workspaceId') ?? '';
  const workspaceSlugParam = searchParams.get('workspaceSlug') ?? '';
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 90, 7) : 90;

  const memberships = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && memberships.includes('company');

  const [workspaceIdInput, setWorkspaceIdInput] = useState(workspaceIdParam);
  const [workspaceSlugInput, setWorkspaceSlugInput] = useState(workspaceSlugParam);
  const [activeView, setActiveView] = useState('summary');
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panelBusy, setPanelBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    setWorkspaceIdInput(workspaceIdParam);
  }, [workspaceIdParam]);

  useEffect(() => {
    setWorkspaceSlugInput(workspaceSlugParam);
  }, [workspaceSlugParam]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isCompanyMember) {
      const fallback = session?.primaryDashboard ?? memberships.find((membership) => membership !== 'company');
      if (fallback) {
        navigate(`/dashboard/${fallback}`, { replace: true, state: { from: '/dashboard/company/volunteer' } });
      }
    }
  }, [isAuthenticated, isCompanyMember, memberships, navigate, session?.primaryDashboard]);

  const hasWorkspaceSelection = Boolean(
    (workspaceIdParam && workspaceIdParam.trim().length > 0) ||
      (workspaceSlugParam && workspaceSlugParam.trim().length > 0),
  );

  const volunteering = useCompanyVolunteeringManagement({
    workspaceId: workspaceIdParam || undefined,
    workspaceSlug: workspaceSlugParam || undefined,
    lookbackDays,
    enabled: isAuthenticated && isCompanyMember && hasWorkspaceSelection,
  });

  const {
    data,
    posts,
    summary,
    totals,
    permissions,
    loading,
    error,
    refresh,
    fromCache,
    lastUpdated,
    createPost,
    updatePost,
    removePost: deletePost,
    createApplication,
    updateApplication,
    removeApplication: deleteApplication,
    createResponse,
    updateResponse,
    removeResponse: deleteResponse,
    scheduleInterview,
    updateInterview,
    removeInterview: deleteInterview,
    createContract,
    updateContract,
    removeContract: deleteContract,
    addSpend,
    updateSpend,
    removeSpend: deleteSpend,
  } = volunteering;

  const workspaceProfile = useMemo(() => buildWorkspaceProfile(data?.workspace), [data?.workspace]);

  const applications = useMemo(() => flattenApplications(posts ?? []), [posts]);
  const contracts = useMemo(() => flattenContracts(applications), [applications]);
  const spendEntries = useMemo(() => flattenSpend(contracts), [contracts]);
  const interviews = useMemo(() => flattenInterviews(applications), [applications]);

  const applicationIndex = useMemo(() => new Map(applications.map((application) => [application.id, application])), [applications]);
  const selectedApplication = selectedApplicationId ? applicationIndex.get(selectedApplicationId) ?? null : null;

  const handleWorkspaceSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (workspaceIdInput && workspaceIdInput.trim().length) {
      next.set('workspaceId', workspaceIdInput.trim());
    } else {
      next.delete('workspaceId');
    }
    if (workspaceSlugInput && workspaceSlugInput.trim().length) {
      next.set('workspaceSlug', workspaceSlugInput.trim());
    } else {
      next.delete('workspaceSlug');
    }
    setSearchParams(next);
  };

  const handleWorkspaceReset = () => {
    setWorkspaceIdInput('');
    setWorkspaceSlugInput('');
    const next = new URLSearchParams(searchParams);
    next.delete('workspaceId');
    next.delete('workspaceSlug');
    setSearchParams(next);
  };

  const handleLookbackChange = (event) => {
    const next = new URLSearchParams(searchParams);
    const value = event.target.value;
    if (value) {
      next.set('lookbackDays', value);
    } else {
      next.delete('lookbackDays');
    }
    setSearchParams(next);
  };

  const execWithPanelBusy = async (operation) => {
    setPanelBusy(true);
    try {
      return await operation();
    } finally {
      setPanelBusy(false);
    }
  };

  const execWithActionBusy = async (operation) => {
    setActionBusy(true);
    try {
      return await operation();
    } finally {
      setActionBusy(false);
    }
  };

  const openApplicationDrawer = (applicationId) => {
    if (!applicationId) return;
    setSelectedApplicationId(applicationId);
    setDrawerOpen(true);
  };

  const handleDeleteApplication = async (applicationId) => {
    await execWithPanelBusy(() => deleteApplication(applicationId));
    if (selectedApplicationId === applicationId) {
      setDrawerOpen(false);
      setSelectedApplicationId(null);
    }
  };

  const handleOpenPostPipeline = (post) => {
    const firstApplication = (post?.applications ?? [])[0];
    if (firstApplication?.id) {
      openApplicationDrawer(firstApplication.id);
      setActiveView('people');
    }
  };

  const renderView = () => {
    if (!hasWorkspaceSelection && activeView !== 'summary') {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Set a workspace above to load this view.
        </div>
      );
    }

    switch (activeView) {
      case 'summary':
        return (
          <div className="space-y-6">
            <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
              <form onSubmit={handleWorkspaceSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Workspace ID
                  <input
                    value={workspaceIdInput}
                    onChange={(event) => setWorkspaceIdInput(event.target.value)}
                    placeholder="ID"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Workspace slug
                  <input
                    value={workspaceSlugInput}
                    onChange={(event) => setWorkspaceSlugInput(event.target.value)}
                    placeholder="slug"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Lookback (days)
                  <select
                    value={lookbackDays}
                    onChange={handleLookbackChange}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    {LOOKBACK_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-2 pt-5 sm:col-span-2 lg:col-span-1 lg:pt-0">
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={handleWorkspaceReset}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Clear
                  </button>
                </div>
              </form>
              <DataStatus
                loading={loading}
                fromCache={fromCache}
                lastUpdated={lastUpdated}
                onRefresh={() => refresh({ force: true })}
                error={error}
              />
            </section>
            <VolunteeringSummaryCards summary={summary} totals={totals} />
          </div>
        );
      case 'posts':
        return (
          <VolunteeringPostBoard
            posts={posts}
            permissions={permissions}
            onCreatePost={(payload) => execWithActionBusy(() => createPost(payload))}
            onUpdatePost={(postId, payload) => execWithActionBusy(() => updatePost(postId, payload))}
            onDeletePost={(postId) => execWithActionBusy(() => deletePost(postId))}
            onOpenPipeline={handleOpenPostPipeline}
          />
        );
      case 'people':
        return (
          <VolunteeringPeopleWorkspace
            applications={applications}
            posts={posts}
            busy={actionBusy}
            onCreateApplication={(postId, payload) => execWithActionBusy(() => createApplication(postId, payload))}
            onSelectApplication={openApplicationDrawer}
            selectedApplicationId={selectedApplicationId}
          />
        );
      case 'interviews':
        return (
          <VolunteeringInterviewBoard
            interviews={interviews}
            applications={applications}
            busy={actionBusy}
            onScheduleInterview={(applicationId, payload) => execWithActionBusy(() => scheduleInterview(applicationId, payload))}
            onUpdateInterview={(interviewId, payload) => execWithActionBusy(() => updateInterview(interviewId, payload))}
            onDeleteInterview={(interviewId) => execWithActionBusy(() => deleteInterview(interviewId))}
            onSelectApplication={openApplicationDrawer}
          />
        );
      case 'contracts':
        return (
          <VolunteeringContractLedger
            contracts={contracts}
            applications={applications}
            busy={actionBusy}
            onCreateContract={(applicationId, payload) => execWithActionBusy(() => createContract(applicationId, payload))}
            onUpdateContract={(contractId, payload) => execWithActionBusy(() => updateContract(contractId, payload))}
            onDeleteContract={(contractId) => execWithActionBusy(() => deleteContract(contractId))}
            onSelectApplication={openApplicationDrawer}
          />
        );
      case 'spend':
        return (
          <VolunteeringSpendTracker
            contracts={contracts}
            spendEntries={spendEntries}
            busy={actionBusy}
            onAddSpend={(contractId, payload) => execWithActionBusy(() => addSpend(contractId, payload))}
            onDeleteSpend={(spendId) => execWithActionBusy(() => deleteSpend(spendId))}
            onSelectApplication={openApplicationDrawer}
          />
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/volunteer' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Volunteer hub"
        subtitle="Community roles"
        description="Manage posts, people, interviews, contracts, and spend."
        menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      >
        <AccessDeniedPanel
          availableDashboards={memberships.filter((membership) => membership !== 'company')}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Volunteer hub"
      subtitle="Community roles"
      description="Manage posts, people, interviews, contracts, and spend."
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      profile={workspaceProfile}
      availableDashboards={memberships}
    >
      <div className="flex flex-col gap-8">
        <nav className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          {VIEWS.map((view) => {
            const active = activeView === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
                className={`min-w-[120px] rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100'
                }`}
              >
                {view.label}
              </button>
            );
          })}
        </nav>

        {renderView()}
      </div>

      <VolunteeringApplicationDrawer
        open={drawerOpen && Boolean(selectedApplication)}
        application={selectedApplication}
        busy={panelBusy}
        onClose={() => setDrawerOpen(false)}
        onUpdate={(payload) =>
          selectedApplication?.id
            ? execWithPanelBusy(() => updateApplication(selectedApplication.id, payload))
            : Promise.resolve()
        }
        onDelete={() => (selectedApplication?.id ? handleDeleteApplication(selectedApplication.id) : Promise.resolve())}
        onCreateResponse={(payload) =>
          selectedApplication?.id
            ? execWithPanelBusy(() => createResponse(selectedApplication.id, payload))
            : Promise.resolve()
        }
        onUpdateResponse={(responseId, payload) => execWithPanelBusy(() => updateResponse(responseId, payload))}
        onDeleteResponse={(responseId) => execWithPanelBusy(() => deleteResponse(responseId))}
        onScheduleInterview={(payload) =>
          selectedApplication?.id
            ? execWithPanelBusy(() => scheduleInterview(selectedApplication.id, payload))
            : Promise.resolve()
        }
        onUpdateInterview={(interviewId, payload) => execWithPanelBusy(() => updateInterview(interviewId, payload))}
        onDeleteInterview={(interviewId) => execWithPanelBusy(() => deleteInterview(interviewId))}
        onCreateContract={(payload) =>
          selectedApplication?.id
            ? execWithPanelBusy(() => createContract(selectedApplication.id, payload))
            : Promise.resolve()
        }
        onUpdateContract={(contractId, payload) => execWithPanelBusy(() => updateContract(contractId, payload))}
        onAddSpend={(contractId, payload) => execWithPanelBusy(() => addSpend(contractId, payload))}
        onUpdateSpend={(spendId, payload) => execWithPanelBusy(() => updateSpend(spendId, payload))}
        onDeleteSpend={(spendId) => execWithPanelBusy(() => deleteSpend(spendId))}
      />
    </DashboardLayout>
  );
}
