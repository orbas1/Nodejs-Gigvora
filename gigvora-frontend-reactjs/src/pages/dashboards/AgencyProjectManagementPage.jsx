import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import ProjectWizardDrawer from '../../components/agency/projectManagement/ProjectWizardDrawer.jsx';
import ProjectBoard from '../../components/agency/projectManagement/ProjectBoard.jsx';
import ProjectDetailsDrawer from '../../components/agency/projectManagement/ProjectDetailsDrawer.jsx';
import ProjectRosterDrawer from '../../components/agency/projectManagement/ProjectRosterDrawer.jsx';
import {
  fetchAgencyProjectManagement,
  createAgencyProject,
  updateAgencyProject,
  updateAgencyProjectAutoMatchSettings,
  upsertAgencyProjectAutoMatchFreelancer,
  updateAgencyProjectAutoMatchFreelancer,
} from '../../services/agencyProjectManagement.js';
import { AGENCY_AVAILABLE_DASHBOARDS, AGENCY_DASHBOARD_MENU } from '../../constants/agencyDashboardMenu.js';

function normalizeErrorMessage(error) {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.body?.message) {
    return error.body.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function AgencyProjectManagementPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [savingProjectId, setSavingProjectId] = useState(null);
  const [savingAutoMatchId, setSavingAutoMatchId] = useState(null);
  const [savingFreelancerKey, setSavingFreelancerKey] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [view, setView] = useState('open');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailsProject, setDetailsProject] = useState(null);
  const [rosterProject, setRosterProject] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAgencyProjectManagement();
      setData(response);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load agency project management dashboard', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreateProject = useCallback(
    async (payload) => {
      setCreating(true);
      setError(null);
      try {
        await createAgencyProject(payload);
        await refresh();
      } catch (err) {
        console.error('Failed to create project', err);
        setError(err);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [refresh],
  );

  const handleUpdateProject = useCallback(
    async (projectId, payload) => {
      setSavingProjectId(projectId);
      setError(null);
      try {
        await updateAgencyProject(projectId, payload);
        await refresh();
      } catch (err) {
        console.error('Failed to update project', err);
        setError(err);
        throw err;
      } finally {
        setSavingProjectId(null);
      }
    },
    [refresh],
  );

  const handleAutoMatchUpdate = useCallback(
    async (projectId, payload) => {
      setSavingAutoMatchId(projectId);
      setError(null);
      try {
        await updateAgencyProjectAutoMatchSettings(projectId, payload);
        await refresh();
      } catch (err) {
        console.error('Failed to update auto-match settings', err);
        setError(err);
        throw err;
      } finally {
        setSavingAutoMatchId(null);
      }
    },
    [refresh],
  );

  const handleQuickToggle = useCallback(
    async (project) => {
      if (!project) {
        return;
      }
      const nextEnabled = !project.autoMatch?.enabled;
      await handleAutoMatchUpdate(project.id, {
        enabled: nextEnabled,
        autoAcceptEnabled: project.autoMatch?.autoAcceptEnabled,
        autoRejectEnabled: project.autoMatch?.autoRejectEnabled,
      });
    },
    [handleAutoMatchUpdate],
  );

  const handleAddFreelancer = useCallback(
    async (projectId, payload) => {
      const savingKey = `${projectId}:new`;
      setSavingFreelancerKey(savingKey);
      setError(null);
      try {
        await upsertAgencyProjectAutoMatchFreelancer(projectId, payload);
        await refresh();
      } catch (err) {
        console.error('Failed to add auto-match freelancer', err);
        setError(err);
        throw err;
      } finally {
        setSavingFreelancerKey(null);
      }
    },
    [refresh],
  );

  const handleUpdateFreelancer = useCallback(
    async (projectId, entryId, payload) => {
      const savingKey = `${projectId}:${entryId}`;
      setSavingFreelancerKey(savingKey);
      setError(null);
      try {
        await updateAgencyProjectAutoMatchFreelancer(projectId, entryId, payload);
        await refresh();
      } catch (err) {
        console.error('Failed to update auto-match freelancer entry', err);
        setError(err);
        throw err;
      } finally {
        setSavingFreelancerKey(null);
      }
    },
    [refresh],
  );

  const errorMessage = normalizeErrorMessage(error);
  const openProjects = data?.openProjects ?? [];
  const closedProjects = data?.closedProjects ?? [];
  const summary = data?.summary ?? null;
  const queue = data?.autoMatchQueue ?? [];

  const projectsInView = useMemo(() => {
    return view === 'closed' ? closedProjects : openProjects;
  }, [view, openProjects, closedProjects]);

  useEffect(() => {
    if (!data) {
      return;
    }
    if (detailsProject) {
      const updated = [...openProjects, ...closedProjects].find((project) => project.id === detailsProject.id);
      if (updated && updated !== detailsProject) {
        setDetailsProject(updated);
      }
    }
    if (rosterProject) {
      const updated = [...openProjects, ...closedProjects].find((project) => project.id === rosterProject.id);
      if (updated && updated !== rosterProject) {
        setRosterProject(updated);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Projects"
      subtitle="Delivery control"
      description=""
      menuSections={AGENCY_DASHBOARD_MENU}
      availableDashboards={AGENCY_AVAILABLE_DASHBOARDS}
      activeMenuItem="agency-projects"
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-slate-900">Project Desk</h1>
            {lastUpdated && (
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
            >
              New
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
        )}

        {loading && !data ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading projects…
          </div>
        ) : (
          <ProjectBoard
            view={view}
            onViewChange={setView}
            summary={summary}
            projects={projectsInView}
            queue={queue}
            onOpenProject={(project) => setDetailsProject(project)}
            onOpenRoster={(project) => setRosterProject(project)}
            onQuickToggle={handleQuickToggle}
            togglingProjectId={savingAutoMatchId}
          />
        )}
      </div>

      <ProjectWizardDrawer
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={async (payload) => {
          await handleCreateProject(payload);
          setWizardOpen(false);
        }}
        submitting={creating}
      />

      <ProjectDetailsDrawer
        open={Boolean(detailsProject)}
        project={detailsProject}
        onClose={() => setDetailsProject(null)}
        submitting={detailsProject ? savingProjectId === detailsProject.id : false}
        onSubmit={async (payload) => {
          if (!detailsProject) {
            return;
          }
          await handleUpdateProject(detailsProject.id, payload);
          setDetailsProject(null);
        }}
      />

      <ProjectRosterDrawer
        open={Boolean(rosterProject)}
        project={rosterProject}
        onClose={() => setRosterProject(null)}
        onSaveSettings={async (payload) => {
          if (!rosterProject) {
            return;
          }
          await handleAutoMatchUpdate(rosterProject.id, payload);
        }}
        savingSettings={rosterProject ? savingAutoMatchId === rosterProject.id : false}
        onAddFreelancer={async (payload) => {
          if (!rosterProject) {
            return;
          }
          await handleAddFreelancer(rosterProject.id, payload);
        }}
        onUpdateFreelancer={async (entryId, payload) => {
          if (!rosterProject) {
            return;
          }
          await handleUpdateFreelancer(rosterProject.id, entryId, payload);
        }}
        savingFreelancerKey={savingFreelancerKey}
      />
    </DashboardLayout>
  );
}
