import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import SectionShell from '../../SectionShell.jsx';
import DataStatus from '../../../../../components/DataStatus.jsx';
import useProjectGigManagement from '../../../../../hooks/useProjectGigManagement.js';
import StatsStrip from './components/StatsStrip.jsx';
import ProjectToolbar from './components/ProjectToolbar.jsx';
import ProjectGrid from './components/ProjectGrid.jsx';
import CreateProjectWizard from './components/CreateProjectWizard.jsx';
import ProjectDrawer from './components/ProjectDrawer.jsx';
import {
  filterProjectsByRisk,
  filterProjectsByStatus,
  searchProjects,
  sortProjects,
} from './utils.js';

export default function ProjectManagementSection({ freelancerId }) {
  const { data, loading, error, actions, reload } = useProjectGigManagement(freelancerId);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('open');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortKey, setSortKey] = useState('updated');
  const [showCreate, setShowCreate] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const lifecycle = data?.projectLifecycle ?? { open: [], closed: [], stats: null };
  const currency = data?.summary?.currency ?? data?.projectLifecycle?.stats?.currency ?? 'USD';

  const openProjects = useMemo(() => (Array.isArray(lifecycle.open) ? lifecycle.open : []), [lifecycle.open]);
  const closedProjects = useMemo(() => (Array.isArray(lifecycle.closed) ? lifecycle.closed : []), [lifecycle.closed]);

  const filteredOpen = useMemo(() => {
    const filtered = filterProjectsByRisk(
      filterProjectsByStatus(searchProjects(openProjects, searchTerm), statusFilter),
      riskFilter,
    );
    return sortProjects(filtered, sortKey);
  }, [openProjects, searchTerm, statusFilter, riskFilter, sortKey]);

  const filteredClosed = useMemo(() => {
    const filtered = filterProjectsByRisk(
      filterProjectsByStatus(searchProjects(closedProjects, searchTerm), statusFilter),
      riskFilter,
    );
    return sortProjects(filtered, sortKey);
  }, [closedProjects, searchTerm, statusFilter, riskFilter, sortKey]);

  const projectsToRender = view === 'open' ? filteredOpen : filteredClosed;
  const allProjects = useMemo(() => [...openProjects, ...closedProjects], [openProjects, closedProjects]);
  const activeProject = useMemo(
    () => allProjects.find((project) => project.id === activeProjectId) ?? null,
    [allProjects, activeProjectId],
  );

  useEffect(() => {
    if (!actionSuccess) {
      return undefined;
    }
    const timeout = setTimeout(() => setActionSuccess(null), 4000);
    return () => clearTimeout(timeout);
  }, [actionSuccess]);

  const runProjectAction = useCallback(
    async (task, { successMessage, propagate = false } = {}) => {
      setActionError(null);
      setActionSuccess(null);
      try {
        const result = await task();
        if (successMessage) {
          setActionSuccess(successMessage);
        }
        return result;
      } catch (error) {
        console.error('Project action failed', error);
        setActionError(error?.message ?? 'Unable to process the project request.');
        if (propagate) {
          throw error;
        }
        return null;
      }
    },
    [],
  );

  const handleExportProjects = useCallback(() => {
    if (!allProjects.length || exporting) {
      return;
    }
    setExporting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const header = ['ID', 'Title', 'Status', 'Client', 'Due', 'Budget Allocated', 'Budget Spent'];
      const rows = allProjects.map((project) => [
        project.id ?? '',
        project.title ?? '',
        project.status ?? '',
        project.metadata?.clientName ?? '',
        project.dueDate ? new Date(project.dueDate).toISOString() : '',
        project.budgetAllocated ?? 0,
        project.budgetSpent ?? 0,
      ]);
      const csv = [header, ...rows]
        .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        setActionError('CSV export is only available in the browser.');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `gigvora-projects-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      setActionSuccess('Projects exported to CSV.');
    } catch (error) {
      console.error('Failed to export projects', error);
      setActionError(error?.message ?? 'Unable to export projects.');
    } finally {
      setExporting(false);
    }
  }, [allProjects, exporting]);

  const handleArchive = async (project) => {
    await runProjectAction(() => actions.archiveProject(project.id, {}), {
      successMessage: 'Project archived.',
    });
  };

  const handleRestore = async (project) => {
    await runProjectAction(() => actions.restoreProject(project.id, {}), {
      successMessage: 'Project restored.',
    });
  };

  const handleCreateProject = useCallback(
    (payload) =>
      runProjectAction(() => actions.createProject(payload), {
        successMessage: 'Project created.',
        propagate: true,
      }),
    [actions, runProjectAction],
  );

  const filtersApplied = Boolean(searchTerm.trim()) || statusFilter !== 'all' || riskFilter !== 'all';

  const emptyState = useMemo(() => {
    if (view === 'closed') {
      if (filtersApplied) {
        return {
          title: 'No closed projects match the current filters.',
          description: 'Adjust filters or review archived workspaces to find the engagement you need.',
        };
      }
      return {
        title: 'No closed projects yet',
        description: 'Projects will appear here once engagements are completed and archived.',
      };
    }
    if (filtersApplied) {
      return {
        title: 'No projects match the current filters.',
        description: 'Try updating the search, status, or risk filters to broaden the results.',
      };
    }
    return {
      title: 'No projects yet',
      description: 'Start by creating a project or importing one from another workspace.',
    };
  }, [view, filtersApplied]);

  return (
    <SectionShell
      id="project-management"
      title="Projects"
      description="Plan, track, and close out engagements without leaving mission control."
      actions={
        <>
          <button
            type="button"
            onClick={handleExportProjects}
            disabled={exporting || allProjects.length === 0}
            className="mr-2 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowDownTrayIcon className={`h-4 w-4 ${exporting ? 'animate-pulse' : ''}`} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <div className="hidden lg:flex">
            <label className="sr-only" htmlFor="project-sort">
              Sort
            </label>
            <select
              id="project-sort"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-accent focus:border-accent focus:outline-none"
            >
              <option value="updated">Recent</option>
              <option value="due">Due date</option>
              <option value="client">Client</option>
              <option value="progress">Progress</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90"
          >
            New project
          </button>
        </>
      }
    >
      <StatsStrip stats={lifecycle.stats} currency={currency} />
      <DataStatus
        loading={loading}
        fromCache={data?.meta?.fromCache ?? data?.projectLifecycle?.meta?.fromCache ?? false}
        lastUpdated={
          data?.meta?.lastUpdated ??
          data?.projectLifecycle?.meta?.generatedAt ??
          data?.projectLifecycle?.stats?.generatedAt ??
          null
        }
        onRefresh={reload}
        error={error}
      />
      <ProjectToolbar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        activeView={view}
        onViewChange={setView}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
      />
      {actionError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">{actionError}</div>
      ) : null}
      {actionSuccess ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700">
          {actionSuccess}
        </div>
      ) : null}

      <ProjectGrid
        projects={projectsToRender}
        onOpen={(project) => setActiveProjectId(project.id)}
        onArchive={handleArchive}
        onRestore={handleRestore}
        loading={loading}
        emptyState={emptyState}
      />

      <CreateProjectWizard
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateProject}
      />

      {activeProject ? (
        <ProjectDrawer
          open={Boolean(activeProject)}
          project={activeProject}
          onClose={() => setActiveProjectId(null)}
          actions={actions}
        />
      ) : null}
    </SectionShell>
  );
}

ProjectManagementSection.propTypes = {
  freelancerId: PropTypes.number,
};

ProjectManagementSection.defaultProps = {
  freelancerId: null,
};
