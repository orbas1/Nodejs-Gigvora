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
  deleteAgencyProject,
  updateAgencyProjectAutoMatchSettings,
  upsertAgencyProjectAutoMatchFreelancer,
  updateAgencyProjectAutoMatchFreelancer,
  deleteAgencyProjectAutoMatchFreelancer,
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
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [view, setView] = useState('open');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailsProject, setDetailsProject] = useState(null);
  const [rosterProject, setRosterProject] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [exporting, setExporting] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

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

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return undefined;
    }
    const interval = setInterval(() => {
      refresh();
    }, 60_000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refresh]);

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

  const handleRemoveFreelancer = useCallback(
    async (projectId, entryId) => {
      const savingKey = `${projectId}:${entryId}`;
      setSavingFreelancerKey(savingKey);
      setError(null);
      try {
        await deleteAgencyProjectAutoMatchFreelancer(projectId, entryId);
        await refresh();
      } catch (err) {
        console.error('Failed to remove auto-match freelancer', err);
        setError(err);
        throw err;
      } finally {
        setSavingFreelancerKey(null);
      }
    },
    [refresh],
  );

  const handleDeleteProject = useCallback(
    async (projectId) => {
      setDeletingProjectId(projectId);
      setError(null);
      try {
        await deleteAgencyProject(projectId);
        await refresh();
      } catch (err) {
        console.error('Failed to delete project', err);
        setError(err);
        throw err;
      } finally {
        setDeletingProjectId(null);
      }
    },
    [refresh],
  );

  const errorMessage = normalizeErrorMessage(error);
  const openProjects = data?.openProjects ?? [];
  const closedProjects = data?.closedProjects ?? [];
  const summary = data?.summary ?? null;
  const queue = data?.autoMatchQueue ?? [];

  const statusOptions = useMemo(() => {
    const statuses = new Set();
    [...openProjects, ...closedProjects].forEach((project) => {
      if (project?.status) {
        statuses.add(project.status);
      }
    });
    return ['all', ...Array.from(statuses)];
  }, [openProjects, closedProjects]);

  const projectsInView = useMemo(() => {
    return view === 'closed' ? closedProjects : openProjects;
  }, [view, openProjects, closedProjects]);

  const filteredProjects = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const statusFilter = filters.status;
    return projectsInView.filter((project) => {
      const matchesQuery = !query
        ? true
        : [project?.name, project?.referenceCode, project?.client?.name, project?.owner?.name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all'
        ? true
        : (project?.status ?? '').toLowerCase() === statusFilter.toLowerCase();
      return matchesQuery && matchesStatus;
    });
  }, [filters.search, filters.status, projectsInView]);

  const derivedMetrics = useMemo(() => {
    const totalBudget = filteredProjects.reduce((total, project) => {
      const amount = Number(project?.budget?.amount ?? project?.financials?.budget ?? 0);
      return Number.isFinite(amount) ? total + amount : total;
    }, 0);
    const activeMilestones = filteredProjects.reduce((count, project) => {
      const milestones = project?.milestones ?? project?.timeline ?? [];
      if (!Array.isArray(milestones)) {
        return count;
      }
      return (
        count +
        milestones.filter((milestone) => {
          if (!milestone) {
            return false;
          }
          if (milestone.completed) {
            return false;
          }
          const dueDate = milestone.dueDate ?? milestone.deadline;
          if (!dueDate) {
            return true;
          }
          const due = new Date(dueDate);
          if (Number.isNaN(due.getTime())) {
            return true;
          }
          return due >= new Date();
        }).length
      );
    }, 0);
    const rosteredContributors = filteredProjects.reduce((total, project) => {
      const roster = Array.isArray(project?.roster) ? project.roster : project?.team ?? [];
      return total + roster.length;
    }, 0);
    return {
      count: filteredProjects.length,
      totalBudget,
      activeMilestones,
      rosteredContributors,
    };
  }, [filteredProjects]);

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
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-slate-900">Project Desk</h1>
              {lastUpdated && (
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Projects in view</p>
                <p className="mt-1 text-lg font-semibold">{derivedMetrics.count}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Active milestones</p>
                <p className="mt-1 text-lg font-semibold">{derivedMetrics.activeMilestones}</p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Rostered contributors</p>
                <p className="mt-1 text-lg font-semibold">{derivedMetrics.rosteredContributors}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Budget coverage</p>
                <p className="mt-1 text-lg font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(derivedMetrics.totalBudget)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-4 lg:flex-row lg:items-center">
              <label className="flex flex-1 items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
                <input
                  type="search"
                  value={filters.search}
                  onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                  placeholder="Search by project, client, or reference"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All statuses' : option.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
              onClick={() => setAutoRefreshEnabled((value) => !value)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                autoRefreshEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {autoRefreshEnabled ? 'Auto-refresh on' : 'Auto-refresh off'}
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  setExporting(true);
                  const rows = filteredProjects.map((project) => {
                    const budget = Number(project?.budget?.amount ?? project?.financials?.budget ?? 0);
                    return [
                      project?.id ?? '',
                      project?.name ?? '',
                      project?.status ?? '',
                      project?.client?.name ?? '',
                      project?.owner?.name ?? '',
                      Number.isFinite(budget) ? budget : '',
                      project?.timeline?.startDate ?? project?.startDate ?? '',
                      project?.timeline?.endDate ?? project?.endDate ?? '',
                    ]
                      .map((value) => {
                        if (value == null) {
                          return '';
                        }
                        const stringValue = String(value).replace(/"/g, '""');
                        return `"${stringValue}"`;
                      })
                      .join(',');
                  });
                  const header = 'ID,Project,Status,Client,Owner,Budget,Start,End';
                  const csv = [header, ...rows].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement('a');
                  anchor.href = url;
                  anchor.download = `gigvora-agency-projects-${Date.now()}.csv`;
                  document.body.appendChild(anchor);
                  anchor.click();
                  document.body.removeChild(anchor);
                  URL.revokeObjectURL(url);
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting || filteredProjects.length === 0}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
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
            projects={filteredProjects}
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
        deleting={detailsProject ? deletingProjectId === detailsProject.id : false}
        onSubmit={async (payload) => {
          if (!detailsProject) {
            return;
          }
          await handleUpdateProject(detailsProject.id, payload);
          setDetailsProject(null);
        }}
        onDelete={
          detailsProject
            ? async () => {
                await handleDeleteProject(detailsProject.id);
                setDetailsProject(null);
                setRosterProject((current) => (current?.id === detailsProject.id ? null : current));
              }
            : undefined
        }
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
        onRemoveFreelancer={async (entryId) => {
          if (!rosterProject) {
            return;
          }
          await handleRemoveFreelancer(rosterProject.id, entryId);
        }}
        savingFreelancerKey={savingFreelancerKey}
      />
    </DashboardLayout>
  );
}
